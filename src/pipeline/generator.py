"""This module handles LLM answer generation via Ollama."""

import logging

import ollama

from src.config import settings

logger = logging.getLogger(__name__)


class GenerationError(Exception):
    """Raised when answer generation with the LLM fails."""


class Generator:
    def __init__(
        self,
        model: str | None = None,
        base_url: str | None = None,
        timeout: int | None = None,
    ) -> None:
        self.model = model or settings.ollama_model
        self.base_url = base_url or settings.ollama_base_url
        self.timeout = timeout or settings.ollama_timeout
        self.client = ollama.Client(host=self.base_url)

    def generate(self, question: str, context_chunks: list[dict]) -> str:
        try:
            context = "\n---\n".join(chunk["text"] for chunk in context_chunks)
            prompt = (
                "Answer the question based only on the following context.\n"
                "If the answer is not in the context, say 'I don't know'.\n\n"
                "Context:\n"
                f"{context}\n\n"
                f"Question: {question}\n"
                "Answer:"
            )
            logger.debug("Generating answer with model %s for question: %s", self.model, question)
            response = self.client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
            )
            return self._extract_content(response)
        except Exception as exc:
            raise GenerationError(str(exc)) from exc

    def _extract_content(self, response: object) -> str:
        if isinstance(response, dict):
            message = response.get("message", {})
            content = message.get("content", "") if isinstance(message, dict) else ""
            return str(content)

        message = getattr(response, "message", None)
        content = getattr(message, "content", "")
        return str(content)
