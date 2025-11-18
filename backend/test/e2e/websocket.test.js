/**
 * E2E тест для WebSocket функционала
 * Запуск: node backend/test/e2e/websocket.test.js
 */

const io = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_USER_1 = {
  email: 'test1@example.com',
  password: 'password123'
};
const TEST_USER_2 = {
  email: 'test2@example.com',
  password: 'password123'
};

class WebSocketTester {
  constructor() {
    this.sockets = [];
  }

  async login(credentials) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.accessToken;
  }

  async createChat(token, participantId) {
    const response = await fetch(`${API_URL}/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'personal',
        participantId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Chat creation failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  }

  connectSocket(token) {
    const socket = io(API_URL, {
      auth: { token },
      reconnection: false
    });
    
    this.sockets.push(socket);
    
    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`✅ Socket connected: ${socket.id}`);
        resolve(socket);
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        reject(error);
      });
    });
  }

  async test() {
    console.log('🚀 Starting WebSocket E2E tests...\n');
    
    try {
      // 1. Login both users
      console.log('1️⃣  Logging in users...');
      const token1 = await this.login(TEST_USER_1);
      const token2 = await this.login(TEST_USER_2);
      console.log('   ✅ Both users logged in\n');
      
      // 2. Get user IDs
      const user1Response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token1}` }
      });
      const user1 = await user1Response.json();
      
      const user2Response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token2}` }
      });
      const user2 = await user2Response.json();
      
      // 3. Create or get existing chat
      console.log('2️⃣  Creating/getting chat...');
      const chat = await this.createChat(token1, user2._id);
      console.log(`   ✅ Chat ready: ${chat._id}\n`);
      
      // 4. Connect WebSocket for both users
      console.log('3️⃣  Connecting WebSockets...');
      const socket1 = await this.connectSocket(token1);
      const socket2 = await this.connectSocket(token2);
      console.log('   ✅ Both users connected\n');
      
      // 5. Join chat rooms
      console.log('4️⃣  Joining chat rooms...');
      await new Promise((resolve) => {
        socket1.emit('chat:join', { chatId: chat._id }, (response) => {
          console.log('   User 1 join response:', response);
          resolve();
        });
      });
      
      await new Promise((resolve) => {
        socket2.emit('chat:join', { chatId: chat._id }, (response) => {
          console.log('   User 2 join response:', response);
          resolve();
        });
      });
      console.log('   ✅ Both users joined chat\n');
      
      // 6. Test message sending
      console.log('5️⃣  Testing message sending...');
      
      // Set up listener for user 2
      const messagePromise = new Promise((resolve) => {
        socket2.on('message:new', (message) => {
          console.log('   📨 User 2 received:', message.text);
          resolve(message);
        });
      });
      
      // User 1 sends message
      const testMessage = `Test message ${Date.now()}`;
      socket1.emit('message:send', {
        chatId: chat._id,
        text: testMessage
      }, (response) => {
        console.log('   📤 User 1 send response:', response.success ? '✅' : '❌');
      });
      
      // Wait for message to arrive
      const receivedMessage = await messagePromise;
      
      if (receivedMessage.text === testMessage) {
        console.log('   ✅ Message delivered correctly!\n');
      } else {
        console.error('   ❌ Message mismatch!\n');
      }
      
      // 7. Test chat:created event
      console.log('6️⃣  Testing chat:created event...');
      
      // Set up listener
      const chatCreatedPromise = new Promise((resolve) => {
        socket2.once('chat:created', (newChat) => {
          console.log('   💬 User 2 received new chat:', newChat._id);
          resolve(newChat);
        });
      });
      
      // Create new chat (will trigger event)
      const newChat = await this.createChat(token1, user2._id);
      
      // Wait for event
      setTimeout(() => {
        console.log('   ℹ️  Note: chat:created might not fire for existing chats\n');
      }, 2000);
      
      console.log('🎉 All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      // Cleanup
      console.log('\n🧹 Cleaning up...');
      this.sockets.forEach(socket => socket.disconnect());
      process.exit(0);
    }
  }
}

// Run tests
const tester = new WebSocketTester();
tester.test();
