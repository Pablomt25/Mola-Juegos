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

    <p v-if="gameOver" class="game-over">
      ¡Juego terminado! Puntuación: {{ score }}
    </p>

    <button v-if="gameOver" @click="resetGame">Jugar otra vez</button>
  </div>
</template>

<script>
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
      const user = auth.currentUser;
      if (user) {
        try {
          const userName = this.getUserName(user.email);

          await addDoc(collection(db, 'ranking'), {
            userId: user.uid,
            nombre: userName,
            puntos: this.score,
            fecha: serverTimestamp(),
            juego: 'Golpea al Topo'
          });
        } catch (error) {
          console.error("Error guardando score:", error);
        }
      }
    },

    getUserName(email) {
      const atIndex = email.indexOf('@');
      return atIndex !== -1 ? email.slice(0, atIndex) : 'Anónimo';
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