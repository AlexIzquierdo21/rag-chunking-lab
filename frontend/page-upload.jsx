/* Page 1 — Upload */

const UploadPage = ({ files, setFiles, setProgress, setPage }) => {
  const [dragging, setDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [parsing, setParsing] = React.useState(null);
  const [parseProgress, setParseProgress] = React.useState(0);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    let isMounted = true;
    setFiles([]);
    loadDocuments(isMounted);
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!parsing) {
      setParseProgress(0);
      return undefined;
    }
    const tick = setInterval(() => {
      setParseProgress((value) => Math.min(value + Math.random() * 12 + 5, 90));
    }, 180);
    return () => clearInterval(tick);
  }, [parsing]);

  const totalChars = files.reduce((s, f) => s + f.chars, 0);
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  const getApi = () => {
    if (!window.API) {
      throw new Error('API client not available');
    }
    return window.API;
  };

  const mapDocument = (doc) => {
    const parts = doc.filename.split('.');
    const extension = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
    return {
      name: doc.filename,
      ext: extension,
      size: doc.characters,
      chars: doc.characters,
      pages: '—',
      status: doc.status === 'ready' ? 'parsed' : doc.status,
    };
  };

  const loadDocuments = async (isMounted = true) => {
    setLoading(true);
    setError('');
    try {
      const documents = await getApi().listDocuments();
      if (isMounted) {
        setFiles(documents.map(mapDocument));
      }
    } catch (err) {
      if (isMounted) {
        setFiles([]);
        setError(`Failed to load documents (${err.message}).`);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const openFilePicker = () => {
    if (!parsing && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFiles = async (selectedFiles) => {
    const filesToUpload = Array.from(selectedFiles || []).filter(Boolean);
    if (!filesToUpload.length) {
      return;
    }
    setError('');
    setSuccess('');
    setParsing(filesToUpload.length === 1 ? filesToUpload[0].name : `${filesToUpload.length} files`);
    try {
      const result = await getApi().uploadDocuments(filesToUpload);
      setParseProgress(100);
      await loadDocuments(true);
      const failed = result.filter((item) => item.status === 'failed');
      if (failed.length) {
        setError(`Some files failed to load: ${failed.map((item) => item.filename).join(', ')}`);
      } else {
        setSuccess(`${result.length} ${result.length === 1 ? 'document' : 'documents'} uploaded successfully.`);
      }
    } catch (err) {
      setError(`Upload failed (${err.message}).`);
    } finally {
      setTimeout(() => {
        setParsing(null);
        setParseProgress(0);
      }, 250);
    }
  };

  const handleDelete = async (filename) => {
    setError('');
    setSuccess('');
    try {
      const result = await getApi().deleteDocument(filename);
      await loadDocuments(true);
      setSuccess(`Deleted ${result.deleted}.`);
    } catch (err) {
      setError(`Delete failed (${err.message}).`);
    }
  };

  const handleClear = async () => {
    if (!files.length || parsing) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await Promise.all(files.map((file) => getApi().deleteDocument(file.name)));
      await loadDocuments(true);
      setSuccess('Corpus cleared successfully.');
    } catch (err) {
      setError(`Clear failed (${err.message}).`);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onFileChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
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
            <button className="btn ghost" onClick={openFilePicker} disabled={!!parsing}><I name="folder" size={14}/> Browse files</button>
            <button className="btn primary" onClick={() => { setProgress(p => ({...p, upload: 'done'})); setPage('configure'); }} disabled={files.length === 0 || loading || !!parsing}>
              Continue <I name="arrow-right" size={14}/>
            </button>
          </React.Fragment>
        }
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.html,.docx"
        style={{display: 'none'}}
        onChange={onFileChange}
      />

      {error && (
        <div className="card" style={{marginBottom: 16, borderColor: 'rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.08)'}}>
          <div style={{fontSize: 13, color: '#FCA5A5'}}>{error}</div>
        </div>
      )}

      {success && (
        <div className="card" style={{marginBottom: 16, borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)'}}>
          <div style={{fontSize: 13, color: '#86EFAC'}}>{success}</div>
        </div>
      )}

      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={openFilePicker}
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

      {loading && (
        <div className="card" style={{marginTop: 20}}>
          <div className="row gap-3">
            <div className="spin"></div>
            <div>
              <div style={{fontSize: 13.5, fontWeight: 500}}>Loading corpus</div>
              <div className="dim" style={{fontSize: 12, marginTop: 2}}>Fetching uploaded documents from the backend</div>
            </div>
          </div>
        </div>
      )}

      {parsing && (
        <div className="card" style={{marginTop: 20}}>
          <div className="row between" style={{marginBottom: 12}}>
            <div className="row gap-3">
              <div className="spin"></div>
              <div>
                <div style={{fontSize: 13.5, fontWeight: 500}}>Uploading <span className="mono">{parsing}</span></div>
                <div className="dim" style={{fontSize: 12, marginTop: 2}}>Sending files to the API · extracting text · indexing corpus</div>
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
            {loading ? 'Loading documents…' : `${files.length} ${files.length === 1 ? 'document' : 'documents'} · ${fmt(totalChars)} chars · ${fmtSize(totalSize)}`}
          </div>
        </div>
        <div className="row gap-2">
          <span className="badge emerald"><I name="check" size={11}/> All parsed</span>
          <button className="btn ghost" onClick={handleClear} disabled={!files.length || !!parsing || loading}><I name="trash" size={13}/> Clear</button>
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
             <button className="btn ghost" style={{padding: '6px 8px'}} onClick={() => handleDelete(f.name)} disabled={!!parsing || loading}><I name="trash" size={13}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

window.UploadPage = UploadPage;

