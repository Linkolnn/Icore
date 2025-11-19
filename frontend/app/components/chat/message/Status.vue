<template>
  <span class="message-status" :title="statusTooltip">
    <!-- Sent status - одна галочка -->
    <span v-if="status === 'sent'" class="message-status__icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
      </svg>
    </span>
    
    <!-- Delivered status - две галочки -->
    <span v-else-if="status === 'delivered'" class="message-status__icon message-status__icon--double">
      <svg width="20" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
        <path d="M13 16.17L8.83 12l-1.42 1.41L13 19 25 7l-1.41-1.41L13 16.17z" fill="currentColor" transform="translate(-2, 0)"/>
      </svg>
    </span>
    
    <!-- Read status - две синие галочки -->
    <span v-else-if="status === 'read'" class="message-status__icon message-status__icon--read">
      <svg width="20" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
        <path d="M13 16.17L8.83 12l-1.42 1.41L13 19 25 7l-1.41-1.41L13 16.17z" fill="currentColor" transform="translate(-2, 0)"/>
      </svg>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status?: 'pending' | 'sent' | 'delivered' | 'read'
  readAt?: string | Date
  deliveredAt?: string | Date
  readBy?: Map<string, Date> | Record<string, Date>
}

const props = withDefaults(defineProps<Props>(), {
  status: 'sent'
})

// Tooltip с информацией о статусе
const statusTooltip = computed(() => {
  switch (props.status) {
    case 'pending':
      return 'Отправляется...'
    case 'sent':
      return 'Отправлено'
    case 'delivered':
      return props.deliveredAt ? `Доставлено ${formatTime(props.deliveredAt)}` : 'Доставлено'
    case 'read':
      if (props.readAt) {
        return `Прочитано ${formatTime(props.readAt)}`
      }
      if (props.readBy && Object.keys(props.readBy).length > 0) {
        return `Прочитано ${Object.keys(props.readBy).length} участниками`
      }
      return 'Прочитано'
    default:
      return ''
  }
})

// Форматирование времени
function formatTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин. назад`
  if (hours < 24) return `${hours} ч. назад`
  if (days < 7) return `${days} дн. назад`
  
  return d.toLocaleDateString()
}
</script>

<style lang="scss" scoped>
.message-status {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  
  &__icon {
    display: inline-flex;
    align-items: center;
    color: $text-secondary;
    opacity: 0.6;
    transition: all 0.3s ease;
    
    svg {
      width: 16px;
      height: 12px;
    }
    
    &--double {
      svg {
        width: 20px;
      }
    }
    
    &--read {
      color: #4FC3F7; // Синий для прочитанных
      opacity: 0.9;
    }
  }
}

// Анимация появления статуса
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.message-status__icon {
  animation: fadeIn 0.3s ease;
}
</style>
