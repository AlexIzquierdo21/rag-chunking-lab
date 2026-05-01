"""This module computes Ragas metrics using Ollama as the evaluator LLM."""

import logging
from typing import Any

from src.config import settings
from src.evaluation import EvalResult

logger = logging.getLogger(__name__)


def build_ragas_llm():
    from openai import OpenAI
    from ragas.llms import llm_factory

    client = OpenAI(
        api_key="ollama",
        base_url=f"{settings.ollama_base_url}/v1",
    )
    return llm_factory(settings.ollama_model, provider="openai", client=client)


def compute_ragas_metrics(results: list[EvalResult]) -> dict:
    try:
        if not results:
            logger.info("No evaluation results available for Ragas metrics")
            return {}

        from ragas import Dataset, evaluate
        from ragas import metrics as ragas_metrics

        llm = build_ragas_llm()
        payload = _build_payload(results)
        dataset = _build_dataset(Dataset, payload)

        context_recall_cls = _resolve_metric_class(ragas_metrics, "ContextRecall")
        context_precision_cls = _resolve_metric_class(ragas_metrics, "ContextPrecision")
        faithfulness_cls = _resolve_metric_class(ragas_metrics, "Faithfulness")
        answer_relevancy_cls = _resolve_metric_class(ragas_metrics, "AnswerRelevancy")

        metrics = [
            _metric_with_llm(context_recall_cls, llm),
            _metric_with_llm(context_precision_cls, llm),
            _metric_with_llm(faithfulness_cls, llm),
            _metric_with_llm(answer_relevancy_cls, llm),
        ]
        evaluation_result = evaluate(dataset=dataset, metrics=metrics)
        return _result_to_dict(evaluation_result)
    except Exception as exc:
        logger.error("Ragas evaluation failed: %s", exc)
        return {}


def _build_payload(results: list[EvalResult]) -> dict[str, list[Any]]:
    return {
        "question": [result.question for result in results],
        "answer": [result.generated_answer for result in results],
        "contexts": [
            [chunk.get("text", "") for chunk in result.retrieved_chunks]
            for result in results
        ],
        "ground_truth": [result.expected_answer for result in results],
    }


def _build_dataset(dataset_cls, payload: dict[str, list[Any]]):
    from_dict = getattr(dataset_cls, "from_dict", None)
    if callable(from_dict):
        return from_dict(payload)
    return dataset_cls(payload)


def _resolve_metric_class(ragas_metrics_module, metric_name: str):
    metric_cls = getattr(ragas_metrics_module, metric_name, None)
    if metric_cls is not None:
        return metric_cls

    fallback_map = {
        "ContextRecall": "context_recall",
        "ContextPrecision": "context_precision",
        "Faithfulness": "faithfulness",
        "AnswerRelevancy": "answer_relevancy",
    }
    fallback_name = fallback_map[metric_name]
    metric_cls = getattr(ragas_metrics_module, fallback_name, None)
    if metric_cls is None:
        raise AttributeError(f"Ragas metric '{metric_name}' is not available")
    return metric_cls


def _metric_with_llm(metric_cls, llm):
    try:
        return metric_cls(llm=llm)
    except TypeError:
        metric = metric_cls()
        if hasattr(metric, "llm"):
            metric.llm = llm
        return metric


def _result_to_dict(evaluation_result: Any) -> dict:
    if isinstance(evaluation_result, dict):
        return evaluation_result
    if hasattr(evaluation_result, "to_dict"):
        return dict(evaluation_result.to_dict())
    if hasattr(evaluation_result, "scores"):
        return dict(evaluation_result.scores)
    return {}

