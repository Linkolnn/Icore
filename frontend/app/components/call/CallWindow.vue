<template>
  <Teleport to="body">
    <div v-if="isOpen" class="call-window">
      <!-- Header -->
      <header class="call-header">
        <div class="call-info">
          <h2 class="call-title">{{ chatName }}</h2>
          <p class="call-status">{{ callStatus }}</p>
        </div>
        <div class="call-actions">
          <button class="btn-minimize" @click="minimize">
            <Icon name="material-symbols:minimize" />
          </button>
          <button class="btn-close" @click="endCall">
            <Icon name="material-symbols:close" />
          </button>
        </div>
      </header>

      <!-- Video Grid -->
      <div class="video-grid" :class="`grid-${gridLayout}`">
        <!-- Local Video -->
        <div class="video-container video-local">
          <video
            ref="localVideo"
            :srcObject="localStream"
            autoplay
            muted
            playsinline
            :class="{ hidden: !isVideoOn }"
          />
          <div v-if="!isVideoOn" class="video-placeholder">
            <UiAvatar
              :name="currentUser?.name"
              :src="currentUser?.avatar"
              size="xl"
            />
          </div>
          <div class="video-label">
            <Icon v-if="isMuted" name="material-symbols:mic-off" />
            <span>Вы</span>
          </div>
        </div>

        <!-- Remote Videos -->
        <div
          v-for="[userId, participant] in participants"
          :key="userId"
          class="video-container"
        >
          <video
            :ref="`remoteVideo-${participant.userId}`"
            :srcObject="participant.stream"
            autoplay
            playsinline
            :class="{ hidden: !participant.isVideoOn }"
          />
          <div v-if="!participant.isVideoOn" class="video-placeholder">
            <UiAvatar
              :name="participant.name"
              :src="participant.avatar"
              :user-id="participant.userId"
              size="xl"
            />
          </div>
          <div class="video-label">
            <Icon v-if="participant.isMuted" name="material-symbols:mic-off" />
            <span>{{ participant.name }}</span>
          </div>
          
        </div>
      </div>

      <!-- Controls -->
      <div class="call-controls">
        <div class="controls-group">
          <!-- Mute/Unmute -->
          <button
            class="control-btn"
            :class="{ active: !isMuted }"
            @click="toggleMute"
          >
            <Icon :name="isMuted ? 'material-symbols:mic-off' : 'material-symbols:mic'" />
            <span>{{ isMuted ? 'Вкл. микрофон' : 'Выкл. микрофон' }}</span>
          </button>

          <!-- Video On/Off -->
          <button
            class="control-btn"
            :class="{ active: isVideoOn }"
            @click="() => toggleVideo()"
          >
            <Icon :name="isVideoOn ? 'material-symbols:videocam' : 'material-symbols:videocam-off'" />
            <span>{{ isVideoOn ? 'Выкл. камеру' : 'Вкл. камеру' }}</span>
          </button>

          <!-- Screen Share -->
          <button
            class="control-btn"
            :class="{ active: isScreenSharing }"
            @click="toggleScreenShare"
          >
            <Icon :name="isScreenSharing ? 'material-symbols:stop-screen-share' : 'material-symbols:screen-share'" />
            <span>{{ isScreenSharing ? 'Остановить показ' : 'Показать экран' }}</span>
          </button>
        </div>

        <!-- End Call -->
        <button class="control-btn btn-end-call" @click="endCall">
          <Icon name="material-symbols:call-end" />
          <span>Завершить</span>
        </button>

        <div class="controls-group">
          <!-- Settings -->
          <button class="control-btn" @click="openSettings">
            <Icon name="material-symbols:settings" />
            <span>Настройки</span>
          </button>

          <!-- Participants -->
          <button class="control-btn" @click="toggleParticipantsList">
            <Icon name="material-symbols:group" />
            <span>{{ participants.size }} участн.</span>
          </button>
        </div>
      </div>

      <!-- Participants List (Sidebar) -->
      <aside v-if="showParticipants" class="participants-sidebar">
        <h3>Участники ({{ participants.size }})</h3>
        <ul class="participants-list">
          <!-- Current User -->
          <li class="participant-item">
            <UiAvatar
              :name="currentUser?.name"
              :src="currentUser?.avatar"
              size="sm"
            />
            <span class="participant-name">Вы</span>
            <div class="participant-status">
              <Icon v-if="isMuted" name="material-symbols:mic-off" />
              <Icon v-if="!isVideoOn" name="material-symbols:videocam-off" />
            </div>
          </li>
          
          <!-- Other Participants -->
          <li
            v-for="[userId, participant] in participants"
            :key="userId"
            class="participant-item"
          >
            <UiAvatar
              :name="participant.name"
              :src="participant.avatar"
              :user-id="participant.userId"
              size="sm"
            />
            <span class="participant-name">{{ participant.name }}</span>
            <div class="participant-status">
              <Icon v-if="participant.isMuted" name="material-symbols:mic-off" />
              <Icon v-if="!participant.isVideoOn" name="material-symbols:videocam-off" />
              <Icon v-if="participant.isScreenSharing" name="material-symbols:screen-share" />
            </div>
          </li>
        </ul>
      </aside>
    </div>

    <!-- Minimized View -->
    <div v-if="isMinimized" class="call-minimized" @click="restore">
      <div class="minimized-content">
        <div class="pulse-animation"></div>
        <Icon name="material-symbols:call" />
        <span>{{ chatName }}</span>
        <span class="call-timer">{{ formattedDuration }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWebRTC } from '@/composables/useWebRTC'

