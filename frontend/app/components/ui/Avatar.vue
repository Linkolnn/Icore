<template>
  <div 
    class="ui-avatar"
    :class="[
      `ui-avatar--${size}`,
      { 'ui-avatar--online': showStatus && isOnline }
    ]"
  >
    <img 
      v-if="src" 
      :src="src" 
      :alt="name || 'Avatar'"
      class="ui-avatar__image"
      @error="handleImageError"
    />
    <div 
      v-else 
      class="ui-avatar__placeholder"
    >
      {{ initials }}
    </div>
    
    <!-- Online indicator -->
    <span 
      v-if="showStatus && isOnline" 
      class="ui-avatar__status"
    />
  </div>
</template>

<script setup lang="ts">

interface Props {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  isOnline?: boolean
  userId?: string | null // For consistent color generation
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showStatus: false,
  isOnline: false
})

// Handle image loading errors
const imageError = ref(false)

function handleImageError() {
  imageError.value = true
}

/**
 * Generate initials from name
 */
const initials = computed(() => {
  if (!props.name) return '?'
  
  const words = props.name.trim().split(' ')
  if (words.length >= 2 && words[0]?.[0] && words[1]?.[0]) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  
  return props.name.slice(0, 2).toUpperCase()
})

</script>

<style scoped lang="scss">
@import '~/assets/styles/mixins';

.ui-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: $bg-secondary;
  
  // Sizes
  &--xs {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
  
  &--sm {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  
  &--md {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
  
  &--lg {
    width: 48px;
    height: 48px;
    font-size: 16px;
  }
  
  &--xl {
    width: 64px;
    height: 64px;
    font-size: 20px;
  }
  
  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-dark;
    font-family: '5mal6Lampen', sans-serif;
    font-weight: 400;
    user-select: none;
    background: $color-accent;
  }
  
  &__status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 25%;
    height: 25%;
    min-width: 8px;
    min-height: 8px;
    background: $success-color;
    border: 2px solid $bg-primary;
    border-radius: 50%;
  }
  
  // Adjust status position for different sizes
  &--xs &__status {
    border-width: 1px;
  }
  
  &--sm &__status {
    border-width: 1.5px;
  }
  
  &--xl &__status {
    border-width: 3px;
  }
}
</style>
