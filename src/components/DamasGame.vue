<template>
  <div class="game-shell checkers-game">
    <h1>Damas</h1>
    <div class="difficulty-buttons">
      <button v-for="level in difficulties" :key="level" @click="setDifficulty(level)"
        :class="{ selected: difficulty === level }">
        {{ level }}
      </button>
      <button @click="setDifficulty('2 Jugadores')" :class="{ selected: difficulty === '2 Jugadores' }">
        2 Jugadores
      </button>
    </div>

    <div class="checkers-status">
      <p v-if="difficulty === '2 Jugadores'">Turno: <strong :class="currentPlayer === PLAYER ? 'turn-player' : 'turn-computer'">{{ currentPlayer === PLAYER ? 'Blancas' : 'Negras' }}</strong></p>
      <p v-else>Turno: {{ currentPlayer === PLAYER ? 'Jugador' : 'Máquina' }}</p>
      <p>Puntuación: {{ score }}</p>
      <p>Fichas: {{ playerPieces }} - {{ computerPieces }}</p>
    </div>

    <div class="checkers-board">
      <button
        v-for="cell in boardCells"
        :key="`${cell.row}-${cell.col}`"
        class="checkers-cell"
        :class="{
          light: !isPlayable(cell.row, cell.col),
          dark: isPlayable(cell.row, cell.col),
          selected: selectedPiece && selectedPiece.row === cell.row && selectedPiece.col === cell.col,
          target: isMoveTarget(cell.row, cell.col)
        }"
        :disabled="gameOver || !canPlayCurrentPlayer || !isPlayable(cell.row, cell.col)"
        @click="handleCellClick(cell.row, cell.col)"
      >
        <span
          v-if="cell.piece"
          class="piece"
          :class="[cell.piece.player, { king: cell.piece.king }]"
        >
          <span v-if="cell.piece.king">D</span>
        </span>
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

const PLAYER = 'player';
const COMPUTER = 'computer';