interface Props {
  isOpen: boolean
  chatId: string
  chatName: string
  callType: 'audio' | 'video'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// WebRTC composable
const {
  localStream,
  remoteStreams,
  participants,
  isInCall,
  isMuted,
  isVideoOn,
  isScreenSharing,
  initializeMedia,
  joinCall,
  leaveCall,
  toggleAudio,
  toggleVideo,
  startScreenShare,
  stopScreenShare
} = useWebRTC()

// Component state
const isMinimized = ref(false)
const showParticipants = ref(false)
const callStartTime = ref<Date | null>(null)
const callDuration = ref(0)
const durationInterval = ref<ReturnType<typeof setInterval> | null>(null)

// Refs
const localVideo = ref<HTMLVideoElement>()
const currentUser = ref({
  name: 'You',
  avatar: null
})

// Computed
const callStatus = computed(() => {
  if (!isInCall.value) return 'Подключение...'
  const count = participants.value.size
  if (count === 0) return 'Ожидание участников...'
  if (count === 1) return '1 участник'
  return `${count} участников`
})

const gridLayout = computed(() => {
  const count = participants.value.size + 1 // +1 for local video
  if (count <= 2) return '2'
  if (count <= 4) return '4'
  if (count <= 6) return '6'
  return 'many'
})

const formattedDuration = computed(() => {
  const hours = Math.floor(callDuration.value / 3600)
  const minutes = Math.floor((callDuration.value % 3600) / 60)
  const seconds = callDuration.value % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Methods
async function startCall() {
  try {
    // Initialize media
    const constraints = props.callType === 'video' 
      ? { audio: true, video: true }
      : { audio: true, video: false }
    
    await initializeMedia(constraints)
    
    // Set local video stream
    if (localVideo.value && localStream.value) {
      localVideo.value.srcObject = localStream.value
    }
    
    // Join call
    await joinCall(props.chatId, [])
    
    // Start duration timer
    callStartTime.value = new Date()
    durationInterval.value = setInterval(() => {
      if (callStartTime.value) {
        const now = new Date()
        callDuration.value = Math.floor((now.getTime() - callStartTime.value.getTime()) / 1000)
      }
    }, 1000)
  } catch (error) {
    console.error('Failed to start call:', error)
  }
}

async function endCall() {
  if (durationInterval.value) {
    clearInterval(durationInterval.value)
    durationInterval.value = null
  }
  
  await leaveCall()
  emit('close')
}

function toggleMute() {
  toggleAudio()
}

async function toggleScreenShare() {
  if (isScreenSharing.value) {
    stopScreenShare()
  } else {
    await startScreenShare()
  }
}

function minimize() {
  isMinimized.value = true
}

function restore() {
  isMinimized.value = false
}

function openSettings() {
  // TODO: Open settings modal
  console.log('Open settings')
}

function toggleParticipantsList() {
  showParticipants.value = !showParticipants.value
}

// Lifecycle
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    await startCall()
  }
})

