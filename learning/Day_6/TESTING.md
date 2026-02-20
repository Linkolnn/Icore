# 🧪 Testing Guide for Day 6

## 🎯 Testing Overview

### Testing Scope
1. **Group Chats** - создание, управление участниками, права
2. **WebRTC Calls** - звонки, качество, reconnection
3. **Integration** - WebSocket события, Redis сессии
4. **Security** - авторизация, валидация, лимиты
5. **Performance** - нагрузка, память, latency

---

## 🧪 E2E Tests

### Group Chats Test Suite

```javascript
// backend/test/e2e/group-chats.test.js

const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:3001';
const WS_URL = 'http://localhost:3001';

describe('Group Chats', () => {
  let authToken;
  let socket;
  let testUsers = [];
  let testGroup;

  beforeAll(async () => {
    // Create test users
    for (let i = 1; i <= 5; i++) {
      const user = await createTestUser(`user${i}@test.com`);
      testUsers.push(user);
    }

    // Login as first user
    authToken = await login(testUsers[0].email, 'password');
    
    // Connect WebSocket
    socket = io(WS_URL, {
      auth: { token: authToken }
    });
  });

  afterAll(async () => {
    socket.disconnect();
    // Cleanup test data
    await cleanupTestData();
  });

  describe('Group Creation', () => {
    test('should create group chat with members', async () => {
      const response = await axios.post(
        `${API_URL}/chats/group`,
        {
          name: 'Test Group',
          description: 'Test group description',
          memberIds: testUsers.slice(1, 3).map(u => u._id),
          type: 'group'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.name).toBe('Test Group');
      expect(response.data.participants).toHaveLength(3); // creator + 2 members
      expect(response.data.type).toBe('group');
      
      testGroup = response.data;
    });

    test('should not create group without members', async () => {
      try {
        await axios.post(
          `${API_URL}/chats/group`,
          {
            name: 'Empty Group',
            memberIds: []
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('at least');
      }
    });

    test('should enforce member limits', async () => {
      const manyMembers = Array(101).fill(null).map((_, i) => `fake-id-${i}`);
      
      try {
        await axios.post(
          `${API_URL}/chats/group`,
          {
            name: 'Too Many Members',
            memberIds: manyMembers
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('limit');
      }
    });
  });

  describe('Member Management', () => {
    test('should add members to group', async () => {
      const response = await axios.post(
        `${API_URL}/chats/${testGroup._id}/members`,
        {
          userIds: [testUsers[3]._id]
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      
      // Verify via WebSocket event
      const memberAddedPromise = new Promise(resolve => {
        socket.on('group:member-added', (data) => {
          if (data.chatId === testGroup._id) {
            resolve(data);
          }
        });
      });

      const event = await memberAddedPromise;
      expect(event.userId).toBe(testUsers[3]._id);
    });

    test('should remove member from group', async () => {
      const response = await axios.delete(
        `${API_URL}/chats/${testGroup._id}/members/${testUsers[3]._id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
    });

    test('should not allow non-admin to remove members', async () => {
      // Login as regular member
      const memberToken = await login(testUsers[1].email, 'password');
      
      try {
        await axios.delete(
          `${API_URL}/chats/${testGroup._id}/members/${testUsers[2]._id}`,
          {
            headers: { Authorization: `Bearer ${memberToken}` }
          }
        );
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });

    test('should update member role', async () => {
      const response = await axios.patch(
        `${API_URL}/chats/${testGroup._id}/members/${testUsers[1]._id}/role`,
        {
          role: 'admin'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Leave Group', () => {
    test('member should be able to leave group', async () => {
      const memberToken = await login(testUsers[2].email, 'password');
      
      const response = await axios.post(
        `${API_URL}/chats/${testGroup._id}/leave`,
        {},
        {
          headers: { Authorization: `Bearer ${memberToken}` }
        }
      );

      expect(response.status).toBe(200);
    });

    test('should transfer ownership when owner leaves', async () => {
      // Create new group where owner will leave
      const newGroup = await createTestGroup('Owner Leave Test', [testUsers[1]._id]);
      
      const response = await axios.post(
        `${API_URL}/chats/${newGroup._id}/leave`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      
      // Check new owner
      const groupResponse = await axios.get(
        `${API_URL}/chats/${newGroup._id}`,
        {
          headers: { Authorization: `Bearer ${await login(testUsers[1].email, 'password')}` }
        }
      );
      
      const newOwner = groupResponse.data.participants.find(p => p.role === 'owner');
      expect(newOwner.user._id).toBe(testUsers[1]._id);
    });
  });
});
```

### WebRTC Calls Test Suite

```javascript
// backend/test/e2e/webrtc-calls.test.js

const io = require('socket.io-client');

describe('WebRTC Calls', () => {
  let caller;
  let receiver;
  let callId;

  beforeAll(async () => {
    // Setup two users for call testing
    const callerToken = await login('caller@test.com', 'password');
    const receiverToken = await login('receiver@test.com', 'password');

    caller = io(`${WS_URL}/calls`, {
      auth: { token: callerToken }
    });

    receiver = io(`${WS_URL}/calls`, {
      auth: { token: receiverToken }
    });

    await waitForConnection(caller);
    await waitForConnection(receiver);
  });

  afterAll(() => {
    caller.disconnect();
    receiver.disconnect();
  });

  describe('Call Initiation', () => {
    test('should initiate audio call', async () => {
      // Receiver listens for incoming call
      const incomingCallPromise = new Promise(resolve => {
        receiver.on('call:incoming', (data) => {
          resolve(data);
        });
      });

      // Caller initiates call
      const initResponse = await emitWithAck(caller, 'call:initiate', {
        chatId: 'test-chat-id',
        type: 'audio'
      });

      expect(initResponse.callId).toBeDefined();
      expect(initResponse.token).toBeDefined();
      expect(initResponse.iceServers).toBeDefined();
      
      callId = initResponse.callId;

      // Verify receiver gets notification
      const incomingCall = await incomingCallPromise;
      expect(incomingCall.callId).toBe(callId);
      expect(incomingCall.type).toBe('audio');
    });

    test('should join existing call', async () => {
      const joinResponse = await emitWithAck(receiver, 'call:join', {
        callId
      });

      expect(joinResponse.callId).toBe(callId);
      expect(joinResponse.session).toBeDefined();
      expect(joinResponse.session.participants).toBeDefined();
    });

    test('should exchange offers and answers', async () => {
      // Simulate WebRTC offer
      const offer = {
        type: 'offer',
        sdp: 'fake-sdp-offer'
      };

      // Receiver listens for offer
      const offerPromise = new Promise(resolve => {
        receiver.on('call:offer', (data) => {
          resolve(data);
        });
      });

      // Caller sends offer
      caller.emit('call:offer', {
        callId,
        targetUserId: 'receiver-id',
        offer
      });

      const receivedOffer = await offerPromise;
      expect(receivedOffer.offer.sdp).toBe('fake-sdp-offer');

      // Receiver sends answer
      const answer = {
        type: 'answer',
        sdp: 'fake-sdp-answer'
      };

      const answerPromise = new Promise(resolve => {
        caller.on('call:answer', (data) => {
          resolve(data);
        });
      });

      receiver.emit('call:answer', {
        callId,
        targetUserId: 'caller-id',
        answer
      });

      const receivedAnswer = await answerPromise;
      expect(receivedAnswer.answer.sdp).toBe('fake-sdp-answer');
    });
  });

  describe('Media Controls', () => {
    test('should toggle mute', async () => {
      const muteEventPromise = new Promise(resolve => {
        receiver.on('call:media-toggled', (data) => {
          resolve(data);
        });
      });

      caller.emit('call:toggle-media', {
        callId,
        type: 'audio',
        enabled: false
      });

      const muteEvent = await muteEventPromise;
      expect(muteEvent.type).toBe('audio');
      expect(muteEvent.enabled).toBe(false);
    });

    test('should toggle video', async () => {
      const videoEventPromise = new Promise(resolve => {
        receiver.on('call:media-toggled', (data) => {
          resolve(data);
        });
      });

      caller.emit('call:toggle-media', {
        callId,
        type: 'video',
        enabled: true
      });

      const videoEvent = await videoEventPromise;
      expect(videoEvent.type).toBe('video');
      expect(videoEvent.enabled).toBe(true);
    });
  });

  describe('Call Termination', () => {
    test('should leave call', async () => {
      const leaveEventPromise = new Promise(resolve => {
        receiver.on('call:participant-left', (data) => {
          resolve(data);
        });
      });

      caller.emit('call:leave', { callId });

      const leaveEvent = await leaveEventPromise;
      expect(leaveEvent.userId).toBeDefined();
    });

    test('should end call when all participants leave', async () => {
      const endEventPromise = new Promise(resolve => {
        receiver.on('call:ended', (data) => {
          resolve(data);
        });
      });

      receiver.emit('call:leave', { callId });

      const endEvent = await endEventPromise;
      expect(endEvent.reason).toBe('all_participants_left');
    });
  });
});

// Helper functions
function waitForConnection(socket) {
  return new Promise(resolve => {
    if (socket.connected) {
      resolve();
    } else {
      socket.on('connect', resolve);
    }
  });
}

function emitWithAck(socket, event, data) {
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}
```

---

## 🧪 Unit Tests

### Group Chat Service Tests

```typescript
// backend/src/modules/chats/chats.service.spec.ts

describe('ChatsService', () => {
  let service: ChatsService;
  let chatModel: Model<ChatDocument>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: getModelToken(Chat.name),
          useValue: mockChatModel,
        },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);
    chatModel = module.get<Model<ChatDocument>>(getModelToken(Chat.name));
  });

  describe('createGroupChat', () => {
    it('should create group with valid data', async () => {
      const createGroupDto = {
        name: 'Test Group',
        memberIds: ['user1', 'user2'],
        type: 'group'
      };

      const result = await service.createGroupChat(createGroupDto, 'creator-id');

      expect(result.name).toBe('Test Group');
      expect(result.participants).toHaveLength(3);
      expect(result.type).toBe('group');
    });

    it('should throw error for too many members', async () => {
      const createGroupDto = {
        name: 'Large Group',
        memberIds: Array(101).fill('user-id'),
        type: 'group'
      };

      await expect(
        service.createGroupChat(createGroupDto, 'creator-id')
      ).rejects.toThrow('limit');
    });
  });

  describe('addMembers', () => {
    it('should check permissions before adding', async () => {
      const mockChat = {
        participants: [
          { user: 'user1', role: 'member', permissions: { canAddMembers: false } }
        ]
      };

      jest.spyOn(chatModel, 'findById').mockResolvedValue(mockChat);

      await expect(
        service.addMembers('chat-id', ['new-user'], 'user1')
      ).rejects.toThrow('No permission');
    });
  });
});
```

### WebRTC Service Tests

```typescript
// backend/src/modules/webrtc/webrtc-redis.service.spec.ts

