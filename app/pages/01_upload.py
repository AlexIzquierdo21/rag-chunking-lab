"""Streamlit page for uploading documents and building the evaluation corpus."""

import sys
from pathlib import Path
from typing import cast

import streamlit as st
from streamlit.runtime.uploaded_file_manager import UploadedFile

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.pipeline import IngestionError, load_documents

st.set_page_config(page_title="Upload Documents", page_icon="📄", layout="wide")

st.title("📄 Upload Documents")
st.write("Upload your documents to build the evaluation corpus.")

uploaded_files_raw = st.file_uploader(
    "Select one or more files",
    type=["pdf", "txt", "md", "html", "docx"],
    accept_multiple_files=True,
)

if uploaded_files_raw:
    uploaded_files = cast(list[UploadedFile], uploaded_files_raw)
    corpus_dir = Path("corpus")
    corpus_dir.mkdir(parents=True, exist_ok=True)

    saved_paths: list[str] = []
    for file in uploaded_files:
        file_path = Path("corpus") / file.name
        with open(file_path, "wb") as saved_file:
            saved_file.write(file.getvalue())
        st.success(f"Saved: {file.name}")
        saved_paths.append(str(file_path))

    try:
        corpus = load_documents(saved_paths)
        st.session_state["corpus"] = corpus

        total_characters = sum(len(text) for text in corpus.values())
        col1, col2 = st.columns(2)
        col1.metric("Documents loaded", len(corpus))
        col2.metric("Total characters", total_characters)
    except IngestionError as error:
        st.error(str(error))

st.subheader("Corpus status")
if st.session_state.get("corpus"):
    corpus_data = [
        {"filename": filename, "characters": len(text)}
        for filename, text in st.session_state["corpus"].items()
    ]
    st.table(corpus_data)
    st.success("Corpus ready — proceed to Configure")
else:
    st.info("No documents loaded yet.")

