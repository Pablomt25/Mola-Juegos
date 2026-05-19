<template>
  <div class="game-shell flappy-game">
    <h1>Flappy Bird</h1>

    <div class="flappy-status">
      <p>Puntuación: {{ score }}</p>
      <p>Mejor partida: {{ bestScore }}</p>
    </div>

    <canvas
      ref="canvas"
      class="flappy-canvas"
      width="420"
      height="560"
      tabindex="0"
      @click="flap"
      @keydown.space.prevent="flap"
      @keydown.enter.prevent="flap"
    ></canvas>

    <div v-if="!started && !gameOver" class="game-panel">
      <p>Pulsa espacio, enter o haz clic para empezar.</p>
    </div>

    <div v-if="gameOver" class="game-over-message">
      <p>Fin del juego. Puntos: {{ score }}</p>
      <button @click="restartGame">Volver a jugar</button>
    </div>
  </div>
</template>

<script>
import { saveGameScore } from '../utils/ranking';

const WIDTH = 420;
const HEIGHT = 560;
const GROUND_HEIGHT = 72;

const BIRD_X = 104;
const BIRD_SIZE = 26;

// MÁS FÁCIL
const GRAVITY = 0.28;
const FLAP_FORCE = -6.8;

const PIPE_WIDTH = 66;
const PIPE_GAP = 190;
const PIPE_DISTANCE = 260;
const PIPE_SPEED = 1.9;

