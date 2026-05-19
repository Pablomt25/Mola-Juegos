<template>
  <div class="game-shell checkers-game">
    <h1>Damas</h1>

    <div class="checkers-status">
      <p>Turno: {{ currentPlayer === 'player' ? 'Jugador' : 'Máquina' }}</p>
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
        :disabled="gameOver || currentPlayer !== 'player' || !isPlayable(cell.row, cell.col)"
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
  },
  mounted() {
    this.resetGame();
  },
  methods: {
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
      const piece = this.board[row][col];

      if (piece?.player === PLAYER) {
        this.selectPiece(row, col);
        return;
      }

      const move = this.legalMoves.find(item => item.to.row === row && item.to.col === col);
      if (move) {
        this.applyPlayerMove(move);
      }
    },
    selectPiece(row, col) {
      const allMoves = this.getAllMoves(PLAYER);
      const pieceMoves = allMoves.filter(move => move.from.row === row && move.from.col === col);

      if (pieceMoves.length === 0) return;

      this.selectedPiece = { row, col };
      this.legalMoves = pieceMoves;
    },
    applyPlayerMove(move) {
      const captured = this.applyMove(move);
      if (captured) this.score += 10;

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

      this.currentPlayer = COMPUTER;
      window.setTimeout(() => {
        this.makeComputerMove();
      }, 450);
    },
    makeComputerMove() {
      if (this.gameOver) return;

      const moves = this.getAllMoves(COMPUTER);
      if (moves.length === 0) {
        this.endGame(true);
        return;
      }

      const captures = moves.filter(move => move.capture);
      const candidates = captures.length ? captures : moves;
      let move = candidates[Math.floor(Math.random() * candidates.length)];
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

      if (
        (piece.player === PLAYER && move.to.row === 0) ||
        (piece.player === COMPUTER && move.to.row === 7)
      ) {
        piece.king = true;
        if (piece.player === PLAYER) this.score += 5;
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

      const finalScore = playerWon ? this.score + 50 + this.playerPieces * 5 : 0;
      this.score = finalScore;
      this.message = playerWon
        ? `Has ganado. Puntos: ${finalScore}`
        : 'Has perdido. Puntos: 0';

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

<style>
@import '../assets/CSS/damas.css';
</style>
