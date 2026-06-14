import { useState, useEffect } from 'react';
import './styles/global.css';
import LoginPage from './components/auth/LoginPage';
import AdminDashboard from './components/admin/AdminDashboard';
import ClientDashboard from './components/client/ClientDashboard';

const SESSION_KEY = 'secorp_session';

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setSession(JSON.parse(stored));
    } catch (_) {}
    setReady(true);
  }, []);

  function handleLogin(result) {
    setSession(result);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
    } catch (_) {}
  }

  function handleLogout() {
    setSession(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  if (!ready) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--gold)' }} />
      </div>
    );
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;
  if (session.role === 'admin') return <AdminDashboard onLogout={handleLogout} />;
  if (session.role === 'client') return <ClientDashboard student={session.student} onLogout={handleLogout} />;

  return <LoginPage onLogin={handleLogin} />;
}
