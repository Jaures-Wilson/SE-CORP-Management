import { db } from './firebase';
import {
  doc, getDoc, collection, query, where, getDocs
} from 'firebase/firestore';

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

export async function loginUser(nameInput, password) {
  if (nameInput === ADMIN_NAME && password === ADMIN_PASSWORD) {
    return { role: 'admin' };
  }

  const normalizedInput = normalize(nameInput);

  const studentsRef = collection(db, 'students');
  const snap = await getDocs(studentsRef);

  let matched = null;
  snap.forEach((d) => {
    const data = d.data();
    const normalizedFirst = normalize(data.prenom || '');
    const normalizedLast = normalize(data.nom || '');
    if (
      normalizedFirst === normalizedInput ||
      normalizedLast === normalizedInput
    ) {
      matched = { id: d.id, ...data };
    }
  });

  if (!matched) return null;
  if (matched.password !== password) return null;

  return { role: 'client', student: matched };
}

export function loginSuperAdmin(password) {
  return password === SUPER_ADMIN_PASSWORD;
}
