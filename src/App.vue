<template>
  <div class="page-container">
    <nav>
      <div class="nav-header">
        <router-link to="/" class="logo-link">
          <img src="./assets/Logo2.png" alt="Logo" width="180px" height="80px">
        </router-link>
        <button class="nav-toggle" @click="toggleNav">
          <i class="fas fa-bars"></i>
        </button>
        <ul class="nav-links" :class="{ 'nav-active': isNavOpen }">
          <li><router-link to="/juegos" @click="closeNav">Juegos</router-link></li>
          <li><router-link to="/misPuntuaciones" @click="closeNav">Mis puntuaciones</router-link></li>
          <li><router-link to="/misLogros" @click="closeNav">Mis logros</router-link></li>
          <li><router-link to="/puntuacionesGlobales" @click="closeNav">Puntuaciones globales</router-link></li>
          <li v-if="isLoggedIn">
            <button @click="logout">{{ isAnonymous ? 'Salir (invitado)' : 'Cerrar sesión' }}</button>
          </li>
          <li v-else>
            <router-link to="/login" @click="closeNav">Iniciar sesión</router-link>
          </li>
        </ul>
      </div>
    </nav>

    <div class="content">
      <router-view />
      <GameChat v-if="currentGameId && isLoggedIn && !isAnonymous" :gameId="currentGameId" :gameName="currentGameName" @sent-message="onChatMessage" />
    </div>

    <AchievementNotification ref="achievementNotif" />

    <footer>
      <div class="footer-content">
        <div class="footer-section">
          <img src="./assets/Logo2.png" alt="Logo">
          <p class="contact-info">
            <i class="fas fa-phone" style="color: #7ee8fa;"></i> +34 345 657 657<br><br>
            <i class="fas fa-envelope" style="color: #7ee8fa;"></i> molajuegos@gmail.com<br>
          </p>
        </div>
        <div class="footer-section">
          <h2>Enlaces</h2>
          <ul>
            <li><router-link to="/" @click="closeNav">Inicio</router-link></li>
            <li><router-link to="/juegos" @click="closeNav">Juegos</router-link></li>
            <li><router-link to="/misPuntuaciones" @click="closeNav">Mis puntuaciones</router-link></li>
            <li><router-link to="/misLogros" @click="closeNav">Mis logros</router-link></li>
            <li><router-link to="/puntuacionesGlobales" @click="closeNav">Puntuaciones Globales</router-link></li>
            <li v-if="!isLoggedIn"><router-link to="/login" @click="closeNav">Iniciar Sesión</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h2>Redes Sociales</h2>
          <div class="social-icons">
            <a href="#"><i class="fab fa-facebook-f"></i></a>
            <a href="#"><i class="fab fa-twitter"></i></a>
            <a href="#"><i class="fab fa-whatsapp"></i></a>
            <a href="#"><i class="fab fa-instagram"></i></a>
          </div>
        </div>
        <div class="footer-section">
          <h2>Contáctanos</h2>
          <form>
            <input type="text" placeholder="Nombre">
            <input type="email" placeholder="Email">
            <button type="submit">ENVIAR</button>
          </form>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import GameChat from './components/GameChat.vue';
import AchievementNotification from './components/AchievementNotification.vue';
import { checkAndUnlockAchievements } from './utils/logros';
import { onEvent, emitEvent } from './utils/events';

export default {
  components: { GameChat, AchievementNotification },
  setup() {
    const isLoggedIn = ref(false);
    const isAnonymous = ref(false);
    const isNavOpen = ref(false);
    const router = useRouter();
    const route = useRoute();
    const achievementNotif = ref(null);

    const currentGameId = computed(() => route.meta.gameId || '');
    const currentGameName = computed(() => route.meta.gameName || '');

    onAuthStateChanged(auth, (user) => {
      isLoggedIn.value = !!user;
      isAnonymous.value = user ? user.isAnonymous : false;
    });

    const logout = async () => {
      try {
        await signOut(auth);
        isLoggedIn.value = false;
        isAnonymous.value = false;
        router.push('/');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    };

    const toggleNav = () => {
      isNavOpen.value = !isNavOpen.value;
    };

    const closeNav = () => {
      isNavOpen.value = false;
    };

    const onChatMessage = async () => {
      const unlocked = await checkAndUnlockAchievements({ sentChat: true });
      if (unlocked.length > 0 && achievementNotif.value) {
        achievementNotif.value.show(unlocked);
      }
    };

    const onAchievementsBus = (unlocked) => {
      if (achievementNotif.value) {
        achievementNotif.value.show(unlocked);
      }
    };

    onMounted(() => {
      onEvent('achievements-unlocked', onAchievementsBus);
    });

    onUnmounted(() => {
      // cleanup handled by onEvent return
    });

    return { isLoggedIn, isAnonymous, isNavOpen, toggleNav, logout, closeNav, currentGameId, currentGameName, achievementNotif, onChatMessage };
  },
};
</script>

<style>
@import '/src/assets/CSS/app.css';
</style>