# FRONTEND_STATUS

## 1. Project structure

### Root tree

```text
rag_chunking_lab/
├── .git/
│   ├── config
│   ├── description
│   ├── HEAD
│   ├── index
│   ├── hooks/
│   │   ├── applypatch-msg.sample
│   │   ├── commit-msg.sample
│   │   ├── fsmonitor-watchman.sample
│   │   ├── post-update.sample
│   │   ├── pre-applypatch.sample
│   │   ├── pre-commit.sample
│   │   ├── pre-merge-commit.sample
│   │   ├── pre-push.sample
│   │   ├── pre-rebase.sample
│   │   ├── pre-receive.sample
│   │   ├── prepare-commit-msg.sample
│   │   ├── push-to-checkout.sample
│   │   ├── sendemail-validate.sample
│   │   └── update.sample
│   ├── info/
│   │   └── exclude
│   ├── objects/
│   │   ├── 00/
│   │   │   └── ede90e235e26eb480754826fbaeb299870cbae
│   │   ├── 04/
│   │   │   └── bf26ec60915234f3f4c7bda003176be3f87d58
│   │   ├── 16/
│   │   │   └── 1d41fadab2f5f4cf3cd18513203772904ec9b3
│   │   ├── 20/
│   │   │   └── c7ef7052e381565a82ae28ab9362c398f27f23
│   │   ├── 5a/
│   │   │   └── 1a4479900481a48b22a641f63e2f47a90aca94
│   │   ├── 5f/
│   │   │   └── 8f95a1ece0d4a17fd85a011a92d0610abc700a
│   │   ├── 82/
│   │   │   └── 51f72f4013da343a61995efc6769c4ad3b6d24
│   │   ├── 8b/
│   │   │   └── 961dce93fd14e7b42035a3aa076b133cedf457
│   │   ├── 94/
│   │   │   ├── 09965555e318b89f386c0318556b6eba78f9d3
│   │   │   └── 2cf2dbe7b8c21f72b495ff8c0a20aceaa87884
│   │   ├── bf/
│   │   │   └── 5ae39acd56fc354292950c113064313d66fbf8
│   │   ├── ec/
│   │   │   └── 450ef4a6f542c53525311dad525e7cb5e4cecc
│   │   ├── info/
│   │   └── pack/
│   └── refs/
│       ├── heads/
│       └── tags/
├── .idea/
│   ├── modules.xml
│   ├── rag_chunking_lab.iml
│   └── vcs.xml
├── app.jsx
├── icons.jsx
├── index.js
├── package.json
├── page-configure.jsx
├── page-evaluate.jsx
├── page-results.jsx
├── page-upload.jsx
├── RAG Chunking Lab.html
├── shell.jsx
├── styles.css
└── tweaks-panel.jsx
```

### File roles

- `RAG Chunking Lab.html`: HTML entrypoint. Mounts the app into `#root` and loads React, ReactDOM, Babel, fonts, CSS, and all JSX files via CDN / script tags.
- `styles.css`: main design system and all page styling.
- `app.jsx`: top-level app state and page switching logic.
- `shell.jsx`: shared layout components (`Sidebar`, `Topbar`, `PageHeader`).
- `icons.jsx`: inline SVG icon set exposed globally as `window.I`.
- `page-upload.jsx`: Upload step UI.
- `page-configure.jsx`: experiment configuration UI.
- `page-evaluate.jsx`: evaluation run UI and progress simulation.
- `page-results.jsx`: results dashboard and question explorer.
- `tweaks-panel.jsx`: reusable tweak/edit-mode utilities; currently not loaded by the HTML entrypoint.
- `index.js`: placeholder JavaScript file with a console log; currently not connected to the HTML entrypoint.
- `package.json`: minimal npm manifest; no runtime dependencies declared.
- `.git/`: Git metadata.
- `.idea/`: JetBrains/WebStorm project metadata.

## 2. Technologies detected

### Core frontend stack

