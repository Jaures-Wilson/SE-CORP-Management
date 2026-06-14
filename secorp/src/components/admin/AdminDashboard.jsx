import { useState } from 'react';
import TopBar from '../shared/TopBar';
import AdminStudents from './AdminStudents';
import AdminDossiers from './AdminDossiers';
import AdminCNI from './AdminCNI';
import AdminCaisse from './AdminCaisse';
import AdminFormConfig from './AdminFormConfig';
import SuperAdminLogin from './SuperAdminLogin';

const TABS = [
  { id: 'eleves', label: 'Eleves' },
  { id: 'dossiers', label: 'Dossiers' },
  { id: 'cni', label: 'CNI' },
  { id: 'caisse', label: 'Caisse' },
  { id: 'config', label: 'Formulaires' },
];

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState('eleves');
  const [superAdmin, setSuperAdmin] = useState(false);

  if (superAdmin) {
    return <SuperAdminLogin onBack={() => setSuperAdmin(false)} />;
  }

  return (
    <div className="page">
      <TopBar
        title="Administration"
        onLogout={onLogout}
        rightContent={
          <button
            onClick={() => setSuperAdmin(true)}
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
              border: 'none',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Super Admin
          </button>
        }
      />

      <div style={{
        display: 'flex',
        overflowX: 'auto',
        background: 'var(--white)',
        borderBottom: '1px solid var(--gray-1)',
        padding: '0 4px',
        gap: 2,
        scrollbarWidth: 'none'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2.5px solid var(--navy)' : '2.5px solid transparent',
              color: tab === t.id ? 'var(--navy)' : 'var(--text-muted)',
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'eleves' && <AdminStudents />}
        {tab === 'dossiers' && <AdminDossiers />}
        {tab === 'cni' && <AdminCNI />}
        {tab === 'caisse' && <AdminCaisse />}
        {tab === 'config' && <AdminFormConfig />}
      </div>
    </div>
  );
}
