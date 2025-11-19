<template>
  <transition name="fade">
    <div v-if="isTyping" class="typing-indicator">
      <div class="typing-indicator__content">
        <span class="typing-indicator__text">
          {{ typingText }}
        </span>
        <span class="typing-indicator__dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  typingUsers: string[]
  users?: Map<string, any> | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  typingUsers: () => []
})

// Проверка, печатает ли кто-то
const isTyping = computed(() => props.typingUsers.length > 0)

// Текст индикатора
const typingText = computed(() => {
  const count = props.typingUsers.length
  
  if (count === 0) return ''
  if (count === 1) {
    // Получаем имя пользователя если есть users map
    const userId = props.typingUsers[0]
    let userName = 'Пользователь'
    
    if (props.users && userId) {
      // Проверяем тип users (Map или Record)
      const user = props.users instanceof Map 
        ? props.users.get(userId)
        : (props.users as Record<string, any>)[userId]
      
      if (user) {
        userName = user.name || user.username || 'Пользователь'
      }
    }
    
    return `${userName} печатает`
  }
  if (count === 2) {
    return 'Два пользователя печатают'
  }
  return `${count} пользователей печатают`
})
</script>

<style lang="scss" scoped>
.typing-indicator {
  padding: 8px 16px;
  background: $bg-primary;
  border-radius: $radius;
  box-shadow: $shadow-block;
  margin: 8px 16px;
  
  &__content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  &__text {
    font-size: 13px;
    color: $text-secondary;
    font-style: italic;
  }
  
  &__dots {
    display: inline-flex;
    gap: 3px;
    
    span {
      width: 6px;
      height: 6px;
      background: $text-secondary;
      border-radius: 50%;
      animation: typing 1.4s infinite;
      
      &:nth-child(1) {
        animation-delay: 0s;
      }
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

// Анимации
@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
