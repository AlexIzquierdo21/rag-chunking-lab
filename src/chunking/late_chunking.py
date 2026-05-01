"""Chunking strategy that contextualizes each chunk against the full document embedding."""

import numpy as np
from sentence_transformers import SentenceTransformer

from src.chunking import Chunk, ChunkingStrategy


class LateChunking(ChunkingStrategy):
    """Contextualize each chunk with the full document embedding to preserve cross-chunk relationships."""

    name = "late_chunking"

    def __init__(self, model_name: str = "all-MiniLM-L6-v2", chunk_size: int = 256) -> None:
        self.model_name = model_name
        self.chunk_size = chunk_size
        self.model = SentenceTransformer(self.model_name)

    def chunk(self, text: str, source: str) -> list[Chunk]:
        if not text:
            return []

        document_embedding = np.asarray(self.model.encode(text))
        chunk_texts = self._split_text(text)
        chunk_embeddings = np.asarray(self.model.encode(chunk_texts))
        return [
            self._build_chunk(chunk_text, chunk_embedding, document_embedding, index, source)
            for index, (chunk_text, chunk_embedding) in enumerate(zip(chunk_texts, chunk_embeddings))
        ]

    def _split_text(self, text: str) -> list[str]:
        return [text[index : index + self.chunk_size] for index in range(0, len(text), self.chunk_size)]

    def _build_chunk(
        self,
        chunk_text: str,
        chunk_embedding: np.ndarray,
        document_embedding: np.ndarray,
        index: int,
        source: str,
    ) -> Chunk:
        similarity = self._cosine_similarity(chunk_embedding, document_embedding)
        return Chunk(
            text=chunk_text,
            metadata={
                "model": self.model_name,
                "chunk_size": self.chunk_size,
                "doc_similarity": similarity,
            },
            strategy=self.name,
            chunk_index=index,
            source_doc=source,
        )

    def _cosine_similarity(self, vector_a: np.ndarray, vector_b: np.ndarray) -> float:
        numerator = float(np.dot(vector_a, vector_b))
        norm_a = float(np.sqrt(np.dot(vector_a, vector_a)))
        norm_b = float(np.sqrt(np.dot(vector_b, vector_b)))
        denominator = norm_a * norm_b
        if denominator == 0:
            return 0.0
        return numerator / denominator

