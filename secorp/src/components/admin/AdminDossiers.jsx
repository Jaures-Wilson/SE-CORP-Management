import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';

function StatusBadge({ status, traite }) {
  if (status === 'rejete') return <span className="badge badge-error">Rejete</span>;
  if (status === 'valide') {
    return traite
      ? <span className="badge badge-success">Valide — Traite</span>
      : <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}>Valide — Non traite</span>;
  }
  return <span className="badge badge-warning">En attente</span>;
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [motif, setMotif] = useState('');
  const [montantPaye, setMontantPaye] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('en_attente');
  const [subTab, setSubTab] = useState('non_traite');

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'dossiers'), orderBy('createdAt', 'desc')));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const toDelete = all.filter(d => {
      if (d.status !== 'rejete') return false;
      const ts = d.updatedAt?.seconds ? d.updatedAt.seconds * 1000 : (d.createdAt?.seconds ? d.createdAt.seconds * 1000 : 0);
      return ts > 0 && ts < oneMonthAgo;
    });
    await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'dossiers', d.id))));
    setDossiers(all.filter(d => !toDelete.find(x => x.id === d.id)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id, action) {
    if (action === 'rejete' && !motif.trim()) return;
    setSaving(true);

    const updates = {
      status: action,
      motifRejet: action === 'rejete' ? motif : null,
      updatedAt: Timestamp.now()
    };

    if (action === 'valide' && selected.studentId) {
      const montant = Number(montantPaye) || 0;
      if (montant > 0) {
        const studentSnap = await getDocs(collection(db, 'students'));
        const studentDoc = studentSnap.docs.find(d => d.id === selected.studentId);
        if (studentDoc) {
          const current = studentDoc.data().paiements || {};
          await updateDoc(doc(db, 'students', selected.studentId), {
            [`paiements.dossierPaye`]: (current.dossierPaye || 0) + montant,
            updatedAt: Timestamp.now()
          });
        }
      }
    }

    await updateDoc(doc(db, 'dossiers', id), updates);
    setSaving(false);
    setSelected(null);
    setMotif('');
    setMontantPaye('');
    load();
  }

  async function toggleTraite(d) {
    await updateDoc(doc(db, 'dossiers', d.id), {
      traite: !d.traite,
      updatedAt: Timestamp.now()
    });
    load();
  }

  const counts = {
    en_attente: dossiers.filter(d => d.status === 'en_attente').length,
    valide: dossiers.filter(d => d.status === 'valide').length,
    rejete: dossiers.filter(d => d.status === 'rejete').length,
  };

  const filtered = tab === 'valide'
    ? dossiers.filter(d => d.status === 'valide' && (subTab === 'traite' ? d.traite : !d.traite))
    : dossiers.filter(d => d.status === tab);

  const validesTraites = dossiers.filter(d => d.status === 'valide' && d.traite).length;
  const validesNonTraites = dossiers.filter(d => d.status === 'valide' && !d.traite).length;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        {[
          { key: 'en_attente', label: 'En attente', color: 'var(--warning)' },
          { key: 'valide', label: 'Valides', color: 'var(--success)' },
          { key: 'rejete', label: 'Rejetes', color: 'var(--error)' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 14px', borderRadius: 20, fontSize: '0.82rem', border: 'none', cursor: 'pointer',
            background: tab === t.key ? t.color : 'var(--gray-1)',
            color: tab === t.key ? 'var(--white)' : 'var(--text-main)',
            fontFamily: 'var(--font-body)', fontWeight: 600, whiteSpace: 'nowrap'
          }}>
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {tab === 'valide' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            { key: 'non_traite', label: `Non traites (${validesNonTraites})`, color: '#1E40AF' },
            { key: 'traite', label: `Traites (${validesTraites})`, color: 'var(--success)' },
          ].map(t => (
            <button key={t.key} onClick={() => setSubTab(t.key)} style={{
              padding: '6px 12px', borderRadius: 16, fontSize: '0.8rem', border: 'none', cursor: 'pointer',
              background: subTab === t.key ? t.color : 'var(--gray-1)',
              color: subTab === t.key ? 'var(--white)' : 'var(--text-main)',
              fontFamily: 'var(--font-body)', fontWeight: 600, whiteSpace: 'nowrap'
            }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">◉</div><p>Aucune demande ici</p></div>
      ) : filtered.map(d => (
        <div key={d.id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>{d.studentNom}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Concours : {d.concours}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{fmtDate(d.createdAt)}</div>
            </div>
            <StatusBadge status={d.status} traite={d.traite} />
          </div>
          {d.status === 'rejete' && d.motifRejet && (
            <div style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: 4 }}>Motif : {d.motifRejet}</div>
          )}
          {d.status === 'en_attente' && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => { setSelected(d); setMotif(''); setMontantPaye(''); }}>
              Examiner
            </button>
          )}
          {d.status === 'valide' && (
            <button
              className="btn btn-sm"
              style={{ marginTop: 6, width: 'auto', background: d.traite ? 'var(--success-bg)' : '#DBEAFE', color: d.traite ? 'var(--success)' : '#1E40AF', border: 'none' }}
              onClick={() => toggleTraite(d)}
            >
              {d.traite ? 'Marquer non traite' : 'Marquer traite'}
            </button>
          )}
        </div>
      ))}

      {selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Dossier — {selected.studentNom}</span>
              <button className="close-btn" onClick={() => setSelected(null)}>x</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Concours : {selected.concours}</div>
              {selected.formData && Object.entries(selected.formData).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            <hr className="divider" />
            <div className="field">
              <label>Montant paye pour ce dossier (F CFA)</label>
              <input
                type="number"
                value={montantPaye}
                onChange={e => setMontantPaye(e.target.value)}
                placeholder="Ex : 40000 — sera ajoute au profil de l'eleve"
              />
            </div>
            <div className="field">
              <label>Motif de rejet (obligatoire si rejet)</label>
              <textarea value={motif} onChange={e => setMotif(e.target.value)} placeholder="Expliquez le motif..." rows={3} />
            </div>
            <div className="alert alert-info" style={{ fontSize: '0.82rem', marginBottom: 12 }}>
              En validant, le montant saisi sera automatiquement ajoute au profil de l'eleve.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success" onClick={() => handleAction(selected.id, 'valide')} disabled={saving}>Valider</button>
              <button className="btn btn-danger" onClick={() => handleAction(selected.id, 'rejete')} disabled={saving || !motif.trim()}>Rejeter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
