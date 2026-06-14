import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminCaisse() {
  const [entrees, setEntrees] = useState('');
  const [depenses, setDepenses] = useState('');
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = getTodayKey();

  useEffect(() => {
    async function loadToday() {
      const snap = await getDoc(doc(db, 'caisse', today));
      if (snap.exists()) {
        const d = snap.data();
        setEntrees(d.entrees?.toString() || '');
        setDepenses(d.depenses?.toString() || '');
        setJustification(d.justification || '');
      }
      setLoading(false);
    }
    loadToday();
  }, [today]);

  useEffect(() => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const ms = midnight - new Date();
    const t = setTimeout(() => handleSave(), ms);
    return () => clearTimeout(t);
  }, [entrees, depenses, justification]);

  async function handleSave() {
    setSaving(true);
    await setDoc(doc(db, 'caisse', today), {
      date: today,
      entrees: Number(entrees) || 0,
      depenses: Number(depenses) || 0,
      justification,
      savedAt: serverTimestamp()
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const solde = (Number(entrees) || 0) - (Number(depenses) || 0);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
          Caisse du jour
        </div>
        <div className="text-muted" style={{ fontSize: '0.82rem' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 20 }}>
        <div style={{ color: 'var(--gray-3)', fontSize: '0.8rem', marginBottom: 4 }}>Solde du jour</div>
        <div style={{ color: solde >= 0 ? '#4ADE80' : '#F87171', fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          {solde.toLocaleString('fr-FR')} F CFA
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Entrees (F CFA)</label>
          <input
            type="number"
            value={entrees}
            onChange={e => setEntrees(e.target.value)}
            placeholder="0"
            style={{ fontSize: '1.1rem', fontWeight: 700 }}
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Depenses (F CFA)</label>
          <input
            type="number"
            value={depenses}
            onChange={e => setDepenses(e.target.value)}
            placeholder="0"
            style={{ fontSize: '1.1rem', fontWeight: 700 }}
          />
        </div>
      </div>

      <div className="field">
        <label>Justification des depenses</label>
        <textarea
          value={justification}
          onChange={e => setJustification(e.target.value)}
          placeholder="Decrivez en detail les depenses effectuees dans la journee..."
          rows={5}
        />
      </div>

      <div className="alert alert-info" style={{ fontSize: '0.82rem', marginBottom: 16 }}>
        Pour les reçus et photos de justificatifs, conservez-les dans le dossier <strong>justificatifs/</strong> de votre depot GitHub. La caisse se sauvegarde automatiquement a minuit.
      </div>

      {saved && <div className="alert alert-success" style={{ marginBottom: 12 }}>Sauvegarde effectuee.</div>}

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sauvegarder la caisse'}
      </button>
    </div>
  );
}
