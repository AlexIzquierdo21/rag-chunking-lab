"""
API routers for RAG Chunking Lab.

Contains all endpoint groups organized by resource:
- documents: file upload, listing, deletion
- datasets: evaluation dataset management
- evaluations: evaluation run execution and tracking
"""

from src.api.routers.datasets import router as datasets_router
from src.api.routers.documents import router as documents_router
from src.api.routers.evaluations import router as evaluations_router

__all__ = ["documents_router", "datasets_router", "evaluations_router"]

