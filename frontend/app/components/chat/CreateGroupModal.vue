<template>
  <BaseModal
    :is-open="isOpen"
    @close="handleClose"
    class="create-group-modal"
  >
    <div class="modal-header">
      <h2>Создать беседу</h2>
    </div>

    <div class="modal-content">
      <!-- Step 1: Основная информация -->
      <div v-if="currentStep === 1" class="step step--info">
        <!-- Аватар -->
        <div class="avatar-section">
          <div 
            class="avatar-upload"
            @click="selectAvatar"
          >
            <img v-if="form.avatar" :src="form.avatar" alt="">
            <Icon v-else name="material-symbols:photo-camera" />
          </div>
          <span class="avatar-hint">Выбрать аватар</span>
        </div>

        <!-- Форма -->
        <div class="form-section">
          <div class="form-group">
            <label>Название беседы *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Введите название..."
              maxlength="100"
              class="form-input"
            >
            <span class="form-hint">{{ form.name.length }}/100</span>
          </div>

          <div class="form-group">
            <label>Описание</label>
            <textarea
              v-model="form.description"
              placeholder="О чем эта беседа..."
              maxlength="500"
              rows="3"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Тип беседы</label>
            <div class="radio-group">
              <label class="radio-item">
                <input
                  v-model="form.type"
                  type="radio"
                  value="group"
                >
                <span class="radio-label">
                  <Icon name="material-symbols:group" />
                  Группа
                </span>
                <span class="radio-hint">До 100 участников</span>
              </label>
              <label class="radio-item">
                <input
                  v-model="form.type"
                  type="radio"
                  value="channel"
                >
                <span class="radio-label">
                  <Icon name="material-symbols:campaign" />
                  Канал
                </span>
                <span class="radio-hint">До 1000 участников</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Выбор участников -->
      <div v-if="currentStep === 2" class="step step--members">
        <!-- Поиск -->
        <div class="search-bar">
          <Icon name="material-symbols:search" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск пользователей..."
            @input="debouncedSearch"
          >
        </div>

        <!-- Выбранные участники -->
        <div v-if="selectedUsers.length > 0" class="selected-section">
          <div class="selected-header">
            <h4>Выбрано: {{ selectedUsers.length }}</h4>
            <button @click="selectedUsers = []" class="clear-btn">
              Очистить
            </button>
          </div>
          <div class="selected-list">
            <div
              v-for="user in selectedUsers"
              :key="user._id"
              class="selected-item"
            >
              <UiAvatar 
                :src="user.avatar" 
                :name="user.name" 
                :user-id="user._id"
                size="xs" 
              />
              <span>{{ user.name }}</span>
              <button @click="removeUser(user._id)">
                <Icon name="material-symbols:close" />
              </button>
            </div>
          </div>
        </div>

        <!-- Список пользователей -->
        <div class="users-section">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <span>Загрузка пользователей...</span>
          </div>

          <div v-else-if="filteredUsers.length === 0" class="empty-state">
            <Icon name="material-symbols:group-off" />
            <p>Пользователи не найдены</p>
          </div>

          <div v-else class="users-list">
            <label
              v-for="user in filteredUsers"
              :key="user._id"
              class="user-item"
            >
              <input
                type="checkbox"
                :checked="isSelected(user._id)"
                @change="toggleUser(user)"
              >
              <UiAvatar 
                :src="user.avatar"
                :name="user.name"
                :user-id="user._id"
                size="sm" 
              />
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-username">@{{ user.username }}</span>
              </div>
              <div 
                v-if="user.isOnline"
                class="status-indicator"
              />
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Действия -->
    <div class="modal-actions">
      <button
        v-if="currentStep > 1"
        @click="currentStep--"
        class="btn btn--secondary"
      >
        Назад
      </button>
      <button
        v-if="currentStep === 1"
        @click="currentStep++"
        class="btn btn--primary"
        :disabled="!form.name"
      >
        Далее
      </button>
      <button
        v-else
        @click="createGroup"
        class="btn btn--primary"
        :disabled="selectedUsers.length === 0 || creating"
      >
        {{ creating ? 'Создание...' : 'Создать беседу' }}
      </button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { debounce } from '@/utils/debounce'
