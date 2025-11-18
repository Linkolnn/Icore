/**
 * Простой тест отправки сообщения
 * Запуск: node backend/test/e2e/send-message.test.js
 * 
 * Параметры:
 * --email=test1@example.com
 * --password=password123
 * --chat-id=<chat-id>
 * --message="Your message"
 */

const io = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    params[key.replace('--', '')] = value;
  });
  
  return {
    email: params.email || 'test1@example.com',
    password: params.password || 'password123',
    chatId: params['chat-id'],
    message: params.message || `Test message from ${new Date().toLocaleTimeString()}`
  };
}

async function sendMessage() {
  const params = parseArgs();
  
  console.log('📤 Send Message Test\n');
  console.log('Parameters:');
  console.log('  Email:', params.email);
  console.log('  Message:', params.message);
  console.log('  Chat ID:', params.chatId || '(will use first available)');
  console.log('');
  
  try {
    // 1. Login
    console.log('1️⃣  Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.email,
        password: params.password
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }
    
    const { accessToken } = await loginResponse.json();
    console.log('   ✅ Logged in\n');
    
    // 2. Get chat ID if not provided
    let chatId = params.chatId;
    
    if (!chatId) {
      console.log('2️⃣  Getting chats...');
      const chatsResponse = await fetch(`${API_URL}/chats`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const chats = await chatsResponse.json();
      
      if (chats.length === 0) {
        throw new Error('No chats found. Create a chat first.');
      }
      
      chatId = chats[0]._id;
      console.log(`   Using first chat: ${chatId}\n`);
    }
    
    // 3. Connect WebSocket
    console.log('3️⃣  Connecting to WebSocket...');
    const socket = io(API_URL, {
      auth: { token: accessToken }
    });
    
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`   ✅ Connected: ${socket.id}\n`);
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        reject(error);
      });
      
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
    
    // 4. Join chat
    console.log('4️⃣  Joining chat...');
    await new Promise((resolve, reject) => {
      socket.emit('chat:join', { chatId }, (response) => {
        if (response.success) {
          console.log('   ✅ Joined chat\n');
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
    
    // 5. Send message
    console.log('5️⃣  Sending message...');
    await new Promise((resolve, reject) => {
      socket.emit('message:send', {
        chatId,
        text: params.message
      }, (response) => {
        if (response.success) {
          console.log('   ✅ Message sent successfully!');
          console.log('   Message ID:', response.message._id);
          console.log('   Timestamp:', new Date(response.message.createdAt).toLocaleString());
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
    
    console.log('\n✨ Done!');
    
    // Disconnect
    socket.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
sendMessage();
