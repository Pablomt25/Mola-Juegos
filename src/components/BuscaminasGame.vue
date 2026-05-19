<template>
  <div class="game-container mines-game">
    <h1>Buscaminas</h1>

    <div class="difficulty-buttons">
      <button
        v-for="level in difficulties"
        :key="level.name"
        @click="setDifficulty(level)"
        :class="{ selected: difficulty.name === level.name }"
      >
        {{ level.name }}
      </button>
    </div>

    <p class="game-status">Tiempo: {{ timer }}s</p>
    <p class="game-status">Minas restantes: {{ minesLeft }}</p>

    <div class="board" :style="{ gridTemplateColumns: `repeat(${cols}, 30px)` }">
      <button
        v-for="(cell, index) in flatBoard"
        :key="index"
        class="cell"
        :class="{ revealed: cell.revealed, mine: cell.revealed && cell.isMine }"
        @click="revealCell(cell)"
        @contextmenu.prevent="toggleFlag(cell)"
      >
        <span v-if="cell.flagged && !cell.revealed">F</span>
        <span v-else-if="cell.revealed && cell.isMine">X</span>
        <span v-else-if="cell.revealed && cell.neighborMines > 0">{{ cell.neighborMines }}</span>
      </button>
    </div>

    <div v-if="gameOver" class="game-over-message">
      <p>{{ message }}</p>
      <button @click="resetGame">Volver a jugar</button>
    </div>
  </div>
</template>

<script>
import { saveGameScore } from '../utils/ranking';

export default {
  data() {
    return {
      rows: 8,
      cols: 8,
      mines: 10,
      board: [],
      gameOver: false,
      message: '',
      timer: 0,
      interval: null,
      firstClick: true,
      difficulties: [
        { name: 'Fácil', rows: 8, cols: 8, mines: 10 },
        { name: 'Medio', rows: 12, cols: 12, mines: 25 },
        { name: 'Difícil', rows: 16, cols: 16, mines: 50 },
      ],
      difficulty: { name: 'Fácil', rows: 8, cols: 8, mines: 10 },
    };
  },
  computed: {
    flatBoard() {
      return this.board.flat();
    },
    minesLeft() {
      const flags = this.flatBoard.filter(c => c.flagged).length;
      return this.mines - flags;
    },
  },
  mounted() {
    this.resetGame();
  },
  beforeUnmount() {
    clearInterval(this.interval);
  },
  methods: {
    setDifficulty(level) {
      this.difficulty = level;
      this.rows = level.rows;
      this.cols = level.cols;
      this.mines = level.mines;
      this.resetGame();
    },
    resetGame() {
      clearInterval(this.interval);
      this.timer = 0;
      this.gameOver = false;
      this.message = '';
      this.firstClick = true;
      this.createBoard();
    },
    createBoard() {
      this.board = Array.from({ length: this.rows }, (_, row) =>
        Array.from({ length: this.cols }, (_, col) => ({
          row,
          col,
          isMine: false,
          revealed: false,
          flagged: false,
          neighborMines: 0,
        }))
      );
    },
    placeMines(firstCell) {
      let placed = 0;
      while (placed < this.mines) {
        const row = Math.floor(Math.random() * this.rows);
        const col = Math.floor(Math.random() * this.cols);

        if (!this.board[row][col].isMine && !(row === firstCell.row && col === firstCell.col)) {
          this.board[row][col].isMine = true;
          placed++;
        }
      }
      this.calculateNeighbors();
    },
    calculateNeighbors() {
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          if (!this.board[row][col].isMine) {
            this.board[row][col].neighborMines =
              this.getNeighbors(row, col).filter(cell => cell.isMine).length;
          }
        }
      }
    },
    getNeighbors(row, col) {
      const neighbors = [];
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          if (rowOffset === 0 && colOffset === 0) continue;
          const nextRow = row + rowOffset;
          const nextCol = col + colOffset;

          if (nextRow >= 0 && nextRow < this.rows && nextCol >= 0 && nextCol < this.cols) {
            neighbors.push(this.board[nextRow][nextCol]);
          }
        }
      }
      return neighbors;
    },
    revealCell(cell) {
      if (this.gameOver || cell.flagged || cell.revealed) return;

      if (this.firstClick) {
        this.placeMines(cell);
        this.startTimer();
        this.firstClick = false;
      }

      cell.revealed = true;

      if (cell.isMine) {
        this.revealAll();
        this.endGame(false);
        return;
      }

      if (cell.neighborMines === 0) {
        this.getNeighbors(cell.row, cell.col).forEach(neighbor => {
          if (!neighbor.revealed) this.revealCell(neighbor);
        });
      }

      this.checkWin();
    },
    toggleFlag(cell) {
      if (!cell.revealed && !this.gameOver) {
        cell.flagged = !cell.flagged;
      }
    },
    revealAll() {
      this.flatBoard.forEach(cell => {
        cell.revealed = true;
      });
    },
    checkWin() {
      const unrevealed = this.flatBoard.filter(cell => !cell.revealed);
      if (unrevealed.length === this.mines) {
        this.endGame(true);
      }
    },
    startTimer() {
      clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.timer++;
      }, 1000);
    },
    async endGame(win) {
      clearInterval(this.interval);
      this.gameOver = true;

      const score = win ? Math.max(1000 - this.timer * 5, 10) : 0;
      this.message = win ? `Ganaste. Puntuación: ${score}` : 'Has perdido. Puntuación: 0';

      try {
        await saveGameScore('Buscaminas', score);
      } catch (error) {
        console.error('Error al guardar puntuación:', error);
      }
    },
  },
};
</script>

<style scoped>
.mines-game {
  overflow-x: auto;
}

.board {
  display: grid;
  justify-content: center;
  gap: 2px;
  width: max-content;
  max-width: 100%;
  margin: 16px auto;
}

.cell {
  width: 30px;
  height: 30px;
  min-height: 30px;
  padding: 0;
  background: #cbd5e1;
  color: #111827;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  border-radius: 2px;
}

.cell.revealed {
  background: #f1f5f9;
}

.cell.mine {
  background: #ff6b6b;
}
</style>
