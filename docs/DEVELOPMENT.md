# Руководство по Разработке

## Следующие Шаги Разработки

### Phase 1: Базовая Функциональность

#### Backend

1. **Auth Module**
   ```bash
   # Реализовать:
   - MongoDB User Schema (mongoose)
   - Register endpoint с валидацией
   - Login endpoint с JWT
   - JWT Strategy для Passport
   - AuthGuard для защиты endpoints
   ```

2. **Users Module**
   ```bash
   - CRUD операции
   - Получение профиля
   - Поиск пользователей
   ```

3. **Chats Module**
   ```bash
   - MongoDB Chat Schema
   - Создание чата
   - Получение списка чатов
   - Добавление/удаление участников
   ```

4. **Messages Module**
   ```bash
   - MongoDB Message Schema
   - Сохранение зашифрованных сообщений
   - Получение истории сообщений
   - Pagination
   ```

5. **WebSocket Module**
   ```bash
   - Настроить Socket.io Gateway
   - Аутентификация через JWT
   - События: message:send, message:receive
   - Rooms для чатов
   ```

#### Frontend

1. **Auth Pages**
   ```bash
   app/pages/
   ├── login.vue        # Страница входа
   ├── register.vue     # Страница регистрации
   └── index.vue        # Главная (редирект)
   ```

2. **Auth Store**
   ```bash
   app/stores/auth.ts
   - login()
   - register()
   - logout()
   - fetchCurrentUser()
   - state: user, token, isAuthenticated
   ```

3. **API Service**
   ```bash
   app/services/api.ts
   - Axios instance с interceptors
   - Автоматическое добавление JWT
   - Обработка 401 ошибок
   ```

4. **Encryption Utils**
   ```bash
   app/utils/crypto.ts
   - generateKeyFromPassphrase(passphrase)
   - encryptMessage(message, key)
   - decryptMessage(encrypted, key, iv)
   ```

5. **Chat Interface**
   ```bash
   app/pages/chat/
   ├── index.vue           # Список чатов
   └── [id].vue            # Конкретный чат
   
   app/components/chat/
   ├── ChatList.vue        # Список чатов
   ├── ChatWindow.vue      # Окно чата
   ├── MessageInput.vue    # Поле ввода
   └── Message.vue         # Компонент сообщения
   ```

### Phase 2: E2E Шифрование

#### Реализация

1. **Генерация Ключа**
   ```javascript
   // app/utils/crypto.ts
   async function generateKey(passphrase: string, salt: string) {
     const encoder = new TextEncoder();
     const passphraseKey = await crypto.subtle.importKey(
       "raw",
       encoder.encode(passphrase),
       "PBKDF2",
       false,
       ["deriveBits", "deriveKey"]
     );
     
     return crypto.subtle.deriveKey(
       {
         name: "PBKDF2",
         salt: encoder.encode(salt),
         iterations: 100000,
         hash: "SHA-256"
       },
       passphraseKey,
       { name: "AES-GCM", length: 256 },
       true,
       ["encrypt", "decrypt"]
     );
   }
   ```

2. **Шифрование**
   ```javascript
   async function encrypt(text: string, key: CryptoKey) {
     const encoder = new TextEncoder();
     const iv = crypto.getRandomValues(new Uint8Array(12));
     
     const encrypted = await crypto.subtle.encrypt(
       { name: "AES-GCM", iv },
       key,
       encoder.encode(text)
     );
     
     return {
       encrypted: arrayBufferToBase64(encrypted),
       iv: arrayBufferToBase64(iv)
     };
   }
   ```

3. **Расшифровка**
   ```javascript
   async function decrypt(encrypted: string, iv: string, key: CryptoKey) {
     const decrypted = await crypto.subtle.decrypt(
       { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
       key,
       base64ToArrayBuffer(encrypted)
     );
     
     const decoder = new TextDecoder();
     return decoder.decode(decrypted);
   }
   ```

4. **Encryption Store**
   ```javascript
   // app/stores/encryption.ts
   export const useEncryptionStore = defineStore('encryption', {
     state: () => ({
       key: null as CryptoKey | null,
       passphrase: ''
     }),
     
     actions: {
       async initializeKey(passphrase: string) {
         this.passphrase = passphrase;
         this.key = await generateKey(passphrase, 'user-salt');
       },
       
       async encryptMessage(text: string) {
         if (!this.key) throw new Error('Key not initialized');
         return await encrypt(text, this.key);
       },
       
       async decryptMessage(encrypted: string, iv: string) {
         if (!this.key) throw new Error('Key not initialized');
         return await decrypt(encrypted, iv, this.key);
       }
     }
   });
   ```

### Phase 3: WebRTC Звонки

#### Backend

