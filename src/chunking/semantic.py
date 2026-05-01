"""Chunking strategy that detects topic shifts via cosine similarity between sentence embeddings."""

import numpy as np
from sentence_transformers import SentenceTransformer

from src.chunking import Chunk, ChunkingStrategy


class SemanticChunking(ChunkingStrategy):
    """Detect topic shifts via cosine similarity between sentence embeddings."""

    name = "semantic"

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        threshold: float = 0.75,
    ) -> None:
        self.model_name = model_name
        self.threshold = threshold
        self.model = SentenceTransformer(self.model_name)

    def chunk(self, text: str, source: str) -> list[Chunk]:
        sentences = [sentence.strip() for sentence in text.split(". ") if sentence.strip()]
        if not sentences:
            return []
        if len(sentences) == 1:
            return [self._build_chunk(sentences[0], 0, source)]

        embeddings = np.asarray(self.model.encode(sentences))
        chunks: list[str] = []
        current_sentences = [sentences[0]]

        for index in range(1, len(sentences)):
            similarity = self._cosine_similarity(embeddings[index - 1], embeddings[index])
            if similarity < self.threshold:
                chunks.append(". ".join(current_sentences))
                current_sentences = [sentences[index]]
            else:
                current_sentences.append(sentences[index])

        chunks.append(". ".join(current_sentences))

        return [self._build_chunk(chunk_text, index, source) for index, chunk_text in enumerate(chunks)]

    def _build_chunk(self, text: str, index: int, source: str) -> Chunk:
        return Chunk(
            text=text,
            metadata={"model": self.model_name, "threshold": self.threshold},
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


