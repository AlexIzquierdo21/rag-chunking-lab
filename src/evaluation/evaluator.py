"""This module orchestrates RAG evaluation per strategy."""

import logging
import time
from dataclasses import dataclass
from dataclasses import field

from src.evaluation import EvalQuestion
from src.pipeline import Generator, Retriever

logger = logging.getLogger(__name__)


class EvaluationError(Exception):
    """Raised when evaluating a question fails."""


@dataclass
class EvalResult:
    question_id: str
    question: str
    strategy: str
    retrieved_chunks: list[dict]
    generated_answer: str
    expected_answer: str
    retrieval_latency_ms: float
    generation_latency_ms: float
    question_type: str = field(default="factual")


class Evaluator:
    def __init__(
        self,
        retriever: Retriever,
        generator: Generator,
        strategy_name: str,
    ) -> None:
        self.retriever = retriever
        self.generator = generator
        self.strategy_name = strategy_name

    def evaluate_question(self, question: EvalQuestion) -> EvalResult:
        try:
            retrieval_start = time.perf_counter()
            retrieved_chunks = self.retriever.retrieve(question.question)
            retrieval_latency_ms = (time.perf_counter() - retrieval_start) * 1000.0

            generation_start = time.perf_counter()
            generated_answer = self.generator.generate(question.question, retrieved_chunks)
            generation_latency_ms = (time.perf_counter() - generation_start) * 1000.0

            return EvalResult(
                question_id=question.id,
                question=question.question,
                strategy=self.strategy_name,
                retrieved_chunks=retrieved_chunks,
                generated_answer=generated_answer,
                expected_answer=question.expected_answer,
                retrieval_latency_ms=retrieval_latency_ms,
                generation_latency_ms=generation_latency_ms,
                question_type=question.type,
            )
        except Exception as exc:
            raise EvaluationError(f"Failed to evaluate question '{question.id}': {exc}") from exc

    def evaluate_dataset(self, questions: list[EvalQuestion]) -> list[EvalResult]:
        results: list[EvalResult] = []
        for index, question in enumerate(questions, start=1):
            try:
                results.append(self.evaluate_question(question))
            except EvaluationError as exc:
                logger.warning("Skipping question %s: %s", question.id, exc)

            if index % 5 == 0:
                logger.info("Evaluation progress: %d/%d questions processed", index, len(questions))

        return results
