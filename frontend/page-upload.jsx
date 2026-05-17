/* Page 1 — Upload */

const UploadPage = ({ files, setFiles, setProgress, setPage }) => {
  const [dragging, setDragging] = React.useState(false);
  const [parsing, setParsing] = React.useState(null);
  const [parseProgress, setParseProgress] = React.useState(0);

  const totalChars = files.reduce((s, f) => s + f.chars, 0);
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    simulateParse();
  };

  const simulateParse = () => {
    setParsing('annual_report_q4.pdf');
    setParseProgress(0);
    const tick = setInterval(() => {
      setParseProgress(p => {
        const next = p + Math.random() * 14 + 4;
        if (next >= 100) {
          clearInterval(tick);
          setTimeout(() => {
            setFiles(fs => [...fs, {
              name: 'annual_report_q4.pdf',
              ext: 'PDF',
              size: 2_840_000,
              chars: 184_213,
              pages: 64,
              status: 'parsed',
            }]);
            setParsing(null);
            setParseProgress(0);
          }, 300);
          return 100;
        }
        return next;
      });
    }, 130);
  };

  const fmtSize = b => b >= 1e6 ? (b/1e6).toFixed(2) + ' MB' : (b/1e3).toFixed(0) + ' KB';
  const fmt = n => n.toLocaleString('en-US');

  return (
    <div className="page fade-in">
      <PageHeader
        eyebrow="STEP 01 — INGEST"
        title="Upload corpus"
        desc="Drop PDF, Markdown, HTML, or plain-text documents. Files are parsed locally with Apache Tika; nothing is sent to a model until evaluation."
        actions={
          <React.Fragment>
            <button className="btn ghost"><I name="folder" size={14}/> Browse files</button>
            <button className="btn primary" onClick={() => { setProgress(p => ({...p, upload: 'done'})); setPage('configure'); }} disabled={files.length === 0}>
              Continue <I name="arrow-right" size={14}/>
            </button>
          </React.Fragment>
        }
      />

      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={simulateParse}
      >
        <div className="dropzone-icon">
          <I name="upload" size={24}/>
        </div>
        <h3>Drop documents here</h3>
        <p>or click to browse — supports <span className="mono" style={{color:'var(--text-primary)'}}>.pdf .md .txt .html .docx</span> · max 50 MB per file</p>
        <div className="row gap-2" style={{justifyContent: 'center', marginTop: 18}}>
          <span className="badge">Tika 2.9</span>
          <span className="badge">UTF-8</span>
          <span className="badge">Local parse</span>
        </div>
      </div>

      {parsing && (
        <div className="card" style={{marginTop: 20}}>
          <div className="row between" style={{marginBottom: 12}}>
            <div className="row gap-3">
              <div className="spin"></div>
              <div>
                <div style={{fontSize: 13.5, fontWeight: 500}}>Parsing <span className="mono">{parsing}</span></div>
                <div className="dim" style={{fontSize: 12, marginTop: 2}}>Extracting text · normalizing whitespace · detecting language</div>
              </div>
            </div>
            <span className="mono" style={{fontSize: 13, color: 'var(--blue)'}}>{Math.floor(parseProgress)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill shimmer" style={{width: `${parseProgress}%`}}></div>
          </div>
        </div>
      )}

      <div className="row between" style={{marginTop: 36, marginBottom: 14}}>
        <div>
          <div style={{fontSize: 14, fontWeight: 600}}>Corpus</div>
          <div className="dim" style={{fontSize: 12, marginTop: 2}}>
            {files.length} {files.length === 1 ? 'document' : 'documents'} · {fmt(totalChars)} chars · {fmtSize(totalSize)}
          </div>
        </div>
        <div className="row gap-2">
          <span className="badge emerald"><I name="check" size={11}/> All parsed</span>
          <button className="btn ghost"><I name="trash" size={13}/> Clear</button>
        </div>
      </div>

      <div className="grid" style={{gap: 10}}>
        {files.map((f, i) => (
          <div key={i} className="corpus-card">
            <div className="file-icon">
              <span className="ext">{f.ext}</span>
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 13.5, fontWeight: 500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{f.name}</div>
              <div className="row gap-3" style={{marginTop: 4}}>
                <span className="dim mono" style={{fontSize: 11.5}}>{fmtSize(f.size)}</span>
                <span className="dim" style={{fontSize: 11.5}}>·</span>
                <span className="dim mono" style={{fontSize: 11.5}}>{fmt(f.chars)} chars</span>
                <span className="dim" style={{fontSize: 11.5}}>·</span>
                <span className="dim mono" style={{fontSize: 11.5}}>{f.pages} pages</span>
              </div>
            </div>
            <span className="badge emerald"><I name="check" size={11}/> Parsed</span>
            <button className="btn ghost" style={{padding: '6px 8px'}}><I name="trash" size={13}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

window.UploadPage = UploadPage;