- **HTML5**
- **CSS3**
  - CSS custom properties / design tokens
  - Flexbox and CSS Grid
  - transitions, gradients, sticky top bar, custom scrollbars, keyframe animations
- **JavaScript / JSX**
- **React 18.3.1** loaded from UMD CDN build
- **ReactDOM 18.3.1** loaded from UMD CDN build
- **Babel Standalone 7.29.0** for in-browser JSX transpilation

### Framework / architecture observations

- This is a **client-side React prototype** running directly in the browser.
- It does **not** use a modern bundler or framework scaffold such as Vite, Next.js, CRA, Parcel, or Webpack.
- It does **not** use ES module imports; instead, components are attached to `window` and shared globally.
- There is **no router library** detected; page changes are controlled by local React state (`page` in `app.jsx`).
- There is **no HTTP client library** such as Axios detected.
- There is **no state management library** such as Redux, Zustand, MobX, etc.
- There is **no testing setup** or frontend build pipeline declared in `package.json`.

## 3. Current state

### Existing pages / flows

The app behaves as a 4-step lab workflow:

1. **Upload** — `page-upload.jsx`
2. **Configure** — `page-configure.jsx`
3. **Evaluate** — `page-evaluate.jsx`
4. **Results** — `page-results.jsx`

Navigation is rendered in `shell.jsx` via the sidebar and top bar.

### What is interactive today

The frontend already includes meaningful UI interactivity, but it is **mocked locally** and not backed by real persistence or server calls.

#### `Upload` page
Interactive:
- drag-over / drop visual state
- click on dropzone triggers simulated parsing
- simulated progress bar using `setInterval`
- file list rendered from React state
- continue button changes page and marks upload step as done

Static / mocked:
- no real `<input type="file">`
- no real file bytes are uploaded
- parsing is simulated with generated progress
- "Browse files", "Clear", and delete buttons are mostly UI-only
- initial corpus comes from hardcoded `initialFiles` in `app.jsx`

#### `Configure` page
Interactive:
- strategy toggles
- enable-all / reset actions
- editable dataset path input
- embedding model selector
- top-k slider
- continue button changes page and marks configure step as done

Static / mocked:
- strategies are hardcoded in `STRATEGIES`
- dataset metadata is hardcoded / local state only
- "Browse", "Load", and "Export config" do not call a backend
- no config persistence

#### `Evaluate` page
Interactive:
- run button starts simulated evaluation
- progress bars animate over time
- per-strategy progress updates through React state
- completion enables transition to results page

Static / mocked:
- evaluation is fully simulated with timers
- no backend run is created
- no real chunking, embeddings, retrieval, or scoring happen
- elapsed / remaining times are synthetic

#### `Results` page
Interactive:
- metric toggle between ROUGE-L and hit-rate
- question selection in explorer
- search input and filter button are UI-only
- charts and leaderboard render from hardcoded arrays

Static / mocked:
- results come from hardcoded `RESULTS` and `QUESTIONS`
- no backend-driven metrics
- no CSV export implementation
- no report sharing implementation
- no rerun action connected to a backend

### Overall status summary

This frontend is best described as a **high-fidelity interactive prototype / demo**:

- Strong visual and UX direction
- Multi-step flow already modeled
- Good local state handling for prototyping
- No real data layer yet
- No real file upload
- No backend integration
- No persistence
- No authentication
- No build tooling declared

## 4. What would be needed to connect this frontend to a Python FastAPI backend

Below is the minimum practical backend integration plan based on the current UI behavior.

### A. Fetch / API calls that need to be added

#### In `page-upload.jsx`
Recommended additions:

- **Upload selected files**
  - `fetch('/api/documents/upload', { method: 'POST', body: formData })`
- **Poll parse status** or stream progress
  - `fetch('/api/documents/{document_id}/status')`
  - or use WebSocket / Server-Sent Events for progress
- **List uploaded documents**
  - `fetch('/api/documents')`
