<template>
  <div class="mis-logros">
    <h1>Mis Logros</h1>
    <div v-if="cargando" class="no-logros">Cargando logros...</div>
    <div v-else-if="!isLoggedIn" class="no-logros">Inicia sesión para ver tus logros.</div>
    <div v-else class="logros-grid">
      <div v-for="ach in allAchievements" :key="ach.id" class="logro-card" :class="{ unlocked: unlockedIds.includes(ach.id) }">
        <div class="logro-icon">
          <i class="fas" :class="ach.icono"></i>
        </div>
        <div class="logro-info">
          <h2>{{ ach.nombre }}</h2>
          <p>{{ ach.descripcion }}</p>
          <span v-if="unlockedIds.includes(ach.id)" class="logro-date">
            Desbloqueado {{ formatFecha(unlockedMap[ach.id]) }}
          </span>
          <span v-else class="logro-locked">Bloqueado</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getAchievementDefs, getUserAchievements } from '../utils/logros';

export default {
  name: 'MisLogros',
  data() {
    return {
      allAchievements: getAchievementDefs(),
      unlockedMap: {},
      isLoggedIn: false,
      cargando: true,
      unsubscribeAuth: null,
    };
  },
  computed: {
    unlockedIds() {
      return Object.keys(this.unlockedMap);
    },
  },
  mounted() {
    this.unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.isLoggedIn = true;
        await this.loadAchievements();
      } else {
        this.isLoggedIn = false;
        this.unlockedMap = {};
      }
      this.cargando = false;
    });
  },
  beforeUnmount() {
    if (this.unsubscribeAuth) this.unsubscribeAuth();
  },
  methods: {
    async loadAchievements() {
      try {
        const achievements = await getUserAchievements();
        this.unlockedMap = {};
        achievements.forEach(a => {
          this.unlockedMap[a.achievementId] = a.fecha || '';
        });
      } catch (error) {
        console.error('Error al cargar logros:', error);
      }
    },
    formatFecha(timestamp) {
      if (!timestamp) return '';
      if (timestamp.toDate) timestamp = timestamp.toDate();
      if (typeof timestamp === 'string') return '';
      try {
        return ' el ' + new Date(timestamp).toLocaleDateString('es-ES');
      } catch {
        return '';
      }
    },
  },
};
</script>

<style scoped>
.mis-logros {
  width: min(100%, 1000px);
  margin: 0 auto;
  padding: clamp(16px, 3vw, 28px);
  text-align: center;
}

h1 {
  font-family: 'Orbitron', sans-serif;
  color: #f0c040;
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  margin: 0 0 24px;
  text-shadow: 0 0 15px rgba(240, 192, 64, 0.3);
}

.no-logros {
  color: #8b949e;
  font-size: 16px;
  padding: 40px 0;
}

.logros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.logro-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(145deg, #161b22, #0d1117);
  border: 1px solid #2a3a50;
  border-radius: 10px;
  padding: 16px;
  text-align: left;
  transition: all 0.3s;
}

.logro-card.unlocked {
  border-color: #f0c040;
  box-shadow: 0 0 12px rgba(240, 192, 64, 0.15);
}

.logro-card:not(.unlocked) {
  opacity: 0.45;
  filter: grayscale(0.8);
}

.logro-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a2738;
  font-size: 20px;
}

.logro-card.unlocked .logro-icon {
  background: linear-gradient(135deg, #f0c040, #e6a817);
  color: #0a0e17;
}

.logro-card:not(.unlocked) .logro-icon {
  color: #555;
}

.logro-info {
  min-width: 0;
}

.logro-info h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  margin: 0 0 4px;
  color: #e6edf3;
}

.logro-card.unlocked .logro-info h2 {
  color: #f0c040;
}

.logro-info p {
  margin: 0 0 4px;
  font-size: 13px;
  color: #8b949e;
}

.logro-date {
  font-size: 11px;
  color: #3fb950;
}

.logro-locked {
  font-size: 11px;
  color: #555;
}

@media (max-width: 520px) {
  .logros-grid {
    grid-template-columns: 1fr;
  }
}
</style>