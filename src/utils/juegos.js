import { db } from '../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

const GAMES_CACHE_KEY = 'mola_juegos_data';
const CACHE_DURATION = 30 * 60 * 1000;
const SEEDED_KEY = 'mola_juegos_seeded';

const GAMES_DATA = [
  { id: 'sudoku', nombre: 'Sudoku', ruta: '/sudoku', categoria: 'Puzzle', multijugador: false },
  { id: 'damas', nombre: 'Damas', ruta: '/damas', categoria: 'Estrategia', multijugador: false },
  { id: 'flappy_bird', nombre: 'Flappy Bird', ruta: '/flappy-bird', categoria: 'Arcade', multijugador: false },
  { id: 'reaction_time', nombre: 'Reaction Time', ruta: '/reaction-time', categoria: 'Habilidad', multijugador: false },
  { id: 'tetris', nombre: 'Tetris', ruta: '/tetris', categoria: 'Arcade', multijugador: false },
  { id: 'buscaminas', nombre: 'Buscaminas', ruta: '/buscaminas', categoria: 'Puzzle', multijugador: false },
  { id: 'adivina_el_color', nombre: 'Adivina el Color', ruta: '/color', categoria: 'Habilidad', multijugador: false },
  { id: 'adivina_el_pokemon', nombre: 'Adivina el Pokémon', ruta: '/pokemon', categoria: 'Trivia', multijugador: false },
  { id: 'ahorcado', nombre: 'Ahorcado', ruta: '/ahorcado', categoria: 'Palabras', multijugador: false },
  { id: 'memoria', nombre: 'Juego de Memoria', ruta: '/memoria', categoria: 'Habilidad', multijugador: false },
  { id: 'tres_en_raya', nombre: '3 en Raya', ruta: '/tresenraya', categoria: 'Estrategia', multijugador: true },
  { id: 'snake_game', nombre: 'Snake Game', ruta: '/serpiente', categoria: 'Arcade', multijugador: false },
  { id: 'adivina_el_numero', nombre: 'Adivina el Número', ruta: '/adivinaNumero', categoria: 'Puzzle', multijugador: false },
  { id: 'golpea_al_topo', nombre: 'Golpea al Topo', ruta: '/topo', categoria: 'Habilidad', multijugador: false },
  { id: 'pong', nombre: 'Pong', ruta: '/pong', categoria: 'Arcade', multijugador: false },
  { id: '2048', nombre: 'Juego 2048', ruta: '/2048', categoria: 'Puzzle', multijugador: false },
];

export async function seedGames() {
  if (localStorage.getItem(SEEDED_KEY)) return;

  try {
    const snapshot = await getDocs(collection(db, 'juegos'));
    if (!snapshot.empty) {
      localStorage.setItem(SEEDED_KEY, '1');
      return;
    }

    for (const game of GAMES_DATA) {
      const { id, ...data } = game;
      await setDoc(doc(db, 'juegos', id), data);
    }
    localStorage.setItem(SEEDED_KEY, '1');
  } catch (error) {
    console.error('Error al inicializar colección juegos:', error);
  }
}

export async function getGames() {
  try {
    const cached = localStorage.getItem(GAMES_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    const snapshot = await getDocs(collection(db, 'juegos'));
    if (!snapshot.empty) {
      const games = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      localStorage.setItem(GAMES_CACHE_KEY, JSON.stringify({ data: games, timestamp: Date.now() }));
      return games;
    }

    return GAMES_DATA;
  } catch (error) {
    console.error('Error al cargar juegos de Firestore, usando fallback:', error);
    return GAMES_DATA;
  }
}

export function getFallbackGames() {
  return GAMES_DATA;
}