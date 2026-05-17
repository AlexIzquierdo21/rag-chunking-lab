/* Page 2 — Configure */

const STRATEGIES = [
  {
    id: 'fixed',
    icon: '📐',
    name: 'Fixed-size',
    desc: 'Constant-length chunks split by character count. Fast, deterministic, blind to structure.',
    chunkSize: 512,
    overlap: 64,
    family: 'baseline',
  },
  {
    id: 'recursive',
    icon: '🔄',
    name: 'Recursive',
    desc: 'Splits on paragraph → sentence → word boundaries until under target length. The LangChain default.',
    chunkSize: 800,
    overlap: 100,
    family: 'structural',
  },
  {
    id: 'semantic',
    icon: '🧠',
    name: 'Semantic',
    desc: 'Embeds sentences and cuts at semantic boundaries using percentile breakpoints.',
    chunkSize: 'adaptive',
    overlap: 0,
    family: 'embedding',
  },
  {
    id: 'sentence-window',
    icon: '🪟',
    name: 'Sentence-window',
    desc: 'Indexes individual sentences; expands ±k neighbors at retrieval time for context.',
    chunkSize: 'k=3',
    overlap: 0,
    family: 'retrieval-time',
  },
  {
    id: 'late',
    icon: '⏳',
    name: 'Late chunking',
    desc: 'Embeds the full document with long-context model, then pools embeddings per chunk.',
    chunkSize: 1024,
    overlap: 0,
    family: 'long-context',
  },
];

