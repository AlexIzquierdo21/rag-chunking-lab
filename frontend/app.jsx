/* App root */

const initialFiles = [
  { name: '10k_acme_corp_2024.pdf', ext: 'PDF', size: 4_120_000, chars: 286_412, pages: 124, status: 'parsed' },
  { name: 'product_documentation.md', ext: 'MD', size: 312_000, chars: 84_220, pages: 38, status: 'parsed' },
  { name: 'research_paper.html', ext: 'HTM', size: 142_000, chars: 38_910, pages: 22, status: 'parsed' },
];

const App = () => {
  const [page, setPage] = React.useState('upload');
  const [progress, setProgress] = React.useState({});
  const [files, setFiles] = React.useState(initialFiles);
  const [enabled, setEnabled] = React.useState({
    fixed: true, recursive: true, semantic: true, 'sentence-window': true, late: true,
  });
  const [dataset, setDataset] = React.useState({
    path: '~/datasets/finance_qa_v2.jsonl',
    questions: 240,
  });
  const [runState, setRunState] = React.useState({
    phase: 'idle', current: 0, perStrategy: {}, elapsed: 0,
  });

  const crumbs = {
    upload: ['Experiment 12', 'Upload'],
    configure: ['Experiment 12', 'Configure'],
    evaluate: ['Experiment 12', 'Evaluate'],
    results: ['Experiment 12', 'Results'],
  }[page];

  const topbarActions = (
    <React.Fragment>
      <button className="btn ghost"><I name="search" size={13}/> <span className="kbd">⌘K</span></button>
      <div className="row gap-2" style={{padding: '0 8px'}}>
        <span className="dot live" style={{width: 7, height: 7}}></span>
        <span className="mono dim" style={{fontSize: 11.5}}>cuda:0 · 24GB</span>
      </div>
      <button className="btn"><I name="plus" size={14}/> New experiment</button>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <Sidebar page={page} setPage={setPage} progress={progress}/>
      <main className="main">
        <Topbar crumbs={crumbs} actions={topbarActions}/>
        {page === 'upload' && <UploadPage files={files} setFiles={setFiles} setProgress={setProgress} setPage={setPage}/>}
        {page === 'configure' && <ConfigurePage enabled={enabled} setEnabled={setEnabled} setProgress={setProgress} setPage={setPage} dataset={dataset} setDataset={setDataset}/>}
        {page === 'evaluate' && <EvaluatePage enabled={enabled} files={files} dataset={dataset} setProgress={setProgress} setPage={setPage} runState={runState} setRunState={setRunState}/>}
        {page === 'results' && <ResultsPage/>}
      </main>
    </React.Fragment>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