export default {
  name: 'DamasGame',
  data() {
    return {
      board: [],
      currentPlayer: PLAYER,
      selectedPiece: null,
      legalMoves: [],
      gameOver: false,
      message: '',
      score: 0,
      savedScore: false,
      difficulty: 'Fácil',
      difficulties: ['Fácil', 'Medio', 'Difícil'],
    };
  },
  computed: {
    boardCells() {
      return this.board.flatMap((row, rowIndex) =>
        row.map((piece, colIndex) => ({ row: rowIndex, col: colIndex, piece }))
      );
    },
    playerPieces() {
      return this.countPieces(PLAYER);
    },
    computerPieces() {
      return this.countPieces(COMPUTER);
    },
    canPlayCurrentPlayer() {
      if (this.difficulty === '2 Jugadores') return true;
      return this.currentPlayer === PLAYER;
    },
  },
  mounted() {
    this.resetGame();
  },
  methods: {
    setDifficulty(level) {
      this.difficulty = level;
      this.resetGame();
    },
    resetGame() {
      this.board = Array.from({ length: 8 }, () => Array(8).fill(null));

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
          if (this.isPlayable(row, col)) {
            this.board[row][col] = { player: COMPUTER, king: false };
          }
        }
      }

      for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (this.isPlayable(row, col)) {
            this.board[row][col] = { player: PLAYER, king: false };
          }
        }
      }

      this.currentPlayer = PLAYER;
      this.selectedPiece = null;
      this.legalMoves = [];
      this.gameOver = false;
      this.message = '';
      this.score = 0;
      this.savedScore = false;
    },
    isPlayable(row, col) {
      return (row + col) % 2 === 1;
    },
    countPieces(player) {
      return this.board.flat().filter(piece => piece?.player === player).length;
    },
    handleCellClick(row, col) {
      if (this.gameOver) return;

      if (this.difficulty !== '2 Jugadores' && this.currentPlayer !== PLAYER) return;

      const piece = this.board[row][col];

      if (piece?.player === this.currentPlayer) {
        this.selectPiece(row, col);
        return;
      }

      const move = this.legalMoves.find(item => item.to.row === row && item.to.col === col);
      if (move) {
        this.applyCurrentPlayerMove(move);
      }
    },
    selectPiece(row, col) {
      const allMoves = this.getAllMoves(this.currentPlayer);
      const pieceMoves = allMoves.filter(move => move.from.row === row && move.from.col === col);

      if (pieceMoves.length === 0) return;

      this.selectedPiece = { row, col };
      this.legalMoves = pieceMoves;
    },
    applyCurrentPlayerMove(move) {
      const isPlayer = this.currentPlayer === PLAYER;
      const captured = this.applyMove(move);
      if (captured && isPlayer) this.score += 10;

      const extraCaptures = captured ? this.getMovesForPiece(move.to.row, move.to.col, true) : [];
      if (extraCaptures.length > 0) {
        this.selectedPiece = { ...move.to };
        this.legalMoves = extraCaptures;
        return;
      }

      this.selectedPiece = null;
      this.legalMoves = [];
      this.finishTurn();
    },
    finishTurn() {
      if (this.checkGameOver()) return;

      if (this.difficulty === '2 Jugadores') {
        this.currentPlayer = this.currentPlayer === PLAYER ? COMPUTER : PLAYER;
      } else {
        this.currentPlayer = COMPUTER;
        window.setTimeout(() => {
          this.makeComputerMove();
        }, 450);
      }
    },
    makeComputerMove() {
      if (this.gameOver) return;

      const moves = this.getAllMoves(COMPUTER);
      if (moves.length === 0) {
        this.endGame(true);
        return;
      }

      const captures = moves.filter(move => move.capture);
      let depth = this.difficulty === 'Fácil' ? 0 : this.difficulty === 'Medio' ? 2 : 4;
      let move;

      if (depth === 0) {
        const candidates = captures.length ? captures : moves;
        move = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        move = this.bestMove(moves, depth);
      }

      let captured = this.applyMove(move);
      while (captured) {
        const extraCaptures = this.getMovesForPiece(move.to.row, move.to.col, true);
        if (extraCaptures.length === 0) break;
        move = extraCaptures[Math.floor(Math.random() * extraCaptures.length)];
        captured = this.applyMove(move);
      }

      if (this.checkGameOver()) return;
      this.currentPlayer = PLAYER;
    },
    bestMove(moves, depth) {
      let bestScore = -Infinity;
      let bestMove = moves[0];

      for (const move of moves) {
        const savedBoard = this.board.map(row => row.map(cell => cell ? { ...cell } : null));
        this.applyMove(move);

        let extraCaptures = move.capture ? this.getMovesForPiece(move.to.row, move.to.col, true) : [];
        while (extraCaptures.length > 0) {
          const em = extraCaptures[0];
          this.applyMove(em);
          extraCaptures = this.getMovesForPiece(em.to.row, em.to.col, true);
        }

        const score = depth > 0 ? this.minimax(depth - 1, false) : this.evaluateBoard();
        this.board = savedBoard;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      return bestMove;
    },
    minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
      if (depth === 0) return this.evaluateBoard();

      const player = isMaximizing ? COMPUTER : PLAYER;
      const moves = this.getAllMoves(player);

      if (moves.length === 0) return isMaximizing ? -1000 : 1000;

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
          const savedBoard = this.board.map(row => row.map(cell => cell ? { ...cell } : null));
          this.applyMove(move);
          const eval_ = this.minimax(depth - 1, false, alpha, beta);
          this.board = savedBoard;
          maxEval = Math.max(maxEval, eval_);
          alpha = Math.max(alpha, eval_);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of moves) {
          const savedBoard = this.board.map(row => row.map(cell => cell ? { ...cell } : null));
          this.applyMove(move);
          const eval_ = this.minimax(depth - 1, true, alpha, beta);
          this.board = savedBoard;
          minEval = Math.min(minEval, eval_);
          beta = Math.min(beta, eval_);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    },
    evaluateBoard() {
      let score = 0;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (!piece) continue;
          const value = piece.king ? 5 : 1;
          if (piece.player === COMPUTER) score += value;
          else score -= value;
        }
      }
      return score;
    },
    getAllMoves(player) {
      const moves = [];

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (this.board[row][col]?.player === player) {
            moves.push(...this.getMovesForPiece(row, col));
          }
        }
      }

      const captures = moves.filter(move => move.capture);
      return captures.length ? captures : moves;
    },
    getMovesForPiece(row, col, onlyCaptures = false) {
      const piece = this.board[row][col];
      if (!piece) return [];

      const directions = this.getDirections(piece);
      const captures = [];
      const moves = [];

      directions.forEach(([rowStep, colStep]) => {
        const nextRow = row + rowStep;
        const nextCol = col + colStep;
        const jumpRow = row + rowStep * 2;
        const jumpCol = col + colStep * 2;

        if (!this.isInside(nextRow, nextCol)) return;

        const nextPiece = this.board[nextRow][nextCol];
        if (!nextPiece && !onlyCaptures) {
          moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol }, capture: null });
        }

        if (
          nextPiece &&
          nextPiece.player !== piece.player &&
          this.isInside(jumpRow, jumpCol) &&
          !this.board[jumpRow][jumpCol]
        ) {
          captures.push({
            from: { row, col },
            to: { row: jumpRow, col: jumpCol },
            capture: { row: nextRow, col: nextCol },
          });
        }
      });

      return captures.length ? captures : moves;
    },
    getDirections(piece) {
      if (piece.king) {
        return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      }

      return piece.player === PLAYER ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]];
    },
    isInside(row, col) {
      return row >= 0 && row < 8 && col >= 0 && col < 8;
    },
    applyMove(move) {
      const piece = this.board[move.from.row][move.from.col];
      this.board[move.from.row][move.from.col] = null;
      this.board[move.to.row][move.to.col] = piece;

      if (move.capture) {
        this.board[move.capture.row][move.capture.col] = null;
      }

      if (piece.player === PLAYER && move.to.row === 0) {
        piece.king = true;
        if (this.difficulty !== '2 Jugadores') this.score += 5;
      }
      if (piece.player === COMPUTER && move.to.row === 7) {
        piece.king = true;
      }

      return Boolean(move.capture);
    },
    isMoveTarget(row, col) {
      return this.legalMoves.some(move => move.to.row === row && move.to.col === col);
    },
    checkGameOver() {
      if (this.computerPieces === 0) {
        this.endGame(true);
        return true;
      }

      if (this.playerPieces === 0) {
        this.endGame(false);
        return true;
      }

      if (this.getAllMoves(PLAYER).length === 0) {
        this.endGame(false);
        return true;
      }

      if (this.getAllMoves(COMPUTER).length === 0) {
        this.endGame(true);
        return true;
      }

      return false;
    },
    async endGame(playerWon) {
      this.gameOver = true;
      this.currentPlayer = PLAYER;
      this.selectedPiece = null;
      this.legalMoves = [];

      let finalScore;
      if (this.difficulty === '2 Jugadores') {
        finalScore = playerWon ? 15 : 0;
        this.message = playerWon
          ? 'Blancas ganan!'
          : 'Negras ganan!';
      } else {
        finalScore = playerWon ? this.score + 50 + this.playerPieces * 5 : 0;
        this.message = playerWon
          ? `Has ganado. Puntos: ${finalScore}`
          : 'Has perdido. Puntos: 0';
      }
      this.score = finalScore;

      if (this.savedScore) return;
      this.savedScore = true;

      try {
        await saveGameScore('Damas', finalScore);
      } catch (error) {
        console.error('Error al guardar la puntuación:', error);
      }
    },
  },
};
</script>

<style scoped>
@import '../assets/CSS/damas.css';

.turn-player {
  color: #f0f4f8;
}

.turn-computer {
  color: #7ee8fa;
}
</style>