/* Page 4 — Results */

const ResultsPage = ({ evaluationResults, setPage }) => {
  const [selectedQ, setSelectedQ] = React.useState(0);
  const [metric, setMetric] = React.useState('rougeL');
  const strategyCatalog = window.STRATEGIES || [];

  const getStrategyMeta = (strategyId) => {
    const found = strategyCatalog.find((item) => item.id === strategyId);
    const colorMap = {
      fixed: 'rose',
      recursive: 'amber',
      semantic: 'emerald',
      sentence_window: 'violet',
      late_chunking: 'blue',
    };
    return {
      icon: found?.icon || '🧩',
      name: found?.name || strategyId,
      color: colorMap[strategyId] || 'blue',
    };
  };

  const averageLatency = (results, key) => {
    if (!results || !results.length) return 0;
    const total = results.reduce((sum, item) => sum + (item[key] || 0), 0);
    return total / results.length;
  };

  const toStrategyRows = () => {
    if (!evaluationResults || !evaluationResults.strategies) {
      return [];
    }
    const source = evaluationResults.strategies;
    const entries = Array.isArray(source)
      ? source.map((item) => [item.strategy, item])
      : Object.entries(source);
    return entries.map(([strategyId, entry]) => {
      const results = entry.results || [];
      const metrics = entry.metrics || {};
      const retrievalLatency = entry.avg_retrieval_latency_ms ?? averageLatency(results, 'retrieval_latency_ms');
      const generationLatency = entry.avg_generation_latency_ms ?? averageLatency(results, 'generation_latency_ms');
      const totalLatency = retrievalLatency + generationLatency;
      const score = (metrics.rouge_l || 0) * 0.4 + (metrics.context_hit_rate || 0) * 0.4 + (metrics.adversarial_score || 0) * 0.2;
      return {
        id: strategyId,
        ...getStrategyMeta(strategyId),
        rougeL: metrics.rouge_l || 0,
        hitRate: metrics.context_hit_rate || 0,
        adversarialScore: metrics.adversarial_score || 0,
        score,
        retrievalLatency,
        generationLatency,
        latency: totalLatency,
        chunks: results.length,
        results,
      };
    });
  };

  const scoreAnswer = (generated, expected) => {
    const generatedWords = String(generated || '').toLowerCase().split(/\W+/).filter(Boolean);
    const expectedWords = String(expected || '').toLowerCase().split(/\W+/).filter(Boolean);
    if (!generatedWords.length || !expectedWords.length) return 0;
    const overlap = expectedWords.filter((word) => generatedWords.includes(word)).length;
    return overlap / expectedWords.length;
  };

  const buildQuestions = (rankedStrategies) => {
    const questionsMap = new Map();
    rankedStrategies.forEach((strategy) => {
      strategy.results.forEach((result) => {
        const existing = questionsMap.get(result.question_id) || {
          id: result.question_id,
          q: result.question,
          expected: result.expected_answer,
          strategies: {},
        };
        existing.strategies[strategy.id] = {
          strategyId: strategy.id,
          strategyName: strategy.name,
          answer: result.generated_answer,
          retrieved: result.retrieved_chunks || [],
          score: scoreAnswer(result.generated_answer, result.expected_answer),
        };
        questionsMap.set(result.question_id, existing);
      });
    });
    return Array.from(questionsMap.values()).map((question) => {
      const rankedEntries = Object.values(question.strategies).sort((a, b) => b.score - a.score);
      const best = rankedEntries[0] || null;
      const second = rankedEntries[1] || null;
      const delta = best ? best.score - (second?.score || 0) : 0;
      return {
        ...question,
        best: best?.strategyName || 'N/A',
        bestStrategyId: best?.strategyId || '',
        delta,
      };
    });
  };

  const buildCsv = (rankedStrategies) => {
    const rows = [
      ['strategy', 'question_id', 'question', 'generated_answer', 'expected_answer', 'retrieval_latency_ms', 'generation_latency_ms'],
    ];
    rankedStrategies.forEach((strategy) => {
      strategy.results.forEach((result) => {
        rows.push([
          strategy.id,
          result.question_id,
          JSON.stringify(result.question || ''),
          JSON.stringify(result.generated_answer || ''),
          JSON.stringify(result.expected_answer || ''),
          result.retrieval_latency_ms || 0,
          result.generation_latency_ms || 0,
        ]);
      });
    });
    return rows.map((row) => row.join(',')).join('\n');
  };

  const downloadCsv = (csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluation_results_${evaluationResults.run_id || 'run'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!evaluationResults || !evaluationResults.strategies) {
    return (
      <div className="page fade-in">
        <PageHeader
          eyebrow="STEP 04 — ANALYZE"
          title="Results"
          desc="Empirical comparison across all enabled strategies. Quality scored with ROUGE-L against reference answers; retrieval scored with top-k context hit rate."
        />
        <div className="card padded-lg" style={{textAlign: 'center', padding: '56px 24px'}}>
          <div style={{fontSize: 16, fontWeight: 600, marginBottom: 8}}>No results available — run an evaluation first.</div>
          <div className="dim" style={{fontSize: 13, marginBottom: 18}}>Start an evaluation to populate this dashboard with real metrics and question-level outputs.</div>
          <button className="btn primary" onClick={() => setPage('evaluate')}><I name="play" size={14}/> Go to Evaluate</button>
        </div>
      </div>
    );
  }

  const ranked = toStrategyRows().sort((a, b) => b.score - a.score);
  if (!ranked.length) {
    return (
      <div className="page fade-in">
        <PageHeader
          eyebrow="STEP 04 — ANALYZE"
          title="Results"
          desc="Empirical comparison across all enabled strategies. Quality scored with ROUGE-L against reference answers; retrieval scored with top-k context hit rate."
        />
        <div className="card padded-lg" style={{textAlign: 'center', padding: '56px 24px'}}>
          <div style={{fontSize: 16, fontWeight: 600, marginBottom: 8}}>No results available — run an evaluation first.</div>
          <div className="dim" style={{fontSize: 13, marginBottom: 18}}>The evaluation payload did not contain any completed strategy results to display.</div>
          <button className="btn primary" onClick={() => setPage('evaluate')}><I name="play" size={14}/> Go to Evaluate</button>
        </div>
      </div>
    );
  }
  const best = ranked[0];
  const baseline = ranked.find((item) => item.id === 'fixed') || ranked[ranked.length - 1] || best;
  const maxLatency = Math.max(...ranked.map((item) => item.latency), 1);
  const maxQuality = Math.max(...ranked.map((item) => metric === 'rougeL' ? item.rougeL : item.hitRate), 0.0001);
  const questions = buildQuestions(ranked);
  const selectedQuestion = questions[selectedQ] || questions[0];
  const csvContent = buildCsv(ranked);
  const bestDelta = baseline && best && baseline.score
    ? ((best.score - baseline.score) / baseline.score) * 100
    : 0;

  return (
    <div className="page fade-in">
      <PageHeader
        eyebrow="STEP 04 — ANALYZE"
        title="Results"
        desc="Empirical comparison across all enabled strategies. Quality scored with ROUGE-L against reference answers; retrieval scored with top-k context hit rate."
        actions={
          <React.Fragment>
            <button className="btn ghost" onClick={() => downloadCsv(csvContent)}><I name="download" size={14}/> Export CSV</button>
            <button className="btn"><I name="sparkles" size={14}/> Share report</button>
            <button className="btn primary" onClick={() => setPage('evaluate')}><I name="play" size={14}/> Re-run</button>
          </React.Fragment>
        }
      />

      <div className="grid grid-3" style={{marginBottom: 28}}>
        <div className="kpi feature">
          <div className="kpi-label" style={{color: '#93BBFC'}}><I name="sparkles" size={12}/> Best overall strategy</div>
          <div className="kpi-value tight" style={{display:'flex', alignItems:'center', gap: 10}}>
            <span style={{fontSize: 26}}>{best.icon}</span>
            {best.name}
          </div>
          <div className="kpi-sub">
            <span className="badge emerald" style={{padding: '2px 7px'}}>{bestDelta >= 0 ? '+' : ''}{bestDelta.toFixed(1)}%</span>
            <span>vs. baseline ({baseline?.name || 'fixed'})</span>
          </div>
        </div>
        <div className="kpi success">
          <div className="kpi-label" style={{color: '#6EE7B7'}}><I name="target" size={12}/> Best ROUGE-L</div>
          <div className="kpi-value tight mono">{best.rougeL.toFixed(3)}</div>
          <div className="kpi-sub"><I name="arrow-up" size={11} style={{color:'var(--emerald)'}}/> {(best.rougeL - (baseline?.rougeL || 0)).toFixed(3)} over baseline</div>
          <svg className="kpi-spark" width="80" height="28" viewBox="0 0 80 28">
            <polyline points="0,22 12,18 24,20 36,12 48,14 60,8 72,6" fill="none" stroke="#10B981" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I name="gauge" size={12}/> Best context hit rate</div>
          <div className="kpi-value tight mono">{(best.hitRate * 100).toFixed(1)}<span className="kpi-unit">%</span></div>
          <div className="kpi-sub">{best.name} · run {evaluationResults.run_id}</div>
          <svg className="kpi-spark" width="80" height="28" viewBox="0 0 80 28">
            <polyline points="0,20 12,16 24,18 36,10 48,12 60,8 72,5" fill="none" stroke="#3B82F6" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      <div className="grid grid-2" style={{marginBottom: 24}}>
        <div className="card padded-lg">
          <div className="row between" style={{marginBottom: 4}}>
            <div className="card-title">Quality</div>
            <div className="row gap-2">
              <button className={`badge ${metric === 'rougeL' ? 'blue' : ''}`} style={{cursor:'pointer'}} onClick={() => setMetric('rougeL')}>ROUGE-L</button>
              <button className={`badge ${metric === 'hitRate' ? 'blue' : ''}`} style={{cursor:'pointer'}} onClick={() => setMetric('hitRate')}>Hit-rate</button>
            </div>
          </div>
          <div className="card-sub" style={{marginBottom: 22}}>Higher is better.</div>
          <div className="bars">
            {ranked.map((item) => {
              const value = metric === 'rougeL' ? item.rougeL : item.hitRate;
              const pct = value / maxQuality * 100;
              return (
                <div key={item.id} className="bar-row">
                  <div className="bar-label">
                    <span style={{fontSize: 14}}>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${item.color}`} style={{width: `${pct}%`}}></div>
                  </div>
                  <div className="bar-value">{metric === 'rougeL' ? value.toFixed(3) : `${(value * 100).toFixed(1)}%`}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card padded-lg">
          <div className="row between" style={{marginBottom: 4}}>
            <div className="card-title">Latency</div>
            <span className="badge">avg retrieval + generation</span>
          </div>
          <div className="card-sub" style={{marginBottom: 22}}>Lower is better. Based on real retrieval and generation latency data.</div>
          <div className="bars">
            {[...ranked].sort((a, b) => a.latency - b.latency).map((item) => (
              <div key={item.id} className="bar-row">
                <div className="bar-label">
                  <span style={{fontSize: 14}}>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                <div className="bar-track">
                  <div className={`bar-fill ${item.color}`} style={{width: `${item.latency / maxLatency * 100}%`}}></div>
                </div>
                <div className="bar-value">{item.latency.toFixed(1)} ms</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card flush" style={{marginBottom: 24}}>
        <div className="row between" style={{padding: '20px 24px 4px'}}>
          <div>
            <div className="card-title">Leaderboard</div>
            <div className="card-sub">Ranked by combined score: rouge_l × 0.4 + context_hit_rate × 0.4 + adversarial_score × 0.2.</div>
          </div>
          <div className="row gap-2">
            <span className="badge"><I name="hash" size={11}/> {questions.length} questions</span>
            <span className="badge emerald"><div className="dot live" style={{width:5, height:5}}></div> live</span>
          </div>
        </div>
        <div style={{padding: '8px 8px 8px'}}>
          <table className="lb">
            <thead>
              <tr>
                <th className="rank-cell">Rank</th>
                <th>Strategy</th>
                <th>ROUGE-L</th>
                <th>Hit rate</th>
                <th>Adversarial</th>
                <th>Latency</th>
                <th>Results</th>
                <th style={{textAlign:'right'}}>Δ vs baseline</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((item, index) => {
                const delta = baseline && baseline.score
                  ? ((item.score - baseline.score) / baseline.score) * 100
                  : 0;
                return (
                  <tr key={item.id} className={index < 3 ? 'top' : ''}>
                    <td className="rank-cell">
                      {index === 0 ? <I name="medal-1"/> : index === 1 ? <I name="medal-2"/> : index === 2 ? <I name="medal-3"/> : <span className="dim">#{index + 1}</span>}
                    </td>
                    <td>
                      <div className="row gap-2">
                        <span style={{fontSize: 16}}>{item.icon}</span>
                        <span style={{fontWeight: 500}}>{item.name}</span>
                        {index === 0 && <span className="badge emerald" style={{padding:'2px 7px'}}>best</span>}
                      </div>
                    </td>
                    <td className="num">{item.rougeL.toFixed(3)}</td>
                    <td className="num">{(item.hitRate * 100).toFixed(1)}%</td>
                    <td className="num">{item.adversarialScore.toFixed(3)}</td>
                    <td className="num">{item.latency.toFixed(1)} ms</td>
                    <td className="num dim">{item.results.length.toLocaleString()}</td>
                    <td className="num" style={{textAlign:'right', color: delta > 0 ? 'var(--emerald)' : delta < 0 ? 'var(--rose)' : 'var(--text-tertiary)'}}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="row between" style={{marginBottom: 14}}>
          <div>
            <div style={{fontSize: 14, fontWeight: 600}}>Question explorer</div>
            <div className="dim" style={{fontSize: 12, marginTop: 2}}>Inspect any evaluated question and compare generated answers across strategies.</div>
          </div>
          <div className="row gap-2">
            <div style={{position:'relative'}}>
              <I name="search" size={13} style={{position:'absolute', left: 10, top: 10, color:'var(--text-tertiary)'}}/>
              <input className="input" placeholder="Search questions…" style={{paddingLeft: 30, width: 240}}/>
            </div>
            <button className="btn ghost" onClick={() => setSelectedQ(0)}><I name="filter" size={13}/> Reset</button>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="col" style={{gap: 10}}>
            {questions.map((question, index) => (
              <div
                key={question.id}
                className={`q-card ${selectedQ === index ? 'selected' : ''}`}
                onClick={() => setSelectedQ(index)}
              >
                <div className="row between" style={{marginBottom: 8}}>
                  <span className="dim mono" style={{fontSize: 11}}>{question.id}</span>
                  <span className="badge emerald" style={{padding:'2px 7px'}}>{question.delta >= 0 ? '+' : ''}{question.delta.toFixed(2)}</span>
                </div>
                <div style={{fontSize: 13, lineHeight: 1.5}}>{question.q}</div>
                <div className="row gap-2" style={{marginTop: 10}}>
                  <span className="dim" style={{fontSize: 11.5}}>winner</span>
                  <span style={{fontSize: 11.5, fontWeight: 500, color: 'var(--text-primary)'}}>{question.best}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedQuestion && (
            <div className="card padded-lg" style={{position:'sticky', top: 80, alignSelf: 'start'}}>
              <div className="row between" style={{marginBottom: 14}}>
                <span className="dim mono" style={{fontSize: 11}}>{selectedQuestion.id} · per-strategy</span>
                <span className="badge blue">{selectedQuestion.best} wins</span>
              </div>
              <div style={{fontSize: 14, lineHeight: 1.5, marginBottom: 18, fontWeight: 500}}>
                {selectedQuestion.q}
              </div>

              <div className="divider" style={{margin: '14px 0 18px'}}></div>

              <div className="dim" style={{fontSize: 11, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 10}}>Per-strategy answer score</div>
              <div className="bars" style={{gap: 9}}>
                {ranked.map((strategy) => {
                  const strategyAnswer = selectedQuestion.strategies[strategy.id];
                  const score = strategyAnswer?.score || 0;
                  return (
                    <div key={strategy.id} className="bar-row" style={{gridTemplateColumns: '120px 1fr 50px'}}>
                      <div className="bar-label" style={{fontSize: 12}}>
                        <span style={{fontSize: 13}}>{strategy.icon}</span>
                        <span>{strategy.name}</span>
                      </div>
                      <div className="bar-track" style={{height: 18}}>
                        <div className={`bar-fill ${strategy.color}`} style={{width: `${score * 100}%`}}></div>
                      </div>
                      <div className="bar-value" style={{fontSize: 11.5}}>{score.toFixed(3)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="divider" style={{margin: '20px 0 16px'}}></div>

              <div className="dim" style={{fontSize: 11, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 8}}>Top retrieved chunk · {selectedQuestion.best}</div>
              <div style={{padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 12.5, lineHeight: 1.55, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)'}}>
                <span className="dim" style={{fontSize: 10.5}}>{selectedQuestion.strategies[selectedQuestion.bestStrategyId]?.retrieved?.[0]?.metadata?.source || 'retrieved context'} · live result</span>
                <div style={{marginTop: 8, color: 'var(--text-primary)'}}>
                  {selectedQuestion.strategies[selectedQuestion.bestStrategyId]?.retrieved?.[0]?.text || 'No retrieved context available for this question.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.ResultsPage = ResultsPage;

