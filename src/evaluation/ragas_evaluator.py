"""Lightweight local metrics for evaluation.

Ragas integration is planned for future versions when using capable API-based
models.
"""

import logging
import re

from src.config import settings
from src.evaluation import EvalResult

logger = logging.getLogger(__name__)


def build_ragas_llm():
    # Reserved for future Ragas integration with capable models.
    from openai import AsyncOpenAI
    from ragas.llms import llm_factory

    client = AsyncOpenAI(
        api_key="ollama",
        base_url=f"{settings.ollama_base_url}/v1",
    )
    return llm_factory(settings.ollama_eval_model, client=client)


def _normalize(text: str) -> str:
    lowercased = text.lower()
    no_punctuation = re.sub(r"[^\w\s]", "", lowercased)
    return no_punctuation.strip()

def _lcs_length(seq_a: list[str], seq_b: list[str]) -> int:
    rows, cols = len(seq_a), len(seq_b)
    table = [[0] * (cols + 1) for _ in range(rows + 1)]
    for row in range(1, rows + 1):
        for col in range(1, cols + 1):
            if seq_a[row - 1] == seq_b[col - 1]:
                table[row][col] = table[row - 1][col - 1] + 1
            else:
                table[row][col] = max(table[row - 1][col], table[row][col - 1])
    return table[rows][cols]


def _rouge_l(hypothesis: str, reference: str) -> float:
    hyp_words = _normalize(hypothesis).split()
    ref_words = _normalize(reference).split()
    if not hyp_words or not ref_words:
        return 0.0
    lcs_len = _lcs_length(hyp_words, ref_words)
    return 2 * lcs_len / (len(hyp_words) + len(ref_words))


def _context_hit_rate(retrieved_chunks: list[dict], expected_answer: str) -> float:
    normalized_answer = _normalize(expected_answer)
    keywords = [word for word in normalized_answer.split() if len(word) > 4]
    if not keywords:
        return 0.0
    chunk_texts = [_normalize(chunk.get("text", "")) for chunk in retrieved_chunks]
    matched = sum(1 for kw in keywords if any(kw in chunk_text for chunk_text in chunk_texts))
    return matched / len(keywords)


def _adversarial_score(generated_answer: str, question_type: str) -> float:
    if question_type != "adversarial":
        return 1.0
    normalized = _normalize(generated_answer)
    refusal_phrases = ["dont know", "do not know", "cannot", "not sure", "no information"]
    return 1.0 if any(phrase in normalized for phrase in refusal_phrases) else 0.0


def compute_ragas_metrics(results: list[EvalResult]) -> dict:
    empty = {"rouge_l": 0.0, "context_hit_rate": 0.0, "adversarial_score": 0.0}
    if not results:
        return empty
    try:
        rouge_scores = [_rouge_l(r.generated_answer, r.expected_answer) for r in results]
        hit_rates = [_context_hit_rate(r.retrieved_chunks, r.expected_answer) for r in results]
        adversarial_results = [r for r in results if getattr(r, "question_type", "factual") == "adversarial"]
        if adversarial_results:
            adv_scores = [
                _adversarial_score(r.generated_answer, getattr(r, "question_type", "factual"))
                for r in adversarial_results
            ]
            adversarial_mean = sum(adv_scores) / len(adv_scores)
        else:
            adversarial_mean = 0.0
        return {
            "rouge_l": round(sum(rouge_scores) / len(rouge_scores), 4),
            "context_hit_rate": round(sum(hit_rates) / len(hit_rates), 4),
            "adversarial_score": round(adversarial_mean, 4),
        }
    except Exception as exc:
        logger.error("Metric computation failed: %s", exc)
        return {}

