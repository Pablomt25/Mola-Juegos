import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { emitEvent } from './events.js';
import { checkAndUnlockAchievements } from './logros.js';

function gameSlug(juego) {
  return juego.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_áéíóúñ]/gi, '');
}

export async function getPlayerName(user = auth.currentUser) {
  if (!user) return 'Anónimo';
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    if (userDoc.exists() && userDoc.data().nombre) {
      return userDoc.data().nombre;
    }
  } catch (e) {}
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split('@')[0];
  return 'Anónimo';
}

export async function ensureUserDocument() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, 'usuarios', user.uid);
  try {
    const existing = await getDoc(userRef);
    const nombre = user.displayName || (user.email ? user.email.split('@')[0] : 'Anónimo');
    const email = user.email || '';

    if (!existing.exists()) {
      await setDoc(userRef, {
        nombre,
        email,
        foto: user.photoURL || '',
        fechaRegistro: serverTimestamp(),
        ultimaConexion: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        nombre,
        email,
        foto: user.photoURL || '',
        ultimaConexion: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error al sincronizar documento de usuario:', error);
  }
}

export async function saveGameScore(juego, puntos, extraContext) {
  const user = auth.currentUser;
  if (!user) return;

  const slug = gameSlug(juego);
  const docId = `${user.uid}_${slug}`;
  const docRef = doc(db, 'ranking', docId);

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      const data = existing.data();
      await updateDoc(docRef, {
        puntos: Math.max(data.puntos || 0, puntos),
        totalPuntos: (data.totalPuntos || 0) + puntos,
        partidas: (data.partidas || 0) + 1,
        nombre: await getPlayerName(user),
        ultimaVez: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        userId: user.uid,
        nombre: await getPlayerName(user),
        juego,
        puntos,
        totalPuntos: puntos,
        partidas: 1,
        ultimaVez: serverTimestamp(),
      });
    }

    const context = { ...(extraContext || {}) };
    const unlocked = await checkAndUnlockAchievements(context);
    if (unlocked.length > 0) {
      emitEvent('achievements-unlocked', unlocked);
    }
  } catch (error) {
    console.error('Error al guardar puntuación:', error);
  }
}

export { gameSlug };