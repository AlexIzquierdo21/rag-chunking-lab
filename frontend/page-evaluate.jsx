/* Page 3 — Evaluate */

const EvaluatePage = ({ enabled, selectedStrategies, files, dataset, setProgress, setPage, runState, setRunState }) => {
  const strategyCatalog = window.STRATEGIES || [];
  const enabledStrategies = strategyCatalog.filter((strategy) => enabled[strategy.id]);
  const { phase, current, perStrategy, elapsed, runId, error, startedAt } = runState;
  const pollIntervalRef = React.useRef(null);
  const fetchedResultsRef = React.useRef(false);

  const getApi = () => {
    if (!window.API) {
      throw new Error('API client not available');
    }
    return window.API;
  };

  const clearPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const getProgressValue = (status) => {
    if (status === 'running') return 50;
    if (status === 'done') return 100;
    if (status === 'failed') return 100;
    return 0;
  };

  const getCurrentIndex = (strategies) => {
    const runningIndex = strategies.findIndex((item) => item.status === 'running');
    if (runningIndex >= 0) {
      return runningIndex;
    }
    const pendingIndex = strategies.findIndex((item) => item.status === 'pending');
    if (pendingIndex >= 0) {
      return pendingIndex;
    }
    return Math.max(0, strategies.length - 1);
  };

  const fetchResults = async (activeRunId) => {
    try {
      const results = await getApi().getEvaluationResults(activeRunId);
      setRunState((state) => ({
        ...state,
        phase: 'done',
        results,
      }));
    } catch (err) {
      clearPolling();
      setRunState((state) => ({
        ...state,
        phase: 'failed',
        error: `Failed to fetch results (${err.message}).`,
      }));
    }
  };

  const updateFromStatus = (statusResponse) => {
    const strategyProgress = {};
    statusResponse.strategies.forEach((strategy) => {
      strategyProgress[strategy.strategy] = getProgressValue(strategy.status);
    });

    const nextPhase = statusResponse.status === 'done' || statusResponse.status === 'failed'
      ? statusResponse.status
      : 'running';

    setRunState((state) => ({
      ...state,
      phase: nextPhase,
      perStrategy: strategyProgress,
      current: getCurrentIndex(statusResponse.strategies),
      error: statusResponse.error || '',
      elapsed: statusResponse.completed_at && statusResponse.started_at
        ? Math.max(0, Math.floor(statusResponse.completed_at - statusResponse.started_at))
        : state.elapsed,
    }));

    if (statusResponse.status === 'done') {
      clearPolling();
      if (!fetchedResultsRef.current) {
        fetchedResultsRef.current = true;
        fetchResults(statusResponse.run_id);
      }
    }

    if (statusResponse.status === 'failed') {
      clearPolling();
    }
  };

  const pollStatus = async (activeRunId) => {
    try {
      const statusResponse = await getApi().getEvaluationStatus(activeRunId);
      updateFromStatus(statusResponse);
    } catch (err) {
      clearPolling();
      setRunState((state) => ({
        ...state,
        phase: 'failed',
        error: `Polling failed (${err.message}).`,
      }));
    }
  };

  React.useEffect(() => {
    if (!runId || (phase !== 'pending' && phase !== 'running')) {
      clearPolling();
      return undefined;
    }

    clearPolling();
    pollIntervalRef.current = setInterval(() => {
      pollStatus(runId);
    }, 3000);

    return () => {
      clearPolling();
    };
  }, [phase, runId]);

  React.useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  React.useEffect(() => {
    if ((phase !== 'pending' && phase !== 'running') || !startedAt) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setRunState((state) => ({
        ...state,
        elapsed: Math.max(0, Math.floor(Date.now() / 1000 - state.startedAt)),
      }));
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase, startedAt]);

  const runEval = async () => {
    try {
      fetchedResultsRef.current = false;
      clearPolling();
      const response = await getApi().startEvaluation(
        selectedStrategies,
        dataset.path || 'eval/questions.json',
        'corpus',
      );
      setRunState({
        phase: 'pending',
        current: 0,
        perStrategy: {},
        elapsed: 0,
        runId: response.run_id,
        error: '',
        results: null,
        startedAt: Date.now() / 1000,
      });
      pollStatus(response.run_id);
    } catch (err) {
      clearPolling();
      setRunState((state) => ({
        ...state,
        phase: 'failed',
        error: `Failed to start evaluation (${err.message}).`,
      }));
    }
  };

  const totalProgress = enabledStrategies.length === 0
    ? 0
    : enabledStrategies.reduce((sum, strategy) => sum + (perStrategy[strategy.id] ?? 0), 0) / enabledStrategies.length;

  const totalChars = files.reduce((sum, file) => sum + file.chars, 0);
  const estTotalSec = enabledStrategies.length * 14;
  const remaining = Math.max(0, estTotalSec - elapsed);
  const isActivePhase = phase === 'pending' || phase === 'running' || phase === 'done' || phase === 'failed';

  return (
    <div className="page fade-in">
      <PageHeader
        eyebrow="STEP 03 — RUN"
        title="Evaluate strategies"
        desc="Each enabled strategy chunks the corpus, builds a vector index, and answers every question. Outputs are scored against the gold answers."
        actions={
          phase === 'done'
            ? <button className="btn primary" onClick={() => { setProgress((p) => ({ ...p, evaluate: 'done' })); setPage('results'); }}>View results <I name="arrow-right" size={14}/></button>
            : null
        }
      />

      {error && (
        <div className="card" style={{marginBottom: 16, borderColor: 'rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.08)'}}>
          <div style={{fontSize: 13, color: '#FCA5A5'}}>{error}</div>
        </div>
      )}

      <div className="grid grid-4" style={{marginBottom: 24}}>
        <div className="kpi">
          <div className="kpi-label"><I name="file-text" size={12}/> Documents</div>
          <div className="kpi-value tight mono">{files.length}</div>
          <div className="kpi-sub">{(totalChars / 1000).toFixed(1)}k chars total</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I name="hash" size={12}/> Questions</div>
          <div className="kpi-value tight mono">{dataset.questions}</div>
          <div className="kpi-sub">{dataset.path.split('/').pop()}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I name="sliders" size={12}/> Strategies</div>
          <div className="kpi-value tight mono">{enabledStrategies.length}</div>
          <div className="kpi-sub">{enabledStrategies.map((strategy) => strategy.name).slice(0, 2).join(', ')}{enabledStrategies.length > 2 ? '…' : ''}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I name="clock" size={12}/> Est. time</div>
          <div className="kpi-value tight mono">~{Math.ceil(estTotalSec / 60)}<span className="kpi-unit">min</span></div>
          <div className="kpi-sub">≈ {(enabledStrategies.length * dataset.questions).toLocaleString()} retrievals</div>
        </div>
      </div>

      {!isActivePhase && (
        <div className="card padded-lg" style={{textAlign: 'center', padding: '52px 24px', position: 'relative', overflow: 'hidden'}}>
          <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.10), transparent 60%)', pointerEvents:'none'}}></div>
          <div style={{position:'relative'}}>
            <div className="row gap-2" style={{justifyContent:'center', marginBottom: 16}}>
              {enabledStrategies.map((strategy) => (
                <span key={strategy.id} className="badge blue" style={{padding:'5px 10px', fontSize: 11.5}}>{strategy.icon} {strategy.name}</span>
              ))}
            </div>
            <h2 style={{fontSize: 22, fontWeight: 600, letterSpacing:'-0.02em', marginBottom: 8}}>Ready to run</h2>
            <p className="muted" style={{fontSize: 13.5, maxWidth: 460, margin: '0 auto 24px'}}>
              All systems checked. Embeddings will be cached locally · run is fully reproducible from <span className="mono" style={{color:'var(--text-primary)'}}>config.yaml</span>.
            </p>
            <button className="btn gradient xl" onClick={runEval} disabled={!selectedStrategies.length || !dataset.path}>
              <I name="play" size={16}/> Run evaluation
            </button>
            <div className="row gap-3" style={{justifyContent:'center', marginTop: 18}}>
              <span className="dim mono" style={{fontSize: 11}}>⌘R to start</span>
              <span className="dim">·</span>
              <span className="dim mono" style={{fontSize: 11}}>seed: 42</span>
              <span className="dim">·</span>
              <span className="dim mono" style={{fontSize: 11}}>cache: warm</span>
            </div>
          </div>
        </div>
      )}

      {isActivePhase && (
        <div className="card padded-lg">
          <div className="row between" style={{marginBottom: 18}}>
            <div className="row gap-3">
              {(phase === 'pending' || phase === 'running')
                ? <div className="spin"></div>
                : phase === 'done'
                  ? <div style={{color:'var(--emerald)'}}><I name="check-circle" size={20}/></div>
                  : <div style={{color:'var(--rose)'}}><I name="x" size={20}/></div>}
              <div>
                <div style={{fontSize: 15, fontWeight: 600}}>
                  {phase === 'done'
                    ? 'Evaluation complete'
                    : phase === 'failed'
                      ? 'Evaluation failed'
                      : `Evaluating ${enabledStrategies[current]?.name || enabledStrategies[0]?.name || 'strategies'}…`}
                </div>
                <div className="dim" style={{fontSize: 12, marginTop: 2}}>
                  {phase === 'done'
                    ? `Finished in ${elapsed.toFixed(1)}s · all ${enabledStrategies.length} strategies scored`
                    : phase === 'failed'
                      ? 'The evaluation stopped before completing all strategies'
                      : `${Math.min(current + 1, enabledStrategies.length)} of ${enabledStrategies.length} strategies · ${dataset.questions} questions per strategy`}
                </div>
              </div>
            </div>
            <div className="row gap-4">
              <div style={{textAlign:'right'}}>
                <div className="dim" style={{fontSize: 11, textTransform:'uppercase', letterSpacing:'0.08em'}}>Elapsed</div>
                <div className="mono" style={{fontSize: 14, marginTop: 2}}>{elapsed.toFixed(1)}s</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="dim" style={{fontSize: 11, textTransform:'uppercase', letterSpacing:'0.08em'}}>Remaining</div>
                <div className="mono" style={{fontSize: 14, marginTop: 2, color: phase === 'done' ? 'var(--emerald)' : phase === 'failed' ? 'var(--rose)' : 'var(--blue)'}}>
                  {phase === 'done' || phase === 'failed' ? '—' : `~${remaining.toFixed(0)}s`}
                </div>
              </div>
            </div>
          </div>

          <div className="progress-track" style={{height: 8, marginBottom: 8}}>
            <div
              className={`progress-fill ${phase === 'done' ? 'success' : 'shimmer'}`}
              style={{width: `${phase === 'done' ? 100 : totalProgress}%`}}
            ></div>
          </div>
          <div className="row between" style={{marginBottom: 24}}>
            <span className="dim mono" style={{fontSize: 11}}>{phase === 'done' ? '100' : Math.floor(totalProgress)}% · overall</span>
            <span className="dim mono" style={{fontSize: 11}}>run_id={runId || '—'}</span>
          </div>

          <div>
            {enabledStrategies.map((strategy, index) => {
              const progress = perStrategy[strategy.id] ?? 0;
              const isCurrent = index === current && (phase === 'pending' || phase === 'running');
              const isFailed = phase === 'failed' && index === current;
              const done = progress >= 100 && !isFailed;
              return (
                <div key={strategy.id} className="run-row">
                  <div className="run-icon">{strategy.icon}</div>
                  <div>
                    <div style={{fontSize: 13.5, fontWeight: 500}}>{strategy.name}</div>
                    <div className="dim" style={{fontSize: 11.5, fontFamily: 'var(--font-mono)', marginTop: 2}}>
                      {done
                        ? `${dataset.questions} / ${dataset.questions} questions`
                        : isFailed
                          ? 'failed'
                          : isCurrent
                            ? `${Math.floor(progress / 100 * dataset.questions)} / ${dataset.questions} questions`
                            : 'queued'}
                    </div>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${done ? 'success' : isCurrent ? 'shimmer' : ''}`}
                      style={{width: `${done || isFailed ? 100 : isCurrent ? progress : 0}%`, opacity: !isCurrent && !done && !isFailed ? 0.3 : 1}}
                    ></div>
                  </div>
                  <div className="run-status">
                    {done
                      ? <span style={{color:'var(--emerald)'}}><I name="check" size={12}/> done</span>
                      : isFailed
                        ? <span style={{color:'var(--rose)'}}>failed</span>
                        : isCurrent
                          ? <span style={{color:'var(--blue)'}}>running</span>
                          : 'waiting'}
                  </div>
                  <div className="run-status mono">
                    {done ? '100%' : isFailed ? 'ERR' : isCurrent ? `${Math.floor(progress)}%` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

window.EvaluatePage = EvaluatePage;