export default {
  name: 'FlappyBirdGame',

  data() {
    return {
      ctx: null,
      animationFrame: null,

      birdY: HEIGHT / 2,
      velocity: 0,

      pipes: [],

      score: 0,
      bestScore: 0,

      started: false,
      gameOver: false,
      savedScore: false,
    };
  },

  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d');

    this.bestScore = Number(
      localStorage.getItem('flappyBestScore') || 0
    );

    this.resetState();

    this.$refs.canvas.focus();

    this.update = this.update.bind(this);

    this.animationFrame = requestAnimationFrame(this.update);
  },

  beforeUnmount() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  },

  methods: {
    resetState() {
      this.birdY = HEIGHT / 2;
      this.velocity = 0;

      this.pipes = [
        this.createPipe(WIDTH + 80),
        this.createPipe(WIDTH + 80 + PIPE_DISTANCE),
      ];

      this.score = 0;
      this.started = false;
      this.gameOver = false;
      this.savedScore = false;

      this.draw();
    },

    createPipe(x) {
      const minTop = 72;

      const maxTop =
        HEIGHT - GROUND_HEIGHT - PIPE_GAP - 72;

      return {
        x,
        topHeight:
          Math.floor(
            Math.random() * (maxTop - minTop + 1)
          ) + minTop,

        passed: false,
      };
    },

    flap() {
      if (this.gameOver) return;

      this.started = true;

      // SALTO MÁS SUAVE
      this.velocity = Math.min(
        this.velocity + FLAP_FORCE,
        FLAP_FORCE
      );

      this.$refs.canvas.focus();
    },

    update() {
      if (this.started && !this.gameOver) {
        this.velocity += GRAVITY;

        this.birdY += this.velocity;

        this.movePipes();

        this.checkCollisions();
      }

      this.draw();

      if (!this.gameOver) {
        this.animationFrame =
          requestAnimationFrame(this.update);
      }
    },

    movePipes() {
      this.pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED;

        if (
          !pipe.passed &&
          pipe.x + PIPE_WIDTH < BIRD_X
        ) {
          pipe.passed = true;
          this.score++;
        }
      });

      if (this.pipes[0].x + PIPE_WIDTH < 0) {
        this.pipes.shift();

        this.pipes.push(
          this.createPipe(
            this.pipes[this.pipes.length - 1].x +
              PIPE_DISTANCE
          )
        );
      }
    },

    checkCollisions() {
      const birdTop =
        this.birdY - BIRD_SIZE / 2;

      const birdBottom =
        this.birdY + BIRD_SIZE / 2;

      const groundTop =
        HEIGHT - GROUND_HEIGHT;

      // TECHO O SUELO
      if (
        birdTop <= 0 ||
        birdBottom >= groundTop
      ) {
        this.endGame();
        return;
      }

      const birdLeft =
        BIRD_X - BIRD_SIZE / 2;

      const birdRight =
        BIRD_X + BIRD_SIZE / 2;

      const hitPipe = this.pipes.some(pipe => {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;

        const gapTop = pipe.topHeight;
        const gapBottom =
          pipe.topHeight + PIPE_GAP;

        const overlapsX =
          birdRight > pipeLeft &&
          birdLeft < pipeRight;

        // AYUDA INVISIBLE
        const margin = 6;

        const outsideGap =
          birdTop < gapTop - margin ||
          birdBottom > gapBottom + margin;

        return overlapsX && outsideGap;
      });

      if (hitPipe) {
        this.endGame();
      }
    },

    async endGame() {
      this.gameOver = true;
      this.started = false;

      if (this.score > this.bestScore) {
        this.bestScore = this.score;

        localStorage.setItem(
          'flappyBestScore',
          String(this.bestScore)
        );
      }

      if (this.savedScore) return;

      this.savedScore = true;

      try {
        await saveGameScore(
          'Flappy Bird',
          this.score
        );
      } catch (error) {
        console.error(
          'Error al guardar la puntuación:',
          error
        );
      }
    },

    restartGame() {
      if (this.animationFrame) {
        cancelAnimationFrame(
          this.animationFrame
        );
      }

      this.resetState();

      this.$nextTick(() => {
        this.$refs.canvas.focus();

        this.animationFrame =
          requestAnimationFrame(this.update);
      });
    },

    draw() {
      const ctx = this.ctx;

      if (!ctx) return;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      this.drawBackground(ctx);

      this.drawPipes(ctx);

      this.drawBird(ctx);

      this.drawGround(ctx);
    },

    drawBackground(ctx) {
      ctx.fillStyle = '#bfdbfe';

      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle =
        'rgba(255, 255, 255, 0.82)';

      this.drawCloud(ctx, 78, 86, 1);

      this.drawCloud(ctx, 285, 138, 0.85);
    },

    drawCloud(ctx, x, y, scale) {
      ctx.beginPath();

      ctx.arc(
        x,
        y,
        18 * scale,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 22 * scale,
        y - 10 * scale,
        24 * scale,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 52 * scale,
        y,
        18 * scale,
        0,
        Math.PI * 2
      );

      ctx.rect(
        x,
        y - 4 * scale,
        54 * scale,
        20 * scale
      );

      ctx.fill();
    },

    drawPipes(ctx) {
      this.pipes.forEach(pipe => {
        const bottomY =
          pipe.topHeight + PIPE_GAP;

        const bottomHeight =
          HEIGHT -
          GROUND_HEIGHT -
          bottomY;

        ctx.fillStyle = '#2563eb';

        ctx.fillRect(
          pipe.x,
          0,
          PIPE_WIDTH,
          pipe.topHeight
        );

        ctx.fillRect(
          pipe.x,
          bottomY,
          PIPE_WIDTH,
          bottomHeight
        );

        ctx.fillStyle = '#1d4ed8';

        ctx.fillRect(
          pipe.x - 5,
          pipe.topHeight - 22,
          PIPE_WIDTH + 10,
          22
        );

        ctx.fillRect(
          pipe.x - 5,
          bottomY,
          PIPE_WIDTH + 10,
          22
        );
      });
    },

    drawBird(ctx) {
      ctx.save();

      ctx.translate(BIRD_X, this.birdY);

      ctx.rotate(
        Math.max(
          -0.5,
          Math.min(0.7, this.velocity / 12)
        )
      );

      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 4;

      ctx.beginPath();

      ctx.ellipse(
        0,
        0,
        21,
        16,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde68a';

      ctx.beginPath();

      ctx.ellipse(
        -8,
        5,
        11,
        8,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';

      ctx.beginPath();

      ctx.arc(8, -6, 5, 0, Math.PI * 2);

      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1f2937';

      ctx.beginPath();

      ctx.arc(10, -6, 2, 0, Math.PI * 2);

      ctx.fill();

      ctx.fillStyle = '#f97316';

      ctx.beginPath();

      ctx.moveTo(20, 0);
      ctx.lineTo(35, 7);
      ctx.lineTo(20, 13);

      ctx.closePath();

      ctx.fill();
      ctx.stroke();

      ctx.restore();
    },

    drawGround(ctx) {
      ctx.fillStyle = '#86efac';

      ctx.fillRect(
        0,
        HEIGHT - GROUND_HEIGHT,
        WIDTH,
        GROUND_HEIGHT
      );

      ctx.fillStyle = '#22c55e';

      ctx.fillRect(
        0,
        HEIGHT - GROUND_HEIGHT,
        WIDTH,
        10
      );
    },
  },
};
</script>

<style>
@import '../assets/CSS/flappy-bird.css';
</style>