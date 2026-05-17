"""
Datasets API router for loading and managing evaluation datasets.

Handles loading of golden datasets in JSONL format with question-answer pairs
for evaluation of RAG chunking strategies.
"""

import logging
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.evaluation import DatasetError, load_dataset

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


# Request models
class DatasetLoadRequest(BaseModel):
    """Request to load a dataset from a file path."""
    path: str


# Response models
class QuestionInfo(BaseModel):
    """Information about a single evaluation question."""
    id: str
    question: str
    type: str  # "factual", "multi-hop", "adversarial"
    source_docs: List[str]


class DatasetInfo(BaseModel):
    """Dataset metadata and questions."""
    path: str
    total: int
    factual: int
    multi_hop: int
    adversarial: int
    questions: List[QuestionInfo]


@router.post("/load", response_model=DatasetInfo)
def load_dataset_endpoint(request: DatasetLoadRequest) -> DatasetInfo:
    """
    Load a dataset from a file path.

    Args:
        request: DatasetLoadRequest containing file path.

    Returns:
        DatasetInfo with metadata and questions.

    Raises:
        HTTPException: If dataset loading fails.
    """
    try:
        eval_questions = load_dataset(request.path)
        logger.info(f"Loaded dataset from {request.path}: {len(eval_questions)} questions")
    except DatasetError as e:
        logger.error(f"Dataset error loading {request.path}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error loading dataset {request.path}: {e}")
        raise HTTPException(status_code=500, detail="Failed to load dataset")

    # Count questions by type
    type_counts = {
        "factual": 0,
        "multi-hop": 0,
        "adversarial": 0,
    }

    questions = []
    for eq in eval_questions:
        # Count by type
        q_type = eq.type
        if q_type in type_counts:
            type_counts[q_type] += 1

        # Build QuestionInfo
        questions.append(
            QuestionInfo(
                id=eq.id,
                question=eq.question,
                type=q_type,
                source_docs=eq.source_docs,
            )
        )

    logger.debug(
        f"Dataset breakdown: {type_counts['factual']} factual, "
        f"{type_counts['multi-hop']} multi-hop, "
        f"{type_counts['adversarial']} adversarial"
    )

    return DatasetInfo(
        path=request.path,
        total=len(questions),
        factual=type_counts["factual"],
        multi_hop=type_counts["multi-hop"],
        adversarial=type_counts["adversarial"],
        questions=questions,
    )


@router.get("/default", response_model=DatasetInfo)
def load_default_dataset() -> DatasetInfo:
    """
    Load the default evaluation dataset.

    Returns:
        DatasetInfo with metadata and questions.

    Raises:
        HTTPException: If default dataset not found or loading fails.
    """
    default_path = "eval/questions.json"
    try:
        eval_questions = load_dataset(default_path)
        logger.info(f"Loaded default dataset: {len(eval_questions)} questions")
    except DatasetError as e:
        logger.error(f"Failed to load default dataset: {e}")
        raise HTTPException(status_code=404, detail="Default dataset not found")
    except Exception as e:
        logger.error(f"Unexpected error loading default dataset: {e}")
        raise HTTPException(status_code=404, detail="Failed to load default dataset")

    # Count questions by type
    type_counts = {
        "factual": 0,
        "multi-hop": 0,
        "adversarial": 0,
    }

    questions = []
    for eq in eval_questions:
        # Count by type
        q_type = eq.type
        if q_type in type_counts:
            type_counts[q_type] += 1

        # Build QuestionInfo
        questions.append(
            QuestionInfo(
                id=eq.id,
                question=eq.question,
                type=q_type,
                source_docs=eq.source_docs,
            )
        )

    logger.debug(
        f"Default dataset breakdown: {type_counts['factual']} factual, "
        f"{type_counts['multi-hop']} multi-hop, "
        f"{type_counts['adversarial']} adversarial"
    )

    return DatasetInfo(
        path=default_path,
        total=len(questions),
        factual=type_counts["factual"],
        multi_hop=type_counts["multi-hop"],
        adversarial=type_counts["adversarial"],
        questions=questions,
    )

