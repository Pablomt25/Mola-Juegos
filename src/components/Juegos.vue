<template>
  <div>
    <div class="filter-bar">
      <label for="sort-options">Filtrar por:</label>
      <select id="sort-options" v-model="sortOption">
        <option value="default">Predeterminado</option>
        <option value="a-z">A-Z</option>
        <option value="z-a">Z-A</option>
        <option v-if="isLoggedIn && !isAnonymous" value="favoritos">Favoritos</option>
        <option value="multijugador">Multijugador</option>
      </select>
    </div>
    <div v-if="sortOption === 'favoritos' && !isLoggedIn" class="login-hint">
      <router-link to="/login">Inicia sesión</router-link> para ver tus favoritos
    </div>
    <div v-if="sortOption === 'favoritos' && isAnonymous" class="login-hint">
      Modo invitado: los favoritos no están disponibles. <router-link to="/login">Inicia sesión</router-link> para guardar favoritos.
    </div>
    <div class="content-custom">
      <div class="games-custom">
        <div v-for="game in sortedGames" :key="game.gameId" class="game-custom">
          <div class="game-img-wrapper">
            <img :src="game.image" :alt="game.name">
            <FavoriteButton v-if="isLoggedIn && !isAnonymous" :gameId="game.gameId" @toggled="onFavToggled" @achievements="onAchievements" />
            <span v-if="game.multiplayer" class="multiplayer-badge"><i class="fas fa-users"></i> 2P</span>
          </div>
          <h2>{{ game.name }}</h2>
          <button><router-link :to="game.link">Jugar</router-link></button>
        </div>
      </div>
    </div>
    <AchievementNotification ref="achievementNotif" />
  </div>
</template>

<script>
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserFavorites } from '../utils/favoritos';
import { onEvent, removeEventListener } from '../utils/events';
import FavoriteButton from './FavoriteButton.vue';
import AchievementNotification from './AchievementNotification.vue';
import pongImage from '../assets/pong.avif';
import guessTheColorImage from '../assets/guess-the-color.webp';
import guessPokemonImage from '../assets/adivina-pokemon.jpg';
import hangmanImage from '../assets/ahorcado.jpg';
import memoryGameImage from '../assets/memoria.jpg';
import tresEnRaya from '../assets/raya.webp';
import snakeGameImage from '../assets/snake.jpg';
import numberGuessingImage from '../assets/numero.jpg';
import buscaminasImage from '../assets/buscaminas.webp';
import tetrisImage from '../assets/tetris.avif';
import SudokuImage from '../assets/sudoku.avif';
import damasImage from '../assets/damas.png';
import flappyBirdImage from '../assets/flappy-bird.png';
import reactionTimeImage from '../assets/reaction-time.svg';
import topoImage from '../assets/topo.jpg';
import juego2048Image from '../assets/juego2048.avif';

export default {
  components: { FavoriteButton, AchievementNotification },
  data() {
    return {
      sortOption: 'default',
      favorites: [],
      isLoggedIn: false,
      isAnonymous: false,
      unsubscribeAuth: null,
      games: [
        { name: 'Sudoku', image: SudokuImage, link: '/sudoku', gameId: 'sudoku', multiplayer: false },
        { name: 'Damas', image: damasImage, link: '/damas', gameId: 'damas', multiplayer: true },
        { name: 'Flappy Bird', image: flappyBirdImage, link: '/flappy-bird', gameId: 'flappy_bird', multiplayer: false },
        { name: 'Reaction Time', image: reactionTimeImage, link: '/reaction-time', gameId: 'reaction_time', multiplayer: false },
        { name: 'Tetris', image: tetrisImage, link: '/tetris', gameId: 'tetris', multiplayer: false },
        { name: 'Buscaminas', image: buscaminasImage, link: '/buscaminas', gameId: 'buscaminas', multiplayer: false },
        { name: 'Juego 2048', image: juego2048Image, link: '/2048', gameId: '2048', multiplayer: false },
        { name: 'Adivinación de números', image: numberGuessingImage, link: '/adivinaNumero', gameId: 'adivina_el_numero', multiplayer: false },
        { name: 'Juego de memoria', image: memoryGameImage, link: '/memoria', gameId: 'memoria', multiplayer: false },
        { name: 'Adivina el color', image: guessTheColorImage, link: '/color', gameId: 'adivina_el_color', multiplayer: false },
        { name: 'Adivina el Pokémon', image: guessPokemonImage, link: '/pokemon', gameId: 'adivina_el_pokemon', multiplayer: false },
        { name: 'Golpea al topo', image: topoImage, link: '/topo', gameId: 'golpea_al_topo', multiplayer: false },
        { name: 'Ahorcado', image: hangmanImage, link: '/ahorcado', gameId: 'ahorcado', multiplayer: false },
        { name: 'Tres en raya', image: tresEnRaya, link: '/tresenraya', gameId: 'tres_en_raya', multiplayer: true },
        { name: 'Juego de la serpiente', image: snakeGameImage, link: '/serpiente', gameId: 'snake_game', multiplayer: false },
        { name: 'Pong', image: pongImage, link: '/pong', gameId: 'pong', multiplayer: false },
      ]
    };
  },
  computed: {
    sortedGames() {
      let list = this.games.slice();
      if (this.sortOption === 'favoritos') {
        list = list.filter(g => this.favorites.includes(g.gameId));
      } else if (this.sortOption === 'multijugador') {
        list = list.filter(g => g.multiplayer);
      } else if (this.sortOption === 'a-z') {
        list.sort((a, b) => a.name.localeCompare(b.name));
      } else if (this.sortOption === 'z-a') {
        list.sort((a, b) => b.name.localeCompare(a.name));
      }
      return list;
    }
  },
  created() {
    this.unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      this.isLoggedIn = !!user;
      this.isAnonymous = user ? user.isAnonymous : false;
      if (user && !user.isAnonymous) {
        try {
          this.favorites = await getUserFavorites();
        } catch (e) {
          this.favorites = [];
        }
      } else {
        this.favorites = [];
      }
    });
    this._onAchievements = (unlocked) => {
      if (this.$refs.achievementNotif) {
        this.$refs.achievementNotif.show(unlocked);
      }
    };
    onEvent('achievements-unlocked', this._onAchievements);
  },
  beforeUnmount() {
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    removeEventListener('achievements-unlocked', this._onAchievements);
  },
  methods: {
    async onFavToggled() {
      try {
        this.favorites = await getUserFavorites();
      } catch (e) {
        console.error('Error al actualizar favoritos:', e);
      }
    },
    onAchievements(unlocked) {
      if (this.$refs.achievementNotif) {
        this.$refs.achievementNotif.show(unlocked);
      }
    },
  }
};
</script>

<style>
@import '../assets/CSS/juegos.css';

.login-hint {
  text-align: center;
  color: #8b949e;
  padding: 20px 0;
  font-size: 15px;
}

.login-hint a {
  color: #7ee8fa;
  text-decoration: none;
  font-weight: 600;
}

.login-hint a:hover {
  text-decoration: underline;
}

.game-img-wrapper {
  position: relative;
  width: 100%;
}

.game-img-wrapper .fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(13, 17, 23, 0.75);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  z-index: 2;
}

.game-img-wrapper .fav-btn:hover {
  background: rgba(13, 17, 23, 0.9);
}

.multiplayer-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #f0c040, #e6a817);
  color: #0a0e17;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 4px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 3px;
  letter-spacing: 0.5px;
}
</style>