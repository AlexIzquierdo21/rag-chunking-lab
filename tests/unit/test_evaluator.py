from unittest.mock import MagicMock

from src.evaluation import EvalQuestion, EvalResult, EvaluationError, Evaluator


def _build_sample_question(question_id: str = "q001") -> EvalQuestion:
    return EvalQuestion(
        id=question_id,
        question="What is retrieval-augmented generation?",
        expected_answer="It combines retrieval and generation.",
        source_docs=["doc1.md"],
        type="factual",
    )


def test_evaluate_question_returns_eval_result() -> None:
    mock_retriever = MagicMock()
    mock_retriever.retrieve.return_value = [{"text": "context text", "metadata": {}, "distance": 0.1}]
    mock_generator = MagicMock()
    mock_generator.generate.return_value = "mocked answer"
    evaluator = Evaluator(mock_retriever, mock_generator, strategy_name="fixed")
    question = _build_sample_question()

    result = evaluator.evaluate_question(question)

    assert isinstance(result, EvalResult)
    assert result.generated_answer == "mocked answer"
    assert result.strategy == "fixed"


def test_evaluate_question_measures_latency() -> None:
    mock_retriever = MagicMock()
    mock_retriever.retrieve.return_value = [{"text": "context text", "metadata": {}, "distance": 0.1}]
    mock_generator = MagicMock()
    mock_generator.generate.return_value = "mocked answer"
    evaluator = Evaluator(mock_retriever, mock_generator, strategy_name="fixed")
    question = _build_sample_question()

    result = evaluator.evaluate_question(question)

    assert result.retrieval_latency_ms >= 0
    assert result.generation_latency_ms >= 0


def test_evaluate_dataset_skips_failed_questions() -> None:
    mock_retriever = MagicMock()
    mock_retriever.retrieve.return_value = [{"text": "context text", "metadata": {}, "distance": 0.1}]
    mock_generator = MagicMock()
    mock_generator.generate.side_effect = [Exception("generation failed"), "mocked answer"]
    evaluator = Evaluator(mock_retriever, mock_generator, strategy_name="fixed")
    questions = [_build_sample_question("q001"), _build_sample_question("q002")]

    results = evaluator.evaluate_dataset(questions)

    assert len(results) == 1
    assert results[0].question_id == "q002"
    assert isinstance(results[0], EvalResult)
    assert EvaluationError is not None

