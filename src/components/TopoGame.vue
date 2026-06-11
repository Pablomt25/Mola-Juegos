<template>
  <div class="mole-game">
    <h1>¡Golpea al Topo!</h1>

    <p class="score">Puntuación: {{ score }}</p>
    <p class="time">Tiempo: {{ timeLeft }}s</p>

    <div v-if="!gameOver" class="grid">
      <div
        v-for="(cell, index) in grid"
        :key="index"
        class="cell"
        @click="hitMole(index)"
      >
        <span v-if="cell === 'mole'">🐹</span>
      </div>
    </div>

    <div v-if="gameOver" class="game-over-message">
      <p>¡Juego terminado! Puntuación: {{ score }}</p>
      <button @click="resetGame">Volver a jugar</button>
    </div>
  </div>
</template>

<script>
import { saveGameScore } from '../utils/ranking';

export default {
  data() {
    return {
      grid: Array(9).fill(null),
      score: 0,
      timeLeft: 30,
      gameOver: false,
      moleInterval: null,
      timerInterval: null,
    };
  },

  mounted() {
    this.startGame();
  },

  methods: {
    startGame() {
      this.score = 0;
      this.timeLeft = 30;
      this.gameOver = false;

      this.spawnMole();
      this.moleInterval = setInterval(this.spawnMole, 800);

      this.timerInterval = setInterval(() => {
        this.timeLeft--;

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }, 1000);
    },

    spawnMole() {
      this.grid = Array(9).fill(null);
      const randomIndex = Math.floor(Math.random() * 9);
      this.grid[randomIndex] = 'mole';
    },

    hitMole(index) {
      if (this.grid[index] === 'mole' && !this.gameOver) {
        this.score += 10;
        this.grid[index] = null;
      }
    },

    async endGame() {
      this.gameOver = true;
      clearInterval(this.moleInterval);
      clearInterval(this.timerInterval);
      this.grid = Array(9).fill(null);

      await this.saveScore();
    },

    async saveScore() {
      try {
        await saveGameScore('Golpea al Topo', this.score);
      } catch (error) {
        console.error("Error guardando score:", error);
      }
    },

    resetGame() {
      clearInterval(this.moleInterval);
      clearInterval(this.timerInterval);
      this.startGame();
    }
  }
};
</script>

<style>
@import '../assets/CSS/topo.css';
</style>