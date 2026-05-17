/* Page 4 — Results */

const RESULTS = [
  { id: 'semantic',         icon: '🧠', name: 'Semantic',         rougeL: 0.612, hitRate: 0.873, mrr: 0.741, latency: 142, chunks: 1842, color: 'emerald' },
  { id: 'late',             icon: '⏳', name: 'Late chunking',    rougeL: 0.598, hitRate: 0.851, mrr: 0.722, latency: 98,  chunks: 920,  color: 'blue' },
  { id: 'sentence-window',  icon: '🪟', name: 'Sentence-window',  rougeL: 0.571, hitRate: 0.819, mrr: 0.689, latency: 124, chunks: 5210, color: 'violet' },
  { id: 'recursive',        icon: '🔄', name: 'Recursive',        rougeL: 0.548, hitRate: 0.792, mrr: 0.651, latency: 67,  chunks: 1208, color: 'amber' },
  { id: 'fixed',            icon: '📐', name: 'Fixed-size',       rougeL: 0.491, hitRate: 0.714, mrr: 0.583, latency: 54,  chunks: 1456, color: 'rose' },
];

const QUESTIONS = [
  { q: 'What was the company\'s total revenue in fiscal year 2024?',                 best: 'Semantic',        delta: '+0.18' },
  { q: 'Which segment showed the largest year-over-year growth?',                    best: 'Late chunking',   delta: '+0.21' },
  { q: 'Summarize the risks listed in the management discussion section.',            best: 'Semantic',        delta: '+0.14' },
  { q: 'How did operating margin change between Q3 and Q4?',                          best: 'Sentence-window', delta: '+0.09' },
  { q: 'What guidance did the CFO provide for the next fiscal year?',                 best: 'Semantic',        delta: '+0.27' },
  { q: 'List the top three R&D investments mentioned in the report.',                 best: 'Late chunking',   delta: '+0.12' },
];

