import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';

function StatusBadge({ status }) {
  if (status === 'valide') return <span className="badge badge-success">Valide</span>;
  if (status === 'rejete') return <span className="badge badge-error">Rejete</span>;
  return <span className="badge badge-warning">En attente</span>;
}

export default function AdminCNI() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [motif, setMotif] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'cni'), orderBy('createdAt', 'desc')));
    setDemandes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id, action) {
    if (action === 'rejete' && !motif.trim()) return;
    setSaving(true);
    await updateDoc(doc(db, 'cni', id), {
      status: action,
      motifRejet: action === 'rejete' ? motif : null
    });
    setSaving(false);
    setSelected(null);
    setMotif('');
    load();
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 16 }}>
        Demandes CNI
      </h3>

      {demandes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◆</div>
          <p>Aucune demande CNI</p>
        </div>
      ) : demandes.map(d => (
        <div key={d.id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>
                {d.studentNom}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Service CNI</div>
            </div>
            <StatusBadge status={d.status} />
          </div>

          {d.status === 'en_attente' && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => { setSelected(d); setMotif(''); }}>
              Examiner
            </button>
          )}
          {d.status === 'rejete' && d.motifRejet && (
            <div style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: 4 }}>
              Motif : {d.motifRejet}
            </div>
          )}
        </div>
      ))}

      {selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">CNI — {selected.studentNom}</span>
              <button className="close-btn" onClick={() => setSelected(null)}>x</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              {selected.formData && Object.entries(selected.formData).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div className="text-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            <hr className="divider" />

            <div className="field">
              <label>Motif de rejet (obligatoire si rejet)</label>
              <textarea
                value={motif}
                onChange={e => setMotif(e.target.value)}
                placeholder="Expliquez le motif en cas de rejet..."
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-success"
                onClick={() => handleAction(selected.id, 'valide')}
                disabled={saving}
              >
                Valider
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleAction(selected.id, 'rejete')}
                disabled={saving || !motif.trim()}
              >
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
