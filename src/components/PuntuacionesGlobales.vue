<template>
  <div class="puntuaciones-globales">
    <h1>Puntuaciones Globales</h1>
    <div class="botones-filtro">
      <button :class="{ activo: mostrarMejorPuntuacion }"
        @click="mostrarMejorPuntuacion = true; getPuntuacionesGlobales()">Mejores Puntuaciones en 1 Partida</button>
      <button :class="{ activo: !mostrarMejorPuntuacion }"
        @click="mostrarMejorPuntuacion = false; getPuntuacionesGlobales()">Puntuaciones Totales</button>
    </div>
    <div v-if="puntuaciones.length === 0" class="no-puntuaciones">No hay puntuaciones aún.</div>
    <div v-else class="puntuaciones-grid">
      <div v-for="puntuacion in puntuaciones" :key="puntuacion.juego" class="puntuacion">
        <img :src="getImage(puntuacion.juego)" alt="Imagen del juego" class="juego-imagen" />
        <div class="puntuacion-info">
          <h2>{{ puntuacion.juego }}</h2>
          <div v-for="(usuario, index) in puntuacion.usuarios" :key="index" class="usuario-info">
            <p>{{ index + 1 }}. {{ usuario.nombre }} - <strong>{{ usuario.puntos }}</strong> puntos</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

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
  name: 'PuntuacionesGlobales',
  data() {
    return {
      puntuaciones: [],
      mostrarMejorPuntuacion: true,
      gameImages: {
        'Sudoku': SudokuImage,
        'Damas': damasImage,
        'Flappy Bird': flappyBirdImage,
        'Reaction Time': reactionTimeImage,
        'Tetris': tetrisImage,
        'Buscaminas': buscaminasImage,
        'Pong': pongImage,
        'Adivina el Color': guessTheColorImage,
        'Adivina el Pokémon': guessPokemonImage,
        'Ahorcado': hangmanImage,
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
    this.getPuntuacionesGlobales();
  },
  methods: {
    async getPuntuacionesGlobales() {
      const querySnapshot = await getDocs(collection(db, 'ranking'));
      const puntuacionesMap = new Map();

      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (!data.juego) return;

        if (!puntuacionesMap.has(data.juego)) {
          puntuacionesMap.set(data.juego, []);
        }
        puntuacionesMap.get(data.juego).push({
          nombre: data.nombre,
          puntos: this.mostrarMejorPuntuacion ? (data.puntos || 0) : (data.totalPuntos || 0),
        });
      });

      this.puntuaciones = Array.from(puntuacionesMap.entries()).map(([juego, usuarios]) => {
        const topUsuarios = usuarios
          .sort((a, b) => b.puntos - a.puntos)
          .slice(0, 3);

        return {
          juego,
          usuarios: topUsuarios,
        };
      });
    },
    getImage(juego) {
      return this.gameImages[juego];
    },
  },
};
</script>

<style>
@import '../assets/CSS/puntuacionesglobales.css';
</style>