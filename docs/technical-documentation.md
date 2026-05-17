# RAG Chunking Strategy Comparator — Technical Documentation

**Version 1.0 | Open Source | MIT License**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Chunking Strategies](#4-chunking-strategies)
5. [Evaluation System](#5-evaluation-system)
6. [Configuration](#6-configuration)
7. [Coding Standards & Best Practices](#7-coding-standards--best-practices)
8. [Local Setup](#8-local-setup)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Project Overview

RAG Chunking Strategy Comparator is an open-source Python tool that enables developers and researchers to empirically compare different text chunking strategies for Retrieval-Augmented Generation (RAG) systems. Given any document corpus and a set of evaluation questions, the tool automatically runs each strategy through a full RAG pipeline and produces a comparative report with objective metrics.

The project runs entirely locally with no external API dependencies, using Ollama for LLM inference and sentence-transformers for embeddings.

### 1.1 Goals

- Provide empirical data on chunking strategy performance across different document types
- Be easy to clone and run — no API keys, no paid services
- Serve as a learning resource for RAG evaluation techniques
- Produce a clear, readable report that can inform production RAG decisions

### 1.2 Non-Goals

- This is not a production RAG system — it is a benchmarking and research tool
- Does not support multi-user or concurrent evaluation runs
- Does not persist results to a database — outputs are files

---

## 2. Technology Stack

| Component | Technology | Reason |
|---|---|---|
| Language | Python 3.10+ | Ecosystem, type hints, modern runtime support |
| Frontend | React (CDN prototype), vanilla fetch, JSX via Babel standalone | Lightweight local UI with no build step required |
| Backend API | FastAPI with 3 routers (documents, datasets, evaluations) | Clear REST layer between UI and pipeline |
| LLM inference | Ollama (local) | Zero cost, no API key, GPU-accelerated |
| Embeddings | sentence-transformers | Local, fast, HuggingFace ecosystem |
| Vector store | ChromaDB | Local, persistent, simple API |
| Chunking (base) | LangChain | RecursiveCharacterTextSplitter, SemanticChunker |
| Chunking (advanced) | LlamaIndex | Sentence-window, late chunking support |
| Evaluation | Ragas | Standard RAG metrics, Ollama-compatible |
| Document parsing | Unstructured.io | PDF, DOCX, TXT, HTML ingestion |
| Reports | pandas + Plotly | Metrics aggregation and visual comparison |
| Testing | pytest | Unit and integration tests |
| Linting | ruff + mypy | Code quality and type safety |

---

## 3. Architecture

### 3.1 High-Level Design Principles

- **Strategy pattern** for chunking — every strategy implements the same interface
- **Dependency injection** — components are passed in, not instantiated internally
- **No global state** — all configuration flows through explicit parameters
- **Fail fast** — validate inputs early before expensive operations
- **Pure functions where possible** — chunking functions are stateless

### 3.2 Project Structure

```
chunking-comparator/
├── app/                         # Streamlit UI prototype / alternative interface
│   ├── pages/
│   │   ├── 01_upload.py         # Document upload & corpus management
│   │   ├── 02_configure.py      # Strategy & model selection
│   │   ├── 03_evaluate.py       # Run evaluation
│   │   └── 04_results.py        # Interactive report
│   └── main.py                  # Streamlit entry point
├── frontend/                    # React CDN prototype frontend
│   ├── api.js                   # Browser API client
│   ├── app.jsx                  # Root app shell
│   ├── page-upload.jsx          # Upload page
│   ├── page-configure.jsx       # Configure page
│   ├── page-evaluate.jsx        # Evaluate page
│   ├── page-results.jsx         # Results page
│   └── RAG Chunking Lab.html    # Frontend entry point
├── src/
│   ├── api/
│   │   ├── main.py              # FastAPI application entry point
│   │   └── routers/
│   │       ├── documents.py     # Document API routes
│   │       ├── datasets.py      # Dataset API routes
│   │       └── evaluations.py   # Evaluation API routes
│   ├── chunking/
│   │   ├── base.py              # ChunkingStrategy ABC
│   │   ├── fixed.py             # Fixed-size chunking
│   │   ├── recursive.py         # Recursive character splitting
│   │   ├── semantic.py          # Semantic (embedding-based) chunking
│   │   ├── sentence_window.py   # Sentence-window retrieval
│   │   └── late_chunking.py     # Late chunking (context-aware)
│   ├── pipeline/
│   │   ├── ingestor.py          # Document loading & parsing
│   │   ├── embedder.py          # Embedding generation
│   │   ├── retriever.py         # Vector search & reranking
│   │   └── generator.py         # LLM answer generation
│   ├── evaluation/
│   │   ├── dataset.py           # Golden dataset management
│   │   └── evaluator.py         # Ragas metrics runner
│   ├── report/
│   │   └── builder.py           # Report generation
│   └── config/
│       └── settings.py          # Pydantic settings model
├── tests/
│   ├── unit/
│   └── integration/
├── corpus/                      # Sample documents
├── eval/
│   └── questions.json           # Golden dataset
├── .github/
│   └── copilot-instructions.md
├── .env.example
├── pyproject.toml
└── README.md
```

### 3.3 Core Abstraction — ChunkingStrategy

Every chunking strategy must implement this interface. Adding a new strategy means creating a new file and registering it — nothing else changes.

```python
# src/chunking/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class Chunk:
    text: str
    metadata: dict
    strategy: str
    chunk_index: int
    source_doc: str

class ChunkingStrategy(ABC):
    name: str

    @abstractmethod
    def chunk(self, text: str, source: str) -> list[Chunk]:
        ...

    def describe(self) -> dict:
        return {"name": self.name, "params": self.__dict__}
```

### 3.4 Data Flow

The evaluation pipeline follows a linear flow with no shared mutable state between stages:

1. User uploads documents via the frontend UI
2. Ingestor parses documents to plain text (PDF, DOCX, TXT, HTML)
3. Each strategy chunks the corpus independently
4. Embedder generates vectors for each chunk set (sentence-transformers)
5. ChromaDB stores each strategy's chunks in a separate collection
6. For each question in the golden dataset, retriever fetches top-k chunks per strategy
7. Generator calls Ollama to produce an answer from retrieved context
8. Evaluator runs Ragas metrics on question + context + answer triplets
9. Report builder aggregates results and the frontend renders charts and rankings

### 3.5 API Layer

The project exposes a FastAPI backend that sits between the frontend and the RAG pipeline. The API is organized into three routers: `documents`, `datasets`, and `evaluations`, with a small core application layer in `src/api/main.py`.

Implemented endpoints:

- `GET /api/health`
- `GET /api/strategies`
- `GET /api/models`
- `POST /api/documents/upload`
- `GET /api/documents`
- `DELETE /api/documents/{filename}`
- `POST /api/datasets/load`
- `GET /api/datasets/default`
- `POST /api/evaluations/start`
- `GET /api/evaluations/{run_id}/status`
- `GET /api/evaluations/{run_id}/results`

This API layer allows the browser frontend to remain thin while the backend owns document ingestion, dataset loading, evaluation orchestration, and result retrieval.

---

## 4. Chunking Strategies

| Strategy | Chunk size | Strengths | Weaknesses |
|---|---|---|---|
| Fixed-size | Fixed (N tokens) | Predictable, fast, baseline | Breaks semantic context arbitrarily |
| Recursive | Variable (heuristic) | Respects paragraph/sentence structure | Still heuristic, no semantic awareness |
| Semantic | Variable (dynamic) | Semantically coherent chunks | Slower, embedding cost at index time |
| Sentence-window | 1 sentence + window | High precision for factual queries | More chunks, higher retrieval noise |
| Late chunking | Variable (context-aware) | Cross-chunk context preserved | Most complex, model-dependent |

### 4.1 Fixed-Size

Splits text every N tokens with an overlap of M tokens. Simple and deterministic. Use as the baseline to beat.

```python
FixedChunking(chunk_size=512, overlap=50)
```

### 4.2 Recursive

Uses LangChain's `RecursiveCharacterTextSplitter`. Tries to split on paragraphs first, then sentences, then words. Respects natural text boundaries more than fixed-size.

```python
RecursiveChunking(chunk_size=512, overlap=50)
```

### 4.3 Semantic

Uses sentence-transformers to embed each sentence. Detects topic shifts by measuring cosine similarity between consecutive sentence embeddings. Splits when similarity drops below a threshold. Produces variable-length chunks that are semantically coherent.

```python
SemanticChunking(model="all-MiniLM-L6-v2", threshold=0.75)
```

### 4.4 Sentence-Window

Indexes each sentence as its own chunk. At retrieval time, returns the target sentence plus N sentences of surrounding context. Good for precise factual queries where the answer is a specific sentence.

```python
SentenceWindowChunking(window_size=3)
```

### 4.5 Late Chunking

Embeds the full document first to capture global context, then applies chunking. Each chunk's embedding is influenced by the whole document, preserving cross-chunk semantic relationships. Requires a model that supports long-context embeddings.

```python
LateChunking(model="jinaai/jina-embeddings-v2-base-en", chunk_size=256)
```

---

## 5. Evaluation System

### 5.1 Golden Dataset Format

The evaluation dataset is a JSON file. Each entry contains a question, the expected answer, and the IDs of the source documents that contain the answer.

```json
[
  {
    "id": "q001",
    "question": "What is the check-out time?",
    "expected_answer": "Check-out is at 12:00 noon.",
    "source_docs": ["hotel_policy.pdf"],
    "type": "factual"
  }
]
```

### 5.2 Question Types

- **Factual** — answer contained in a single chunk. Tests precision.
- **Multi-hop** — answer requires combining information from multiple chunks. Tests recall.
- **Adversarial** — no correct answer exists in the corpus. Tests hallucination resistance.

### 5.3 Metrics

| Metric | What it measures | Target |
|---|---|---|
| Context Recall | Was the correct chunk retrieved? | > 0.80 |
| Context Precision | How much noise in retrieved chunks? | > 0.75 |
| Answer Faithfulness | Is the answer grounded in context? | > 0.80 |
| Answer Relevancy | Does the answer address the question? | > 0.75 |
| Chunk size (avg) | Mean token count per chunk | Diagnostic |
| Chunk size (std) | Variance in chunk sizes | Diagnostic |
| Retrieval latency | Time to retrieve top-k chunks | Diagnostic |
| Index time | Time to chunk + embed corpus | Diagnostic |

---

## 6. Configuration

### 6.1 Settings Model

All configuration is centralized in a Pydantic settings model. Environment variables override defaults. No magic constants scattered through the code.

```python
# src/config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_timeout: int = 120

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_batch_size: int = 32

    # Retrieval
    retrieval_top_k: int = 5

    # ChromaDB
    chroma_persist_dir: str = ".chroma"

    class Config:
        env_file = ".env"
```

### 6.2 .env.example

```env
OLLAMA_MODEL=llama3.2
EMBEDDING_MODEL=all-MiniLM-L6-v2
RETRIEVAL_TOP_K=5
```

---

## 7. Coding Standards & Best Practices

### 7.1 General Rules

- All functions must have type annotations — no bare `Any` unless justified
- No function longer than 40 lines — extract helpers if needed
- No commented-out code in commits
- No magic numbers — use named constants or config
- Every module has a single responsibility — if you can't describe it in one sentence, split it

### 7.2 Error Handling

- Never silently swallow exceptions with bare `except`
- Use custom exception classes for domain errors (`ChunkingError`, `EvaluationError`, `IngestionError`)
- Log errors with context — include the operation, input shape, and strategy name
- Validate all user inputs at the UI/API boundary, not inside pipeline functions

### 7.3 Copilot Usage Guidelines

**Accept Copilot suggestions for:**
- Boilerplate and repetitive logic
- Docstrings and inline comments
- Test cases given a function signature
- Type annotations on existing functions
- Pandas / Plotly data transformation code

**Reject Copilot suggestions that:**
- Create new modules, classes, or abstractions not already defined in the architecture
- Bypass the `ChunkingStrategy` interface
- Add dependencies not listed in the tech stack
- Add bare `except` or `except Exception` blocks
- Put business logic inside frontend page files or Streamlit page files
- Hardcode model names, URLs, or file paths

### 7.4 Testing

- Unit tests for every chunking strategy — given text input, assert chunk count and properties
- Unit tests for the evaluator — mock the LLM and assert metric calculation
- Integration test: run full pipeline on a small corpus (3 docs, 5 questions)
- Tests must not call Ollama or any network resource — mock all external calls
- Aim for > 80% coverage on `src/`

### 7.5 Dependency Management

```toml
[tool.poetry.dependencies]
python = "^3.11"
streamlit = "^1.35"
langchain = "^0.2"
llama-index = "^0.10"
sentence-transformers = "^3.0"
chromadb = "^0.5"
ragas = "^0.1"
unstructured = "^0.14"
pydantic-settings = "^2.0"
pandas = "^2.0"
plotly = "^5.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0"
pytest-cov = "^5.0"
ruff = "^0.4"
mypy = "^1.10"
```

---

## 8. Local Setup

### 8.1 Prerequisites

- Python 3.10+
- [Ollama](https://ollama.com) installed and running
- NVIDIA GPU with CUDA drivers (recommended — CPU works but is slower)

### 8.2 Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/<user>/chunking-comparator
cd chunking-comparator

# 2. Install dependencies
pip install -e .[dev]

# 3. Pull the default Ollama model
ollama pull llama3.2

# 4. Copy and edit the environment file
cp .env.example .env

# 5. Start the FastAPI backend
uvicorn src.api.main:app --reload --port 8000

# 6. Start the frontend
cd frontend && python -m http.server 5500
```

### 8.3 Changing the Ollama Model

Any model available in Ollama can be used. Edit `.env`:

```env
OLLAMA_MODEL=mistral
```

Then pull the model:

```bash
ollama pull mistral
```

---

## 9. Implementation Roadmap

| Phase | Scope | Deliverable |
|---|---|---|
| Phase 1 | Fixed + Recursive chunking, basic pipeline, Ragas integration | Working evaluation with 2 strategies |
| Phase 2 | Semantic + Sentence-window chunking, Streamlit UI (upload + results) | Full UI with 4 strategies |
| Phase 3 | Late chunking, interactive report with Plotly charts | Complete comparator, GitHub ready |
| Phase 4 | Tests, README, sample corpus + golden dataset included | Public release |
