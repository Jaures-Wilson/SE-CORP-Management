import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import TopBar from '../shared/TopBar';

function PaymentRow({ label, total, paye, couleur }) {
  const restant = Math.max(0, (total || 0) - (paye || 0));
  const pct = total > 0 ? Math.min(100, Math.round(((paye || 0) / total) * 100)) : 0;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ padding: '10px', background: 'var(--off-white)', borderRadius: 8 }}>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>
            {(total || 0).toLocaleString('fr-FR')} F
          </div>
        </div>
        <div style={{ padding: '10px', background: 'var(--success-bg)', borderRadius: 8 }}>
          <div style={{ color: 'var(--success)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Deja verse</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2, color: 'var(--success)' }}>
            {(paye || 0).toLocaleString('fr-FR')} F
          </div>
        </div>
      </div>
      <div style={{ background: 'var(--gray-1)', borderRadius: 6, height: 8, marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: couleur || 'var(--navy)', borderRadius: 6, transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{pct}% regle</span>
        {restant > 0 ? (
          <span style={{ color: 'var(--error)', fontWeight: 600 }}>
            Reste : {restant.toLocaleString('fr-FR')} F
          </span>
        ) : (
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Solde</span>
        )}
      </div>
    </div>
  );
}

export default function ClientFormation({ student, onBack, onLogout }) {
  const [paiements, setPaiements] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'students', student.id)).then(d => {
      if (d.exists()) setPaiements(d.data().paiements || {});
      setLoading(false);
    });
  }, [student.id]);

  return (
    <div className="page">
      <TopBar title="Prix de la formation" onBack={onBack} onLogout={onLogout} />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div className="alert alert-info" style={{ marginBottom: 20, fontSize: '0.88rem' }}>
          Ci-dessous le detail de vos paiements. Seule l'administration peut mettre a jour ces informations.
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : paiements ? (
          <>
            <PaymentRow
              label="Formation"
              total={paiements.formationTotal}
              paye={paiements.formationPaye}
              couleur="var(--navy)"
            />
            <PaymentRow
              label="Frais de dossier"
              total={paiements.dossierTotal}
              paye={paiements.dossierPaye}
              couleur="#0E6655"
            />
            <PaymentRow
              label="CNI"
              total={paiements.cniTotal}
              paye={paiements.cniPaye}
              couleur="#784212"
            />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p>Aucune information de paiement disponible.</p>
          </div>
        )}

        <div className="divider" />
        <a
          href="https://wa.me/237655230364"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline"
          style={{ textDecoration: 'none' }}
        >
          Contacter l'administration
        </a>
      </div>
    </div>
  );
}
