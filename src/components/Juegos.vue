<template>
  <div>
    <div class="filter-bar">
      <label for="sort-options">Filtrar por:</label>
      <select id="sort-options" v-model="sortOption">
        <option value="default">Predeterminado</option>
        <option value="a-z">A-Z</option>
        <option value="z-a">Z-A</option>
        <option value="favoritos">Favoritos</option>
      </select>
    </div>
    <div v-if="sortOption === 'favoritos' && !isLoggedIn" class="login-hint">
      <router-link to="/login">Inicia sesión</router-link> para ver tus favoritos
    </div>
    <div class="content-custom">
      <div class="games-custom">
        <div v-for="game in sortedGames" :key="game.gameId" class="game-custom">
          <div class="game-img-wrapper">
            <img :src="game.image" :alt="game.name">
            <FavoriteButton :gameId="game.gameId" @toggled="onFavToggled" @achievements="onAchievements" />
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
      unsubscribeAuth: null,
      games: [
        { name: 'Sudoku', image: SudokuImage, link: '/sudoku', gameId: 'sudoku' },
        { name: 'Damas', image: damasImage, link: '/damas', gameId: 'damas' },
        { name: 'Flappy Bird', image: flappyBirdImage, link: '/flappy-bird', gameId: 'flappy_bird' },
        { name: 'Reaction Time', image: reactionTimeImage, link: '/reaction-time', gameId: 'reaction_time' },
        { name: 'Tetris', image: tetrisImage, link: '/tetris', gameId: 'tetris' },
        { name: 'Buscaminas', image: buscaminasImage, link: '/buscaminas', gameId: 'buscaminas' },
        { name: 'Juego 2048', image: juego2048Image, link: '/2048', gameId: '2048' },
        { name: 'Adivinación de números', image: numberGuessingImage, link: '/adivinaNumero', gameId: 'adivina_el_numero' },
        { name: 'Juego de memoria', image: memoryGameImage, link: '/memoria', gameId: 'memoria' },
        { name: 'Adivina el color', image: guessTheColorImage, link: '/color', gameId: 'adivina_el_color' },
        { name: 'Adivina el Pokémon', image: guessPokemonImage, link: '/pokemon', gameId: 'adivina_el_pokemon' },
        { name: 'Golpea al topo', image: topoImage, link: '/topo', gameId: 'golpea_al_topo' },
        { name: 'Ahorcado', image: hangmanImage, link: '/ahorcado', gameId: 'ahorcado' },
        { name: 'Tres en raya', image: tresEnRaya, link: '/tresenraya', gameId: 'tres_en_raya' },
        { name: 'Juego de la serpiente', image: snakeGameImage, link: '/serpiente', gameId: 'snake_game' },
        { name: 'Pong', image: pongImage, link: '/pong', gameId: 'pong' },
      ]
    };
  },
  computed: {
    sortedGames() {
      let list = this.games.slice();
      if (this.sortOption === 'favoritos') {
        list = list.filter(g => this.favorites.includes(g.gameId));
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
      if (user) {
        try {
          this.favorites = await getUserFavorites();
        } catch (e) {
          console.error('Error al cargar favoritos:', e);
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
</style>