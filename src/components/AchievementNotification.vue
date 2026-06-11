<template>
  <transition-group name="achievement-slide" tag="div" class="achievement-notifications">
    <div v-for="achievement in visibleAchievements" :key="achievement.id" class="achievement-toast" @click="dismiss(achievement.id)">
      <i class="fas" :class="achievement.icono" style="color: #f0c040;"></i>
      <div class="achievement-toast-text">
        <strong>{{ achievement.nombre }}</strong>
        <span>{{ achievement.descripcion }}</span>
      </div>
    </div>
  </transition-group>
</template>

<script>
export default {
  name: 'AchievementNotification',
  data() {
    return {
      visibleAchievements: [],
    };
  },
  methods: {
    show(achievements) {
      achievements.forEach((a) => {
        this.visibleAchievements.push({ ...a, _key: Date.now() + Math.random() });
        setTimeout(() => {
          this.dismiss(a.id);
        }, 4000);
      });
    },
    dismiss(id) {
      const idx = this.visibleAchievements.findIndex(a => a.id === id);
      if (idx !== -1) this.visibleAchievements.splice(idx, 1);
    },
  },
};
</script>

<style scoped>
.achievement-notifications {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.achievement-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #1a2738, #0d1117);
  border: 1px solid #f0c040;
  border-radius: 10px;
  padding: 12px 18px;
  min-width: 260px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(240, 192, 64, 0.25);
  animation: slide-in 0.4s ease;
}

.achievement-toast i {
  font-size: 24px;
}

.achievement-toast-text {
  display: flex;
  flex-direction: column;
  color: #e6edf3;
  font-size: 13px;
}

.achievement-toast-text strong {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  color: #f0c040;
}

.achievement-toast-text span {
  color: #8b949e;
}

.achievement-slide-enter-active {
  animation: slide-in 0.4s ease;
}

.achievement-slide-leave-active {
  animation: slide-out 0.3s ease;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@media (max-width: 520px) {
  .achievement-notifications {
    top: 70px;
    right: 10px;
    left: 10px;
  }

  .achievement-toast {
    min-width: auto;
  }
}
</style>