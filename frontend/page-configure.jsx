/* Page 2 — Configure */

const STRATEGIES = window.STRATEGIES || [];
window.STRATEGIES = STRATEGIES;

const STRATEGY_VISUALS = {
  fixed: {
    icon: '📐',
    family: 'baseline',
    desc: 'Constant-length chunks split by character count. Fast, deterministic, blind to structure.',
  },
  recursive: {
    icon: '🔄',
    family: 'structural',
    desc: 'Splits on paragraph → sentence → word boundaries until under target length. The LangChain default.',
  },
  semantic: {
    icon: '🧠',
    family: 'embedding',
    desc: 'Embeds sentences and cuts at semantic boundaries using percentile breakpoints.',
  },
  sentence_window: {
    icon: '🪟',
    family: 'retrieval-time',
    desc: 'Indexes individual sentences; expands ±k neighbors at retrieval time for context.',
  },
  late_chunking: {
    icon: '⏳',
    family: 'long-context',
    desc: 'Embeds the full document with long-context model, then pools embeddings per chunk.',
  },
};

const mapStrategy = (strategy) => {
  const visuals = STRATEGY_VISUALS[strategy.name] || {};
  const params = strategy.default_params || {};
  return {
    id: strategy.name,
    icon: visuals.icon || '🧩',
    name: strategy.display_name || strategy.name,
    desc: visuals.desc || strategy.description || 'Chunking strategy available from backend configuration.',
    chunkSize: params.chunk_size || (params.window_size ? `k=${params.window_size}` : 'adaptive'),
    overlap: params.overlap || 0,
    family: visuals.family || 'backend',
  };
};

const setStrategyCatalog = (items) => {
  STRATEGIES.splice(0, STRATEGIES.length, ...items);
};

const toDatasetState = (info) => ({
  path: info.path,
  questions: info.total,
  factual: info.factual,
  multi_hop: info.multi_hop,
  adversarial: info.adversarial,
  info,
});

