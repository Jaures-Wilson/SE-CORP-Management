import TopBar from '../shared/TopBar';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-1)' }}>
      <div className="text-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{value}</div>
    </div>
  );
}

export default function ClientProfile({ student, onBack, onLogout }) {
  const concours = Array.isArray(student.concours) ? student.concours.join(', ') : (student.concours || '');

  return (
    <div className="page">
      <TopBar title="Profil" onBack={onBack} onLogout={onLogout} />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56,
              background: 'var(--navy)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--white)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.3rem'
            }}>
              {(student.prenom || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
                {student.prenom} {student.nom}
              </div>
              <div className="text-muted" style={{ fontSize: '0.82rem' }}>Eleve inscrit</div>
            </div>
          </div>

          <Row label="Prenom" value={student.prenom} />
          <Row label="Nom" value={student.nom} />
          <Row label="Age" value={student.age ? `${student.age} ans` : ''} />
          <Row label="Date de naissance" value={student.dateNaissance} />
          <Row label="Ecoles visees" value={student.ecolesVisees} />
          <Row label="Concours" value={concours} />
          {student.commentaire && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--gold-pale)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: 'var(--warning)' }}>
                NOTE DE L'ADMINISTRATION
              </div>
              <div style={{ fontSize: '0.9rem' }}>{student.commentaire}</div>
            </div>
          )}
        </div>

        <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
          Les informations du profil sont gereees par l'administration. Pour toute modification, contactez-nous.
        </div>

        <a
          href="https://wa.me/237655230364"
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          style={{ textDecoration: 'none', marginTop: 8 }}
        >
          Contacter l'administration
        </a>
      </div>
    </div>
  );
}
