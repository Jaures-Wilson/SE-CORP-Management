import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import {
  collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import TopBar from '../shared/TopBar';

function StatusBadge({ status, traite }) {
  if (status === 'valide') return traite ? <span className="badge badge-success">Valide — Traite</span> : <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}>Valide — En cours de traitement</span>;
  if (status === 'rejete') return <span className="badge badge-error">Rejete</span>;
  return <span className="badge badge-warning">En attente</span>;
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ClientCNI({ student, onBack, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [resubmitId, setResubmitId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [paiements, setPaiements] = useState(null);

  async function loadData() {
    setLoading(true);
    const [cniSnap, configSnap, studentSnap] = await Promise.all([
      getDocs(query(collection(db, 'cni'), where('studentId', '==', student.id))),
      getDoc(doc(db, 'config', 'cniForm')),
      getDoc(doc(db, 'students', student.id))
    ]);
    const sorted = cniSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setDemandes(sorted);
    if (configSnap.exists()) setFormFields(configSnap.data().fields || []);
    if (studentSnap.exists()) setPaiements(studentSnap.data().paiements || null);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [student.id]);

  function openForm(existing = null) {
    if (existing) {
      setFormData(existing.formData || {});
      setResubmitId(existing.id);
    } else {
      setFormData({});
      setResubmitId(null);
    }
    setShowForm(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const payload = {
      studentId: student.id,
      studentNom: `${student.prenom} ${student.nom}`,
      formData,
      status: 'en_attente',
      motifRejet: null,
      createdAt: serverTimestamp()
    };
    if (resubmitId) {
      await updateDoc(doc(db, 'cni', resubmitId), { ...payload, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'cni'), payload);
    }
    setShowForm(false);
    setSubmitting(false);
    loadData();
  }

  return (
    <div className="page">
      <TopBar title="Service CNI" onBack={onBack} onLogout={onLogout} />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 32 }}>

        <div className="alert alert-info" style={{ fontSize: '0.87rem', marginBottom: 16 }}>
          <strong>La CNI est obligatoire pour tout concours.</strong><br />
          Une carte nationale d'identite est exigee pour composer a chaque concours.
        </div>

        <button className="btn btn-ghost" style={{ marginBottom: 16, fontSize: '0.85rem' }} onClick={() => setShowInfo(!showInfo)}>
          {showInfo ? 'Masquer les details' : 'Voir les details et le tarif'}
        </button>

        {showInfo && (
          <div className="card" style={{ marginBottom: 16, fontSize: '0.88rem', lineHeight: 1.7 }}>
            <p><strong>Delai :</strong> La CNI est disponible en une semaine.</p>
            <p style={{ marginTop: 6 }}><strong>Tarif :</strong> 20 000 F CFA (tarif fixe, non negociable).</p>
            <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>Ce service couvre l'ensemble des demarches administratives.</p>
          </div>
        )}

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <>
            {paiements && (paiements.cniTotal > 0 || paiements.cniPaye > 0) && (
              <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid #784212' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, color: '#784212' }}>
                  Paiements CNI enregistres
                </div>
                <div className="two-col" style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>Total du</div>
                    <strong>{(paiements.cniTotal || 0).toLocaleString('fr-FR')} F</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>Deja verse</div>
                    <strong style={{ color: 'var(--success)' }}>{(paiements.cniPaye || 0).toLocaleString('fr-FR')} F</strong>
                  </div>
                </div>
                {paiements.cniCommentaire && (
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', borderTop: '1px solid var(--gray-1)', paddingTop: 8 }}>
                    {paiements.cniCommentaire}
                  </div>
                )}
              </div>
            )}

            {demandes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 12 }}>
                  Mes demandes CNI ({demandes.length})
                </h3>
                {demandes.map(d => (
                  <div key={d.id} className="card" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                          Demande CNI{d.formData?.pourQui ? ` — ${d.formData.pourQui}` : ''}
                        </div>
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
              + Nouvelle demande CNI
            </button>
          </>
        )}

        {showForm && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Demande CNI</span>
                <button className="close-btn" onClick={() => setShowForm(false)}>x</button>
              </div>
              {formFields.length === 0 ? (
                <div className="alert alert-warning">Le formulaire n'est pas encore configure. Contactez l'administration.</div>
              ) : formFields.map(field => (
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
                Votre demande sera validee apres reception du paiement de 20 000 F CFA.
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || formFields.length === 0}>
                {submitting ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Envoyer la demande'}
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
