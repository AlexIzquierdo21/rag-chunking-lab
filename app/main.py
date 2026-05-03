"""Streamlit entry point for the RAG Chunking Lab application."""

import streamlit as st

st.set_page_config(
    page_title="RAG Chunking Lab",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.sidebar.title("RAG Chunking Lab")
st.sidebar.caption("Compare chunking strategies empirically")
st.sidebar.divider()
st.sidebar.info("Use the pages above to navigate")

st.sidebar.subheader("Ollama status")
try:
    import ollama

    ollama.Client().list()
    st.sidebar.success("✅ Ollama connected")
except Exception:
    st.sidebar.error("❌ Ollama not running. Run `ollama serve`.")

st.title("Welcome to RAG Chunking Lab")
st.write(
    "This tool helps you compare multiple chunking strategies for retrieval-augmented "
    "generation on your own corpus. You can upload documents, configure a strategy, run "
    "evaluations, and inspect comparative results in one local workflow."
)

st.info("Workflow: Upload -> Configure -> Evaluate -> Results")

col1, col2, col3 = st.columns(3)
col1.metric("Strategies", "5")
col2.metric("Metrics", "3")
col3.metric("Document formats", "4")