import { useToast } from '@/composables/useToast'

interface User {
  _id: string
  name: string
  username: string
  avatar?: string
  isOnline: boolean
}

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  created: [chat: any]
}>()

const toast = useToast()

const currentStep = ref(1)
const loading = ref(false)
const creating = ref(false)
const searchQuery = ref('')
const allUsers = ref<User[]>([])
const selectedUsers = ref<User[]>([])

const form = ref({
  name: '',
  description: '',
  avatar: '',
  type: 'group' as 'group' | 'channel',
})

// Computed
const maxMembers = computed(() => 
  form.value.type === 'channel' ? 1000 : 100
)

const filteredUsers = computed(() => {
  if (!searchQuery.value) return allUsers.value

  const query = searchQuery.value.toLowerCase()
  return allUsers.value.filter(user => 
    user.name.toLowerCase().includes(query) ||
    user.username.toLowerCase().includes(query)
  )
})

// Methods
function handleClose() {
  // Reset form
  currentStep.value = 1
  form.value = {
    name: '',
    description: '',
    avatar: '',
    type: 'group',
  }
  selectedUsers.value = []
  searchQuery.value = ''
  emit('close')
}

function selectAvatar() {
  // TODO: Implement avatar upload
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      // TODO: Upload file and get URL
      const reader = new FileReader()
      reader.onload = (e) => {
        form.value.avatar = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

function isSelected(userId: string): boolean {
  return selectedUsers.value.some(u => u._id === userId)
}

function toggleUser(user: User) {
  if (isSelected(user._id)) {
    removeUser(user._id)
  } else if (selectedUsers.value.length < maxMembers.value - 1) {
    selectedUsers.value.push(user)
  } else {
    // Show error - max members reached
    toast.error(`Максимум ${maxMembers.value - 1} участников`)
  }
}

function removeUser(userId: string) {
  selectedUsers.value = selectedUsers.value.filter(u => u._id !== userId)
}

async function searchUsers() {
  if (loading.value) return
  
  loading.value = true
  try {
    const response = await $fetch<{ data: User[] }>('/api/users/search', {
      query: {
        search: searchQuery.value,
        exclude: 'current',
        limit: 50,
      }
    })
    allUsers.value = response.data
  } catch (error) {
    console.error('Failed to search users:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(searchUsers, 300)

async function loadUsers() {
  loading.value = true
  try {
    const response = await $fetch<{ data: User[] }>('/api/users', {
      query: {
        exclude: 'current',
        limit: 50,
      }
    })
    allUsers.value = response.data
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

async function createGroup() {
  if (creating.value) return
  
  creating.value = true
  try {
    const response = await $fetch<any>('/api/chats/group', {
      method: 'POST',
      body: {
        name: form.value.name,
        description: form.value.description,
        avatar: form.value.avatar,
        type: form.value.type,
        memberIds: selectedUsers.value.map(u => u._id),
      }
    })
    
    emit('created', response)
    handleClose()
  } catch (error) {
    console.error('Failed to create group:', error)
    toast.error('Не удалось создать беседу')
  } finally {
    creating.value = false
  }
}

// Load users when step 2 is shown
watch(() => currentStep.value, (step) => {
  if (step === 2 && allUsers.value.length === 0) {
    loadUsers()
  }
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables";
@import "@/assets/styles/mixins";

.create-group-modal {
  :deep(.modal-dialog) {
    max-width: 600px;
  }

  .modal-header {
    padding: 24px;
    border-bottom: 1px solid rgba($text-secondary, 0.1);
    
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .modal-content {
    padding: 24px;
    max-height: 500px;
    overflow-y: auto;
  }

  .modal-actions {
    padding: 16px 24px;
    border-top: 1px solid rgba($text-secondary, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  // Step 1: Info
  .step--info {
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 32px;

      .avatar-upload {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: rgba($accent-primary, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        transition: all 0.3s;
        box-shadow: $shadow-block;
        
        &:hover {
          opacity: 0.9;
          transform: scale(1.05);
          box-shadow: $shadow-block;
        }
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        svg {
          width: 32px;
          height: 32px;
          color: $accent-primary;
        }
      }

      .avatar-hint {
        margin-top: 12px;
        color: $text-secondary;
        font-size: 14px;
      }
    }

    .form-section {
      .form-group {
        margin-bottom: 20px;

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: $text-secondary;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: $bg-primary;
          border: none;
          border-radius: $radius;
          color: $text-primary;
          font-size: 15px;
          transition: all 0.3s;
          box-shadow: $shadow-input;

          &:focus {
            outline: none;
            box-shadow: $shadow-input, $shadow-focus;
            opacity: 0.9;
          }

          &::placeholder {
            color: $text-secondary;
          }
        }

        textarea.form-input {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .form-hint {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: $text-secondary;
          text-align: right;
        }
      }

      .radio-group {
        display: flex;
        gap: 12px;

        .radio-item {
          flex: 1;
          position: relative;
          
          input[type="radio"] {
            position: absolute;
            opacity: 0;
            
            &:checked + .radio-label {
              background: rgba($accent-primary, 0.1);
              border-color: $accent-primary;
            }
          }

          .radio-label {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: $bg-primary;
            border: 2px solid transparent;
            border-radius: $radius;
            cursor: pointer;
            transition: all 0.3s;

            svg {
              width: 20px;
              height: 20px;
              color: $text-primary;
            }
          }

          .radio-hint {
            position: absolute;
            bottom: -20px;
            left: 16px;
            font-size: 12px;
            color: $text-secondary;
          }
        }
      }
    }
  }

  // Step 2: Members
  .step--members {
    .search-bar {
      position: relative;
      margin-bottom: 20px;
      
      input {
        width: 100%;
        padding: 12px 16px 12px 44px;
        background: $bg-primary;
        border: none;
        border-radius: $radius;
        color: $text-primary;
        font-size: 15px;
        box-shadow: $shadow-input;
        
        &::placeholder {
          color: $text-secondary;
        }

        &:focus {
          outline: none;
          box-shadow: $shadow-input, $shadow-focus;
        }
      }
      
      svg {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: $text-secondary;
        width: 20px;
        height: 20px;
      }
    }

    .selected-section {
      margin-bottom: 20px;
      padding: 12px;
      background: rgba($accent-primary, 0.05);
      border-radius: $radius;

      .selected-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        h4 {
          margin: 0;
          font-size: 14px;
          color: $text-secondary;
        }
        
        .clear-btn {
          background: none;
          border: none;
          color: $accent-primary;
          cursor: pointer;
          font-size: 14px;
          
          &:hover {
            opacity: 0.8;
          }
        }
      }

      .selected-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .selected-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: $bg-primary;
          border-radius: $radius;
          box-shadow: $shadow-block;
          
          span {
            font-size: 14px;
          }
          
          button {
            background: none;
            border: none;
            color: $text-secondary;
            cursor: pointer;
            padding: 0;
            display: flex;
            
            svg {
              width: 14px;
              height: 14px;
            }
            
            &:hover {
              color: #f44336;
            }
          }
        }
      }
    }

    .users-section {
      .loading-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: $text-secondary;

        svg {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba($accent-primary, 0.2);
          border-top-color: $accent-primary;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }

      .users-list {
        max-height: 300px;
        overflow-y: auto;
        padding: 4px;

        .user-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: $radius;
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            background: rgba($accent-primary, 0.05);
          }
          
          input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
          }
          
          .user-info {
            flex: 1;
            
            .user-name {
              display: block;
              font-weight: 500;
              color: $text-primary;
            }
            
            .user-username {
              display: block;
              font-size: 14px;
              color: $text-secondary;
            }
          }
          
          .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4CAF50;
          }
        }
      }
    }
  }
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: $radius;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &--primary {
    background: $accent-primary;
    color: white;
    box-shadow: $shadow-block;

    &:hover:not(:disabled) {
      opacity: 0.9;
      box-shadow: $shadow-block;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--secondary {
    background: $bg-primary;
    color: $text-primary;
    box-shadow: $shadow-block;

    &:hover {
      opacity: 0.9;
      box-shadow: $shadow-block;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
