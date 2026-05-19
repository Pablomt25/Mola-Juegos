<template>
  <div class="game-shell reaction-game">
    <h1>Reaction Time</h1>

    <div class="reaction-status">
      <p>Ultimo tiempo: {{ lastTimeLabel }}</p>
      <p>Mejor tiempo: {{ bestTimeLabel }}</p>
      <p>Puntos: {{ score }}</p>
    </div>

    <button
      class="reaction-board"
      :class="boardClass"
      type="button"
      @click="handleReaction"
      @keydown.space.prevent="handleReaction"
      @keydown.enter.prevent="handleReaction"
    >
      <span class="reaction-icon">{{ icon }}</span>
      <span class="reaction-title">{{ title }}</span>
      <span class="reaction-message">{{ message }}</span>
    </button>

    <div class="reaction-actions">
      <button @click="startGame" :disabled="phase === 'waiting' || phase === 'ready'">
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<script>
import { saveGameScore } from '../utils/ranking';

const MIN_WAIT = 1500;
const MAX_WAIT = 4500;

export default {
  name: 'ReactionTimeGame',

  data() {
    return {
      phase: 'idle',
      waitTimeout: null,
      startTime: 0,
      lastTime: null,
      bestTime: null,
      score: 0,
      savedScore: false,
    };
  },

  computed: {
    boardClass() {
      return {
        'is-idle': this.phase === 'idle',
        'is-waiting': this.phase === 'waiting',
        'is-ready': this.phase === 'ready',
        'is-result': this.phase === 'result',
        'is-too-soon': this.phase === 'tooSoon',
      };
    },

    icon() {
      if (this.phase === 'ready') return '!';
      if (this.phase === 'result') return `${this.lastTime} ms`;
      if (this.phase === 'tooSoon') return 'X';
      return '⚡';
    },

    title() {
      if (this.phase === 'waiting') return 'Espera al verde';
      if (this.phase === 'ready') return 'Ahora';
      if (this.phase === 'result') return 'Buen reflejo';
      if (this.phase === 'tooSoon') return 'Demasiado pronto';
      return 'Test de reflejos';
    },

    message() {
      if (this.phase === 'waiting') return 'No pulses mientras esta rojo.';
      if (this.phase === 'ready') return 'Pulsa lo mas rapido posible.';
      if (this.phase === 'result') return `Has reaccionado en ${this.lastTime} ms.`;
      if (this.phase === 'tooSoon') return 'Has pulsado antes de tiempo. Prueba otra vez.';
      return 'Pulsa empezar y espera el cambio a verde.';
    },

    actionLabel() {
      if (this.phase === 'result' || this.phase === 'tooSoon') return 'Volver a jugar';
      return 'Empezar';
    },

    lastTimeLabel() {
      return this.lastTime === null ? '-' : `${this.lastTime} ms`;
    },

    bestTimeLabel() {
      return this.bestTime === null ? '-' : `${this.bestTime} ms`;
    },
  },

  mounted() {
    const storedBestTime = localStorage.getItem('reactionBestTime');
    if (storedBestTime) {
      this.bestTime = Number(storedBestTime);
      this.score = this.calculateScore(this.bestTime);
    }
  },

  beforeUnmount() {
    this.clearWaitTimeout();
  },

  methods: {
    startGame() {
      this.clearWaitTimeout();

      this.phase = 'waiting';
      this.lastTime = null;
      this.savedScore = false;

      const waitTime =
        Math.floor(Math.random() * (MAX_WAIT - MIN_WAIT + 1)) + MIN_WAIT;

      this.waitTimeout = setTimeout(() => {
        this.phase = 'ready';
        this.startTime = performance.now();
      }, waitTime);
    },

    handleReaction() {
      if (this.phase === 'idle' || this.phase === 'result' || this.phase === 'tooSoon') {
        this.startGame();
        return;
      }

      if (this.phase === 'waiting') {
        this.clearWaitTimeout();
        this.phase = 'tooSoon';
        this.lastTime = null;
        this.score = 0;
        return;
      }

      if (this.phase !== 'ready') return;

      this.lastTime = Math.round(performance.now() - this.startTime);
      this.phase = 'result';
      this.score = this.calculateScore(this.lastTime);

      if (this.bestTime === null || this.lastTime < this.bestTime) {
        this.bestTime = this.lastTime;
        localStorage.setItem('reactionBestTime', String(this.bestTime));
      }

      this.saveScore();
    },

    calculateScore(timeMs) {
      return Math.max(1, 10000 - timeMs);
    },

    async saveScore() {
      if (this.savedScore || this.lastTime === null) return;

      this.savedScore = true;

      try {
        await saveGameScore('Reaction Time', this.score);
      } catch (error) {
        console.error('Error al guardar la puntuacion:', error);
      }
    },

    clearWaitTimeout() {
      if (this.waitTimeout) {
        clearTimeout(this.waitTimeout);
        this.waitTimeout = null;
      }
    },
  },
};
</script>

<style>
@import '../assets/CSS/reaction-time.css';
</style>