- **Delete one document**
  - `fetch('/api/documents/{document_id}', { method: 'DELETE' })`
- **Clear all corpus documents**
  - `fetch('/api/documents', { method: 'DELETE' })`

UI changes needed:
- add a real hidden file input
- convert `simulateParse()` into real upload + progress handling
- keep document IDs returned by backend, not only file names

#### In `page-configure.jsx`
Recommended additions:

- **Load available datasets**
  - `fetch('/api/datasets')`
- **Load a dataset by path or dataset id**
  - `fetch('/api/datasets/load', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) })`
- **Save experiment configuration**
  - `fetch('/api/experiments/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })`
- **Export current config**
  - `fetch('/api/experiments/config/export')` or generate locally from saved config

Payload should include at least:
- enabled strategies
- chunk sizes / overlaps where applicable
- embedding model
- retrieval top-k
- dataset selection
- maybe experiment name / seed / device target

#### In `page-evaluate.jsx`
Recommended additions:

- **Start evaluation run**
  - `fetch('/api/evaluations/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(runConfig) })`
- **Get run status**
  - `fetch('/api/evaluations/{run_id}/status')`
- **Stream live progress**
  - better via WebSocket: `/ws/evaluations/{run_id}`
  - alternative: periodic polling every 1-2 seconds
- **Optional cancel endpoint**
  - `fetch('/api/evaluations/{run_id}/cancel', { method: 'POST' })`

UI changes needed:
- replace timer-based mock progress with backend status data
- persist `run_id` in state
- disable duplicate runs while one is active

#### In `page-results.jsx`
Recommended additions:

- **Fetch final summary metrics**
  - `fetch('/api/evaluations/{run_id}/results')`
- **Fetch leaderboard / strategy metrics**
  - `fetch('/api/evaluations/{run_id}/leaderboard')`
- **Fetch per-question breakdown**
  - `fetch('/api/evaluations/{run_id}/questions')`
- **Fetch question detail**
  - `fetch('/api/evaluations/{run_id}/questions/{question_id}')`
- **Export CSV**
  - `fetch('/api/evaluations/{run_id}/export.csv')`
- **Share report** (optional)
  - `fetch('/api/reports/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ run_id }) })`
- **Re-run evaluation**
  - either call `start` again with same config or use `POST /api/evaluations/{run_id}/rerun`

UI changes needed:
- replace `RESULTS` and `QUESTIONS` constants with backend response data
- wire the search input to query params or local filtering over fetched data

### B. FastAPI endpoints it would need

A practical backend contract could look like this:

#### Health / metadata
- `GET /api/health`
- `GET /api/models` — available embedding / LLM models
- `GET /api/strategies` — available chunking strategies and defaults

#### Documents / corpus
- `POST /api/documents/upload`
  - multipart upload for one or more files
  - returns document IDs and parse job IDs/status
- `GET /api/documents`
  - returns uploaded corpus documents
- `GET /api/documents/{document_id}`
- `GET /api/documents/{document_id}/status`
  - parse progress / extraction status
- `DELETE /api/documents/{document_id}`
- `DELETE /api/documents`
  - clear corpus

#### Datasets
- `GET /api/datasets`
  - list datasets known to backend
- `POST /api/datasets/load`
  - load by path or identifier
- `GET /api/datasets/{dataset_id}`
  - summary stats such as question count, schema, hash

#### Experiment configuration
- `POST /api/experiments/config`
  - save current config
- `GET /api/experiments/config/{config_id}`
- `GET /api/experiments/config/{config_id}/export`

#### Evaluation runs
- `POST /api/evaluations/start`
  - starts chunking + indexing + retrieval evaluation
- `GET /api/evaluations/{run_id}/status`
  - phase, current strategy, progress percentages, elapsed, errors
- `POST /api/evaluations/{run_id}/cancel`
- `GET /api/evaluations/{run_id}/results`
  - overall summary
- `GET /api/evaluations/{run_id}/leaderboard`
- `GET /api/evaluations/{run_id}/questions`
  - list/search/filter question rows
