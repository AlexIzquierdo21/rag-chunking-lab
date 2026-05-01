# Copilot Instructions — RAG Chunking Strategy Comparator

## Project summary

Open-source Python tool that compares RAG chunking strategies (fixed, recursive, semantic, sentence-window, late chunking) on any document corpus and produces a metrics report. Runs 100% locally via Ollama + sentence-transformers. UI is Streamlit.

---

## Architecture rules — never break these

- Every chunking strategy implements `ChunkingStrategy` (ABC in `src/chunking/base.py`). Never instantiate a strategy without going through this interface.
- All configuration comes from `src/config/settings.py` (Pydantic BaseSettings). Never hardcode URLs, model names, or numeric constants.
- Pipeline stages (`ingestor`, `embedder`, `retriever`, `generator`, `evaluator`) are independent modules with no shared mutable state.
- Each strategy gets its own ChromaDB collection. Never mix chunks from different strategies in the same collection.
- Streamlit pages live in `app/pages/`. Business logic never goes in Streamlit files — only calls to `src/`.

## Project structure

```
chunking-comparator/
├── app/
│   ├── pages/
│   │   ├── 01_upload.py
│   │   ├── 02_configure.py
│   │   ├── 03_evaluate.py
│   │   └── 04_results.py
│   └── main.py
├── src/
│   ├── chunking/
│   │   ├── base.py              # ChunkingStrategy ABC + Chunk dataclass
│   │   ├── fixed.py
│   │   ├── recursive.py
│   │   ├── semantic.py
│   │   ├── sentence_window.py
│   │   └── late_chunking.py
│   ├── pipeline/
│   │   ├── ingestor.py
│   │   ├── embedder.py
│   │   ├── retriever.py
│   │   └── generator.py
│   ├── evaluation/
│   │   ├── dataset.py
│   │   └── evaluator.py
│   ├── report/
│   │   └── builder.py
│   └── config/
│       └── settings.py
├── tests/
│   ├── unit/
│   └── integration/
├── corpus/
├── eval/
│   └── questions.json
├── .env.example
└── pyproject.toml
```

---

## Core abstractions

```python
# src/chunking/base.py
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
    def chunk(self, text: str, source: str) -> list[Chunk]: ...

    def describe(self) -> dict:
        return {"name": self.name, "params": self.__dict__}
```

---

## Tech stack

| Component | Library |
|---|---|
| LLM inference | Ollama (local, no API key) |
| Embeddings | sentence-transformers |
| Vector store | ChromaDB (local, persistent) |
| Chunking | LangChain + LlamaIndex |
| Evaluation | Ragas |
| Document parsing | Unstructured.io |
| UI | Streamlit |
| Settings | pydantic-settings |
| Reports | pandas + Plotly |
| Tests | pytest |
| Linting | ruff + mypy |

---

## Coding standards

- All functions must have type annotations. No bare `Any` unless justified with a comment.
- No function longer than 40 lines. Extract helpers if needed.
- No magic numbers — use `Settings` or named constants.
- No commented-out code in commits.
- Custom exceptions for domain errors: `ChunkingError`, `EvaluationError`, `IngestionError`.
- Never use bare `except` — always catch specific exceptions and log with context.
- Validate all user inputs at the Streamlit boundary, not inside pipeline functions.

---

## What Copilot should help with

- Boilerplate and repetitive logic (loop bodies, dict construction, dataclass fields)
- Docstrings and inline comments
- Test cases — given a function signature, generate unit tests
- Type annotations on existing functions
- Pandas / Plotly data transformation code

## What Copilot must NOT do

- Create new modules, classes, or abstractions not already defined in this file
- Bypass the `ChunkingStrategy` interface in any way
- Add new dependencies not listed in the tech stack above
- Add `try/except Exception` or bare `except` blocks
- Put business logic inside Streamlit page files (`app/pages/`)
- Hardcode model names, URLs, or file paths

---

## Settings reference

```python
# src/config/settings.py
class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_timeout: int = 120
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_batch_size: int = 32
    retrieval_top_k: int = 5
    chroma_persist_dir: str = ".chroma"

    class Config:
        env_file = ".env"
```

---

## Golden dataset format

```json
[
  {
    "id": "q001",
    "question": "...",
    "expected_answer": "...",
    "source_docs": ["file.pdf"],
    "type": "factual"
  }
]
```

Question types: `factual`, `multi-hop`, `adversarial`.

---

## Evaluation metrics (Ragas)

- Context Recall → target > 0.80
- Context Precision → target > 0.75
- Answer Faithfulness → target > 0.80
- Answer Relevancy → target > 0.75
- Chunk size avg/std, retrieval latency, index time → diagnostic only
