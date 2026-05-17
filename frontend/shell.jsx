/* Sidebar + Topbar */

const Sidebar = ({ page, setPage, progress }) => {
  const items = [
    { id: 'upload', label: 'Upload', icon: 'upload', step: '01' },
    { id: 'configure', label: 'Configure', icon: 'sliders', step: '02' },
    { id: 'evaluate', label: 'Evaluate', icon: 'play', step: '03' },
    { id: 'results', label: 'Results', icon: 'chart', step: '04' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"></div>
        <div>
          <div className="brand-name">RAG Chunking Lab</div>
          <div className="brand-sub">v0.4.2</div>
        </div>
      </div>

      <div className="nav-section-label">Pipeline</div>
      {items.map((item, i) => {
        const status = progress[item.id]; // 'done' | 'active' | undefined
        const isActive = page === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''} ${status === 'done' ? 'complete' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <I name={item.icon} size={15} className="nav-item-icon"/>
            <span>{item.label}</span>
            <span className="step-num">
              {status === 'done' ? <I name="check" size={13}/> : item.step}
            </span>
          </button>
        );
      })}

      <div className="nav-section-label">Workspace</div>
      <button className="nav-item">
        <I name="folder" size={15} className="nav-item-icon"/>
        <span>Experiments</span>
        <span className="step-num">12</span>
      </button>
      <button className="nav-item">
        <I name="database" size={15} className="nav-item-icon"/>
        <span>Datasets</span>
        <span className="step-num">3</span>
      </button>
      <button className="nav-item">
        <I name="settings" size={15} className="nav-item-icon"/>
        <span>Settings</span>
      </button>

      <div className="sidebar-footer">
        <div className="session-card">
          <div className="session-avatar">RL</div>
          <div className="session-info">
            <div className="session-name">research-lab</div>
            <div className="session-meta">free tier · GPU on</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ crumbs, actions }) => (
  <div className="topbar">
    <div className="crumbs">
      <span>RAG Lab</span>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          <span className="sep">/</span>
          <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="topbar-actions">
      {actions}
    </div>
  </div>
);

const PageHeader = ({ eyebrow, title, desc, actions }) => (
  <div className="page-header row between" style={{alignItems: 'flex-end'}}>
    <div>
      <div className="page-eyebrow">{eyebrow}</div>
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">{desc}</p>
    </div>
    {actions && <div className="row gap-2">{actions}</div>}
  </div>
);

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.PageHeader = PageHeader;