- `GET /api/evaluations/{run_id}/questions/{question_id}`
  - per-strategy details, retrieved chunk, scores
- `GET /api/evaluations/{run_id}/export.csv`

#### Live progress channel
Optional but recommended:
- `WebSocket /ws/evaluations/{run_id}`

This would fit the current UI especially well because the `Evaluate` page visually expects progressive updates.

### C. Suggested frontend/backend data mapping

Current hardcoded frontend data that should come from backend:

- `initialFiles` in `app.jsx` -> `GET /api/documents`
- `STRATEGIES` in `page-configure.jsx` -> optionally `GET /api/strategies`
- dataset info in `app.jsx` / `page-configure.jsx` -> `GET /api/datasets` or `POST /api/datasets/load`
- `runState` in `app.jsx` / `page-evaluate.jsx` -> `GET /api/evaluations/{run_id}/status`
- `RESULTS` and `QUESTIONS` in `page-results.jsx` -> results endpoints

### D. CORS considerations

If the frontend is served from a different origin than FastAPI, CORS must be configured.

Examples:
- frontend from `http://127.0.0.1:5500` or a local file/server
- backend from `http://localhost:8000`

In FastAPI you would typically enable:
- allowed origins for the frontend dev URL(s)
- allowed methods: `GET`, `POST`, `DELETE`, optionally `PUT`, `PATCH`
- allowed headers: `Content-Type`, `Authorization` if auth is added later
- credentials only if cookies/session auth are used

Important notes:
- If this prototype is opened directly as a `file://` page, browser behavior around CORS and `fetch` can be awkward. In practice, this frontend should be served from a local HTTP server, not opened directly from disk.
- If uploads are large, backend and reverse proxy limits should be configured accordingly.
- If progress streaming uses WebSockets, the backend and deployment environment must allow WebSocket upgrades.

Minimal FastAPI middleware shape:

- allow origins such as `http://localhost:3000`, `http://127.0.0.1:5500`, or whichever origin serves this frontend
- add `CORSMiddleware`
- keep origins explicit rather than `*` if credentials are ever needed

## 5. Dependencies — CDN links or external resources used

### External resources detected in `RAG Chunking Lab.html`

#### Fonts
- `https://fonts.googleapis.com`
- `https://fonts.gstatic.com`
- Google Fonts stylesheet for:
  - `Inter`
  - `JetBrains Mono`

#### JavaScript CDNs
- `https://unpkg.com/react@18.3.1/umd/react.development.js`
- `https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js`
- `https://unpkg.com/@babel/standalone@7.29.0/babel.min.js`

These are loaded directly in the browser via script tags and are required by the current prototype architecture.

### NPM dependencies

- No runtime dependencies are declared in `package.json`
- No dev dependencies are declared in `package.json`
- No lockfile was found in the provided workspace tree

### Other external references

- `tweaks-panel.jsx` contains an inline SVG encoded as a `data:` URL for a select arrow icon
- No Axios, Tailwind, Bootstrap, Material UI, charting library, or router dependency detected

## Additional implementation notes

### Frontend integration priorities

If this project is about to be connected to FastAPI, the most impactful next steps would be:

1. Replace the simulated upload flow with real file input + multipart upload
2. Add a small API layer (for example `api.js`) wrapping `fetch`
3. Introduce a configurable `API_BASE_URL`
4. Replace timer-based evaluation progress with polling or WebSocket updates
5. Replace hardcoded results arrays with backend responses
6. Optionally migrate from CDN+Babel-in-browser to a real dev build setup (for example Vite + React)

### Risks / limitations in current form

- Browser-side Babel is suitable for prototyping, not ideal for production
- Global `window.*` component sharing is fragile at scale
- Directly opening the HTML file may complicate backend communication
- The prototype strongly implies backend capabilities (Tika parsing, embedding runs, evaluation, exports), but none are implemented yet in the frontend-network layer


