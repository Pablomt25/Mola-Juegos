<template>
  <div class="game-2048">
    <h1>2048</h1>

    <div class="top-bar">
      <p>Puntuación: {{ score }}</p>
    </div>
      <p v-if="gameOver" class="game-over" style="display: none;">¡Game Over!</p>

    <div
      class="grid"
      ref="grid"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div
        v-for="(cell, index) in board"
        :key="index"
        class="cell"
        :class="'cell-' + cell"
        :style="{
          background: cellColor(cell),
          color: cellTextColor(cell)
        }"
      >
        <span v-if="cell">{{ cell }}</span>
      </div>
    </div>

    <button v-if="gameOver" class="restart-button" @click="resetGame">Volver a jugar</button>
  </div>
</template>

<script>
import { saveGameScore } from '../utils/ranking';

export default {
  data() {
    return {
      board: Array(16).fill(0),
      score: 0,
      gameOver: false,
      touchStartX: 0,
      touchStartY: 0,
    };
  },

  mounted() {
    this.resetGame();
    window.addEventListener('keydown', this.handleKey);
    // Evita que el gesto táctil desplace la página cuando se juega en móvil
    this.$nextTick(() => {
      if (this.$refs.grid) {
        this._touchMoveHandler = (e) => { e.preventDefault(); };
        this.$refs.grid.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
      }
    });
  },

  beforeUnmount() {
  window.removeEventListener('keydown', this.handleKey);
  if (this.$refs && this.$refs.grid && this._touchMoveHandler) {
    this.$refs.grid.removeEventListener('touchmove', this._touchMoveHandler, { passive: false });
  }
},

  methods: {
    resetGame() {
      this.board = Array(16).fill(0);
      this.score = 0;
      this.gameOver = false;
      this.addRandomTile();
      this.addRandomTile();
    },

    addRandomTile() {
      const empty = this.board
        .map((v, i) => (v === 0 ? i : null))
        .filter(v => v !== null);

      if (empty.length === 0) return;

      const index = empty[Math.floor(Math.random() * empty.length)];
      this.board[index] = Math.random() < 0.9 ? 2 : 4;
    },

    // ✅ CORREGIDO: move ahora distingue correctamente filas y columnas
    move(direction) {
      if (this.gameOver) return;

      let oldBoard = [...this.board];

      for (let i = 0; i < 4; i++) {
        if (direction === 'left' || direction === 'right') {
          let row = this.getRow(i);
          row = this.processRow(row, direction === 'right');
          this.setRow(i, row);
        } else {
          let col = this.getCol(i);
          col = this.processRow(col, direction === 'down');
          this.setCol(i, col);
        }
      }

      if (JSON.stringify(oldBoard) !== JSON.stringify(this.board)) {
        this.addRandomTile();
        this.checkGameOver();
      }
      if (this.board.includes(2048)) {
  this.gameOver = true;
  this.saveScore();
}
    },

    processRow(row, reverse = false) {
      let arr = reverse ? [...row].reverse() : [...row];

      // Eliminar ceros
      arr = arr.filter(v => v !== 0);

      // Combinar pares adyacentes
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          this.score += arr[i];
          arr[i + 1] = 0;
        }
      }

      // Eliminar ceros tras combinación
      arr = arr.filter(v => v !== 0);

      // Rellenar con ceros hasta 4 elementos
      while (arr.length < 4) {
        arr.push(0);
      }

      return reverse ? arr.reverse() : arr;
    },

    // ✅ Obtiene una fila horizontal
    getRow(i) {
      return this.board.slice(i * 4, i * 4 + 4);
    },

    // ✅ NUEVO: Obtiene una columna vertical
    getCol(j) {
      return [0, 1, 2, 3].map(i => this.board[i * 4 + j]);
    },

    // ✅ Escribe una fila horizontal
    setRow(i, row) {
      this.board.splice(i * 4, 4, ...row);
    },

    // ✅ NUEVO: Escribe una columna vertical
    setCol(j, col) {
      for (let i = 0; i < 4; i++) {
        this.board[i * 4 + j] = col[i];
      }
    },

    handleKey(e) {
      if (this.gameOver) return;

      const map = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      };

      if (map[e.key]) {
        e.preventDefault();
        this.move(map[e.key]);
      }
    },

    handleTouchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    },

    handleTouchEnd(e) {
      const dx = e.changedTouches[0].screenX - this.touchStartX;
      const dy = e.changedTouches[0].screenY - this.touchStartY;

      // Umbral mínimo para evitar swipes accidentales
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        dx > 0 ? this.move('right') : this.move('left');
      } else {
        dy > 0 ? this.move('down') : this.move('up');
      }
    },

    checkGameOver() {
  if (this.gameOver) return; // evita doble ejecución

  // si aún hay huecos, no es game over
  if (this.board.includes(0)) return;

  // comprobar si hay movimientos posibles
  for (let i = 0; i < 16; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;

    // derecha
    if (col < 3 && this.board[i] === this.board[i + 1]) {
      return;
    }

    // abajo
    if (row < 3 && this.board[i] === this.board[i + 4]) {
      return;
    }
  }

  // si no hay movimientos -> game over
  this.gameOver = true;
  this.saveScore();
},

    // ✅ NUEVO: colores por valor (estilo 2048 original)
    cellColor(value) {
      const colors = {
        0:    '#cdc1b4',
        2:    '#eee4da',
        4:    '#ede0c8',
        8:    '#f2b179',
        16:   '#f59563',
        32:   '#f67c5f',
        64:   '#f65e3b',
        128:  '#edcf72',
        256:  '#edcc61',
        512:  '#edc850',
        1024: '#edc53f',
        2048: '#edc22e',
      };
      return colors[value] ?? '#3c3a32';
    },

    // ✅ NUEVO: texto oscuro para valores bajos, claro para altos
    cellTextColor(value) {
      return value <= 4 ? '#776e65' : '#f9f6f2';
    },

    async saveScore() {
      try {
        await saveGameScore('2048', this.score);
      } catch (err) {
        console.error(err);
      }
    },
  },
};
</script>

<style scoped>
.game-2048 {
  width: min(100%, 540px);
  margin: 0 auto;
  text-align: center;
  padding: clamp(12px, 3vw, 24px);
  font-family: 'Clear Sans', 'Helvetica Neue', Arial, sans-serif;
}

.game-2048 h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: #776e65;
  margin-bottom: 8px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 4px;
  font-weight: bold;
  font-size: 1.1rem;
  color: #776e65;
}

.game-over {
  color: #f65e3b;
  font-size: 1.2rem;
  animation: fadeIn 0.3s ease;
}

/* Fondo del tablero */
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 10px;
  background: #bbada0;
  border-radius: 10px;
  padding: 10px;
  margin-top: 12px;
  /* Mantener el tablero cuadrado y escalable */
  width: min(100%, 520px);
  aspect-ratio: 1 / 1;
}

/* Celda individual — color e texto vienen del :style dinámico */
.cell {
  aspect-ratio: 1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: clamp(16px, 4vw, 28px);
  transition: background 0.1s ease;
  /* sin background ni color fijos: se aplican dinámicamente */
  width: 100%;
  height: 100%;
}
/* botón reiniciar específico */
.restart-button {
  margin-top: 16px;
  padding: 10px 28px;
  border: none;
  background: #007bff;
  color: #ffffff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: background 0.15s ease;
}

.restart-button:hover {
  background: #0056b3;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

@media (max-width: 600px) {
  .grid {
    gap: 7px;
    padding: 7px;
  }
}

@media (max-width: 380px) {
  .cell {
    font-size: 14px;
  }
}
</style>