const ResultsPage = () => {
  const [selectedQ, setSelectedQ] = React.useState(0);
  const [metric, setMetric] = React.useState('rougeL');
  const ranked = [...RESULTS].sort((a, b) => b.rougeL - a.rougeL);
  const best = ranked[0];
  const maxLatency = Math.max(...RESULTS.map(r => r.latency));
  const maxQuality = Math.max(...RESULTS.map(r => r[metric === 'rougeL' ? 'rougeL' : 'hitRate']));

  return (
    <div className="page fade-in">
      <PageHeader
        eyebrow="STEP 04 — ANALYZE"
        title="Results"
        desc="Empirical comparison across all enabled strategies. Quality scored with ROUGE-L against reference answers; retrieval scored with top-k context hit rate."
        actions={
          <React.Fragment>
            <button className="btn ghost"><I name="download" size={14}/> Export CSV</button>
            <button className="btn"><I name="sparkles" size={14}/> Share report</button>
            <button className="btn primary"><I name="play" size={14}/> Re-run</button>
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
            <span className="badge emerald" style={{padding: '2px 7px'}}>+12.3%</span>
            <span>vs. baseline (fixed)</span>
          </div>
        </div>
        <div className="kpi success">
          <div className="kpi-label" style={{color: '#6EE7B7'}}><I name="target" size={12}/> Best ROUGE-L</div>
          <div className="kpi-value tight mono">{best.rougeL.toFixed(3)}</div>
          <div className="kpi-sub"><I name="arrow-up" size={11} style={{color:'var(--emerald)'}}/> 0.121 over fixed-size baseline</div>
          <svg className="kpi-spark" width="80" height="28" viewBox="0 0 80 28">
            <polyline points="0,22 12,18 24,20 36,12 48,14 60,8 72,6" fill="none" stroke="#10B981" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I name="gauge" size={12}/> Best context hit rate</div>
          <div className="kpi-value tight mono">87.3<span className="kpi-unit">%</span></div>
          <div className="kpi-sub">{ranked[0].name} · top-5 retrieval</div>
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
              <button
                className={`badge ${metric === 'rougeL' ? 'blue' : ''}`}
                style={{cursor:'pointer'}}
                onClick={() => setMetric('rougeL')}
              >ROUGE-L</button>
              <button
                className={`badge ${metric === 'hitRate' ? 'blue' : ''}`}
                style={{cursor:'pointer'}}
                onClick={() => setMetric('hitRate')}
              >Hit-rate</button>
            </div>
          </div>
          <div className="card-sub" style={{marginBottom: 22}}>Higher is better.</div>
          <div className="bars">
            {ranked.map((r, i) => {
              const v = metric === 'rougeL' ? r.rougeL : r.hitRate;
              const pct = v / maxQuality * 100;
              return (
                <div key={r.id} className="bar-row">
                  <div className="bar-label">
                    <span style={{fontSize: 14}}>{r.icon}</span>
                    <span>{r.name}</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${r.color}`} style={{width: `${pct}%`}}></div>
                  </div>
                  <div className="bar-value">{metric === 'rougeL' ? v.toFixed(3) : (v*100).toFixed(1) + '%'}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card padded-lg">
          <div className="row between" style={{marginBottom: 4}}>
            <div className="card-title">Latency</div>
            <span className="badge">p50 · ms / query</span>
          </div>
          <div className="card-sub" style={{marginBottom: 22}}>Lower is better. End-to-end: chunk → embed → retrieve.</div>
          <div className="bars">
            {[...RESULTS].sort((a, b) => a.latency - b.latency).map(r => (
              <div key={r.id} className="bar-row">
                <div className="bar-label">
                  <span style={{fontSize: 14}}>{r.icon}</span>
                  <span>{r.name}</span>
                </div>
                <div className="bar-track">
                  <div className={`bar-fill ${r.color}`} style={{width: `${r.latency / maxLatency * 100}%`}}></div>
                </div>
                <div className="bar-value">{r.latency} ms</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card flush" style={{marginBottom: 24}}>
        <div className="row between" style={{padding: '20px 24px 4px'}}>
          <div>
            <div className="card-title">Leaderboard</div>
            <div className="card-sub">Ranked by ROUGE-L. Click a row for the full per-question breakdown.</div>
          </div>
          <div className="row gap-2">
            <span className="badge"><I name="hash" size={11}/> 240 questions</span>
            <span className="badge emerald"><div className="dot live" style={{width:5, height:5}}></div> fresh</span>
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
                <th>MRR@5</th>
                <th>Latency</th>
                <th>Chunks</th>
                <th style={{textAlign:'right'}}>Δ vs baseline</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const baseline = ranked.find(x => x.id === 'fixed') || ranked[ranked.length-1];
                const delta = ((r.rougeL - baseline.rougeL) / baseline.rougeL * 100);
                return (
                  <tr key={r.id} className={i < 3 ? 'top' : ''}>
                    <td className="rank-cell">
                      {i === 0 ? <I name="medal-1"/> : i === 1 ? <I name="medal-2"/> : i === 2 ? <I name="medal-3"/> : <span className="dim">#{i+1}</span>}
                    </td>
                    <td>
                      <div className="row gap-2">
                        <span style={{fontSize: 16}}>{r.icon}</span>
                        <span style={{fontWeight: 500}}>{r.name}</span>
                        {i === 0 && <span className="badge emerald" style={{padding:'2px 7px'}}>best</span>}
                      </div>
                    </td>
                    <td className="num">{r.rougeL.toFixed(3)}</td>
                    <td className="num">{(r.hitRate * 100).toFixed(1)}%</td>
                    <td className="num">{r.mrr.toFixed(3)}</td>
                    <td className="num">{r.latency} ms</td>
                    <td className="num dim">{r.chunks.toLocaleString()}</td>
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

      {/* Question explorer */}
      <div>
        <div className="row between" style={{marginBottom: 14}}>
          <div>
            <div style={{fontSize: 14, fontWeight: 600}}>Question explorer</div>
            <div className="dim" style={{fontSize: 12, marginTop: 2}}>Inspect any question to see which strategy retrieved the right context.</div>
          </div>
          <div className="row gap-2">
            <div style={{position:'relative'}}>
              <I name="search" size={13} style={{position:'absolute', left: 10, top: 10, color:'var(--text-tertiary)'}}/>
              <input className="input" placeholder="Search questions…" style={{paddingLeft: 30, width: 240}}/>
            </div>
            <button className="btn ghost"><I name="filter" size={13}/> Filter</button>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="col" style={{gap: 10}}>
            {QUESTIONS.map((qu, i) => (
              <div
                key={i}
                className={`q-card ${selectedQ === i ? 'selected' : ''}`}
                onClick={() => setSelectedQ(i)}
              >
                <div className="row between" style={{marginBottom: 8}}>
                  <span className="dim mono" style={{fontSize: 11}}>Q{String(i+1).padStart(3,'0')}</span>
                  <span className="badge emerald" style={{padding:'2px 7px'}}>{qu.delta}</span>
                </div>
                <div style={{fontSize: 13, lineHeight: 1.5}}>{qu.q}</div>
                <div className="row gap-2" style={{marginTop: 10}}>
                  <span className="dim" style={{fontSize: 11.5}}>winner</span>
                  <span style={{fontSize: 11.5, fontWeight: 500, color: 'var(--text-primary)'}}>{qu.best}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card padded-lg" style={{position:'sticky', top: 80, alignSelf: 'start'}}>
            <div className="row between" style={{marginBottom: 14}}>
              <span className="dim mono" style={{fontSize: 11}}>Q{String(selectedQ+1).padStart(3,'0')} · per-strategy</span>
              <span className="badge blue">{QUESTIONS[selectedQ].best} wins</span>
            </div>
            <div style={{fontSize: 14, lineHeight: 1.5, marginBottom: 18, fontWeight: 500}}>
              {QUESTIONS[selectedQ].q}
            </div>

            <div className="divider" style={{margin: '14px 0 18px'}}></div>

            <div className="dim" style={{fontSize: 11, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 10}}>Per-strategy ROUGE-L</div>
            <div className="bars" style={{gap: 9}}>
              {RESULTS.map(r => {
                const score = r.rougeL * (0.85 + Math.sin((selectedQ+1) * r.id.length) * 0.15);
                return (
                  <div key={r.id} className="bar-row" style={{gridTemplateColumns: '120px 1fr 50px'}}>
                    <div className="bar-label" style={{fontSize: 12}}>
                      <span style={{fontSize: 13}}>{r.icon}</span>
                      <span>{r.name}</span>
                    </div>
                    <div className="bar-track" style={{height: 18}}>
                      <div className={`bar-fill ${r.color}`} style={{width: `${score / 0.7 * 100}%`}}></div>
                    </div>
                    <div className="bar-value" style={{fontSize: 11.5}}>{score.toFixed(3)}</div>
                  </div>
                );
              })}
            </div>

            <div className="divider" style={{margin: '20px 0 16px'}}></div>

            <div className="dim" style={{fontSize: 11, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 8}}>Top retrieved chunk · {QUESTIONS[selectedQ].best}</div>
            <div style={{padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 12.5, lineHeight: 1.55, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)'}}>
              <span className="dim" style={{fontSize: 10.5}}>annual_report_q4.pdf · p. 42 · score 0.87</span>
              <div style={{marginTop: 8, color: 'var(--text-primary)'}}>
                "…segment-level performance for the quarter showed Cloud Services at 34.2% YoY growth, exceeding internal forecasts and accounting for the largest contribution to consolidated revenue expansion in the period…"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ResultsPage = ResultsPage;

