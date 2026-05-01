from pathlib import Path

import pandas as pd

from src.evaluation import EvalResult
from src.report import build_dataframe, save_report, summarize_by_strategy


def _sample_results() -> list[EvalResult]:
    return [
        EvalResult(
            question_id="q001",
            question="What is RAG?",
            strategy="fixed",
            retrieved_chunks=[{"text": "context 1", "metadata": {}, "distance": 0.1}],
            generated_answer="RAG combines retrieval and generation.",
            expected_answer="Retrieval-Augmented Generation.",
            retrieval_latency_ms=12.5,
            generation_latency_ms=230.0,
        ),
        EvalResult(
            question_id="q002",
            question="What is chunking?",
            strategy="fixed",
            retrieved_chunks=[{"text": "context 2", "metadata": {}, "distance": 0.2}],
            generated_answer="Chunking splits text into smaller parts.",
            expected_answer="Splitting text into smaller units.",
            retrieval_latency_ms=10.0,
            generation_latency_ms=210.0,
        ),
        EvalResult(
            question_id="q003",
            question="How does retrieval work?",
            strategy="recursive",
            retrieved_chunks=[{"text": "context 3", "metadata": {}, "distance": 0.3}],
            generated_answer="Retrieval finds relevant documents.",
            expected_answer="It retrieves relevant chunks from a vector store.",
            retrieval_latency_ms=15.0,
            generation_latency_ms=250.0,
        ),
        EvalResult(
            question_id="q004",
            question="What is a vector store?",
            strategy="recursive",
            retrieved_chunks=[{"text": "context 4", "metadata": {}, "distance": 0.4}],
            generated_answer="A vector store indexes embeddings.",
            expected_answer="A database for embedding vectors.",
            retrieval_latency_ms=11.0,
            generation_latency_ms=220.0,
        ),
    ]


def test_build_dataframe_returns_correct_shape() -> None:
    results = _sample_results()

    df = build_dataframe(results)

    assert len(df) == 4
    for column in ("question_id", "strategy", "retrieval_latency_ms", "generation_latency_ms"):
        assert column in df.columns


def test_summarize_by_strategy_groups_correctly() -> None:
    results = _sample_results()
    df = build_dataframe(results)

    summary = summarize_by_strategy(df)

    assert len(summary) == 2
    assert "total_questions" in summary.columns
    assert set(summary["strategy"]) == {"fixed", "recursive"}
    assert list(summary["total_questions"]) == [2, 2]


def test_save_report_creates_csv_file(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    report_path = base_path / "report.csv"
    results = _sample_results()
    df = build_dataframe(results)

    save_report(df, str(report_path))

    assert report_path.exists()
    loaded = pd.read_csv(str(report_path))
    assert len(loaded) == 4

