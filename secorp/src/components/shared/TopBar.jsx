export default function TopBar({ title, onBack, onLogout, rightContent }) {
  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onBack && (
          <button className="back-btn" onClick={onBack}>&#8592;</button>
        )}
        <div className="topbar-title">
          {!onBack && (
            <div className="topbar-logo">SEC</div>
          )}
          <span>{title}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightContent}
        {onLogout && (
          <button className="logout-btn" onClick={onLogout}>Deconnexion</button>
        )}
      </div>
    </div>
  );
}
