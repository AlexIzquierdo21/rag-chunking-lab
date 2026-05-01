import json
from pathlib import Path

import pytest

from src.evaluation import DatasetError, EvalQuestion, load_dataset, save_dataset


def test_load_valid_dataset(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    dataset_path = base_path / "valid_dataset.json"
    payload = [
        {
            "id": "q001",
            "question": "What is RAG?",
            "expected_answer": "Retrieval-Augmented Generation.",
            "source_docs": ["doc1.md"],
            "type": "factual",
        },
        {
            "id": "q002",
            "question": "How do two concepts connect?",
            "expected_answer": "They connect through shared context.",
            "source_docs": ["doc2.md", "doc3.md"],
            "type": "multi-hop",
        },
    ]
    dataset_path.write_text(json.dumps(payload), encoding="utf-8")

    questions = load_dataset(str(dataset_path))

    assert isinstance(questions, list)
    assert len(questions) == 2
    assert all(isinstance(question, EvalQuestion) for question in questions)
    assert questions[0].id == "q001"
    assert questions[0].question == "What is RAG?"
    assert questions[0].expected_answer == "Retrieval-Augmented Generation."
    assert questions[0].source_docs == ["doc1.md"]
    assert questions[0].type == "factual"
    assert questions[1].id == "q002"
    assert questions[1].source_docs == ["doc2.md", "doc3.md"]
    assert questions[1].type == "multi-hop"


def test_load_missing_file_raises_dataset_error(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    missing_path = base_path / "missing_dataset.json"

    with pytest.raises(DatasetError):
        load_dataset(str(missing_path))


def test_load_missing_field_raises_dataset_error(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    dataset_path = base_path / "invalid_dataset.json"
    payload = [
        {
            "id": "q003",
            "question": "Missing expected answer?",
            "source_docs": ["doc4.md"],
            "type": "adversarial",
        }
    ]
    dataset_path.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(DatasetError):
        load_dataset(str(dataset_path))


def test_save_and_reload_dataset(tmp_path) -> None:
    base_path = Path(str(tmp_path))
    dataset_path = base_path / "roundtrip_dataset.json"
    questions = [
        EvalQuestion(
            id="q010",
            question="What is chunking?",
            expected_answer="Splitting text into smaller units.",
            source_docs=["guide.md"],
            type="factual",
        ),
        EvalQuestion(
            id="q011",
            question="Connect two distant facts.",
            expected_answer="By combining evidence from multiple sections.",
            source_docs=["a.md", "b.md"],
            type="multi-hop",
        ),
    ]

    save_dataset(questions, str(dataset_path))
    reloaded_questions = load_dataset(str(dataset_path))

    assert reloaded_questions == questions

