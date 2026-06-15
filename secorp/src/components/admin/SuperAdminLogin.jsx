import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { loginSuperAdmin } from '../../lib/auth';
import TopBar from '../shared/TopBar';

function StatCard({ label, value, color, sub, isMoney }) {
  return (
    <div style={{
      background: 'var(--white)', borderRadius: 'var(--radius-lg)',
      padding: '14px 12px', boxShadow: 'var(--shadow)', borderTop: `3px solid ${color}`
    }}>
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: isMoney ? '1.1rem' : '1.5rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
        {isMoney ? `${Number(value).toLocaleString('fr-FR')} F` : value}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CaisseTab({ onBack }) {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getDocs(query(collection(db, 'caisse'), orderBy('date', 'desc'))).then(snap => {
      setHistorique(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const totalEntrees = historique.reduce((a, h) => a + (h.entrees || 0), 0);
  const totalDepenses = historique.reduce((a, h) => a + (h.depenses || 0), 0);
  const totalSolde = totalEntrees - totalDepenses;
  const nbJours = historique.length;
  const meilleureJ = historique.reduce((best, h) => {
    const s = (h.entrees || 0) - (h.depenses || 0);
    return s > (best.solde ?? -Infinity) ? { ...h, solde: s } : best;
  }, {});

  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ background: 'var(--navy)', padding: '16px', marginBottom: 16 }}>
        <div style={{ color: 'var(--gray-3)', fontSize: '0.78rem', marginBottom: 4 }}>
          Solde cumule — {nbJours} jour{nbJours !== 1 ? 's' : ''}
        </div>
        <div style={{ color: totalSolde >= 0 ? '#4ADE80' : '#F87171', fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          {totalSolde.toLocaleString('fr-FR')} F CFA
        </div>
        {nbJours > 0 && (
          <div style={{ color: 'var(--gray-3)', fontSize: '0.75rem', marginTop: 4 }}>
            Moyenne entrees / jour : {Math.round(totalEntrees / nbJours).toLocaleString('fr-FR')} F
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <StatCard label="Total entrees" value={totalEntrees} color="var(--success)" isMoney
            sub={`${nbJours} journee(s)`} />
          <StatCard label="Total depenses" value={totalDepenses} color="var(--error)" isMoney
            sub={totalEntrees > 0 ? `Ratio ${Math.round((totalDepenses / totalEntrees) * 100)}%` : ''} />
        </div>

        {meilleureJ.date && (
          <div style={{ background: 'var(--success-bg)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 16, fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 2 }}>Meilleure journee</div>
            <div>{meilleureJ.date} — <strong>{meilleureJ.solde?.toLocaleString('fr-FR')} F</strong></div>
          </div>
        )}

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 12 }}>
          Historique journalier <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(lecture seule)</span>
        </h3>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : historique.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">◎</div><p>Aucun historique</p></div>
        ) : historique.map((h, idx) => {
          const sJ = (h.entrees || 0) - (h.depenses || 0);
          const isOpen = expanded === h.id;
          const cumulE = historique.slice(idx).reduce((a, x) => a + (x.entrees || 0), 0);
          return (
            <div key={h.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius)', marginBottom: 8, boxShadow: 'var(--shadow)', overflow: 'hidden', border: '1px solid var(--gray-1)' }}>
              <button onClick={() => setExpanded(isOpen ? null : h.id)} style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 14px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-body)'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>
                    {new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Entrees : <span style={{ color: 'var(--success)', fontWeight: 600 }}>{(h.entrees || 0).toLocaleString('fr-FR')} F</span>
                    {' '}&nbsp;|&nbsp;{' '}
                    Depenses : <span style={{ color: 'var(--error)', fontWeight: 600 }}>{(h.depenses || 0).toLocaleString('fr-FR')} F</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: sJ >= 0 ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)' }}>
                    {sJ >= 0 ? '+' : ''}{sJ.toLocaleString('fr-FR')} F
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </button>
              {isOpen && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--gray-1)' }}>
                  <div style={{ paddingTop: 10 }}>
                    {h.justification ? (
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 10 }}>{h.justification}</div>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>Aucune justification.</div>
                    )}
                    <div style={{ padding: '8px 10px', background: 'var(--off-white)', borderRadius: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Cumul entrees jusqu'ici : <strong style={{ color: 'var(--text-main)' }}>{cumulE.toLocaleString('fr-FR')} F</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientsTab() {
  const [students, setStudents] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [cnis, setCnis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'dossiers')),
      getDocs(collection(db, 'cni'))
    ]).then(([sSnap, dSnap, cSnap]) => {
      setStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDossiers(dSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCnis(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const totalFormationPaye = students.reduce((a, s) => a + (s.paiements?.formationPaye || 0), 0);
  const totalFormationDu = students.reduce((a, s) => a + (s.paiements?.formationTotal || 0), 0);
  const totalDossierPaye = students.reduce((a, s) => a + (s.paiements?.dossierPaye || 0), 0);
  const totalDossierDu = students.reduce((a, s) => a + (s.paiements?.dossierTotal || 0), 0);
  const totalCniPaye = students.reduce((a, s) => a + (s.paiements?.cniPaye || 0), 0);
  const totalCniDu = students.reduce((a, s) => a + (s.paiements?.cniTotal || 0), 0);
  const totalPaye = totalFormationPaye + totalDossierPaye + totalCniPaye;

  const nbDossiersSouscrit = dossiers.length;
  const nbDossiersValides = dossiers.filter(d => d.status === 'valide').length;
  const nbCniSouscrit = cnis.length;
  const nbCniValidees = cnis.filter(c => c.status === 'valide').length;
  const nbEleves = students.length;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ padding: '0 16px 32px' }}>
      <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 20, marginTop: 4 }}>
        <div style={{ color: 'var(--gray-3)', fontSize: '0.78rem', marginBottom: 4 }}>
          Total encaisse clients — {nbEleves} eleve{nbEleves !== 1 ? 's' : ''}
        </div>
        <div style={{ color: 'var(--gold)', fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          {totalPaye.toLocaleString('fr-FR')} F CFA
        </div>
        <div style={{ color: 'var(--gray-3)', fontSize: '0.75rem', marginTop: 4 }}>
          Total du par les clients : {(totalFormationDu + totalDossierDu + totalCniDu).toLocaleString('fr-FR')} F
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <StatCard label="Formation — verse" value={totalFormationPaye} color="var(--navy)" isMoney
          sub={`Du total : ${totalFormationDu.toLocaleString('fr-FR')} F`} />
        <StatCard label="Dossiers — verse" value={totalDossierPaye} color="#0E6655" isMoney
          sub={`Du total : ${totalDossierDu.toLocaleString('fr-FR')} F`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatCard label="CNI — verse" value={totalCniPaye} color="#784212" isMoney
          sub={`Du total : ${totalCniDu.toLocaleString('fr-FR')} F`} />
        <StatCard label="Eleves inscrits" value={nbEleves} color="var(--gray-3)"
          sub="Sur la plateforme" />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 12 }}>Activite des souscriptions</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <div className="card" style={{ borderTop: '3px solid #0E6655' }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>Dossiers souscrit</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#0E6655' }}>{nbDossiersSouscrit}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>dont {nbDossiersValides} valide{nbDossiersValides !== 1 ? 's' : ''}</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid #784212' }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>CNI demandees</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#784212' }}>{nbCniSouscrit}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>dont {nbCniValidees} validee{nbCniValidees !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 12 }}>Detail par eleve</h3>
      {students
        .sort((a, b) => (b.updatedAt?.seconds || b.createdAt?.seconds || 0) - (a.updatedAt?.seconds || a.createdAt?.seconds || 0))
        .map(s => {
          const totalS = (s.paiements?.formationPaye || 0) + (s.paiements?.dossierPaye || 0) + (s.paiements?.cniPaye || 0);
          return (
            <div key={s.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>{s.prenom} {s.nom}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.concours?.length || 0} concours</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>
                    {totalS.toLocaleString('fr-FR')} F
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>verse total</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[
                  { label: 'Formation', val: s.paiements?.formationPaye, color: 'var(--navy)' },
                  { label: 'Dossiers', val: s.paiements?.dossierPaye, color: '#0E6655' },
                  { label: 'CNI', val: s.paiements?.cniPaye, color: '#784212' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--off-white)', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color, marginTop: 2 }}>
                      {(item.val || 0).toLocaleString('fr-FR')} F
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--off-white)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Ces donnees sont recalculees a chaque ouverture depuis les fiches eleves. Elles se mettent a jour automatiquement lors de toute modification par l'administrateur.
      </div>
    </div>
  );
}

function SuperAdminDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <div className="page">
      <TopBar title="Espace Super Admin" onBack={onBack} />
      <div style={{
        display: 'flex', background: 'var(--white)', borderBottom: '1px solid var(--gray-1)', overflowX: 'auto'
      }}>
        {[
          { id: 'clients', label: 'Vue clients' },
          { id: 'caisse', label: 'Caisse journaliere' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '12px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === t.id ? '2.5px solid var(--navy)' : '2.5px solid transparent',
            color: activeTab === t.id ? 'var(--navy)' : 'var(--text-muted)',
            fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.88rem',
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)'
          }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'caisse' && <CaisseTab onBack={onBack} />}
      </div>
    </div>
  );
}

export default function SuperAdminLogin({ onBack }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [auth, setAuth] = useState(false);

  if (auth) return <SuperAdminDashboard onBack={onBack} />;

  function handleLogin(e) {
    e.preventDefault();
    if (loginSuperAdmin(password)) {
      setAuth(true);
    } else {
      setError('Mot de passe incorrect.');
    }
  }

  return (
    <div className="page">
      <TopBar title="Super Administration" onBack={onBack} />
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', marginBottom: 6 }}>
            Espace comptabilite
          </h2>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
            Acces reserve. Entrez le mot de passe super administrateur.
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe super admin" autoComplete="off" />
            </div>
            <button type="submit" className="btn btn-primary">Acceder a la comptabilite</button>
          </form>
        </div>
      </div>
    </div>
  );
}
