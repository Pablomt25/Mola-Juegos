<template>
  <div class="sudoku-container">
    <h1>Sudoku</h1>

    <p class="game-status">Tiempo: {{ timer }}s</p>

    <div class="grid">
      <div v-for="(row, y) in userBoard" :key="y" class="row">
        <input
          v-for="(cell, x) in row"
          :key="x"
          v-model="userBoard[y][x]"
          :readonly="fixedCells[y][x] || solved"
          maxlength="1"
          inputmode="numeric"
          @input="checkCell(y, x)"
          :class="{
            fixed: fixedCells[y][x],
            error: errors[y][x],
            blockBg: (Math.floor(y / 3) + Math.floor(x / 3)) % 2 === 0
          }"
          :style="{
            borderTop: y % 3 === 0 ? '3px solid #444' : '1px solid #888',
            borderLeft: x % 3 === 0 ? '3px solid #444' : '1px solid #888',
            borderBottom: (y + 1) % 3 === 0 ? '3px solid #444' : '1px solid #888',
            borderRight: (x + 1) % 3 === 0 ? '3px solid #444' : '1px solid #888'
          }"
        />
      </div>
    </div>

    <div v-if="solved" class="game-over-message">
      <p>Completado. Puntos: {{ score }}</p>
      <button @click="newGame">Volver a jugar</button>
    </div>
    <div v-else class="controls">
      <button @click="newGame">Nuevo juego</button>
    </div>
  </div>
</template>

<script>
import { saveGameScore } from '../utils/ranking';

export default {
  data() {
    return {
      solution: Array.from({ length: 9 }, () => Array(9).fill('')),
      userBoard: Array.from({ length: 9 }, () => Array(9).fill('')),
      fixedCells: Array.from({ length: 9 }, () => Array(9).fill(false)),
      errors: Array.from({ length: 9 }, () => Array(9).fill(false)),
      timer: 0,
      interval: null,
      solved: false,
      score: 0,
    };
  },
  mounted() {
    this.newGame();
  },
  beforeUnmount() {
    clearInterval(this.interval);
  },
  methods: {
    newGame() {
      this.generateSolution();
      this.generatePuzzle();
      this.timer = 0;
      this.score = 0;
      this.solved = false;

      clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.timer++;
      }, 1000);
    },
    generateSolution() {
      this.solution = Array.from({ length: 9 }, () => Array(9).fill(0));

      const shuffle = arr => arr.sort(() => Math.random() - 0.5);
      const isValid = (board, y, x, num) => {
        for (let i = 0; i < 9; i++) {
          if (board[y][i] === num || board[i][x] === num) return false;
        }
        const startRow = Math.floor(y / 3) * 3;
        const startCol = Math.floor(x / 3) * 3;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (board[startRow + i][startCol + j] === num) return false;
          }
        }
        return true;
      };

      const fillBoard = (board, y = 0, x = 0) => {
        if (y === 9) return true;
        const [nextY, nextX] = x === 8 ? [y + 1, 0] : [y, x + 1];
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (const num of numbers) {
          if (isValid(board, y, x, num)) {
            board[y][x] = num;
            if (fillBoard(board, nextY, nextX)) return true;
            board[y][x] = 0;
          }
        }
        return false;
      };

      fillBoard(this.solution);
    },
    generatePuzzle() {
      this.userBoard = this.solution.map(row => [...row]);
      this.fixedCells = Array.from({ length: 9 }, () => Array(9).fill(false));

      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (Math.random() < 0.5) {
            this.userBoard[y][x] = '';
            this.fixedCells[y][x] = false;
          } else {
            this.fixedCells[y][x] = true;
          }
        }
      }

      this.errors = Array.from({ length: 9 }, () => Array(9).fill(false));
    },
    async checkCell(y, x) {
      const val = String(this.userBoard[y][x]).replace(/[^1-9]/g, '');
      this.userBoard[y][x] = val;

      this.errors[y][x] = val ? Number(val) !== this.solution[y][x] : false;

      const completed = this.userBoard.flat().every(Boolean);
      const hasErrors = this.errors.flat().some(Boolean);

      if (completed && !hasErrors && !this.solved) {
        this.solved = true;
        this.score = Math.max(1000 - this.timer * 5, 10);
        clearInterval(this.interval);

        try {
          await saveGameScore('Sudoku', this.score);
        } catch (error) {
          console.error('Error al guardar la puntuación:', error);
        }
      }
    },
  },
};
</script>

<style scoped>
.grid {
  display: inline-block;
  max-width: 100%;
  border: 3px solid #444;
  background: #fff;
}

.row {
  display: flex;
}

input {
  width: clamp(32px, 9vw, 50px);
  height: clamp(32px, 9vw, 50px);
  text-align: center;
  font-size: clamp(1rem, 4vw, 1.5rem);
  outline: none;
}

input.fixed {
  background: #ddd;
  font-weight: bold;
}

input.error {
  background: #fdd;
}

input.blockBg:not(.fixed):not(.error) {
  background: #f8f8f8;
}
</style>
