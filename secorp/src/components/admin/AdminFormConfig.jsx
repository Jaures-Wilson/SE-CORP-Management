import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'tel'];

function FieldEditor({ field, onChange, onDelete }) {
  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={field.label}
          onChange={e => onChange({ ...field, label: e.target.value })}
          placeholder="Libelle du champ"
          style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--gray-2)', borderRadius: 8, fontSize: '0.88rem' }}
        />
        <select
          value={field.type}
          onChange={e => onChange({ ...field, type: e.target.value })}
          style={{ padding: '8px', border: '1.5px solid var(--gray-2)', borderRadius: 8, fontSize: '0.85rem', background: 'var(--white)' }}
        >
          {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={field.placeholder || ''}
          onChange={e => onChange({ ...field, placeholder: e.target.value })}
          placeholder="Texte indicatif (placeholder)"
          style={{ flex: 1, padding: '7px 10px', border: '1.5px solid var(--gray-2)', borderRadius: 8, fontSize: '0.85rem' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={field.required || false}
            onChange={e => onChange({ ...field, required: e.target.checked })}
          />
          Obligatoire
        </label>
        <button
          onClick={onDelete}
          style={{ background: 'var(--error-bg)', color: 'var(--error)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
        >
          Suppr.
        </button>
      </div>
    </div>
  );
}

function FormSection({ configKey, title }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'config', configKey)).then(snap => {
      if (snap.exists()) setFields(snap.data().fields || []);
      setLoading(false);
    });
  }, [configKey]);

  function addField() {
    setFields(p => [...p, { id: `f_${Date.now()}`, label: '', type: 'text', placeholder: '', required: false }]);
  }

  function updateField(id, updated) {
    setFields(p => p.map(f => f.id === id ? updated : f));
  }

  function deleteField(id) {
    setFields(p => p.filter(f => f.id !== id));
  }

  async function save() {
    setSaving(true);
    await setDoc(doc(db, 'config', configKey), { fields });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>{title}</h3>
        <button className="btn btn-ghost btn-sm" style={{ width: 'auto' }} onClick={addField}>
          + Ajouter champ
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
          Aucun champ configure. Cliquez sur "+ Ajouter champ" pour commencer.
        </div>
      ) : (
        fields.map(f => (
          <FieldEditor
            key={f.id}
            field={f}
            onChange={updated => updateField(f.id, updated)}
            onDelete={() => deleteField(f.id)}
          />
        ))
      )}

      {saved && <div className="alert alert-success" style={{ marginTop: 8 }}>Sauvegarde.</div>}

      <button
        className="btn btn-primary"
        onClick={save}
        disabled={saving}
        style={{ marginTop: 12 }}
      >
        {saving ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sauvegarder ce formulaire'}
      </button>
    </div>
  );
}

export default function AdminFormConfig() {
  return (
    <div style={{ padding: 16 }}>
      <div className="alert alert-info" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
        Configurez ici les champs que les parents doivent remplir pour chaque service. Ces champs s'affichent automatiquement dans l'application des parents.
      </div>
      <FormSection configKey="dossierForm" title="Formulaire — Frais de dossier" />
      <hr className="divider" />
      <FormSection configKey="cniForm" title="Formulaire — Service CNI" />
    </div>
  );
}
