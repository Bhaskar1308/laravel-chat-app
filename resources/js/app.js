import { createApp, ref } from 'vue';
import axios from 'axios';
import Echo from 'laravel-echo';
import io from 'socket.io-client';

// --- Token handling ---
axios.defaults.baseURL = 'http://localhost:8000';
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// --- Echo setup ---
window.Echo = new Echo({
    broadcaster: 'socket.io',
    host: window.location.hostname + ':6001',
    client: io,
    auth: {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    },
});

// --- Components ---
const Auth = {
    setup() {
        const name = ref('');
        const email = ref('');
        const password = ref('');
        const isLogin = ref(true);
        const error = ref('');

        const submit = () => {
            const url = isLogin.value ? '/api/login' : '/api/register';
            const data = isLogin.value ? { email: email.value, password: password.value } : {
                name: name.value,
                email: email.value,
                password: password.value,
            };

            axios.post(url, data)
                .then(res => {
                    localStorage.setItem('token', res.data.token);
                    window.location.href = '/chat';
                })
                .catch(err => {
                    error.value = err.response.data.error || 'Something went wrong';
                });
        };

        return { name, email, password, isLogin, error, submit };
    },
    template: `
    <div class="max-w-md mx-auto mt-20 p-4 border rounded shadow">
        <h2 class="text-xl mb-4 text-center">{{ isLogin ? 'Login' : 'Register' }}</h2>
        <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>
        <div v-if="!isLogin">
            <input v-model="name" type="text" placeholder="Name" class="w-full p-2 mb-2 border rounded" />
        </div>
        <input v-model="email" type="email" placeholder="Email" class="w-full p-2 mb-2 border rounded" />
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
        return {
            user: {},
            messages: [],
            text: '',
        };
    },
    mounted() {
        axios.get('/api/messages').then(r => this.messages = r.data);

        window.Echo.join('chatroom')
            .here(users => console.log('Users in room', users))
            .listen('ChatMessageSent', (e) => {
                this.messages.push(e);
            });
    },
    methods: {
        send() {
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
            <input v-model="text" @keyup.enter="send" class="flex-1 border rounded p-2" placeholder="Say something...">
            <button @click="send" class="bg-blue-500 text-white px-4 rounded">Send</button>
        </div>
    </div>`
};

// Mount based on route
const path = window.location.pathname;
const app = createApp(path === '/chat' ? Chat : Auth);
app.mount('#app');
