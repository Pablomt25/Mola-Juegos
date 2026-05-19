<template>
  <div>
    <div class="filter-bar">
      <label for="sort-options">Ordenar por:</label>
      <select id="sort-options" @change="sortGames">
        <option value="default">Predeterminado</option>
        <option value="a-z">A-Z</option>
        <option value="z-a">Z-A</option>
      </select>
    </div>
    <div class="content-custom">
      <div class="games-custom">
        <div v-for="game in sortedGames" :key="game.name" class="game-custom">
          <img :src="game.image" :alt="game.name">
          <h2>{{ game.name }}</h2>
          <button><router-link :to="game.link">Jugar</router-link></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
import SudokuGame from '../assets/sudoku.avif';
import damasImage from '../assets/damas.png';
import flappyBirdImage from '../assets/flappy-bird.svg';

export default {
  data() {
    return {
      sortOption: 'default',
      games: [
        { name: 'Sudoku', image: SudokuGame, link: '/sudoku' },
        { name: 'Damas', image: damasImage, link: '/damas' },
        { name: 'Flappy Bird', image: flappyBirdImage, link: '/flappy-bird' },
        { name: 'Tetris', image: tetrisImage, link: '/tetris' },
        { name: 'Buscaminas', image: buscaminasImage, link: '/buscaminas' },
        { name: 'Pong', image: pongImage, link: '/pong' },
        { name: 'Adivina el color', image: guessTheColorImage, link: '/color' },
        { name: 'Adivina el Pokémon', image: guessPokemonImage, link: '/pokemon' },
        { name: 'Ahorcado', image: hangmanImage, link: '/ahorcado' },
        { name: 'Juego de memoria', image: memoryGameImage, link: '/memoria' },
        { name: 'Tres en raya', image: tresEnRaya, link: '/tresenraya' },
        { name: 'Juego de la serpiente', image: snakeGameImage, link: '/serpiente' },
        { name: 'Adivinación de números', image: numberGuessingImage, link: '/adivinaNumero' }
      ]
    };
  },
  computed: {
    sortedGames() {
      if (this.sortOption === 'a-z') {
        return this.games.slice().sort((a, b) => a.name.localeCompare(b.name));
      } else if (this.sortOption === 'z-a') {
        return this.games.slice().sort((a, b) => b.name.localeCompare(a.name));
      } else {
        return this.games;
      }
    }
  },
  methods: {
    sortGames(event) {
      this.sortOption = event.target.value;
    }
  }
};
</script>

<style>
@import '../assets/CSS/juegos.css';
</style>
