<template>
  <button class="fav-btn" :class="{ active: isFav }" @click.stop="toggle" :title="isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'">
    <i :class="isFav ? 'fas fa-heart' : 'far fa-heart'"></i>
  </button>
</template>

<script>
import { isFavorite, toggleFavorite } from '../utils/favoritos';
import { checkAndUnlockAchievements } from '../utils/logros';
import { emitEvent } from '../utils/events';

export default {
  name: 'FavoriteButton',
  props: {
    gameId: { type: String, required: true },
  },
  data() {
    return {
      isFav: false,
    };
  },
  mounted() {
    this.checkFav();
  },
  watch: {
    gameId() {
      this.checkFav();
    },
  },
  methods: {
    async checkFav() {
      try {
        this.isFav = await isFavorite(this.gameId);
      } catch (e) {
        this.isFav = false;
      }
    },
    async toggle() {
      try {
        const becameFav = await toggleFavorite(this.gameId);
        this.isFav = becameFav;
        if (becameFav) {
          const unlocked = await checkAndUnlockAchievements({ addedFavorite: true });
          if (unlocked.length > 0) {
            emitEvent('achievements-unlocked', unlocked);
          }
        }
        this.$emit('toggled', this.isFav);
      } catch (e) {
        console.error('Error al toggle favorito:', e);
      }
    },
  },
};
</script>

<style scoped>
.fav-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 22px;
  color: #555;
  transition: all 0.3s ease;
  padding: 6px;
}

.fav-btn:hover {
  color: #e74c3c;
  transform: scale(1.2);
}

.fav-btn.active {
  color: #e74c3c;
  animation: fav-pop 0.4s ease;
}

@keyframes fav-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.35); }
  100% { transform: scale(1); }
}
</style>