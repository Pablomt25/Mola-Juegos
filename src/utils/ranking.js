import { auth, db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export function getPlayerName(user = auth.currentUser) {
  if (!user) return 'Anónimo';
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split('@')[0];
  return 'Anónimo';
}

export async function saveGameScore(juego, puntos) {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, 'ranking'), {
    userId: user.uid,
    nombre: getPlayerName(user),
    puntos,
    fecha: serverTimestamp(),
    juego,
  });
}
