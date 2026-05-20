<template>
  <div class="game-container">
    <h1>🟣 Tetris</h1>

    <div class="layout">
      <!-- HOLD -->
      <div class="side">
        <h3>Hold (C)</h3>
        <canvas ref="holdCanvas" width="80" height="80"></canvas>
      </div>

      <!-- TABLERO -->
      <canvas ref="canvas" width="200" height="400"></canvas>

      <!-- NEXT -->
      <div class="side">
        <h3>Siguientes</h3>
        <canvas ref="nextCanvas" width="80" height="240"></canvas>
      </div>
    </div>
    <!-- CONTROLES MÓVIL -->
<div class="mobile-controls">
  <button @click="moveLeft">⬅️</button>

  <button @click="rotatePiece">🔄</button>

  <button @click="moveRight">➡️</button>

  <button @click="drop">⬇️</button>

  <button @click="hardDrop">⚡</button>

  <button @click="hold">🟪</button>
</div>

    <p>🏆 Puntuación: {{ score }}</p>
    
    <div v-if="gameOver" class="game-over-message">
      <p>Fin del juego. Puntos: {{ score }}</p>
      <button @click="resetGame">Volver a jugar</button>
    </div>
  </div>
</template>

<script>
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const COLS = 10;
const ROWS = 20;
const BLOCK = 20;

const SHAPES = {
  I: { color: '#00f0f0', shape: [[1,1,1,1]] },
  J: { color: '#0000f0', shape: [[1,0,0],[1,1,1]] },
  L: { color: '#f0a000', shape: [[0,0,1],[1,1,1]] },
  O: { color: '#f0f000', shape: [[1,1],[1,1]] },
  S: { color: '#00f000', shape: [[0,1,1],[1,1,0]] },
  T: { color: '#a000f0', shape: [[0,1,0],[1,1,1]] },
  Z: { color: '#f00000', shape: [[1,1,0],[0,1,1]] }
};