```javascript
// backend/src/modules/webrtc/webrtc.gateway.ts
@WebSocketGateway()
export class WebRTCGateway {
  @SubscribeMessage('call:offer')
  handleOffer(@MessageBody() data: any) {
    // Передать SDP offer получателю
  }
  
  @SubscribeMessage('call:answer')
  handleAnswer(@MessageBody() data: any) {
    // Передать SDP answer звонящему
  }
  
  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(@MessageBody() data: any) {
    // Обмен ICE candidates
  }
}
```

#### Frontend

```javascript
// app/composables/useWebRTC.ts
export function useWebRTC() {
  const peerConnection = ref<RTCPeerConnection>();
  const localStream = ref<MediaStream>();
  const remoteStream = ref<MediaStream>();
  
  async function startCall(targetUserId: string) {
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    peerConnection.value = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    // Add tracks to peer connection
    localStream.value.getTracks().forEach(track => {
      peerConnection.value?.addTrack(track, localStream.value!);
    });
    
    // Create offer
    const offer = await peerConnection.value.createOffer();
    await peerConnection.value.setLocalDescription(offer);
    
    // Send offer via WebSocket
    socket.emit('call:offer', {
      to: targetUserId,
      offer: offer
    });
  }
  
  return {
    startCall,
    endCall,
    localStream,
    remoteStream
  };
}
```

## Команды Разработки

### Backend

```bash
# Разработка
yarn start:dev

# Production build
yarn build
yarn start:prod

# Тесты
yarn test
yarn test:e2e

# Линтинг
yarn lint
yarn format

# Генерация модуля
nest g module modules/[name]
nest g service modules/[name]
nest g controller modules/[name]
```

### Frontend

```bash
# Разработка
yarn dev

# Production build
yarn build
yarn preview

# Линтинг
yarn lint

# Type checking
yarn typecheck
```

### Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Только инфраструктура (MongoDB + Redis)
docker-compose up -d mongodb redis

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild
docker-compose up -d --build
```

## Git Workflow

```bash
# Создать feature branch
git checkout -b feature/chat-messages

# Коммит изменений
git add .
git commit -m "feat: add chat messages functionality"

# Push
git push origin feature/chat-messages

# После merge
git checkout main
git pull origin main
```

### Commit Convention

```
feat: новая функциональность
fix: исправление бага
docs: документация
style: форматирование
refactor: рефакторинг
test: тесты
chore: обновление зависимостей
```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://admin:password123@localhost:27017/icore?authSource=admin
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)

```env
NUXT_PUBLIC_API_BASE=http://localhost:3001
NUXT_PUBLIC_WS_BASE=ws://localhost:3001
```

## Debugging

### VS Code Launch Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

## Troubleshooting

### Backend не запускается

1. Проверьте MongoDB
   ```bash
   docker-compose ps mongodb
   docker-compose logs mongodb
   ```

2. Проверьте .env файл
   ```bash
   cat backend/.env
   ```

3. Переустановите зависимости
   ```bash
   cd backend
   rm -rf node_modules yarn.lock
   yarn install
   ```

### Frontend не запускается

1. Проверьте node_modules
   ```bash
   cd frontend
   rm -rf node_modules .nuxt yarn.lock
   yarn install
   ```

2. Очистите кэш Nuxt
   ```bash
   rm -rf .nuxt .output
   yarn dev
   ```

### WebSocket не подключается

1. Проверьте CORS настройки backend
2. Убедитесь что backend запущен
3. Проверьте URL в .env файле frontend

## Performance Tips

### Backend

- Используйте индексы в MongoDB
- Кэшируйте частые запросы в Redis
- Pagination для больших списков
- Используйте `select()` для ограничения полей

### Frontend

- Lazy load компонентов
- Virtual scrolling для длинных списков
- Debounce для поиска
- Image optimization

## Security Checklist

- [ ] JWT токены в httpOnly cookies (production)
- [ ] Rate limiting на auth endpoints
- [ ] Input validation везде
- [ ] SQL injection защита (MongoDB)
- [ ] XSS защита
- [ ] CORS правильно настроен
- [ ] Helmet.js для HTTP headers
- [ ] HTTPS в production
- [ ] Environment variables не в git
- [ ] Passphrase никогда не отправляется на сервер

## Testing Strategy

### Backend

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Coverage
yarn test:cov
```

### Frontend

```bash
# Unit tests (Vitest)
yarn test

# E2E tests (Playwright)
yarn test:e2e
```

## Deployment

### Production Checklist

- [ ] Environment variables настроены
- [ ] MongoDB в production режиме
- [ ] Redis настроен
- [ ] HTTPS сертификаты
- [ ] Backup стратегия
- [ ] Monitoring настроен
- [ ] Error tracking (Sentry)
- [ ] CDN для статики (опционально)

### Платформы для Deploy

- **Backend**: Railway, Render, DigitalOcean
- **Frontend**: Vercel, Netlify, Railway
- **Database**: MongoDB Atlas
- **Redis**: Redis Cloud, Upstash

## Полезные Ресурсы

- [NestJS Docs](https://docs.nestjs.com/)
- [Nuxt 3 Docs](https://nuxt.com/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
