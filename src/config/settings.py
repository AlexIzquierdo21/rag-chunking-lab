"""Configuración central de la aplicación."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centraliza toda la configuración de la aplicación y permite sobrescribirla mediante `.env`."""

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_timeout: int = 120
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_batch_size: int = 32
    retrieval_top_k: int = 5
    chroma_persist_dir: str = ".chroma"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
