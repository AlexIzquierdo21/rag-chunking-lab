"""End-to-end evaluation script for comparing RAG chunking strategies."""

import logging
import sys
import time
from pathlib import Path

from src.chunking import (
    FixedChunking,
    LateChunking,
    RecursiveChunking,
    SemanticChunking,
    SentenceWindowChunking,
)
from src.evaluation import EvalResult, Evaluator, load_dataset
from src.pipeline import Embedder, Generator, Retriever, load_documents
from src.report import build_dataframe, save_report, summarize_by_strategy

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

CORPUS_EXTENSIONS = ("*.pdf", "*.txt", "*.md")
ALL_STRATEGIES = [
    FixedChunking(),
    RecursiveChunking(),
    SemanticChunking(),
    SentenceWindowChunking(),
    LateChunking(),
]


def check_ollama() -> bool:
    try:
        import ollama

        client = ollama.Client()
        client.list()
        logger.info("Ollama is running and reachable.")
        return True
    except Exception as exc:
        logger.error("Ollama is not available: %s", exc)
        return False


def _load_corpus(corpus_dir: str) -> dict[str, str]:
    corpus_path = Path(corpus_dir)
    file_paths = [
        str(path)
        for pattern in CORPUS_EXTENSIONS
        for path in corpus_path.glob(pattern)
    ]
    documents = load_documents(file_paths)
    total_chars = sum(len(text) for text in documents.values())
    logger.info("Loaded %d documents (%d total characters)", len(documents), total_chars)
    return documents


def _run_strategy(
    strategy,
    documents: dict[str, str],
    embedder: Embedder,
    generator: Generator,
    questions: list,
) -> list[EvalResult]:
    logger.info("Running strategy: %s", strategy.name)

    chunks = [
        chunk
        for source, text in documents.items()
        for chunk in strategy.chunk(text, source)
    ]

    retriever = Retriever(
        collection_name=f"eval_{strategy.name}",
        embedder=embedder,
    )
    retriever.index_chunks(chunks)

    evaluator = Evaluator(
        retriever=retriever,
        generator=generator,
        strategy_name=strategy.name,
    )
    results = evaluator.evaluate_dataset(questions)

    if results:
        avg_latency = sum(r.retrieval_latency_ms for r in results) / len(results)
        logger.info(
            "Strategy '%s': %d results, avg retrieval latency %.2f ms",
            strategy.name,
            len(results),
            avg_latency,
        )

    return results


def run_pipeline(
    corpus_dir: str,
    dataset_path: str,
    output_dir: str,
    strategies: list | None = None,
) -> None:
    try:
        # Step 1 — Load documents
        documents = _load_corpus(corpus_dir)
        if not documents:
            logger.error("No documents found in corpus directory: %s", corpus_dir)
            return

        # Step 2 — Load dataset
        questions = load_dataset(dataset_path)
        logger.info("Loaded %d evaluation questions from %s", len(questions), dataset_path)

        # Step 3 — Initialize shared components
        embedder = Embedder()
        generator = Generator()
        active_strategies = strategies if strategies is not None else ALL_STRATEGIES

        # Step 4 — Run evaluation per strategy
        all_results: list[EvalResult] = []
        for strategy in active_strategies:
            strategy_results = _run_strategy(strategy, documents, embedder, generator, questions)
            all_results.extend(strategy_results)

        if not all_results:
            logger.warning("No evaluation results produced — check corpus and dataset.")
            return

        # Step 5 — Build and save report
        df = build_dataframe(all_results)
        summary = summarize_by_strategy(df)
        print("\n=== Evaluation Summary by Strategy ===")
        print(summary.to_string(index=False))
        print()

        output_path = Path(output_dir) / "evaluation_results.csv"
        save_report(df, str(output_path))
        logger.info("Report saved to %s", output_path)

    except Exception as exc:
        logger.error("Fatal error during evaluation pipeline: %s", exc, exc_info=True)


if __name__ == "__main__":
    if not check_ollama():
        logger.error("Cannot proceed without Ollama running. Start Ollama and try again.")
        sys.exit(1)

    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    start = time.perf_counter()
    run_pipeline(
        corpus_dir="corpus",
        dataset_path="eval/questions.json",
        output_dir=str(output_dir),
    )
    elapsed = time.perf_counter() - start
    logger.info("Total evaluation time: %.2f seconds", elapsed)