export default {
  data() {
    return {
      board: [],
      piece: null,
      nextQueue: [],
      holdPiece: null,
      canHold: true,
      score: 0,
      dropInterval: 800,
      dropCounter: 0,
      lastTime: 0,
      gameOver: false,
      animationFrame: null
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.init();
      window.addEventListener('keydown', this.handleKey);
    });
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKey);
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  },

  methods: {
    init() {
      this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      this.nextQueue = [];
      for (let i = 0; i < 3; i++) this.nextQueue.push(this.randomPiece());
      this.score = 0;
      this.dropInterval = 800;
      this.dropCounter = 0;
      this.lastTime = 0;
      this.gameOver = false;
      this.holdPiece = null;
      this.canHold = true;
      this.spawnPiece();
      this.animationFrame = requestAnimationFrame((t) => this.update(t));
    },

    randomPiece() {
      const keys = Object.keys(SHAPES);
      const rand = keys[Math.floor(Math.random() * keys.length)];
      const p = SHAPES[rand];
      return { shape: p.shape.map(r => [...r]), color: p.color, x: Math.floor(COLS/2)-1, y: 0 };
    },

    spawnPiece() {
      this.piece = this.nextQueue.shift();
      this.piece.x = Math.floor(COLS/2)-1;
      this.piece.y = 0;
      this.nextQueue.push(this.randomPiece());
      this.canHold = true;
      if (this.collide()) this.endGame();
    },

    update(time = 0) {
      const delta = time - this.lastTime;
      this.lastTime = time;
      this.dropCounter += delta;

      if (this.dropCounter > this.dropInterval) this.drop();

      this.draw();

      if (!this.gameOver) this.animationFrame = requestAnimationFrame((t) => this.update(t));
    },

    moveLeft() {
  if (this.gameOver) return;

  this.piece.x--;

  if (this.collide()) {
    this.piece.x++;
  }
},

moveRight() {
  if (this.gameOver) return;

  this.piece.x++;

  if (this.collide()) {
    this.piece.x--;
  }
},

    drop() {
      this.piece.y++;
      if (this.collide()) {
        this.piece.y--;
        this.merge();
        this.clearLines();
        this.spawnPiece();
      }
      this.dropCounter = 0;
    },

    hardDrop() {
      while (!this.collide()) this.piece.y++;
      this.piece.y--;
      this.merge();
      this.clearLines();
      this.spawnPiece();
    },

    rotate(matrix) { return matrix[0].map((_,i)=>matrix.map(r=>r[i]).reverse()); },
    rotatePiece() {
      const rotated = this.rotate(this.piece.shape);
      const orig = this.piece.shape;
      this.piece.shape = rotated;
      if (this.collide()) this.piece.shape = orig;
    },

    hold() {
      if (!this.canHold) return;
      if (!this.holdPiece) {
        this.holdPiece = this.piece;
        this.spawnPiece(); 
      } else {
        const temp = this.piece;
        this.piece = this.holdPiece;
        this.piece.x = Math.floor(COLS/2)-1;
        this.piece.y = 0;
        this.holdPiece = temp;
      }
      this.canHold = false;
    },

    collide() {
      return this.piece.shape.some((row,y)=>
        row.some((v,x)=>{
          if (!v) return false;
          const newX = x + this.piece.x;
          const newY = y + this.piece.y;
          return newX<0 || newX>=COLS || newY>=ROWS || (newY>=0 && this.board[newY][newX]);
        })
      );
    },

    merge() {
      this.piece.shape.forEach((row,y)=>{
        row.forEach((v,x)=>{
          if(v) this.board[y+this.piece.y][x+this.piece.x]=this.piece.color;
        });
      });
    },

    clearLines() {
  let linesCleared = 0;
  this.board = this.board.filter(row => {
    if (row.every(cell => cell!==null)) { 
      linesCleared++; 
      return false; 
    }
    return true;
  });
  while(this.board.length<ROWS) this.board.unshift(Array(COLS).fill(null));

  if (linesCleared > 0) {
    const points = [0, 100, 300, 500, 800]; // puntos por 1,2,3,4 filas
    this.score += points[linesCleared];
  }
},


    drawGhost(ctx) {
      let ghostY = this.piece.y;
      while(!this.collideGhost(ghostY)) ghostY++;
      ghostY--;
      ctx.globalAlpha = 0.3;
      this.piece.shape.forEach((row,y)=>{
        row.forEach((v,x)=>{
          if(v){
            ctx.fillStyle = this.piece.color;
            ctx.fillRect((x+this.piece.x)*BLOCK,(y+ghostY)*BLOCK,BLOCK,BLOCK);
            ctx.strokeStyle = '#111';
            ctx.strokeRect((x+this.piece.x)*BLOCK,(y+ghostY)*BLOCK,BLOCK,BLOCK);
          }
        });
      });
      ctx.globalAlpha = 1;
    },

    collideGhost(testY) {
      return this.piece.shape.some((row,y)=>
        row.some((v,x)=>{
          if(!v) return false;
          const newX = x + this.piece.x;
          const newY = y + testY;
          return newY>=ROWS || (newY>=0 && this.board[newY][newX]);
        })
      );
    },

    drawMini(canvas, piece, offsetY=0) {
      if(!piece) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      piece.shape.forEach((row,y)=>{
        row.forEach((v,x)=>{
          if(v){
            ctx.fillStyle = piece.color;
            ctx.fillRect(x*20, y*20 + offsetY, 20, 20);
            ctx.strokeStyle = '#111';
            ctx.strokeRect(x*20, y*20 + offsetY, 20, 20);
          }
        });
      });
    },

    draw() {
      const ctx = this.$refs.canvas.getContext('2d');
      ctx.clearRect(0,0,200,400);

      // tablero
      this.board.forEach((row,y)=>{
        row.forEach((color,x)=>{
          if(color){
            ctx.fillStyle=color;
            ctx.fillRect(x*BLOCK, y*BLOCK, BLOCK, BLOCK);
            ctx.strokeStyle='#111';
            ctx.strokeRect(x*BLOCK, y*BLOCK, BLOCK, BLOCK);
          }
        });
      });

      // sombra
      this.drawGhost(ctx);

      // pieza actual
      this.piece.shape.forEach((row,y)=>{
        row.forEach((v,x)=>{
          if(v){
            ctx.fillStyle = this.piece.color;
            ctx.fillRect((x+this.piece.x)*BLOCK,(y+this.piece.y)*BLOCK,BLOCK,BLOCK);
            ctx.strokeStyle = '#111';
            ctx.strokeRect((x+this.piece.x)*BLOCK,(y+this.piece.y)*BLOCK,BLOCK,BLOCK);
          }
        });
      });

      // hold
      this.drawMini(this.$refs.holdCanvas,this.holdPiece);

      // siguientes 3 piezas
      this.nextQueue.forEach((p,i)=>this.drawMini(this.$refs.nextCanvas,p,i*70));
    },

    async endGame() {
      this.gameOver = true;
      const user = auth.currentUser;
      if(user){
        await addDoc(collection(db,'ranking'),{
          userId: user.uid,
          nombre: user.email.split('@')[0],
          puntos: this.score,
          fecha: serverTimestamp(),
          juego:'Tetris'
        });
      }
    },

    handleKey(e){
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","c","C"].includes(e.key)) e.preventDefault();
      if(this.gameOver) return;

      if(e.key==='ArrowLeft'){ this.piece.x--; if(this.collide()) this.piece.x++; }
      if(e.key==='ArrowRight'){ this.piece.x++; if(this.collide()) this.piece.x--; }
      if(e.key==='ArrowDown'){ this.drop(); }
      if(e.key==='ArrowUp'){ this.rotatePiece(); }
      if(e.key===' '){ this.hardDrop(); }
      if(e.key==='c' || e.key==='C'){ this.hold(); }
    },

    resetGame(){ this.init(); }
  }
};
</script>

