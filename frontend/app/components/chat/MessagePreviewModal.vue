<template>
  <UiBaseModal
    v-model="isOpen"
    title="Пересылаемые сообщения"
    size="small"
    @close="handleClose"
  >
    <div class="message-preview-chat">
      <!-- Messages in chat-like style -->
      <div class="message-preview-chat__messages">
        <div
          v-for="message in messages"
          :key="message._id"
          class="message-preview-chat__bubble"
        >
          <!-- Sender info -->
          <div class="message-preview-chat__sender-info">
            <img 
              v-if="getAvatar(message.sender)" 
              :src="getAvatar(message.sender)" 
              :alt="getSenderName(message.sender)"
              class="message-preview-chat__avatar"
            />
            <div 
              v-else 
              class="message-preview-chat__avatar message-preview-chat__avatar--placeholder"
            >
              {{ getInitials(message.sender) }}
            </div>
            <span class="message-preview-chat__sender">
              {{ getSenderName(message.sender) }}
            </span>
          </div>
          
          <!-- Message content -->
          <div class="message-preview-chat__content">
            <p class="message-preview-chat__text">{{ message.text }}</p>
            <time class="message-preview-chat__time">
              {{ formatTime(message.createdAt) }}
            </time>
          </div>
        </div>
      </div>
    </div>
  </UiBaseModal>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message.types'
import { formatTime } from '~/utils/date.utils'

interface Props {
  modelValue: boolean
  messages: Message[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function getSenderName(sender: any): string {
  if (typeof sender === 'string') return 'Пользователь'
  return sender?.name || 'Пользователь'
}

function getAvatar(sender: any): string | undefined {
  if (typeof sender === 'string') return undefined
  return sender?.avatar || undefined
}

function getInitials(sender: any): string {
  const name = getSenderName(sender)
  if (!name || name === 'Пользователь') return '?'
  const words = name.split(' ')
  if (words.length >= 2 && words[0]?.[0] && words[1]?.[0]) {
    return words[0][0].toUpperCase() + words[1][0].toUpperCase()
  }
  return name[0]?.toUpperCase() || '?'
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.message-preview-chat {
  &__messages {
    max-height: 400px;
    overflow-y: auto;
    padding: 12px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
  }
  
  &__bubble {
    margin-bottom: 16px;
    padding: 12px;
    background: $bg-primary;
    border-radius: 18px;
    box-shadow: $shadow-block;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  &__sender-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  &__avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    flex-shrink: 0;
    overflow: hidden;
    object-fit: cover;
    
    &--placeholder {
      background: linear-gradient(135deg, $accent-primary, darken($accent-primary, 15%));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: white;
    }
  }
  
  &__sender {
    font-size: 13px;
    font-weight: 500;
    color: $accent-primary;
  }
  
  &__content {
    margin-left: 32px; // Avatar width + gap
  }
  
  &__text {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: $text-primary;
    line-height: 1.4;
    word-wrap: break-word;
  }
  
  &__time {
    font-size: 11px;
    color: $text-secondary;
    opacity: 0.7;
  }
}
</style>
