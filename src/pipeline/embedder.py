"""This module handles embedding generation for chunks and query texts."""

import logging

from sentence_transformers import SentenceTransformer

from src.chunking import Chunk
from src.config import settings

logger = logging.getLogger(__name__)


class Embedder:
    def __init__(
        self,
        model_name: str | None = None,
        batch_size: int | None = None,
    ) -> None:
        self.model_name = model_name or settings.embedding_model
        self.batch_size = batch_size or settings.embedding_batch_size
        self.model = SentenceTransformer(self.model_name)

    def embed_chunks(self, chunks: list[Chunk]) -> list[Chunk]:
        if not chunks:
            logger.debug("Embedded 0 chunks")
            return chunks

        embeddings = self.embed_texts([chunk.text for chunk in chunks])
        for chunk, embedding in zip(chunks, embeddings):
            chunk.metadata["embedding"] = embedding

        logger.debug("Embedded %d chunks", len(chunks))
        return chunks

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        embeddings = self.model.encode(texts, batch_size=self.batch_size)
        return [[float(value) for value in embedding] for embedding in embeddings]
