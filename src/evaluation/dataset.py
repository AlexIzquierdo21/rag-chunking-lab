"""This module manages the golden evaluation dataset."""

import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = {"id", "question", "expected_answer", "source_docs", "type"}
ALLOWED_TYPES = {"factual", "multi-hop", "adversarial"}


class DatasetError(Exception):
    """Raised when the evaluation dataset cannot be loaded or saved correctly."""


@dataclass
class EvalQuestion:
    id: str
    question: str
    expected_answer: str
    source_docs: list[str]
    type: str


def load_dataset(path: str) -> list[EvalQuestion]:
    dataset_path = Path(path)
    if not dataset_path.exists():
        raise DatasetError(f"Dataset file not found: {path}")

    try:
        data = json.loads(dataset_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise DatasetError(f"Failed to read dataset file '{path}': {exc}") from exc

    if not isinstance(data, list):
        raise DatasetError("Dataset content must be a JSON array of question entries")

    questions = [_parse_entry(entry, index) for index, entry in enumerate(data)]
    logger.debug("Loaded dataset from %s with %d questions", path, len(questions))
    return questions


def save_dataset(questions: list[EvalQuestion], path: str) -> None:
    dataset_path = Path(path)
    payload = [asdict(question) for question in questions]

    try:
        dataset_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=True),
            encoding="utf-8",
        )
    except OSError as exc:
        raise DatasetError(f"Failed to save dataset file '{path}': {exc}") from exc

    logger.debug("Saved dataset to %s with %d questions", path, len(questions))


def _parse_entry(entry: Any, index: int) -> EvalQuestion:
    if not isinstance(entry, dict):
        raise DatasetError(f"Invalid dataset entry at index {index}: expected object")

    entry_id = str(entry.get("id", f"index_{index}"))
    missing_fields = sorted(REQUIRED_FIELDS.difference(entry.keys()))
    if missing_fields:
        raise DatasetError(
            f"Dataset entry '{entry_id}' is missing required fields: {', '.join(missing_fields)}"
        )

    source_docs = entry["source_docs"]
    if not isinstance(source_docs, list) or not all(isinstance(doc, str) for doc in source_docs):
        raise DatasetError(f"Dataset entry '{entry_id}' has invalid 'source_docs'; expected list[str]")

    question_type = entry["type"]
    if question_type not in ALLOWED_TYPES:
        allowed = ", ".join(sorted(ALLOWED_TYPES))
        raise DatasetError(
            f"Dataset entry '{entry_id}' has invalid type '{question_type}'. Allowed values: {allowed}"
        )

    return EvalQuestion(
        id=str(entry["id"]),
        question=str(entry["question"]),
        expected_answer=str(entry["expected_answer"]),
        source_docs=source_docs,
        type=str(question_type),
    )
