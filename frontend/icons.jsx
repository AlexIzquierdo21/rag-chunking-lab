/* Inline SVG icon set — geometric, 1.5px stroke */
const I = ({ name, size = 16, className = '', style }) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    style,
  };
  switch (name) {
    case 'upload': return (
      <svg {...props}><path d="M12 16V4M12 4l-5 5M12 4l5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
    );
    case 'sliders': return (
      <svg {...props}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>
    );
    case 'play': return (
      <svg {...props}><path d="M7 5v14l12-7-12-7z" fill="currentColor"/></svg>
    );
    case 'chart': return (
      <svg {...props}><path d="M4 20V10M10 20V4M16 20v-6M22 20H2"/></svg>
    );
    case 'doc': return (
      <svg {...props}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>
    );
    case 'check': return (
      <svg {...props}><path d="M5 12l5 5L20 7"/></svg>
    );
    case 'check-circle': return (
      <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
    );
    case 'arrow-right': return (
      <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    );
    case 'arrow-up': return (
      <svg {...props}><path d="M7 14l5-5 5 5"/></svg>
    );
    case 'arrow-down': return (
      <svg {...props}><path d="M7 10l5 5 5-5"/></svg>
    );
    case 'plus': return (
      <svg {...props}><path d="M12 5v14M5 12h14"/></svg>
    );
    case 'x': return (
      <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>
    );
    case 'folder': return (
      <svg {...props}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    );
    case 'database': return (
      <svg {...props}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>
    );
    case 'clock': return (
      <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    );
    case 'sparkles': return (
      <svg {...props}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>
    );
    case 'target': return (
      <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
    );
    case 'zap': return (
      <svg {...props}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>
    );
    case 'search': return (
      <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    );
    case 'filter': return (
      <svg {...props}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>
    );
    case 'download': return (
      <svg {...props}><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>
    );
    case 'settings': return (
      <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
    );
    case 'trash': return (
      <svg {...props}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
    );
    case 'cpu': return (
      <svg {...props}><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>
    );
    case 'gauge': return (
      <svg {...props}><path d="M12 14l4-4"/><path d="M3.5 16a9 9 0 1 1 17 0"/></svg>
    );
    case 'hash': return (
      <svg {...props}><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18"/></svg>
    );
    case 'file-text': return (
      <svg {...props}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>
    );
    case 'medal-1': return (
      <span style={{fontSize: 16, lineHeight: 1}}>🥇</span>
    );
    case 'medal-2': return (
      <span style={{fontSize: 16, lineHeight: 1}}>🥈</span>
    );
    case 'medal-3': return (
      <span style={{fontSize: 16, lineHeight: 1}}>🥉</span>
    );
    default: return null;
  }
};

window.I = I;

