import { useState } from 'react';
import { loginUser } from '../../lib/auth';

export default function LoginPage({ onLogin }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(name.trim(), password);
      if (!result) {
        setError('Nom ou mot de passe incorrect.');
      } else {
        onLogin(result);
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ background: 'var(--navy)', justifyContent: 'center', alignItems: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64,
            background: 'var(--gold)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--navy)',
            fontFamily: 'var(--font-display)'
          }}>
            SEC
          </div>
          <h1 style={{ color: 'var(--white)', fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
            S.E. Corporation
          </h1>
          <p style={{ color: 'var(--gray-3)', fontSize: '0.9rem', marginTop: 6 }}>
            Prepa Concours — Makepe, Douala
          </p>
        </div>

        <div className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', marginBottom: 20 }}>
            Connexion
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Nom de l'enfant</label>
              <input
                type="text"
                placeholder="Entrez un seul prenom ou nom"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label>Mot de passe</label>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Se connecter'}
            </button>
          </form>

          <div className="divider" />
          <p className="text-muted text-center" style={{ fontSize: '0.8rem' }}>
            Probleme de connexion ? Contactez l'administration<br />
            <strong>655 230 364</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