describe('WebRTCRedisService', () => {
  let service: WebRTCRedisService;
  let redis: Redis;

  beforeEach(() => {
    redis = new Redis();
    service = new WebRTCRedisService(redis);
  });

  afterEach(async () => {
    await redis.flushall();
    redis.disconnect();
  });

  describe('createCallSession', () => {
    it('should create call session with TTL', async () => {
      const callId = await service.createCallSession(
        'chat-123',
        'user-123',
        'video',
        ['user-123', 'user-456']
      );

      expect(callId).toBeDefined();
      
      const ttl = await redis.ttl(`call:${callId}:session`);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(12 * 60 * 60);
    });
  });

  describe('updateParticipantStatus', () => {
    it('should update participant status', async () => {
      const callId = await service.createCallSession(
        'chat-123',
        'user-123',
        'audio',
        ['user-123']
      );

      await service.updateParticipantStatus(callId, 'user-456', {
        status: 'connected',
        isMuted: true
      });

      const session = await service.getCallSession(callId);
      const participant = session.participants.find(p => p.userId === 'user-456');
      
      expect(participant).toBeDefined();
      expect(participant.status).toBe('connected');
      expect(participant.isMuted).toBe(true);
    });
  });

  describe('call cleanup', () => {
    it('should cleanup all call data on end', async () => {
      const callId = await service.createCallSession(
        'chat-123',
        'user-123',
        'video',
        ['user-123']
      );

      // Add some data
      await service.storeSDP(callId, 'user-123', 'offer', 'sdp-data');
      await service.addICECandidate(callId, 'user-123', { candidate: 'ice' });

      // End call
      await service.endCall(callId);

      // Check cleanup
      const session = await service.getCallSession(callId);
      const sdp = await redis.get(`call:${callId}:sdp:user-123:offer`);
      const ice = await redis.lrange(`call:${callId}:ice:user-123`, 0, -1);

      expect(session.status).toBe('ended');
      expect(sdp).toBeNull();
      expect(ice).toHaveLength(0);
    });
  });
});
```

---

## 🧪 Frontend Component Tests

### CreateGroupModal Test

```typescript
// frontend/app/components/chat/CreateGroupModal.test.ts

