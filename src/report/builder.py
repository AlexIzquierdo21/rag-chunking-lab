"""This module builds comparison reports from evaluation results."""

import logging

import pandas as pd

from src.evaluation import EvalResult

logger = logging.getLogger(__name__)


def build_dataframe(results: list[EvalResult]) -> pd.DataFrame:
    rows = [
        {
            "question_id": result.question_id,
            "question": result.question,
            "strategy": result.strategy,
            "expected_answer": result.expected_answer,
            "generated_answer": result.generated_answer,
            "retrieval_latency_ms": result.retrieval_latency_ms,
            "generation_latency_ms": result.generation_latency_ms,
        }
        for result in results
    ]
    dataframe = pd.DataFrame(rows)
    logger.debug("Built report DataFrame with %d rows", len(dataframe))
    return dataframe


def summarize_by_strategy(df: pd.DataFrame) -> pd.DataFrame:
    summary = (
        df.groupby("strategy", as_index=False)
        .agg(
            retrieval_latency_ms=("retrieval_latency_ms", "mean"),
            generation_latency_ms=("generation_latency_ms", "mean"),
            total_questions=("question_id", "count"),
        )
        .round({"retrieval_latency_ms": 2, "generation_latency_ms": 2})
    )
    return summary


def save_report(df: pd.DataFrame, path: str) -> None:
    df.to_csv(path, index=False)
    logger.debug("Saved report to %s", path)
