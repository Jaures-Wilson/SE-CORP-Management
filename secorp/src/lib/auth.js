import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const ADMIN_NAME = 'SECORP_ADMIN';
const ADMIN_PASSWORD = 'SEC@2024!Admin';
const SUPER_ADMIN_PASSWORD = 'SUP3R#SEC0rp!2024';

export { ADMIN_PASSWORD, SUPER_ADMIN_PASSWORD };

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function extractTokens(input) {
  return input.trim().split(/\s+/).filter(Boolean).map(normalize);
}

export async function loginUser(nameInput, password) {
  if (nameInput.trim() === ADMIN_NAME && password === ADMIN_PASSWORD) {
    return { role: 'admin' };
  }

  const tokens = extractTokens(nameInput);
  if (tokens.length === 0) return null;

  const snap = await getDocs(collection(db, 'students'));
  const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  function matchStudent(token) {
    return students.find(s => {
      const prenomTokens = extractTokens(s.prenom || '');
      const nomTokens = extractTokens(s.nom || '');
      return prenomTokens.includes(token) || nomTokens.includes(token);
    });
  }

  let matched = matchStudent(tokens[0]);

  if (!matched && tokens.length > 1) {
    for (let i = 1; i < tokens.length; i++) {
      matched = matchStudent(tokens[i]);
      if (matched) break;
    }
  }

  if (!matched) return null;
  if (matched.password !== password) return null;

  return { role: 'client', student: matched };
}

export function loginSuperAdmin(password) {
  return password === SUPER_ADMIN_PASSWORD;
}
