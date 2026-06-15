import { useState } from 'react';
import TopBar from '../shared/TopBar';
import ClientProfile from './ClientProfile';
import ClientFormation from './ClientFormation';
import ClientDossiers from './ClientDossiers';
import ClientCNI from './ClientCNI';

const SECTIONS = [
  {
    id: 'profil',
    label: 'Voir le profil',
    desc: 'Informations personnelles et concours',
    color: 'var(--navy)',
    icon: '◈'
  },
  {
    id: 'formation',
    label: 'Prix de la formation',
    desc: 'Suivi des paiements de formation',
    color: '#1A5276',
    icon: '◎'
  },
  {
    id: 'dossiers',
    label: 'Service dossier',
    desc: 'Inscription aux concours par SEC',
    color: '#0E6655',
    icon: '◉'
  },
  {
    id: 'cni',
    label: 'Service CNI',
    desc: 'Obtention de la carte nationale d\'identite',
    color: '#784212',
    icon: '◆'
  }
];

export default function ClientDashboard({ student, onLogout }) {
  const [section, setSection] = useState(null);

  if (section === 'profil') {
    return <ClientProfile student={student} onBack={() => setSection(null)} onLogout={onLogout} />;
  }
  if (section === 'formation') {
    return <ClientFormation student={student} onBack={() => setSection(null)} onLogout={onLogout} />;
  }
  if (section === 'dossiers') {
    return <ClientDossiers student={student} onBack={() => setSection(null)} onLogout={onLogout} />;
  }
  if (section === 'cni') {
    return <ClientCNI student={student} onBack={() => setSection(null)} onLogout={onLogout} />;
  }

  return (
    <div className="page">
      <TopBar
        title="S.E. Corporation"
        onLogout={onLogout}
      />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)' }}>
            Bienvenue, {student.prenom}
          </h2>
          <p className="text-muted" style={{ marginTop: 4, fontSize: '0.88rem' }}>
            Choisissez un service ci-dessous
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{
                background: 'var(--white)',
                border: '1.5px solid var(--gray-1)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: 'var(--shadow)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={e => e.currentTarget.style.transform = ''}
            >
              <div style={{
                width: 48, height: 48,
                background: s.color,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
                color: 'var(--white)',
                flexShrink: 0
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.desc}
                </div>
              </div>
              <span style={{ color: 'var(--gray-3)', fontSize: '1rem' }}>&#8594;</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '14px 16px', background: 'var(--navy)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'var(--white)', fontSize: '0.85rem', fontWeight: 600 }}>Besoin d'aide ?</div>
            <div style={{ color: 'var(--gray-3)', fontSize: '0.78rem' }}>Contactez l'administration</div>
          </div>
          <a
            href="https://wa.me/237655230364"
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
