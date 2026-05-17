"""Evaluation API router for launching and tracking RAG comparison runs."""

import logging
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from src.chunking import (
    Chunk,
    ChunkingStrategy,
    FixedChunking,
    LateChunking,
    RecursiveChunking,
    SemanticChunking,
    SentenceWindowChunking,
)
from src.evaluation import (
    DatasetError,
    EvalQuestion,
    EvalResult,
    EvaluationError,
    Evaluator,
    compute_ragas_metrics,
    load_dataset,
)
from src.pipeline import Embedder, GenerationError, Generator, IngestionError, Retriever, load_documents

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])

_runs: dict[str, dict] = {}
_SUPPORTED_PATTERNS = ("*.pdf", "*.txt", "*.md", "*.html", "*.docx")
_TASK_ERRORS = (
    AttributeError,
    DatasetError,
    EvaluationError,
    GenerationError,
    IngestionError,
    ImportError,
    KeyError,
    OSError,
    RuntimeError,
    TypeError,
    ValueError,
)


class EvaluationConfig(BaseModel):
    strategies: list[str]
    dataset_path: str = "eval/questions.json"
    corpus_dir: str = "corpus"


class StrategyProgress(BaseModel):
    strategy: str
    status: str
    progress: float = Field(ge=0.0, le=1.0)
    results_count: int = 0


class EvaluationStatus(BaseModel):
    run_id: str
    status: str
    strategies: list[StrategyProgress] = Field(default_factory=list)
    started_at: float
    completed_at: float | None = None
    error: str | None = None


def _get_strategy_class(name: str):
    strategy_map = {
        "fixed": FixedChunking,
        "recursive": RecursiveChunking,
        "semantic": SemanticChunking,
        "sentence_window": SentenceWindowChunking,
        "late_chunking": LateChunking,
    }
    strategy_class = strategy_map.get(name)
    if strategy_class is None:
        raise ValueError(f"Unknown strategy: {name}")
    return strategy_class


def _build_strategy_states(strategies: list[str]) -> list[dict[str, object]]:
    return [
        {
            "strategy": strategy,
            "status": "pending",
            "progress": 0.0,
            "results_count": 0,
            "results": [],
            "metrics": {},
        }
        for strategy in strategies
    ]


def _get_strategy_state(run_id: str, strategy_name: str) -> dict[str, object]:
    for strategy_state in _runs[run_id]["strategies"]:
        if strategy_state["strategy"] == strategy_name:
            return strategy_state
    raise ValueError(f"Strategy state not found for '{strategy_name}'")


def _collect_corpus_paths(corpus_dir: str) -> list[str]:
    base_path = Path(corpus_dir)
    if not base_path.exists():
        raise IngestionError(f"Corpus directory not found: {corpus_dir}")
    file_paths = [
        str(path)
        for pattern in _SUPPORTED_PATTERNS
        for path in base_path.glob(pattern)
        if path.is_file()
    ]
    if not file_paths:
        raise IngestionError(f"No supported documents found in corpus directory: {corpus_dir}")
    return file_paths


def _load_corpus(corpus_dir: str) -> dict[str, str]:
    documents = load_documents(_collect_corpus_paths(corpus_dir))
    if not documents:
        raise IngestionError(f"No documents could be loaded from corpus directory: {corpus_dir}")
    return documents


def _chunk_documents(strategy: ChunkingStrategy, documents: dict[str, str]) -> list[Chunk]:
    chunks = [
        chunk
        for source, text in documents.items()
        for chunk in strategy.chunk(text, source)
    ]
    if not chunks:
        raise ValueError(f"Strategy '{strategy.name}' produced no chunks")
    return chunks


def _serialize_result(result: EvalResult) -> dict[str, object]:
    return {
        "question_id": result.question_id,
        "question": result.question,
        "strategy": result.strategy,
        "retrieved_chunks": result.retrieved_chunks,
        "generated_answer": result.generated_answer,
        "expected_answer": result.expected_answer,
        "retrieval_latency_ms": result.retrieval_latency_ms,
        "generation_latency_ms": result.generation_latency_ms,
        "question_type": result.question_type,
    }


def _set_strategy_running(run_id: str, strategy_name: str) -> None:
    strategy_state = _get_strategy_state(run_id, strategy_name)
    strategy_state["status"] = "running"
    strategy_state["progress"] = 0.1
    _runs[run_id]["status"] = "running"


def _set_strategy_done(
    run_id: str,
    strategy_name: str,
    results: list[EvalResult],
    metrics: dict[str, float],
) -> None:
    strategy_state = _get_strategy_state(run_id, strategy_name)
    strategy_state["status"] = "done"
    strategy_state["progress"] = 1.0
    strategy_state["results_count"] = len(results)
    strategy_state["results"] = [_serialize_result(result) for result in results]
    strategy_state["metrics"] = metrics