const ConfigurePage = ({ enabled, setEnabled, setProgress, setPage, dataset, setDataset }) => {
  const [embedModel, setEmbedModel] = React.useState('text-embedding-3-small');
  const [topK, setTopK] = React.useState(5);
  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="page fade-in">
      <PageHeader
        eyebrow="STEP 02 — STRATEGIES"
        title="Configure experiment"
        desc="Pick the chunking strategies you want to compare and select an evaluation dataset. Each enabled strategy is run independently against the same questions."
        actions={
          <React.Fragment>
            <button className="btn ghost"><I name="download" size={14}/> Export config</button>
            <button className="btn primary" onClick={() => { setProgress(p => ({...p, configure: 'done'})); setPage('evaluate'); }} disabled={enabledCount === 0}>
              Continue <I name="arrow-right" size={14}/>
            </button>
          </React.Fragment>
        }
      />

      <div className="grid grid-3" style={{marginBottom: 24}}>
        <div className="card">
          <div className="kpi-label"><I name="hash" size={12}/> Strategies enabled</div>
          <div className="kpi-value tight">{enabledCount}<span className="kpi-unit">/ {STRATEGIES.length}</span></div>
        </div>
        <div className="card">
          <div className="kpi-label"><I name="cpu" size={12}/> Embedding model</div>
          <div style={{fontSize: 14, fontWeight: 500, marginTop: 4}} className="mono">{embedModel}</div>
          <div className="dim" style={{fontSize: 11.5, marginTop: 2, fontFamily: 'var(--font-mono)'}}>1536 dim · OpenAI</div>
        </div>
        <div className="card">
          <div className="kpi-label"><I name="target" size={12}/> Retrieval top-k</div>
          <div className="kpi-value tight mono">{topK}</div>
        </div>
      </div>

      <div className="row between" style={{marginBottom: 14}}>
        <div>
          <div style={{fontSize: 14, fontWeight: 600}}>Chunking strategies</div>
          <div className="dim" style={{fontSize: 12, marginTop: 2}}>Toggle the strategies to include in this run.</div>
        </div>
        <div className="row gap-2">
          <button className="btn ghost" onClick={() => setEnabled(Object.fromEntries(STRATEGIES.map(s => [s.id, true])))}>Enable all</button>
          <button className="btn ghost" onClick={() => setEnabled({})}>Reset</button>
        </div>
      </div>

      <div className="grid grid-2">
        {STRATEGIES.map(s => {
          const on = !!enabled[s.id];
          return (
            <div
              key={s.id}
              className={`strategy-card ${on ? 'on' : ''}`}
              onClick={() => setEnabled({...enabled, [s.id]: !on})}
            >
              <div className="strategy-icon">{s.icon}</div>
              <div style={{flex: 1, minWidth: 0}}>
                <div className="strategy-name">
                  {s.name}
                  <span className="badge" style={{marginLeft: 4}}>{s.family}</span>
                </div>
                <div className="strategy-desc">{s.desc}</div>
                <div className="strategy-meta">
                  <span><b>chunk:</b> {s.chunkSize}{typeof s.chunkSize === 'number' ? ' tok' : ''}</span>
                  <span><b>overlap:</b> {s.overlap}{typeof s.overlap === 'number' && s.overlap > 0 ? ' tok' : ''}</span>
                </div>
              </div>
              <div className={`toggle ${on ? 'on' : ''}`} onClick={e => { e.stopPropagation(); setEnabled({...enabled, [s.id]: !on}); }}></div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{marginTop: 28}}>
        <div className="row between" style={{marginBottom: 16}}>
          <div>
            <div className="card-title">Evaluation dataset</div>
            <div className="card-sub">Question-answer pairs used to score retrieval. Format: JSONL with <span className="mono">question</span>, <span className="mono">answer</span>, <span className="mono">source_doc</span>.</div>
          </div>
          <span className="badge emerald"><div className="dot live" style={{width:5, height:5}}></div> Loaded</span>
        </div>

        <label className="label">Dataset path</label>
        <div className="row gap-2">
          <input className="input mono" value={dataset.path} onChange={e => setDataset({...dataset, path: e.target.value})}/>
          <button className="btn"><I name="folder" size={14}/> Browse</button>
          <button className="btn primary"><I name="check" size={14}/> Load</button>
        </div>

        <div className="grid grid-4" style={{marginTop: 18, gap: 12}}>
          <div className="card" style={{padding: 12, background: 'var(--bg-elevated)'}}>
            <div className="dim" style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Questions</div>
            <div style={{fontSize: 18, fontWeight: 600, marginTop: 4}} className="mono">{dataset.questions}</div>
          </div>
          <div className="card" style={{padding: 12, background: 'var(--bg-elevated)'}}>
            <div className="dim" style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Avg length</div>
            <div style={{fontSize: 18, fontWeight: 600, marginTop: 4}} className="mono">14.2<span className="kpi-unit">tok</span></div>
          </div>
          <div className="card" style={{padding: 12, background: 'var(--bg-elevated)'}}>
            <div className="dim" style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Format</div>
            <div style={{fontSize: 13, fontWeight: 500, marginTop: 6}} className="mono">JSONL · v1.2</div>
          </div>
          <div className="card" style={{padding: 12, background: 'var(--bg-elevated)'}}>
            <div className="dim" style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Hash</div>
            <div style={{fontSize: 13, fontWeight: 500, marginTop: 6}} className="mono">a8f3…2b91</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{marginTop: 20}}>
        <div className="card">
          <div className="card-title" style={{marginBottom: 14}}>Embedding model</div>
          <select className="input mono" value={embedModel} onChange={e => setEmbedModel(e.target.value)}>
            <option>text-embedding-3-small</option>
            <option>text-embedding-3-large</option>
            <option>nomic-embed-text-v1.5</option>
            <option>bge-large-en-v1.5</option>
          </select>
          <div className="dim" style={{fontSize: 11.5, marginTop: 8, fontFamily: 'var(--font-mono)'}}>$0.02 / 1M tokens · 1536 dim</div>
        </div>
        <div className="card">
          <div className="card-title" style={{marginBottom: 14}}>Retrieval top-k</div>
          <div className="row gap-3">
            <input type="range" min="1" max="20" value={topK} onChange={e => setTopK(+e.target.value)} style={{flex: 1, accentColor: 'var(--blue)'}}/>
            <div style={{fontSize: 18, fontWeight: 600, width: 36, textAlign: 'right'}} className="mono">{topK}</div>
          </div>
          <div className="dim" style={{fontSize: 11.5, marginTop: 8}}>Number of chunks retrieved per question.</div>
        </div>
      </div>
    </div>
  );
};

window.ConfigurePage = ConfigurePage;
window.STRATEGIES = STRATEGIES;

