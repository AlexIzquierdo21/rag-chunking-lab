"""This module handles chunk indexing and semantic retrieval via ChromaDB."""

import logging
from typing import Any

import chromadb

from src.chunking import Chunk
from src.config import settings
from src.pipeline import Embedder

logger = logging.getLogger(__name__)


class Retriever:
    def __init__(
        self,
        collection_name: str,
        embedder: Embedder,
        persist_dir: str | None = None,
    ) -> None:
        storage_dir = persist_dir or settings.chroma_persist_dir
        client = chromadb.PersistentClient(path=storage_dir)
        self.collection = client.get_or_create_collection(name=collection_name)
        self.embedder = embedder

    def index_chunks(self, chunks: list[Chunk]) -> None:
        if not chunks:
            logger.debug("Indexed 0 chunks into collection %s", self.collection.name)
            return

        texts = [chunk.text for chunk in chunks]
        ids = [f"{chunk.chunk_index}_{chunk.source_doc}" for chunk in chunks]
        metadatas = [
            self._clean_metadata(chunk.metadata) or {"source": chunk.source_doc}
            for chunk in chunks
        ]
        embeddings = self.embedder.embed_texts(texts)

        self.collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas,
            embeddings=embeddings,
        )
        logger.debug("Indexed %d chunks into collection %s", len(chunks), self.collection.name)

    def retrieve(self, query: str, top_k: int | None = None) -> list[dict[str, Any]]:
        limit = top_k or settings.retrieval_top_k
        query_embedding = self.embedder.embed_texts([query])[0]
        response = self.collection.query(query_embeddings=[query_embedding], n_results=limit)

        documents = response.get("documents", [[]])[0]
        metadatas = response.get("metadatas", [[]])[0]
        distances = response.get("distances", [[]])[0]
        results = [
            {
                "text": text,
                "metadata": metadata,
                "distance": distance,
            }
            for text, metadata, distance in zip(documents, metadatas, distances)
        ]
        logger.debug("Retrieved %d results for query '%s'", len(results), query)
        return results

    def _clean_metadata(self, metadata: dict[str, Any]) -> dict[str, Any]:
        cleaned = dict(metadata)
        cleaned.pop("embedding", None)
        return cleaned