def _set_run_failed(run_id: str, error_message: str) -> None:
    for strategy_state in _runs[run_id]["strategies"]:
        if strategy_state["status"] == "running":
            strategy_state["status"] = "failed"
    _runs[run_id]["status"] = "failed"
    _runs[run_id]["completed_at"] = time.time()
    _runs[run_id]["error"] = error_message


def _run_strategy(
    run_id: str,
    strategy_name: str,
    documents: dict[str, str],
    questions: list[EvalQuestion],
    embedder: Embedder,
    generator: Generator,
) -> None:
    _set_strategy_running(run_id, strategy_name)
    strategy = _get_strategy_class(strategy_name)()
    chunks = _chunk_documents(strategy, documents)
    strategy_state = _get_strategy_state(run_id, strategy_name)
    strategy_state["progress"] = 0.4
    retriever = Retriever(collection_name=f"api_{run_id}_{strategy_name}", embedder=embedder)
    retriever.index_chunks(chunks)
    strategy_state["progress"] = 0.7
    evaluator = Evaluator(retriever, generator, strategy_name)
    results = evaluator.evaluate_dataset(questions)
    metrics = compute_ragas_metrics(results)
    _set_strategy_done(run_id, strategy_name, results, metrics)


def run_evaluation_task(run_id: str, config: EvaluationConfig) -> None:
    """Run the blocking evaluation pipeline in a sync background task.

    This function must remain synchronous (`def`, not `async def`) so FastAPI
    executes it via the thread pool used by `BackgroundTasks`, avoiding
    blocking the main event loop with sentence-transformers, ChromaDB and
    Ollama calls.
    """
    try:
        documents = _load_corpus(config.corpus_dir)
        questions = load_dataset(config.dataset_path)
        embedder = Embedder()
        generator = Generator()
        for strategy_name in config.strategies:
            _run_strategy(run_id, strategy_name, documents, questions, embedder, generator)
        _runs[run_id]["status"] = "done"
        _runs[run_id]["completed_at"] = time.time()
    except _TASK_ERRORS as exc:
        logger.error("Evaluation run %s failed: %s", run_id, exc)
        _set_run_failed(run_id, str(exc))


def _build_status(run_id: str) -> EvaluationStatus:
    run_data = _runs[run_id]
    strategies = [
        StrategyProgress(
            strategy=strategy_state["strategy"],
            status=strategy_state["status"],
            progress=float(strategy_state["progress"]),
            results_count=int(strategy_state["results_count"]),
        )
        for strategy_state in run_data["strategies"]
    ]
    return EvaluationStatus(
        run_id=run_id,
        status=run_data["status"],
        strategies=strategies,
        started_at=run_data["started_at"],
        completed_at=run_data.get("completed_at"),
        error=run_data.get("error"),
    )


def _build_results_response(run_id: str) -> dict[str, object]:
    run_data = _runs[run_id]
    return {
        "run_id": run_id,
        "status": run_data["status"],
        "started_at": run_data["started_at"],
        "completed_at": run_data.get("completed_at"),
        "error": run_data.get("error"),
        "config": run_data.get("config", {}),
        "strategies": [
            {
                "strategy": strategy_state["strategy"],
                "status": strategy_state["status"],
                "progress": strategy_state["progress"],
                "results_count": strategy_state["results_count"],
                "metrics": strategy_state.get("metrics", {}),
                "results": strategy_state.get("results", []),
            }
            for strategy_state in run_data["strategies"]
        ],
    }


@router.post("/start")
def start_evaluation(config: EvaluationConfig, background_tasks: BackgroundTasks) -> dict[str, str]:
    try:
        for strategy_name in config.strategies:
            _get_strategy_class(strategy_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    run_id = str(uuid.uuid4())[:8]
    _runs[run_id] = {
        "status": "pending",
        "strategies": _build_strategy_states(config.strategies),
        "started_at": time.time(),
        "completed_at": None,
        "error": None,
        "config": config.model_dump(),
    }
    # Register the synchronous function directly so FastAPI runs it in the
    # background thread pool instead of on the main event loop.
    background_tasks.add_task(run_evaluation_task, run_id, config)
    return {"run_id": run_id, "status": "pending"}


@router.get("/{run_id}/status", response_model=EvaluationStatus)
def get_evaluation_status(run_id: str) -> EvaluationStatus:
    if run_id not in _runs:
        raise HTTPException(status_code=404, detail=f"Run not found: {run_id}")
    return _build_status(run_id)


@router.get("/{run_id}/results")
def get_evaluation_results(run_id: str) -> dict[str, object]:
    if run_id not in _runs:
        raise HTTPException(status_code=404, detail=f"Run not found: {run_id}")
    if _runs[run_id]["status"] != "done":
        raise HTTPException(status_code=400, detail="Evaluation not complete")
    return _build_results_response(run_id)

