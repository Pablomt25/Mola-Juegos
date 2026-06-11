import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';

const ACHIEVEMENTS = {
  primera_partida: {
    id: 'primera_partida',
    nombre: 'Primera Partida',
    descripcion: 'Juega tu primera partida',
    icono: 'fa-star',
  },
  cinquenta_partidas: {
    id: 'cinquenta_partidas',
    nombre: 'Veterano',
    descripcion: 'Juega 50 partidas en total',
    icono: 'fa-trophy',
  },
  cien_partidas: {
    id: 'cien_partidas',
    nombre: 'Adicto',
    descripcion: 'Juega 100 partidas en total',
    icono: 'fa-medal',
  },
  explorador: {
    id: 'explorador',
    nombre: 'Explorador',
    descripcion: 'Juega al menos 5 juegos distintos',
    icono: 'fa-compass',
  },
  maestro: {
    id: 'maestro',
    nombre: 'Maestro',
    descripcion: 'Juega al menos 10 juegos distintos',
    icono: 'fa-crown',
  },
  puntuacion_100: {
    id: 'puntuacion_100',
    nombre: 'Triple Digits',
    descripcion: 'Consigue 100+ puntos en un juego',
    icono: 'fa-fire',
  },
  puntuacion_500: {
    id: 'puntuacion_500',
    nombre: 'Puntuador Pro',
    descripcion: 'Consigue 500+ puntos en un juego',
    icono: 'fa-bolt',
  },
  tres_raya_ganar: {
    id: 'tres_raya_ganar',
    nombre: 'Estratega',
    descripcion: 'Gana una partida de 3 en Raya',
    icono: 'fa-chess',
  },
  favorito: {
    id: 'favorito',
    nombre: 'Fan',
    descripcion: 'Añade tu primer juego a favoritos',
    icono: 'fa-heart',
  },
  chat_msg: {
    id: 'chat_msg',
    nombre: 'Sociable',
    descripcion: 'Envía tu primer mensaje en el chat',
    icono: 'fa-comment',
  },
};

export function getAchievementDefs() {
  return Object.values(ACHIEVEMENTS);
}

export async function checkAndUnlockAchievements(context) {
  const user = auth.currentUser;
  if (!user) return [];

  const newlyUnlocked = [];

  try {
    const rankingQ = query(collection(db, 'ranking'), where('userId', '==', user.uid));
    const rankingSnap = await getDocs(rankingQ);

    let totalPartidas = 0;
    let juegosDistintos = new Set();
    let maxPuntuacion = 0;

    rankingSnap.forEach(doc => {
      const data = doc.data();
      totalPartidas += data.partidas || 0;
      if (data.juego) juegosDistintos.add(data.juego);
      if ((data.puntos || 0) > maxPuntuacion) maxPuntuacion = data.puntos;
    });

    const checks = {
      primera_partida: totalPartidas >= 1,
      cinquenta_partidas: totalPartidas >= 50,
      cien_partidas: totalPartidas >= 100,
      explorador: juegosDistintos.size >= 5,
      maestro: juegosDistintos.size >= 10,
      puntuacion_100: maxPuntuacion >= 100,
      puntuacion_500: maxPuntuacion >= 500,
    };

    if (context) {
      if (context.wonTresEnRaya) checks.tres_raya_ganar = true;
      if (context.addedFavorite) checks.favorito = true;
      if (context.sentChat) checks.chat_msg = true;
    }

    for (const [achievementId, condition] of Object.entries(checks)) {
      if (condition) {
        const unlocked = await tryUnlock(achievementId);
        if (unlocked) newlyUnlocked.push(ACHIEVEMENTS[achievementId]);
      }
    }
  } catch (error) {
    console.error('Error al verificar logros:', error);
  }

  return newlyUnlocked;
}

async function tryUnlock(achievementId) {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const logroRef = doc(db, 'logros', `${user.uid}_${achievementId}`);
    const existing = await getDoc(logroRef);

    if (!existing.exists()) {
      await setDoc(logroRef, {
        userId: user.uid,
        achievementId,
        fecha: serverTimestamp(),
      });
      return true;
    }
  } catch (error) {
    console.error('Error al desbloquear logro:', error);
  }
  return false;
}

export async function getUserAchievements() {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, 'logros'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error al cargar logros:', error);
    return [];
  }
}

export function onAchievementsChange(callback) {
  const user = auth.currentUser;
  if (!user) return () => {};

  try {
    const q = query(collection(db, 'logros'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const achievements = snapshot.docs.map(doc => doc.data());
      callback(achievements);
    }, (error) => {
      console.error('Error en onAchievementsChange:', error);
    });
  } catch (error) {
    console.error('Error en onAchievementsChange:', error);
    return () => {};
  }
}