<template>
  <div class="game-shell snake-game">
    <h1>Snake Game</h1>
    <p class="game-status">Puntuación: {{ score }}</p>

    <div
      class="cuadrado"
      ref="snakeGame"
      tabindex="0"
      @keydown="handleKeyDown"
    >
      <div
        v-for="(segment, index) in snake"
        :key="index"
        class="snake-segment"
        :style="{ left: segment.x + 'px', top: segment.y + 'px' }"
      ></div>
      <div
        class="snake-food"
        :style="{ left: food.x + 'px', top: food.y + 'px' }"
      ></div>
    </div>

    <div v-if="gameOver" class="game-over-message">
      <p>Fin del juego. Puntos: {{ score }}</p>
      <button @click="resetGame">Volver a jugar</button>
    </div>
  </div>
</template>

<script>
import { saveGameScore } from '../utils/ranking';

const BOARD_SIZE = 300;
const GRID_SIZE = 20;

export default {
  data() {
    return {
      snake: [{ x: 20, y: 20 }, { x: 40, y: 20 }],
      food: { x: 200, y: 200 },
      score: 0,
      direction: 'right',
      gameOver: false,
      interval: null,
    };
  },
  mounted() {
    this.startLoop();
    this.$refs.snakeGame.focus();
  },
  beforeUnmount() {
    clearInterval(this.interval);
  },
  methods: {
    startLoop() {
      clearInterval(this.interval);
      this.interval = setInterval(this.moveSnake, 100);
    },
    async moveSnake() {
      if (this.gameOver) return;

      const newHead = { ...this.snake[this.snake.length - 1] };

      if (this.direction === 'up') newHead.y -= GRID_SIZE;
      if (this.direction === 'down') newHead.y += GRID_SIZE;
      if (this.direction === 'left') newHead.x -= GRID_SIZE;
      if (this.direction === 'right') newHead.x += GRID_SIZE;

      if (
        newHead.x < 0 ||
        newHead.x >= BOARD_SIZE ||
        newHead.y < 0 ||
        newHead.y >= BOARD_SIZE ||
        this.checkCollisionWithSelf(newHead)
      ) {
        await this.endGame();
        return;
      }

      if (this.checkCollision(newHead, this.food)) {
        this.score++;
        this.generateFood();
      } else {
        this.snake.shift();
      }

      this.snake.push(newHead);
    },
    checkCollision(head, target) {
      return head.x === target.x && head.y === target.y;
    },
    checkCollisionWithSelf(head) {
      return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    },
    generateFood() {
      do {
        this.food = {
          x: Math.floor(Math.random() * (BOARD_SIZE / GRID_SIZE)) * GRID_SIZE,
          y: Math.floor(Math.random() * (BOARD_SIZE / GRID_SIZE)) * GRID_SIZE,
        };
      } while (this.snake.some(segment => this.checkCollision(segment, this.food)));
    },
    handleKeyDown(event) {
      const nextDirection = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }[event.key];

      if (!nextDirection) return;
      event.preventDefault();

      const opposite = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left',
      };

      if (opposite[nextDirection] !== this.direction) {
        this.direction = nextDirection;
      }
    },
    async endGame() {
      this.gameOver = true;
      clearInterval(this.interval);
      try {
        await saveGameScore('Snake Game', this.score);
      } catch (error) {
        console.error('Error al guardar la puntuación:', error);
      }
    },
    resetGame() {
      this.snake = [{ x: 20, y: 20 }, { x: 40, y: 20 }];
      this.food = { x: 200, y: 200 };
      this.score = 0;
      this.direction = 'right';
      this.gameOver = false;
      this.startLoop();
      this.$nextTick(() => this.$refs.snakeGame.focus());
    },
  },
};
</script>

<style>
@import '../assets/CSS/serpiente.css';
</style>