onUnmounted(() => {
  if (isInCall.value) {
    endCall()
  }
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables";
@import "@/assets/styles/mixins";

.call-window {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 1200px;
  height: 80vh;
  background: $bg-primary;
  border-radius: $radius;
  box-shadow: $shadow-modal;
  display: flex;
  flex-direction: column;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba($text-secondary, 0.1);
  background: rgba($bg-secondary, 0.5);
  backdrop-filter: blur(10px);

  .call-info {
    .call-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }

    .call-status {
      margin: 4px 0 0;
      font-size: 14px;
      color: $text-secondary;
    }
  }

  .call-actions {
    display: flex;
    gap: 8px;

    button {
      background: transparent;
      border: none;
      color: $text-secondary;
      cursor: pointer;
      padding: 8px;
      border-radius: $radius-sm;
      transition: all 0.2s;

      &:hover {
        background: rgba($text-secondary, 0.1);
        color: $text-primary;
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }

    .btn-close:hover {
      background: rgba($error-color, 0.1);
      color: $error-color;
    }
  }
}

.video-grid {
  flex: 1;
  padding: 20px;
  display: grid;
  gap: 16px;
  overflow: hidden;

  &.grid-2 {
    grid-template-columns: 1fr 1fr;
  }

  &.grid-4 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }

  &.grid-6 {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }

  &.grid-many {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

.video-container {
  position: relative;
  background: $bg-secondary;
  border-radius: $radius;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;

  &.video-local {
    border: 2px solid $accent-primary;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;

    &.hidden {
      display: none;
    }
  }

  .video-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba($accent-primary, 0.1), rgba($accent-secondary, 0.1));
  }

  .video-label {
    position: absolute;
    bottom: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba($bg-primary, 0.8);
    backdrop-filter: blur(10px);
    border-radius: $radius-sm;
    color: $text-primary;
    font-size: 14px;
    font-weight: 500;

    svg {
      width: 16px;
      height: 16px;
      color: $error-color;
    }
  }

  .connection-state {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($bg-primary, 0.9);
    backdrop-filter: blur(5px);

    .connecting,
    .failed {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: $text-secondary;

      svg {
        width: 32px;
        height: 32px;
      }
    }

    .failed {
      color: $error-color;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba($accent-primary, 0.2);
      border-top-color: $accent-primary;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

.call-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-top: 1px solid rgba($text-secondary, 0.1);
  background: rgba($bg-secondary, 0.5);
  backdrop-filter: blur(10px);

  .controls-group {
    display: flex;
    gap: 8px;
  }

  .control-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 16px;
    background: rgba($bg-secondary, 0.8);
    border: none;
    border-radius: $radius;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($bg-secondary, 1);
      color: $text-primary;
      transform: translateY(-2px);
    }

    &.active {
      background: rgba($accent-primary, 0.2);
      color: $accent-primary;
    }

    &.btn-end-call {
      background: $error-color;
      color: white;

      &:hover {
        background: darken($error-color, 10%);
        transform: translateY(-2px);
      }
    }

    svg {
      width: 24px;
      height: 24px;
    }

    span {
      font-size: 12px;
      font-weight: 500;
    }
  }
}

.participants-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: $bg-secondary;
  border-left: 1px solid rgba($text-secondary, 0.1);
  padding: 20px;
  overflow-y: auto;
  animation: slideInRight 0.3s ease;

  h3 {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  .participants-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .participant-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: $radius-sm;
    transition: background 0.2s;

    &:hover {
      background: rgba($accent-primary, 0.05);
    }

    .participant-name {
      flex: 1;
      font-size: 14px;
      color: $text-primary;
    }

    .participant-status {
      display: flex;
      gap: 4px;

      svg {
        width: 16px;
        height: 16px;
        color: $text-secondary;
      }
    }
  }
}

.call-minimized {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  background: $accent-primary;
  border-radius: $radius;
  box-shadow: $shadow-float;
  cursor: pointer;
  z-index: 1999;
  animation: slideInUp 0.3s ease;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-hover;
  }

  .minimized-content {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;

    .pulse-animation {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    svg {
      width: 20px;
      height: 20px;
    }

    span {
      font-size: 14px;
      font-weight: 500;
    }

    .call-timer {
      opacity: 0.9;
    }
  }
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
