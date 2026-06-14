import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { loginSuperAdmin } from '../../lib/auth';
import TopBar from '../shared/TopBar';

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 14px',
      boxShadow: 'var(--shadow)',
      borderTop: `3px solid ${color}`
    }}>
      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
        {value.toLocaleString('fr-FR')} F
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SuperAdminDashboard({ onBack }) {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(query(collection(db, 'caisse'), orderBy('date', 'desc')));
      setHistorique(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  const totalEntrees = historique.reduce((acc, h) => acc + (h.entrees || 0), 0);
  const totalDepenses = historique.reduce((acc, h) => acc + (h.depenses || 0), 0);
  const totalSolde = totalEntrees - totalDepenses;
  const nbJours = historique.length;
  const moyenneEntrees = nbJours > 0 ? Math.round(totalEntrees / nbJours) : 0;

  const meilleureJournee = historique.reduce((best, h) => {
    const solde = (h.entrees || 0) - (h.depenses || 0);
    return solde > (best.solde || -Infinity) ? { ...h, solde } : best;
  }, {});

  return (
    <div className="page">
      <TopBar title="Comptabilite globale" onBack={onBack} />
      <div className="container-wide" style={{ paddingTop: 20, paddingBottom: 40 }}>

        <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '18px 16px', marginBottom: 20 }}>
          <div style={{ color: 'var(--gray-3)', fontSize: '0.8rem', marginBottom: 4 }}>
            Solde cumule total — {nbJours} jour{nbJours > 1 ? 's' : ''} enregistre{nbJours > 1 ? 's' : ''}
          </div>
          <div style={{
            color: totalSolde >= 0 ? '#4ADE80' : '#F87171',
            fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.1
          }}>
            {totalSolde.toLocaleString('fr-FR')} F CFA
          </div>
          <div style={{ color: 'var(--gray-3)', fontSize: '0.78rem', marginTop: 6 }}>
            Moyenne entrees / jour : {moyenneEntrees.toLocaleString('fr-FR')} F
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <StatCard
            label="Total entrees"
            value={totalEntrees}
            color="var(--success)"
            sub={`${nbJours} journee(s)`}
          />
          <StatCard
            label="Total depenses"
            value={totalDepenses}
            color="var(--error)"
            sub={`Ratio : ${totalEntrees > 0 ? Math.round((totalDepenses / totalEntrees) * 100) : 0}%`}
          />
        </div>

        {meilleureJournee.date && (
          <div style={{
            background: 'var(--success-bg)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            marginBottom: 20,
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 2 }}>Meilleure journee</div>
            <div style={{ color: 'var(--text-main)' }}>
              {meilleureJournee.date} — Solde de <strong>{meilleureJournee.solde?.toLocaleString('fr-FR')} F</strong>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
            Historique detaille
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Lecture seule
          </span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : historique.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p>Aucun historique disponible</p>
            <p style={{ fontSize: '0.82rem', marginTop: 6 }}>Les donnees apparaissent des que l'administrateur enregistre une journee.</p>
          </div>
        ) : historique.map((h, idx) => {
          const soldeJ = (h.entrees || 0) - (h.depenses || 0);
          const isOpen = expanded === h.id;
          const cumulEntrees = historique.slice(idx).reduce((a, x) => a + (x.entrees || 0), 0);

          return (
            <div key={h.id} style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius)',
              marginBottom: 8,
              boxShadow: 'var(--shadow)',
              overflow: 'hidden',
              border: '1px solid var(--gray-1)'
            }}>
              <button
                onClick={() => setExpanded(isOpen ? null : h.id)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 16px', textAlign: 'left', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  fontFamily: 'var(--font-body)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                    {new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Entrees : <span style={{ color: 'var(--success)', fontWeight: 600 }}>{(h.entrees || 0).toLocaleString('fr-FR')} F</span>
                    {' '}&nbsp;|&nbsp;{' '}
                    Depenses : <span style={{ color: 'var(--error)', fontWeight: 600 }}>{(h.depenses || 0).toLocaleString('fr-FR')} F</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontWeight: 800, fontSize: '0.95rem',
                    color: soldeJ >= 0 ? 'var(--success)' : 'var(--error)',
                    fontFamily: 'var(--font-display)'
                  }}>
                    {soldeJ >= 0 ? '+' : ''}{soldeJ.toLocaleString('fr-FR')} F
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isOpen ? '▲' : '▼'}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--gray-1)' }}>
                  <div style={{ paddingTop: 12 }}>
                    {h.justification ? (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                          Justification des depenses
                        </div>
                        <div style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>{h.justification}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                        Aucune justification renseignee.
                      </div>
                    )}


                    <div style={{
                      marginTop: 12, padding: '10px 12px',
                      background: 'var(--off-white)', borderRadius: 8,
                      fontSize: '0.8rem', color: 'var(--text-muted)'
                    }}>
                      Cumul entrees jusqu'a ce jour : <strong style={{ color: 'var(--text-main)' }}>
                        {cumulEntrees.toLocaleString('fr-FR')} F
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div style={{
          marginTop: 24, padding: '14px 16px',
          background: 'var(--navy)', borderRadius: 'var(--radius)',
          fontSize: '0.82rem', color: 'var(--gray-3)'
        }}>
          Acces en lecture seule. Les donnees sont enregistrees automatiquement par l'administrateur chaque soir. Aucune modification n'est possible depuis cet espace.
        </div>
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
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe super admin"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Acceder a la comptabilite
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
