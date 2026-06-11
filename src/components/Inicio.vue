<template>
  <div class="inicio-content">
    <div class="description">
      <h1>Bienvenido a nuestra página Molajuegos</h1>
      <p>
        Aquí encontrarás una variedad de juegos sencillos como Adivina el Color,
        Pong, Adivina el Pokémon, Ahorcado y muchos más.
      </p>

      <button>
        <router-link to="/juegos">Explorar más juegos</router-link>
      </button>
    </div>

    <div class="games">
      <div class="game">
        <img src="../assets/tetris.avif" alt="Tetris">
        <h2>Tetris</h2>
        <button><router-link to="/tetris">Jugar</router-link></button>
      </div>

      <div class="game">
        <img src="../assets/flappy-bird.png" alt="Flappy Bird">
        <h2>Flappy Bird</h2>
        <button><router-link to="/flappy-bird">Jugar</router-link></button>
      </div>

      <div class="game">
        <img src="../assets/sudoku.avif" alt="Sudoku">
        <h2>Sudoku</h2>
        <button><router-link to="/sudoku">Jugar</router-link></button>
      </div>

      <div class="game">
        <img src="../assets/damas.png" alt="Damas">
        <h2>Damas</h2>
        <button><router-link to="/damas">Jugar</router-link></button>
      </div>
    </div>
  </div>
</template>

<script>
import { analytics, logEvent } from '../firebase';

export default {
  name: 'Inicio',

  mounted() {
    logEvent(analytics, 'home_page_view', {
      page_name: 'Inicio',
      section: 'principal'
    });

    console.log('Visita a la página principal registrada');
  }
};
</script>

<style>
@import '../assets/CSS/inicio.css';
</style>