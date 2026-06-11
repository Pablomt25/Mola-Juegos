import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export async function toggleFavorite(gameId) {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const favRef = doc(db, 'favoritos', `${user.uid}_${gameId}`);
    const existing = await getDoc(favRef);

    if (existing.exists()) {
      await deleteDoc(favRef);
      return false;
    } else {
      await setDoc(favRef, {
        userId: user.uid,
        gameId,
        fecha: new Date(),
      });
      return true;
    }
  } catch (error) {
    console.error('Error en toggleFavorite:', error);
    return false;
  }
}

export async function isFavorite(gameId) {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const favRef = doc(db, 'favoritos', `${user.uid}_${gameId}`);
    const existing = await getDoc(favRef);
    return existing.exists();
  } catch (error) {
    console.error('Error en isFavorite:', error);
    return false;
  }
}

export async function getUserFavorites() {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, 'favoritos'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().gameId);
  } catch (error) {
    console.error('Error en getUserFavorites:', error);
    return [];
  }
}

export function onFavoritesChange(callback) {
  const user = auth.currentUser;
  if (!user) return () => {};

  try {
    const q = query(collection(db, 'favoritos'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs = snapshot.docs.map(doc => doc.data().gameId);
      callback(favs);
    }, (error) => {
      console.error('Error en onFavoritesChange:', error);
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error en onFavoritesChange:', error);
    return () => {};
  }
}