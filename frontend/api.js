// This file must be loaded before any JSX page files so window.API is available globally.

const API_BASE = "http://localhost:8000";

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function jsonOptions(method, payload) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function ensureValue(value, name) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeFiles(files) {
  return Array.from(files || []).filter(Boolean);
}

async function checkHealth() {
  return request("/api/health");
}

async function getStrategies() {
  return request("/api/strategies");
}

async function getModels() {
  return request("/api/models");
}

async function uploadDocuments(files) {
  const normalizedFiles = normalizeFiles(files);
  if (!normalizedFiles.length) {
    throw new Error("files are required");
  }
  const formData = new FormData();
  normalizedFiles.forEach((file) => formData.append("files", file));
  return request("/api/documents/upload", { method: "POST", body: formData });
}

async function listDocuments() {
  return request("/api/documents");
}

async function deleteDocument(filename) {
  const safeFilename = encodeURIComponent(ensureValue(filename, "filename"));
  return request(`/api/documents/${safeFilename}`, { method: "DELETE" });
}

async function loadDataset(path) {
  return request("/api/datasets/load", jsonOptions("POST", {
    path: ensureValue(path, "path"),
  }));
}

async function loadDefaultDataset() {
  return request("/api/datasets/default");
}

async function startEvaluation(strategies, datasetPath, corpusDir) {
  if (!Array.isArray(strategies) || !strategies.length) {
    throw new Error("strategies are required");
  }
  return request("/api/evaluations/start", jsonOptions("POST", {
    strategies,
    dataset_path: datasetPath || "eval/questions.json",
    corpus_dir: corpusDir || "corpus",
  }));
}

async function getEvaluationStatus(runId) {
  const safeRunId = encodeURIComponent(ensureValue(runId, "runId"));
  return request(`/api/evaluations/${safeRunId}/status`);
}

async function getEvaluationResults(runId) {
  const safeRunId = encodeURIComponent(ensureValue(runId, "runId"));
  return request(`/api/evaluations/${safeRunId}/results`);
}

window.API = {};
window.API.checkHealth = checkHealth;
window.API.getStrategies = getStrategies;
window.API.getModels = getModels;
window.API.uploadDocuments = uploadDocuments;
window.API.listDocuments = listDocuments;
window.API.deleteDocument = deleteDocument;
window.API.loadDataset = loadDataset;
window.API.loadDefaultDataset = loadDefaultDataset;
window.API.startEvaluation = startEvaluation;
window.API.getEvaluationStatus = getEvaluationStatus;
window.API.getEvaluationResults = getEvaluationResults;

