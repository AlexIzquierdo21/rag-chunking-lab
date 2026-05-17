# RAG Chunking Lab

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen)

**Empirically compare RAG chunking strategies on your own documents. Runs 100% locally with Ollama — no API keys required.**

RAG Chunking Lab helps you benchmark how different chunking strategies affect retrieval and answer quality on your own corpus. It compares fixed, recursive, semantic, sentence-window, and late chunking strategies using a local-first pipeline powered by Ollama, sentence-transformers, and ChromaDB. The project measures ROUGE-L, context hit rate, and adversarial detection quality, then surfaces the results in a visual dashboard. Everything runs locally, so you can experiment without external API costs or data leaving your machine.

![Results Dashboard](docs/screenshot.png)

## Features

- 5 chunking strategies
- Modern React UI + FastAPI backend
- 100% local — Ollama + sentence-transformers
- PDF, DOCX, TXT, HTML, MD support
- Custom evaluation dataset (JSON)
- Metrics: ROUGE-L, context hit rate, adversarial score
- Strategy leaderboard with combined scoring

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (CDN/JSX prototype), vanilla browser `fetch` |
| Backend API | FastAPI |
| Local LLM inference | Ollama |
| Embeddings | sentence-transformers |
| Vector store | ChromaDB |
| Chunking | LangChain text splitters + custom semantic strategies |
| Evaluation | Custom local metrics (ROUGE-L, context hit rate, adversarial score) |
| Document parsing | pypdf, python-docx, BeautifulSoup |
| Reports | CSV + frontend dashboard |
| Testing | pytest |

## Prerequisites

- Python 3.10+
- Ollama installed and running
- NVIDIA GPU recommended (CPU works but slower)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/rag-chunking-lab.git
cd rag-chunking-lab
```

### 2. Create a virtual environment with Python 3.10

```bash
python3.10 -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Create your local environment file

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 5. Pull the default Ollama model

```bash
ollama pull llama3.2
```

### 6. Start the backend API

```bash
uvicorn src.api.main:app --reload --port 8000
```

### 7. Start the frontend

```bash
cd frontend
python -m http.server 5500
```

### 8. Open the app

Open this URL in your browser:

```text
http://localhost:5500/RAG%20Chunking%20Lab.html
```

## Usage

The workflow is intentionally simple:

1. **Upload** — Add your documents to the corpus (`PDF`, `DOCX`, `TXT`, `HTML`, `MD`)
2. **Configure** — Choose chunking strategies and load an evaluation dataset
3. **Evaluate** — Run the comparison pipeline against your corpus and dataset
4. **Results** — Inspect rankings, latencies, metrics, and per-question outputs

## Changing the Ollama Model

To use a different Ollama generation model, edit your `.env` file:

```env
OLLAMA_MODEL=mistral
```

Then restart the backend.

## Project Structure

```text
rag-chunking-lab/
├── app/                        # Streamlit app entry + pages
│   ├── main.py
│   └── pages/
├── corpus/                     # Uploaded/input documents
├── docs/
│   └── technical-documentation.md
├── eval/
│   └── questions.json          # Evaluation dataset
├── frontend/                   # React-style browser UI
│   ├── api.js
│   ├── app.jsx
│   ├── page-upload.jsx
│   ├── page-configure.jsx
│   ├── page-evaluate.jsx
│   ├── page-results.jsx
│   └── RAG Chunking Lab.html
├── output/                     # Generated evaluation output files
├── scripts/
│   └── run_evaluation.py
├── src/
│   ├── api/                    # FastAPI app + routers
│   ├── chunking/               # Chunking strategies
│   ├── config/                 # Pydantic settings
│   ├── evaluation/             # Dataset + evaluator logic
│   ├── pipeline/               # Ingestion, embedding, retrieval, generation
│   └── report/                 # Report building utilities
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
├── LICENSE
├── pyproject.toml
├── README.md
└── requirements.txt
```

## Running Tests

```bash
python -m pytest tests/ -q
```

## Roadmap

- Ragas integration with capable models
- Docker compose for one-command startup
- OpenAI/Groq API support as optional evaluator

## Contributing

Contributions are welcome.

If you want to improve the project:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests where appropriate
4. Run the test suite locally
5. Open a pull request with a clear description

Good contributions include:

- bug fixes
- UI improvements
- evaluation metrics improvements
- new dataset tooling
- performance improvements for local inference
- documentation and examples

If you're planning a large change, opening an issue first is appreciated.

## License

MIT
