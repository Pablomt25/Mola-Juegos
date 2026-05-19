<template>
  <div class="mis-puntuaciones">
    <h1>Mis Puntuaciones</h1>
    <div v-if="cargando" class="no-puntuaciones">Cargando puntuaciones...</div>
    <div v-else-if="errorMessage" class="no-puntuaciones">{{ errorMessage }}</div>
    <div v-else-if="puntuaciones.length === 0" class="no-puntuaciones">No tienes puntuaciones aún.</div>
    <div v-else>
      <div class="botones-filtro">
        <button :class="{ activo: mostrarMejorPuntuacion }" @click="mostrarMejorPuntuacion = true">
          Mejor Puntuación en 1 Partida
        </button>
        <button :class="{ activo: !mostrarMejorPuntuacion }" @click="mostrarMejorPuntuacion = false">
          Puntuaciones Totales
        </button>
      </div>
      <div class="puntuaciones-grid">
        <div v-for="puntuacion in puntuaciones" :key="puntuacion.juego" class="puntuacion">
          <img :src="getImage(puntuacion.juego)" alt="Imagen del juego" class="juego-imagen" />
          <div class="puntuacion-info">
            <h2>{{ puntuacion.juego }}</h2>
            <p v-if="mostrarMejorPuntuacion">
              Mejor Puntuación en 1 Partida: <strong>{{ puntuacion.mejorPuntos }}</strong> puntos
            </p>
            <p v-else>Puntuaciones Totales: <strong>{{ puntuacion.totalPuntos }}</strong></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

import pongImage from '../assets/pong.avif';
import guessTheColorImage from '../assets/guess-the-color.webp';
import guessPokemonImage from '../assets/adivina-pokemon.jpg';
import hangmanImage from '../assets/ahorcado.jpg';
import memoryGameImage from '../assets/memoria.jpg';
import tresEnRaya from '../assets/raya.webp';
import snakeGameImage from '../assets/snake.jpg';
import numberGuessingImage from '../assets/numero.jpg';
import buscaminasImage from '../assets/buscaminas.webp';
import tetrisImage from '../assets/tetris.avif';
import SudokuImage from '../assets/sudoku.avif';
import damasImage from '../assets/damas.png';
import flappyBirdImage from '../assets/flappy-bird.png';
import reactionTimeImage from '../assets/reaction-time.svg';
import topoImage from '../assets/topo.jpg';
import juego2048Image from '../assets/juego2048.avif';

export default {
  name: 'MisPuntuaciones',
  data() {
    return {
      puntuaciones: [],
      cargando: true,
      errorMessage: '',
      unsubscribeAuth: null,
      mostrarMejorPuntuacion: true,
      gameImages: {
        Sudoku: SudokuImage,
        Damas: damasImage,
        'Flappy Bird': flappyBirdImage,
        'Reaction Time': reactionTimeImage,
        Tetris: tetrisImage,
        Buscaminas: buscaminasImage,
        Pong: pongImage,
        'Adivina el Color': guessTheColorImage,
        'Adivina el Pokémon': guessPokemonImage,
        Ahorcado: hangmanImage,
        'Juego de Memoria': memoryGameImage,
        '3 en Raya': tresEnRaya,
        'Snake Game': snakeGameImage,
        'Adivina el Número': numberGuessingImage,
        'Golpea al Topo': topoImage,
        '2048': juego2048Image,
      },
    };
  },
  mounted() {
    this.unsubscribeAuth = onAuthStateChanged(auth, user => {
      if (user) {
        this.getPuntuaciones(user);
      } else {
        this.puntuaciones = [];
        this.cargando = false;
        this.errorMessage = 'Inicia sesión para ver tus puntuaciones.';
      }
    });
  },
  beforeUnmount() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  },
  methods: {
    async getPuntuaciones(user) {
      this.cargando = true;
      this.errorMessage = '';

      try {
        const q = query(collection(db, 'ranking'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const puntuacionesMap = new Map();

        querySnapshot.forEach(doc => {
          const data = doc.data();

          if (!puntuacionesMap.has(data.juego)) {
            puntuacionesMap.set(data.juego, {
              juego: data.juego,
              juegoImagen: this.gameImages[data.juego],
              mejorPuntos: data.puntos,
              totalPuntos: data.puntos,
            });
          } else {
            const current = puntuacionesMap.get(data.juego);
            current.mejorPuntos = Math.max(current.mejorPuntos, data.puntos);
            current.totalPuntos += data.puntos;
          }
        });

        this.puntuaciones = Array.from(puntuacionesMap.values());
      } catch (error) {
        console.error('Error al cargar tus puntuaciones:', error);
        this.errorMessage = 'No se han podido cargar tus puntuaciones.';
      } finally {
        this.cargando = false;
      }
    },
    getImage(juego) {
      return this.gameImages[juego] || '';
    },
  },
};
</script>

<style>
@import '../assets/CSS/mispuntuaciones.css';
</style>
