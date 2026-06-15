import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';

const CONCOURS_LIST = ['ENAM', 'FASA', 'IDE', 'ENSP', 'ENSPT', 'FMSP', 'ENSPD', 'ENSPY', 'IUT', 'ESSEC', 'IUC', 'UCAC', 'FMSB', 'Sainte Jerome', 'Saint-Jean', 'Autre'];
const EMPTY = {
  prenom: '', nom: '', age: '', dateNaissance: '', ecolesVisees: '',
  concours: [], password: '', commentaire: '',
  paiements: {
    formationTotal: 0, formationPaye: 0,
    dossierTotal: 0, dossierPaye: 0, dossierCommentaire: '',
    cniTotal: 0, cniPaye: 0, cniCommentaire: ''
  }
};

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p = '';
  for (let i = 0; i < 5; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('alpha');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadStudents() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'students'));
    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { loadStudents(); }, []);

  function openNew() { setForm(EMPTY); setEditId(null); setShowForm(true); }

  function openEdit(s) {
    setForm({
      prenom: s.prenom || '',
      nom: s.nom || '',
      age: s.age || '',
      dateNaissance: s.dateNaissance || '',
      ecolesVisees: s.ecolesVisees || '',
      concours: s.concours || [],
      password: s.password || '',
      commentaire: s.commentaire || '',
      paiements: {
        formationTotal: s.paiements?.formationTotal || 0,
        formationPaye: s.paiements?.formationPaye || 0,
        dossierTotal: s.paiements?.dossierTotal || 0,
        dossierPaye: s.paiements?.dossierPaye || 0,
        dossierCommentaire: s.paiements?.dossierCommentaire || '',
        cniTotal: s.paiements?.cniTotal || 0,
        cniPaye: s.paiements?.cniPaye || 0,
        cniCommentaire: s.paiements?.cniCommentaire || ''
      }
    });
    setEditId(s.id);
    setShowForm(true);
  }

  function setField(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function setPaiement(k, v) { setForm(p => ({ ...p, paiements: { ...p.paiements, [k]: typeof v === 'string' && isNaN(v) ? v : (Number(v) || 0) } })); }
  function setPaiementText(k, v) { setForm(p => ({ ...p, paiements: { ...p.paiements, [k]: v } })); }

  function toggleConcours(c) {
    setForm(p => ({
      ...p,
      concours: p.concours.includes(c) ? p.concours.filter(x => x !== c) : [...p.concours, c]
    }));
  }

  async function handleSave() {
    if (!form.prenom || !form.nom || !form.password) return;
    setSaving(true);
    const data = { ...form, updatedAt: serverTimestamp() };
    if (editId) {
      await updateDoc(doc(db, 'students', editId), data);
    } else {
      await addDoc(collection(db, 'students'), { ...data, createdAt: serverTimestamp() });
    }
    setSaving(false);
    setShowForm(false);
    loadStudents();
  }

  async function handleDelete(id) {
    setDeleting(true);
    await deleteDoc(doc(db, 'students', id));
    setDeleting(false);
    setConfirmDelete(null);
    loadStudents();
  }

  let filtered = students.filter(s =>
    `${s.prenom} ${s.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  if (sortMode === 'alpha') {
    filtered = [...filtered].sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, 'fr'));
  } else {
    filtered = [...filtered].sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Rechercher un eleve..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--gray-2)', borderRadius: 'var(--radius)', fontSize: '0.9rem', background: 'var(--white)' }}
        />
        <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 16px', whiteSpace: 'nowrap' }} onClick={openNew}>
          + Inscrire
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setSortMode('alpha')}
          style={{
            padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', border: 'none', cursor: 'pointer',
            background: sortMode === 'alpha' ? 'var(--navy)' : 'var(--gray-1)',
            color: sortMode === 'alpha' ? 'var(--white)' : 'var(--text-main)', fontFamily: 'var(--font-body)', fontWeight: 600
          }}
        >
          A-Z
        </button>
        <button
          onClick={() => setSortMode('recent')}
          style={{
            padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', border: 'none', cursor: 'pointer',
            background: sortMode === 'recent' ? 'var(--navy)' : 'var(--gray-1)',
            color: sortMode === 'recent' ? 'var(--white)' : 'var(--text-main)', fontFamily: 'var(--font-body)', fontWeight: 600
          }}
        >
          Plus recents
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <p>Aucun eleve inscrit</p>
        </div>
      ) : (
        filtered.map(s => (
          <div key={s.id} className="card" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--white)', fontWeight: 700, flexShrink: 0
            }}>
              {(s.prenom || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.prenom} {s.nom}</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                {s.age ? `${s.age} ans` : ''}{s.concours?.length ? ` — ${s.concours.length} concours` : ''}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600, marginTop: 2 }}>
                Code : {s.password}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" style={{ width: 'auto' }} onClick={() => openEdit(s)}>
                Modifier
              </button>
              <button
                className="btn btn-sm"
                style={{ width: 'auto', background: 'var(--error-bg)', color: 'var(--error)', border: 'none' }}
                onClick={() => setConfirmDelete(s)}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxHeight: 'auto' }}>
            <div className="modal-header">
              <span className="modal-title">Confirmer la suppression</span>
              <button className="close-btn" onClick={() => setConfirmDelete(null)}>x</button>
            </div>
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              Supprimer <strong>{confirmDelete.prenom} {confirmDelete.nom}</strong> ? Cette action supprime le profil et les paiements. Les souscriptions (dossiers, CNI) restent dans l'historique.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)} disabled={deleting}>
                {deleting ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Oui, supprimer'}
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal" style={{ maxHeight: '92vh' }}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Modifier eleve' : 'Inscrire un eleve'}</span>
              <button className="close-btn" onClick={() => setShowForm(false)}>x</button>
            </div>

            <div className="two-col">
              <div className="field" style={{ margin: 0 }}>
                <label>Prenom *</label>
                <input value={form.prenom} onChange={e => setField('prenom', e.target.value)} placeholder="Prenom" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Nom *</label>
                <input value={form.nom} onChange={e => setField('nom', e.target.value)} placeholder="Nom" />
              </div>
            </div>

            <div className="two-col" style={{ marginTop: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Age</label>
                <input type="number" value={form.age} onChange={e => setField('age', e.target.value)} placeholder="Age" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Date de naissance</label>
                <input type="date" value={form.dateNaissance} onChange={e => setField('dateNaissance', e.target.value)} />
              </div>
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label>Ecoles visees</label>
              <textarea value={form.ecolesVisees} onChange={e => setField('ecolesVisees', e.target.value)} placeholder="Listez les ecoles..." rows={2} />
            </div>

            <div className="field">
              <label>Concours</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CONCOURS_LIST.map(c => (
                  <button
                    key={c} type="button" onClick={() => toggleConcours(c)}
                    style={{
                      padding: '5px 10px', borderRadius: 16, fontSize: '0.8rem', cursor: 'pointer',
                      background: form.concours.includes(c) ? 'var(--navy)' : 'var(--gray-1)',
                      color: form.concours.includes(c) ? 'var(--white)' : 'var(--text-main)',
                      border: 'none', fontFamily: 'var(--font-body)', fontWeight: 500
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <hr className="divider" />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>
              Suivi des paiements (F CFA)
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--navy)' }}>Formation</div>
              <div className="two-col">
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>Total du</label>
                  <input type="number" value={form.paiements.formationTotal} onChange={e => setPaiement('formationTotal', e.target.value)} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>Deja verse</label>
                  <input type="number" value={form.paiements.formationPaye} onChange={e => setPaiement('formationPaye', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: '#0E6655' }}>Service Dossiers</div>
              <div className="two-col">
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>Total du</label>
                  <input type="number" value={form.paiements.dossierTotal} onChange={e => setPaiement('dossierTotal', e.target.value)} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>Deja verse</label>
                  <input type="number" value={form.paiements.dossierPaye} onChange={e => setPaiement('dossierPaye', e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ marginTop: 6 }}>
                <label style={{ fontSize: '0.75rem' }}>Ecoles / concours concernes (commentaire)</label>
                <textarea
                  value={form.paiements.dossierCommentaire}
                  onChange={e => setPaiementText('dossierCommentaire', e.target.value)}
                  placeholder="Ex: Paiement pour ENAM et FASA. Reste a payer pour IDE..."
                  rows={2}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: '#784212' }}>Service CNI</div>
              <div className="two-col">
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>Total du</label>
                  <input type="number" value={form.paiements.cniTotal} onChange={e => setPaiement('cniTotal', e.target.value)} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>Deja verse</label>
                  <input type="number" value={form.paiements.cniPaye} onChange={e => setPaiement('cniPaye', e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ marginTop: 6 }}>
                <label style={{ fontSize: '0.75rem' }}>Pour qui / quel enfant (commentaire)</label>
                <textarea
                  value={form.paiements.cniCommentaire}
                  onChange={e => setPaiementText('cniCommentaire', e.target.value)}
                  placeholder="Ex: CNI payee pour enfant 1. En attente pour enfant 2..."
                  rows={2}
                />
              </div>
            </div>

            <hr className="divider" />
            <div className="field">
              <label>Mot de passe * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(4-5 caracteres)</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.password} onChange={e => setField('password', e.target.value)} placeholder="Ex: AB3K7" style={{ flex: 1 }} />
                <button type="button" className="btn btn-ghost btn-sm" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={() => setField('password', genPassword())}>
                  Generer
                </button>
              </div>
            </div>

            <div className="field">
              <label>Commentaire general (optionnel)</label>
              <textarea value={form.commentaire} onChange={e => setField('commentaire', e.target.value)} placeholder="Note pour les parents..." rows={2} />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !form.prenom || !form.nom || !form.password}
            >
              {saving ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (editId ? 'Enregistrer' : "Inscrire l'eleve")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
