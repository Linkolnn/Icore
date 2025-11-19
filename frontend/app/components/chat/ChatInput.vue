<template>
    <!-- Preview attached files -->
    <transition-group name="slide-up">
      <div 
        v-for="(file, index) in attachedFiles" 
        :key="`file-${index}`"
        class="chat-input__attachment"
      >
        <img 
          v-if="file.type?.startsWith('image/')" 
          :src="getFilePreview(file)" 
          :alt="file.name"
          class="chat-input__attachment-preview"
        />
        <span v-else class="chat-input__attachment-name">{{ file.name }}</span>
        <button 
          class="chat-input__attachment-remove" 
          @click="$emit('file-remove', index)"
        >
          ✕
        </button>
      </div>
    </transition-group>
    
    <!-- Main input wrapper -->
    <div class="chat-input__wrapper">
      <!-- Textarea with auto-resize -->
      <div class="chat-input__field-wrapper">
        <textarea
          ref="textareaRef"
          v-model="model"
          class="chat-input__field"
          :placeholder="placeholder"
          :disabled="disabled"
          :style="{ height: textareaHeight }"
          :title="'Enter - отправить\nShift+Enter - новая строка'"
          @input="handleInput"
          @keydown="handleKeyDown"
          @focus="$emit('focus')"
          @blur="$emit('blur')"
          rows="1"
        />
        
        <!-- Right actions inside input -->
        <div class="chat-input__actions">
          <UiBaseButton
            variant="input-icon"
            aria-label="Эмодзи"
            @click="$emit('emoji')"
          >
            <SvgoStickerIcon />
          </UiBaseButton>
          <UiBaseButton
            variant="input-icon"
            aria-label="Прикрепить файл"
            @click="openFilePicker"
          >
            <SvgoClipIcon />
          </UiBaseButton>
        </div>
      </div>
      
      <!-- Dynamic Send/Voice button -->
      <UiBaseButton
        variant="icon"
        :aria-label="hasText ? 'Отправить' : 'Голосовое сообщение'"
        @click="hasText ? $emit('send') : $emit('voice')"
      >
        <transition name="fade-scale" mode="out-in">
          <SvgoSendIcon v-if="hasText" key="send" />
          <SvgoMicroIcon v-else key="mic" />
        </transition>
      </UiBaseButton>
    </div>
    
    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
      style="display: none"
      @change="handleFileSelect"
    />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  editingMessage?: any
  attachedFiles?: File[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Сообщение',
  attachedFiles: () => [],
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': []
  'attach': [files: File[]]
  'emoji': []
  'voice': []
  'file-remove': [index: number]
  'focus': []
  'blur': []
}>()

// Refs
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const textareaHeight = ref('48px')

// v-model support
const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Check if has text
const hasText = computed(() => props.modelValue.trim().length > 0)

// Auto-resize textarea
const adjustHeight = async () => {
  await nextTick()
  const textarea = textareaRef.value
  if (!textarea) return
  
  // Save current scroll position
  const currentScroll = textarea.scrollTop
  
  // Reset height to calculate actual content height
  textarea.style.height = 'auto'
  textarea.style.overflowY = 'hidden'
  
  // Get the scroll height (actual content height)
  const scrollHeight = textarea.scrollHeight
  
  // Calculate new height (min 48px, max 150px)
  const newHeight = Math.min(Math.max(scrollHeight, 48), 150)
  
  // Set the new height
  textareaHeight.value = `${newHeight}px`
  textarea.style.height = `${newHeight}px`
  
  // If we're at max height, enable scrolling
  if (scrollHeight > 150) {
    textarea.style.overflowY = 'auto'
    // Restore scroll position
    textarea.scrollTop = currentScroll
  } else {
    textarea.style.overflowY = 'hidden'
  }
}

// Handle input event
const handleInput = () => {
  // Adjust height on every input change
  adjustHeight()
}

// Handle keyboard shortcuts (Telegram-like)
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    // Shift + Enter = new line
    if (e.shiftKey) {
      // Default behavior - insert new line
      // Also trigger height adjustment after new line
      nextTick(() => adjustHeight())
      return
    }
    
    // Regular Enter = send message (like Telegram)
    e.preventDefault()
    if (hasText.value) {
      emit('send')
    }
  }
}

// File handling
const openFilePicker = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (files.length > 0) {
    emit('attach', files)
  }
  // Reset input
  input.value = ''
}

// Get file preview URL for images
const getFilePreview = (file: File): string => {
  return URL.createObjectURL(file)
}

// Watch for external changes to adjust height
watch(() => props.modelValue, (newValue) => {
  nextTick(() => {
    adjustHeight()
    // Reset height when cleared
    if (!newValue) {
      textareaHeight.value = '48px'
      if (textareaRef.value) {
        textareaRef.value.style.overflowY = 'hidden'
      }
    }
  })
})

// Initial height adjustment
onMounted(() => {
  // Set initial height
  textareaHeight.value = '48px'
  // Adjust if there's initial content
  if (props.modelValue) {
    adjustHeight()
  }
})
</script>

<style lang="scss" scoped>
.chat-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  
  // Attached files preview
  &__attachment {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: $bg-secondary;
    border-radius: 12px;
    
    &-preview {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 8px;
    }
    
    &-name {
      flex: 1;
      @include font-styles(14px, 400, 1.4);
      color: $text-primary;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    &-remove {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: $color-accent;
      color: $color-dark;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      @include transition;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
  
  // Main wrapper with input and send button
  &__wrapper {
    width: 100%;
    display: flex;
    gap: 10px;
    align-items: flex-end; // Align to bottom when textarea expands
  }
  
  // Field wrapper (textarea + actions)
  &__field-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: flex-end;
  }
  
  // Textarea field
  &__field {
    width: 100%;
    min-height: 48px;
    max-height: 150px;
    padding: 12px 85px 12px 14px; // Right padding for action buttons
    border-radius: $radius;
    background: $bg-primary;
    color: $text-primary;
    box-shadow: $shadow-input;
    @include font-styles(16px, 400, 1.5);
    font-family: 'Roboto', sans-serif;
    border: none;
    resize: none;
    overflow-y: hidden; // Initially hidden, will be set to auto when needed
    @include transition;
    
    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: $text-secondary;
      border-radius: 2px;
    }
    
    // Ensure text is always visible
    -webkit-text-fill-color: $text-primary;
    -webkit-opacity: 1;
    opacity: 1;
    
    &::placeholder {
      color: $text-placeholder;
      font-size: 16px;
      line-height: 1.5;
      font-family: '5mal6Lampen', sans-serif;
    }
    
    &:focus {
      outline: none;
      box-shadow: $shadow-input, 0 0 0 2px rgba($accent-primary, 0.5);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  // Action buttons inside input
  &__actions {
    position: absolute;
    right: 10px;
    bottom: 12px;
    display: flex;
    align-items: center;
    gap: 5px;
    
    // Style buttons
    :deep(button) {
      padding: 0;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      @include transition;
      
      &:hover {
        opacity: 0.7;
      }
      
      svg {
        width: 16px;
        height: 16px;
        color: $text-secondary;
      }
    }
  }
}

// Animations
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.2);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
