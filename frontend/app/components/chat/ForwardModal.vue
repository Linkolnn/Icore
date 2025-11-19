<template>
  <UiBaseModal
    v-model="isOpen"
    title="Переслать сообщения"
    size="large"
    :close-on-backdrop="true"
    @close="handleClose"
  >
    <div class="forward-modal">
      <!-- Search -->
      <div class="forward-modal__search">
        <UiBaseInput
          v-model="searchQuery"
          placeholder="Поиск чатов..."
          variant="filled"
        />
      </div>

      <!-- Chat List -->
      <div class="forward-modal__list">
        <ChatList 
          :search="searchQuery"
          :compact="true"
          :selectable="true"
          :selected-chat-id="selectedChatId"
          @chat-select="handleChatSelect"
        />
      </div>
    </div>

    <!-- Footer with Forward button -->
    <template #footer>
      <UiBaseButton
        variant="secondary"
        @click="handleClose"
      >
        Отмена
      </UiBaseButton>
      <UiBaseButton
        variant="primary"
        :disabled="!selectedChatId"
        @click="handleForward"
      >
        Переслать
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>

<script setup lang="ts">
import { useSelectionStore } from '~/stores/selection'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'forward': [chatId: string]
}>()

const selectionStore = useSelectionStore()
const searchQuery = ref('')
const selectedChatId = ref<string | null>(null)

// Computed for v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/**
 * Handle chat selection
 */
function handleChatSelect(chatId: string) {
  selectedChatId.value = chatId
}

/**
 * Handle forward action
 */
function handleForward() {
  if (selectedChatId.value) {
    emit('forward', selectedChatId.value)
    handleClose()
  }
}

/**
 * Handle modal close
 */
function handleClose() {
  searchQuery.value = ''
  selectedChatId.value = null
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.forward-modal {
  display: flex;
  flex-direction: column;
  height: 500px;

  &__search {
    border-radius: $radius;
    padding: 10px;
    background: $bg-primary;
    box-shadow: $shadow-block;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    background: $bg-primary;
    
    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}
</style>