<style scoped>
* {
  touch-action: manipulation;
}

.game-container{
  text-align:center;
  overflow-x:auto;
}

.layout{
  display:flex;
  justify-content:center;
  align-items:flex-start;
  gap:clamp(10px, 3vw, 20px);
  width:max-content;
  max-width:100%;
  margin:0 auto;
}

.side{
  display:flex;
  flex-direction:column;
  align-items:center;
}

canvas{
  background:#111;
  border:3px solid #444;
}

@media (max-width: 520px) {
  .layout {
    transform: scale(0.86);
    transform-origin: top center;
    margin-bottom: -36px;
  }

  .side h3 {
    font-size: 14px;
  }
}
/* CONTROLES MÓVIL */

.mobile-controls {
  display: none;
}

@media (max-width: 768px) {

  .layout {
    transform: scale(0.82);
    transform-origin: top center;
    margin-bottom: -30px;
  }

  .mobile-controls {
    display: grid;
    grid-template-columns: repeat(3, 70px);
    justify-content: center;
    gap: 10px;

    margin-top: 20px;
    margin-bottom: 10px;
  }

  .mobile-controls button {
    width: 70px;
    height: 55px;

    border: none;
    border-radius: 10px;

    background: #2563eb;
    color: white;

    font-size: 22px;
    font-weight: bold;

    cursor: pointer;

    transition: 0.15s;
    -webkit-tap-highlight-color: transparent;
touch-action: manipulation;
user-select: none;
-webkit-user-select: none;
  }

  .mobile-controls button:active {
    transform: scale(0.92);
    background: #1d4ed8;
  }
}

@media (max-width: 480px) {

  .layout {
    transform: scale(0.72);
    margin-bottom: -55px;
  }

  .mobile-controls {
    grid-template-columns: repeat(3, 60px);
    gap: 8px;
  }

  .mobile-controls button {
    width: 60px;
    height: 50px;
    font-size: 20px;
  }
}
</style>