const ConfigurePage = ({ selectedStrategies, setSelectedStrategies, setProgress, setPage, dataset, setDataset }) => {
  const [embedModel, setEmbedModel] = React.useState('text-embedding-3-small');
  const [topK, setTopK] = React.useState(5);
  const [loadingStrategies, setLoadingStrategies] = React.useState(true);
  const [loadingDataset, setLoadingDataset] = React.useState(true);
  const [loadingCustomDataset, setLoadingCustomDataset] = React.useState(false);
  const [error, setError] = React.useState('');
  const enabledCount = selectedStrategies.length;

  React.useEffect(() => {
    let isMounted = true;
    loadStrategies(isMounted);
    loadInitialDataset(isMounted);
    return () => {
      isMounted = false;
    };
  }, []);

  const getApi = () => {
    if (!window.API) {
      throw new Error('API client not available');
    }
    return window.API;
  };

  const loadStrategies = async (isMounted) => {
    setLoadingStrategies(true);
    try {
      const strategies = await getApi().getStrategies();
      const mapped = strategies.map(mapStrategy);
      setStrategyCatalog(mapped);
      if (isMounted && !selectedStrategies.length) {
        setSelectedStrategies(mapped.map((strategy) => strategy.id));
      }
    } catch (err) {
      if (isMounted) {
        setStrategyCatalog([]);
        setError(`Failed to load strategies (${err.message}).`);
      }
    } finally {
      if (isMounted) {
        setLoadingStrategies(false);
      }
    }
  };

  const loadInitialDataset = async (isMounted) => {
    setLoadingDataset(true);
    try {
      const info = await getApi().loadDefaultDataset();
      if (isMounted) {
        setDataset(toDatasetState(info));
      }
    } catch (err) {
      if (isMounted) {
        setError(`Failed to load default dataset (${err.message}).`);
      }
    } finally {
      if (isMounted) {
        setLoadingDataset(false);
      }
    }
  };

  const toggleStrategy = (strategyId) => {
    setSelectedStrategies((current) => (
      current.includes(strategyId)
        ? current.filter((item) => item !== strategyId)
        : [...current, strategyId]
    ));
  };

  const loadDatasetFromPath = async () => {
    setLoadingCustomDataset(true);
    setError('');
    try {
      const info = await getApi().loadDataset(dataset.path);
      setDataset(toDatasetState(info));
    } catch (err) {
      setError(`Failed to load dataset (${err.message}).`);
    } finally {
      setLoadingCustomDataset(false);
    }
  };

  const configurationReady = enabledCount > 0 && !!dataset.info;

  return (
    <div className="page fade-in">
      <PageHeader
        eyebrow="STEP 02 — STRATEGIES"
        title="Configure experiment"
        desc="Pick the chunking strategies you want to compare and select an evaluation dataset. Each enabled strategy is run independently against the same questions."
        actions={
          <React.Fragment>
            <button className="btn ghost"><I name="download" size={14}/> Export config</button>
            <button className="btn primary" onClick={() => { setProgress(p => ({...p, configure: 'done'})); setPage('evaluate'); }} disabled={!configurationReady || loadingStrategies || loadingDataset || loadingCustomDataset}>
              Continue <I name="arrow-right" size={14}/>
            </button>
          </React.Fragment>
        }
      />

      {error && (
        <div className="card" style={{marginBottom: 16, borderColor: 'rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.08)'}}>
          <div style={{fontSize: 13, color: '#FCA5A5'}}>{error}</div>
        </div>
      )}

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
          <div className="dim" style={{fontSize: 12, marginTop: 2}}>{loadingStrategies ? 'Loading available strategies from the backend…' : 'Toggle the strategies to include in this run.'}</div>
        </div>
        <div className="row gap-2">
          <button className="btn ghost" onClick={() => setSelectedStrategies(STRATEGIES.map(s => s.id))} disabled={loadingStrategies || !STRATEGIES.length}>Enable all</button>
          <button className="btn ghost" onClick={() => setSelectedStrategies([])} disabled={loadingStrategies || !selectedStrategies.length}>Reset</button>
        </div>
      </div>

      <div className="grid grid-2">
        {!loadingStrategies && STRATEGIES.length === 0 && (
          <div className="card">
            <div className="card-title">No strategies available</div>
            <div className="card-sub">The backend did not return any chunking strategies.</div>
          </div>
        )}
        {STRATEGIES.map(s => {
          const on = selectedStrategies.includes(s.id);
          return (
            <div
              key={s.id}
              className={`strategy-card ${on ? 'on' : ''}`}
              onClick={() => toggleStrategy(s.id)}
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
              <div className={`toggle ${on ? 'on' : ''}`} onClick={e => { e.stopPropagation(); toggleStrategy(s.id); }}></div>
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
          <span className={`badge ${dataset.info ? 'emerald' : ''}`}><div className="dot live" style={{width:5, height:5}}></div> {loadingDataset ? 'Loading' : dataset.info ? 'Loaded' : 'Unavailable'}</span>
        </div>

        <label className="label">Dataset path</label>
        <div className="row gap-2">
          <input className="input mono" value={dataset.path} onChange={e => setDataset({...dataset, path: e.target.value})}/>
          <button className="btn"><I name="folder" size={14}/> Browse</button>
          <button className="btn primary" onClick={loadDatasetFromPath} disabled={loadingCustomDataset || loadingDataset}><I name="check" size={14}/> {loadingCustomDataset ? 'Loading…' : 'Load'}</button>
        </div>

        <div className="grid grid-4" style={{marginTop: 18, gap: 12}}>
          <div className="card" style={{padding: 12, background: 'var(--bg-elevated)'}}>
            <div className="dim" style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Questions</div>
            <div style={{fontSize: 18, fontWeight: 600, marginTop: 4}} className="mono">{dataset.questions}</div>
          </div>
          <div className="card" style={{padding: 12, background: 'var(--bg-elevated)'}}>
            <div className="dim" style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Factual</div>
            <div style={{fontSize: 18, fontWeight: 600, marginTop: 4}} className="mono">{dataset.factual}</div>
          </div>
          <div className="card" style={{padding: 12, background: 'var(--bg-elevated)'}}>
            <div className="dim" style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Multi-hop</div>
            <div style={{fontSize: 18, fontWeight: 600, marginTop: 4}} className="mono">{dataset.multi_hop}</div>
          </div>
          <div className="card" style={{padding: 12, background: 'var(--bg-elevated)'}}>
            <div className="dim" style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Adversarial</div>
            <div style={{fontSize: 18, fontWeight: 600, marginTop: 4}} className="mono">{dataset.adversarial}</div>
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

