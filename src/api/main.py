"""
FastAPI application entry point for RAG Chunking Lab.

Provides REST API endpoints for:
- Health checks
- Chunking strategy metadata
- Model configuration
- Document management (via documents_router)
- Dataset management (via datasets_router)
- Evaluation runs (via evaluations_router)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routers import datasets_router, documents_router, evaluations_router
from src.config import settings

app = FastAPI(
    title="RAG Chunking Lab API",
    version="1.0.0",
    description="REST API for comparing RAG chunking strategies",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents_router)
app.include_router(datasets_router)
app.include_router(evaluations_router)


@app.get("/api/health")
def health_check():
    """
    Health check endpoint.
    
    Returns:
        dict: Status and version information.
    """
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/strategies")
def get_strategies():
    """
    Get available chunking strategies and their default parameters.
    
    Returns:
        list[dict]: List of strategy metadata.
    """
    return [
        {
            "name": "fixed",
            "display_name": "Fixed-size chunking",
            "description": "Splits text into fixed-size chunks with overlap. Fast and deterministic.",
            "default_params": {
                "chunk_size": 512,
                "overlap": 50,
            },
        },
        {
            "name": "recursive",
            "display_name": "Recursive character splitting",
            "description": "Recursively splits on delimiters (paragraphs, sentences, words) to maintain structure.",
            "default_params": {
                "chunk_size": 512,
                "overlap": 50,
            },
        },
        {
            "name": "semantic",
            "display_name": "Semantic chunking",
            "description": "Uses sentence embeddings to split at semantic boundaries.",
            "default_params": {
                "threshold": 0.75,
            },
        },
        {
            "name": "sentence_window",
            "display_name": "Sentence-window retrieval",
            "description": "Indexes individual sentences with surrounding context windows.",
            "default_params": {
                "window_size": 3,
            },
        },
        {
            "name": "late_chunking",
            "display_name": "Late chunking",
            "description": "Embeds full document context then pools embeddings per chunk.",
            "default_params": {
                "chunk_size": 256,
            },
        },
    ]


@app.get("/api/models")
def get_models():
    """
    Get configured embedding and LLM model names.
    
    Returns:
        dict: Model configuration from settings.
    """
    return {
        "embedding_model": settings.embedding_model,
        "llm_model": settings.ollama_model,
    }


# TODO: add routers for reports and live progress streaming



