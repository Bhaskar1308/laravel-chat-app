/* resources/js/app.js
   Vue 3 + Axios + Laravel Echo (Pusher protocol) + JWT auth
------------------------------------------------------------------ */

import { createApp, ref } from 'vue';
import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

/* -----------------------------------------------------------------
   1. Axios  ─────────────────────────────────────────────────────── */
const API_BASE_URL = 'http://127.0.0.1:8000';   // Laravel app
axios.defaults.baseURL = API_BASE_URL;

const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/* Optional: auto‑logout on 401 */
axios.interceptors.response.use(
    resp => resp,
    err  => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/';   // back to login
        }
        return Promise.reject(err);
    }
);

/* -----------------------------------------------------------------
   2. Echo (WebSockets via Laravel‑WebSockets)  ──────────────────── */
window.Pusher = Pusher;                     // Echo expects this global

window.Echo = new Echo({
    broadcaster: 'pusher',
    key:          'local-chat-key',         // from .env
    cluster:      'mt1',                    // 👈 ADD THIS LINE (must match .env)
    wsHost:       '127.0.0.1',
    wsPort:       6001,
    forceTLS:     false,
    disableStats: true,
    enabledTransports: ['ws'],
    authEndpoint: API_BASE_URL + '/broadcasting/auth',
    auth: {
        headers: { Authorization: `Bearer ${token}` },
    },
});


/* -----------------------------------------------------------------
   3. Vue Components  ────────────────────────────────────────────── */
const Auth = {
    setup() {
        const name      = ref('');
        const email     = ref('');
        const password  = ref('');
        const isLogin   = ref(true);
        const error     = ref('');

        const submit = async () => {
            try {
                const url  = isLogin.value ? '/api/login' : '/api/register';
                const data = isLogin.value
                    ? { email: email.value,  password: password.value }
                    : { name:  name.value,   email: email.value, password: password.value };

                const res = await axios.post(url, data);
                localStorage.setItem('token', res.data.token);
                location.href = '/chat';
            } catch (e) {
                error.value =
                    e.response?.data?.error || e.response?.data?.message || 'Something went wrong';
            }
        };

        return { name, email, password, isLogin, error, submit };
    },
    template: `
    <div class="max-w-md mx-auto mt-20 p-4 border rounded shadow">
      <h2 class="text-xl mb-4 text-center">{{ isLogin ? 'Login' : 'Register' }}</h2>
      <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>

      <div v-if="!isLogin">
        <input v-model="name"  placeholder="Name"     class="w-full p-2 mb-2 border rounded" />
      </div>
      <input v-model="email"    type="email"    placeholder="Email"    class="w-full p-2 mb-2 border rounded" />
      <input v-model="password" type="password" placeholder="Password" class="w-full p-2 mb-4 border rounded" />

      <button @click="submit" class="w-full bg-blue-600 text-white p-2 rounded">
        {{ isLogin ? 'Login' : 'Register' }}
      </button>

      <div class="text-center mt-2">
        <button @click="isLogin = !isLogin" class="text-blue-500 underline text-sm">
          {{ isLogin ? 'Create an account' : 'Already have an account?' }}
        </button>
      </div>
    </div>`
};

const Chat = {
    data() {
        return { messages: [], text: '' };
    },
   mounted() {
    axios.get('/api/messages').then(r => (this.messages = r.data));

    // ✅ Test JWT token and /api/me auth route
    axios.get('/api/me')
      .then(res => console.log('✅ JWT auth success:', res.data))
      .catch(err => console.error('❌ JWT auth failed:', err.response?.data || err));

    window.Echo.join('chatroom')
        .here(users => console.log('Users in room:', users))
        .listen('ChatMessageSent', e => this.messages.push(e));
},

    methods: {
        send() {
            if (!this.text.trim()) return;
            axios.post('/api/messages', { body: this.text }).then(r => {
                this.messages.push(r.data);
                this.text = '';
            });
        },
    },
    template: `
    <div class="p-4 max-w-xl mx-auto">
      <h1 class="text-2xl mb-4">Chat</h1>

      <div class="border h-64 overflow-y-auto mb-2 p-2 rounded">
        <div v-for="m in messages" :key="m.id" class="mb-1">
          <strong>{{ m.user.name }}:</strong> {{ m.body }}
        </div>
      </div>

      <div class="flex gap-2">
        <input v-model="text" @keyup.enter="send" class="flex-1 border rounded p-2"
               placeholder="Say something…" />
        <button @click="send" class="bg-blue-500 text-white px-4 rounded">Send</button>
      </div>
    </div>`
};

/* -----------------------------------------------------------------
   4. Mount App  ─────────────────────────────────────────────────-- */
const path = window.location.pathname;
createApp(path === '/chat' ? Chat : Auth).mount('#app');
