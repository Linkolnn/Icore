/**
 * Тест real-time обновлений списка чатов
 * Запуск: node backend/test/e2e/realtime-updates.test.js
 */

const io = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testRealtimeUpdates() {
  console.log('🔄 Testing Real-time Updates...\n');
  
  try {
    // 1. Login as test1
    console.log('1️⃣  Logging in as test1@example.com...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test1@example.com',
        password: 'password123'
      })
    });
    
    const { accessToken } = await loginResponse.json();
    console.log('   ✅ Logged in\n');
    
    // 2. Connect WebSocket
    console.log('2️⃣  Connecting WebSocket...');
    const socket = io(API_URL, {
      auth: { token: accessToken }
    });
    
    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
    
    console.log('   ✅ Connected:', socket.id, '\n');
    
    // 3. Set up listeners
    console.log('3️⃣  Setting up event listeners...');
    
    socket.on('message:new', (message) => {
      console.log('\n📨 NEW MESSAGE EVENT:');
      console.log('   Chat ID:', message.chat);
      console.log('   Text:', message.text);
      console.log('   Sender:', message.sender?.username || message.sender);
      console.log('   Time:', new Date(message.createdAt).toLocaleTimeString());
    });
    
    socket.on('chat:created', (chat) => {
      console.log('\n💬 NEW CHAT EVENT:');
      console.log('   Chat ID:', chat._id);
      console.log('   Type:', chat.type);
      console.log('   Participants:', chat.participants?.length || 0);
    });
    
    socket.on('user:status', (status) => {
      console.log('\n👤 USER STATUS EVENT:');
      console.log('   User:', status.userId);
      console.log('   Status:', status.online ? 'online' : 'offline');
    });
    
    socket.on('typing:start', ({ userId, chatId }) => {
      console.log(`\n✍️  User ${userId} started typing in chat ${chatId}`);
    });
    
    socket.on('typing:stop', ({ userId, chatId }) => {
      console.log(`\n✋ User ${userId} stopped typing in chat ${chatId}`);
    });
    
    console.log('   ✅ Listeners attached\n');
    
    // 4. Get existing chats
    console.log('4️⃣  Getting existing chats...');
    const chatsResponse = await fetch(`${API_URL}/chats`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const chats = await chatsResponse.json();
    console.log(`   Found ${chats.length} chats\n`);
    
    // 5. Join first chat if exists
    if (chats.length > 0) {
      const firstChat = chats[0];
      console.log('5️⃣  Joining first chat:', firstChat._id);
      
      socket.emit('chat:join', { chatId: firstChat._id }, (response) => {
        if (response.success) {
          console.log('   ✅ Joined successfully\n');
        } else {
          console.log('   ❌ Failed to join:', response.error, '\n');
        }
      });
    }
    
    // 6. Keep listening
    console.log('📡 Listening for real-time events...');
    console.log('   (Open another terminal and send messages to see events)\n');
    console.log('   Press Ctrl+C to stop\n');
    
    // Heartbeat to keep connection alive
    setInterval(() => {
      socket.emit('ping');
    }, 30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

// Run test
testRealtimeUpdates();
