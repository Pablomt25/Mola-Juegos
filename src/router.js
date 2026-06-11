import { createRouter, createWebHistory } from 'vue-router';
import { auth } from './firebase';

import Inicio from './components/Inicio.vue';
import Login from './components/Login.vue';
import Juegos from './components/Juegos.vue';
import BuscaminasGame from './components/BuscaminasGame.vue';
import PongGame from './components/PongGame.vue';
import ColorGame from './components/ColorGame.vue';
import AhorcadoGame from './components/AhorcadoGame.vue';
import PokemonGame from './components/PokemonGame.vue';
import MemoriaGame from './components/MemoriaGame.vue';
import TresEnRayaGama from './components/TresEnRayaGama.vue';
import SerpienteGame from './components/SerpienteGame.vue';
import AdivinaNumeroGame from './components/AdivinaNumeroGame.vue';
import MisPuntuaciones from './components/MisPuntuaciones.vue';
import MisLogros from './components/MisLogros.vue';
import PuntuacionesGlobales from './components/PuntuacionesGlobales.vue';
import TetrisGame from './components/TetrisGame.vue';
import SudokuGame from './components/SudokuGame.vue';
import DamasGame from './components/DamasGame.vue';
import FlappyBirdGame from './components/FlappyBirdGame.vue';
import ReactionTimeGame from './components/ReactionTimeGame.vue';
import TopoGame from './components/TopoGame.vue';
import Juego2048Game from './components/2048Game.vue';

const routes = [
  {
    path: '/',
    name: 'Inicio',
    component: Inicio,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    props: route => ({ redirect: route.query.redirect }),
  },
  {
    path: '/juegos',
    name: 'Juegos',
    component: Juegos,
  },
  {
    path: '/sudoku',
    name: 'SudokuGame',
    component: SudokuGame,
    meta: { requiresAuth: true, gameId: 'sudoku', gameName: 'Sudoku' },
  },
  {
    path: '/damas',
    name: 'DamasGame',
    component: DamasGame,
    meta: { requiresAuth: true, gameId: 'damas', gameName: 'Damas', multiplayer: true },
  },
  {
    path: '/flappy-bird',
    name: 'FlappyBirdGame',
    component: FlappyBirdGame,
    meta: { requiresAuth: true, gameId: 'flappy_bird', gameName: 'Flappy Bird' },
  },
  {
    path: '/reaction-time',
    name: 'ReactionTimeGame',
    component: ReactionTimeGame,
    meta: { requiresAuth: true, gameId: 'reaction_time', gameName: 'Reaction Time' },
  },
  {
    path: '/tetris',
    name: 'TetrisGame',
    component: TetrisGame,
    meta: { requiresAuth: true, gameId: 'tetris', gameName: 'Tetris' },
  },
  {
    path: '/buscaminas',
    name: 'BuscaminasGame',
    component: BuscaminasGame,
    meta: { requiresAuth: true, gameId: 'buscaminas', gameName: 'Buscaminas' },
  },
  {
    path: '/pong',
    name: 'PongGame',
    component: PongGame,
    meta: { requiresAuth: true, gameId: 'pong', gameName: 'Pong' },
  },
  {
    path: '/color',
    name: 'ColorGame',
    component: ColorGame,
    meta: { requiresAuth: true, gameId: 'adivina_el_color', gameName: 'Adivina el Color' },
  },
  {
    path: '/pokemon',
    name: 'PokemonGame',
    component: PokemonGame,
    meta: { requiresAuth: true, gameId: 'adivina_el_pokemon', gameName: 'Adivina el Pokémon' },
  },
  {
    path: '/ahorcado',
    name: 'AhorcadoGame',
    component: AhorcadoGame,
    meta: { requiresAuth: true, gameId: 'ahorcado', gameName: 'Ahorcado' },
  },
  {
    path: '/memoria',
    name: 'MemoriaGame',
    component: MemoriaGame,
    meta: { requiresAuth: true, gameId: 'memoria', gameName: 'Juego de Memoria' },
  },
  {
    path: '/tresenraya',
    name: 'TresEnRayaGama',
    component: TresEnRayaGama,
    meta: { requiresAuth: true, gameId: 'tres_en_raya', gameName: '3 en Raya', multiplayer: true },
  },
  {
    path: '/serpiente',
    name: 'SerpienteGame',
    component: SerpienteGame,
    meta: { requiresAuth: true, gameId: 'snake_game', gameName: 'Snake Game' },
  },
  {
    path: '/adivinaNumero',
    name: 'AdivinaNumeroGame',
    component: AdivinaNumeroGame,
    meta: { requiresAuth: true, gameId: 'adivina_el_numero', gameName: 'Adivina el Número' },
  },
  {
    path: '/topo',
    name: 'TopoGame',
    component: TopoGame,
    meta: { requiresAuth: true, gameId: 'golpea_al_topo', gameName: 'Golpea al Topo' },
  },
  {
    path: '/misPuntuaciones',
    name: 'MisPuntuaciones',
    component: MisPuntuaciones,
    meta: { requiresAuth: true },
  },
  {
    path: '/misLogros',
    name: 'MisLogros',
    component: MisLogros,
    meta: { requiresAuth: true },
  },
  {
    path: '/puntuacionesGlobales',
    name: 'PuntuacionesGlobales',
    component: PuntuacionesGlobales,
  },
  {
    path: '/2048',
    name: 'Juego2048Game',
    component: Juego2048Game,
    meta: { requiresAuth: true, gameId: '2048', gameName: '2048' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,

  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

let authReady = false;
let authReadyPromise = new Promise((resolve) => {
  auth.onAuthStateChanged(() => {
    authReady = true;
    resolve();
  });
});

router.beforeEach(async (to, from, next) => {
  if (!authReady) {
    await authReadyPromise;
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = auth.currentUser;

  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  } else {
    next();
  }
});

export default router;