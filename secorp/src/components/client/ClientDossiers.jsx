import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import {
  collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import TopBar from '../shared/TopBar';

function StatusBadge({ status, traite }) {
  if (status === 'valide') return traite ? <span className="badge badge-success">Valide — Traite</span> : <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}>Valide — En cours de traitement</span>;
  if (status === 'rejete') return <span className="badge badge-error">Rejete</span>;
  return <span className="badge badge-warning">En attente de validation</span>;
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ClientDossiers({ student, onBack, onLogout }) {
  const [dossiers, setDossiers] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [concours, setConcours] = useState('');
  const [resubmitId, setResubmitId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [paiements, setPaiements] = useState(null);

  async function loadData() {
    setLoading(true);
    const [dosSnap, configSnap, studentSnap] = await Promise.all([
      getDocs(query(collection(db, 'dossiers'), where('studentId', '==', student.id))),
      getDoc(doc(db, 'config', 'dossierForm')),
      getDoc(doc(db, 'students', student.id))
    ]);
    const sorted = dosSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setDossiers(sorted);
    if (configSnap.exists()) setFormFields(configSnap.data().fields || []);
    if (studentSnap.exists()) setPaiements(studentSnap.data().paiements || null);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [student.id]);

  function openForm(existing = null) {
    if (existing) {
      setFormData(existing.formData || {});
      setConcours(existing.concours || '');
      setResubmitId(existing.id);
    } else {
      setFormData({});
      setConcours('');
      setResubmitId(null);
    }
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!concours.trim()) return;
    setSubmitting(true);
    const payload = {
      studentId: student.id,
      studentNom: `${student.prenom} ${student.nom}`,
      concours,
      formData,
      status: 'en_attente',
      motifRejet: null,
      createdAt: serverTimestamp()
    };
    if (resubmitId) {
      await updateDoc(doc(db, 'dossiers', resubmitId), { ...payload, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'dossiers'), payload);
    }
    setShowForm(false);
    setSubmitting(false);
    loadData();
  }

  return (
    <div className="page">
      <TopBar title="Frais de dossier" onBack={onBack} onLogout={onLogout} />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 32 }}>

        <div className="alert alert-info" style={{ fontSize: '0.87rem', marginBottom: 16 }}>
          <strong>Information importante</strong><br />
          La formation preparatoire ne couvre pas les frais d'inscription au concours. La S.E. Corporation peut prendre en charge toutes les demarches d'inscription en votre nom.
        </div>

        <button className="btn btn-ghost" style={{ marginBottom: 16, fontSize: '0.85rem' }} onClick={() => setShowInfo(!showInfo)}>
          {showInfo ? 'Masquer les details' : 'Voir les tarifs et details'}
        </button>

        {showInfo && (
          <div className="card" style={{ marginBottom: 16, fontSize: '0.88rem', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>Les frais comprennent : acte de naissance, timbres fiscaux, timbres communaux, depot bancaire aupres de l'Etat.</p>
            <p><strong>Tarif S.E. Corporation :</strong></p>
            <ul style={{ paddingLeft: 16, marginTop: 4 }}>
              <li>Tous concours : <strong>40 000 F CFA</strong></li>
              <li>Ecoles avec casier judiciaire (IDE, Ecole des Travaux...) : <strong>45 000 F CFA</strong></li>
            </ul>
          </div>
        )}

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <>
            {paiements && (paiements.dossierTotal > 0 || paiements.dossierPaye > 0) && (
              <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid #0E6655' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, color: '#0E6655' }}>
                  Paiements dossiers enregistres
                </div>
                <div className="two-col" style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>Total du</div>
                    <strong>{(paiements.dossierTotal || 0).toLocaleString('fr-FR')} F</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>Deja verse</div>
                    <strong style={{ color: 'var(--success)' }}>{(paiements.dossierPaye || 0).toLocaleString('fr-FR')} F</strong>
                  </div>
                </div>
                {paiements.dossierCommentaire && (
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', borderTop: '1px solid var(--gray-1)', paddingTop: 8 }}>
                    {paiements.dossierCommentaire}
                  </div>
                )}
              </div>
            )}

            {dossiers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 12 }}>
                  Mes souscriptions ({dossiers.length})
                </h3>
                {dossiers.map(d => (
                  <div key={d.id} className="card" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{d.concours}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{fmtDate(d.createdAt)}</div>
                      </div>
                      <StatusBadge status={d.status} traite={d.traite} />
                    </div>
                    {d.status === 'rejete' && d.motifRejet && (
                      <div className="alert alert-error" style={{ fontSize: '0.83rem', marginTop: 8 }}>
                        <strong>Motif du rejet :</strong> {d.motifRejet}
                      </div>
                    )}
                    {d.status === 'rejete' && (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => openForm(d)}>
                        Modifier et renvoyer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-primary" onClick={() => openForm()}>
              + Ajouter un concours
            </button>
          </>
        )}

        {showForm && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Souscrire — service dossier</span>
                <button className="close-btn" onClick={() => setShowForm(false)}>x</button>
              </div>
              <div className="field">
                <label style={{ fontWeight: 700 }}>Concours vise (obligatoire)</label>
                <input type="text" placeholder="Ex : ENAM, FASA, IDE..." value={concours} onChange={e => setConcours(e.target.value)} />
              </div>
              {formFields.map(field => (
                <div className="field" key={field.id}>
                  <label>{field.label}{field.required && ' *'}</label>
                  {field.type === 'textarea' ? (
                    <textarea placeholder={field.placeholder || ''} value={formData[field.id] || ''} onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))} />
                  ) : (
                    <input type={field.type || 'text'} placeholder={field.placeholder || ''} value={formData[field.id] || ''} onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))} />
                  )}
                </div>
              ))}
              <div className="alert alert-warning" style={{ fontSize: '0.83rem' }}>
                Votre souscription sera examinee par l'administration avant validation.
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !concours.trim()}>
                {submitting ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "Valider l'inscription"}
              </button>
            </div>
          </div>
        )}

        <div className="divider" />
        <a href="https://wa.me/237655230364" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ textDecoration: 'none', marginTop: 8 }}>
          Contacter l'administration
        </a>
      </div>
    </div>
  );
}