import { mount } from '@vue/test-utils';
import CreateGroupModal from './CreateGroupModal.vue';

describe('CreateGroupModal', () => {
  it('should validate group name', async () => {
    const wrapper = mount(CreateGroupModal, {
      props: { isOpen: true }
    });

    const nextButton = wrapper.find('.btn--primary');
    expect(nextButton.attributes('disabled')).toBeDefined();

    await wrapper.find('input[type="text"]').setValue('Test Group');
    expect(nextButton.attributes('disabled')).toBeUndefined();
  });

  it('should search users', async () => {
    const wrapper = mount(CreateGroupModal, {
      props: { isOpen: true },
      global: {
        mocks: {
          $fetch: jest.fn().mockResolvedValue([
            { _id: '1', name: 'User 1', username: 'user1' },
            { _id: '2', name: 'User 2', username: 'user2' }
          ])
        }
      }
    });

    await wrapper.find('.search-bar input').setValue('user');
    await wrapper.vm.$nextTick();

    const userItems = wrapper.findAll('.user-item');
    expect(userItems).toHaveLength(2);
  });

  it('should emit created event', async () => {
    const wrapper = mount(CreateGroupModal, {
      props: { isOpen: true }
    });

    wrapper.vm.form.name = 'Test Group';
    wrapper.vm.selectedUsers = ['user1', 'user2'];

    await wrapper.find('.btn--primary').trigger('click');
    
    expect(wrapper.emitted('created')).toBeDefined();
  });
});
```

---

## 🧪 Load Testing

### Artillery Configuration

```yaml
# backend/test/load/group-chat-load.yml

