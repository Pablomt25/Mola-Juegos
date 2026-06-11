<template>
  <div class="game-chat" v-if="gameId">
    <div class="chat-header" @click="isOpen = !isOpen">
      <span class="chat-title">Chat - {{ gameName }}</span>
      <i :class="isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i>
    </div>
    <div class="chat-body" v-if="isOpen">
      <div class="chat-messages" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg.id" :class="['chat-message', msg.userId === currentUserId ? 'own' : '']">
          <span class="chat-user">{{ msg.nombre }}:</span>
          <span class="chat-text">{{ msg.texto }}</span>
        </div>
        <div v-if="messages.length === 0" class="chat-empty">Sé el primero en escribir</div>
      </div>
      <div class="chat-input-area" v-if="currentUserId">
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Escribe un mensaje..."
          maxlength="200"
        />
        <button @click="sendMessage" :disabled="!newMessage.trim()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
      <div v-else class="chat-login-hint">
        <router-link to="/login">Inicia sesión</router-link> para chatear
      </div>
    </div>
  </div>
</template>

<script>
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export default {
  name: 'GameChat',
  emits: ['sent-message'],
  props: {
    gameId: { type: String, default: '' },
    gameName: { type: String, default: '' },
  },
  data() {
    return {
      messages: [],
      newMessage: '',
      isOpen: false,
      currentUserId: null,
      unsubscribe: null,
    };
  },
  watch: {
    gameId(newVal) {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.messages = [];
      }
      if (newVal) {
        this.listenMessages();
      }
    },
  },
  mounted() {
    this.currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    auth.onAuthStateChanged((user) => {
      this.currentUserId = user ? user.uid : null;
    });
    if (this.gameId) {
      this.listenMessages();
    }
  },
  beforeUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
    listenMessages() {
      if (!this.gameId) return;
      try {
        const chatRef = collection(db, 'chats', this.gameId, 'messages');
        const q = query(chatRef, orderBy('fecha', 'asc'), limit(50));
        this.unsubscribe = onSnapshot(q, (snapshot) => {
          this.messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          this.$nextTick(() => {
            const container = this.$refs.messagesContainer;
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          });
        }, (error) => {
          console.error('Error en chat:', error);
        });
      } catch (error) {
        console.error('Error al conectar al chat:', error);
      }
    },
    async getPlayerName() {
      const user = auth.currentUser;
      if (!user) return 'Anónimo';

      try {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists()) {
          return userDoc.data().nombre || user.email.split('@')[0];
        }
      } catch (e) {
        // fallback
      }
      if (user.displayName) return user.displayName;
      if (user.email) return user.email.split('@')[0];
      return 'Anónimo';
    },
    async sendMessage() {
      const text = this.newMessage.trim();
      if (!text) return;
      const user = auth.currentUser;
      if (!user) return;

      const nombre = await this.getPlayerName();

      this.newMessage = '';
      try {
        await addDoc(collection(db, 'chats', this.gameId, 'messages'), {
          userId: user.uid,
          nombre,
          texto: text,
          fecha: serverTimestamp(),
        });
        this.$emit('sent-message');
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
      }
    },
  },
};
</script>

<style scoped>
.game-chat {
  width: min(100%, 920px);
  margin: 10px auto;
  border: 1px solid #2a3a50;
  border-radius: 10px;
  background: #0d1117;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #1a2738, #0f1923);
  color: #7ee8fa;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  font-size: 14px;
}

.chat-header i {
  font-size: 12px;
}

.chat-body {
  display: flex;
  flex-direction: column;
  height: 240px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  background: #0d1117;
}

.chat-message {
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.4;
  padding: 4px 8px;
  border-radius: 6px;
  background: #161b22;
}

.chat-message.own {
  background: #1a3a5c;
}

.chat-user {
  font-weight: 700;
  color: #7ee8fa;
  margin-right: 4px;
}

.chat-message.own .chat-user {
  color: #f0c040;
}

.chat-text {
  color: #c9d1d9;
}

.chat-empty {
  color: #555;
  text-align: center;
  padding: 30px 0;
  font-size: 13px;
}

.chat-input-area {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  background: #161b22;
  border-top: 1px solid #2a3a50;
}

.chat-input-area input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #2a3a50;
  background: #0d1117;
  color: #c9d1d9;
  font-size: 13px;
  outline: none;
}

.chat-input-area input:focus {
  border-color: #7ee8fa;
}

.chat-input-area button {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: #7ee8fa;
  color: #0d1117;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-input-area button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-input-area button:not(:disabled):hover {
  background: #5cc8e0;
}

.chat-login-hint {
  padding: 10px;
  text-align: center;
  color: #888;
  font-size: 13px;
  border-top: 1px solid #2a3a50;
  background: #161b22;
}

.chat-login-hint a {
  color: #7ee8fa;
  text-decoration: none;
  font-weight: 600;
}

.chat-login-hint a:hover {
  text-decoration: underline;
}
</style>