config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
  defaults:
    headers:
      Authorization: 'Bearer {{ $randomString() }}'

scenarios:
  - name: "Create and manage group"
    flow:
      - post:
          url: "/chats/group"
          json:
            name: "Group {{ $randomNumber() }}"
            memberIds: ["user1", "user2", "user3"]
      - think: 2
      - post:
          url: "/chats/{{ chatId }}/members"
          json:
            userIds: ["user4"]
      - think: 1
      - delete:
          url: "/chats/{{ chatId }}/members/user4"

  - name: "WebRTC call simulation"
    engine: ws
    flow:
      - connect:
          namespace: "/calls"
      - emit:
          channel: "call:initiate"
          data:
            chatId: "test-chat"
            type: "video"
      - think: 5
      - emit:
          channel: "call:toggle-media"
          data:
            type: "audio"
            enabled: false
      - think: 10
      - emit:
          channel: "call:leave"
```

---

## 🧪 Manual Testing Checklist

### Group Chats
- [ ] Create group with 2+ members
- [ ] Create group with avatar
- [ ] Add members to existing group
- [ ] Remove member (as admin)
- [ ] Try to remove member (as regular member) - should fail
- [ ] Leave group as member
- [ ] Leave group as owner - ownership transfer
- [ ] Delete group (owner only)
- [ ] Search users when creating group
- [ ] Reach member limit (100 for group)

### WebRTC Calls
- [ ] Start audio call 1-on-1
- [ ] Start video call 1-on-1
- [ ] Accept incoming call
- [ ] Decline incoming call
- [ ] Mute/unmute microphone
- [ ] Enable/disable camera
- [ ] Start screen sharing
- [ ] Stop screen sharing
- [ ] End call normally
- [ ] Handle sudden disconnect
- [ ] Join group call (3+ participants)
- [ ] See all participants in grid
- [ ] Switch between grid/focus view

### Performance
- [ ] Create group with 50+ members
- [ ] 4-person video call quality
- [ ] Message sending in large groups
- [ ] Search in chat with 1000+ messages
- [ ] Redis memory usage under load
- [ ] WebSocket connection stability

### Security
- [ ] Cannot join call without chat membership
- [ ] Cannot add non-existent users to group
- [ ] XSS attempt in group name - sanitized
- [ ] Rate limiting on call initiation
- [ ] TURN authentication works
- [ ] Call tokens expire properly

---

## 🚀 Testing Commands

```bash
# Run backend unit tests
cd backend
npm test

# Run backend e2e tests
npm run test:e2e

# Run specific test suite
npm test -- --testNamePattern="Group Chats"

# Run with coverage
npm run test:cov

# Frontend tests
cd frontend
npm test

# Component tests
npm run test:components

# Load testing
artillery run test/load/group-chat-load.yml

# Debug WebRTC in Chrome
chrome://webrtc-internals/
```
