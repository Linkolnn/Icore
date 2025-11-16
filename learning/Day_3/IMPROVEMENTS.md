# 🎨 День 3: Улучшения и Рефакторинг

> Дополнительные улучшения кода для соответствия DRY принципу и лучшим практикам

---

## 📋 Обзор улучшений

После базовой реализации списка чатов были проведены следующие улучшения:

### 1. Создание переиспользуемых composables ✅
### 2. Создание утилит для работы с датами ✅
### 3. Рефакторинг компонентов ✅
### 4. Исправление реактивности ✅

---

## 🎯 Проблема: Дублирование кода

### Обнаруженное дублирование

После первой реализации в коде появилось дублирование логики:

**1. Название чата**
- `chat/Item.vue` (строки 58-74) - вычисление названия чата
- `chat/[id].vue` (строки 119-138) - та же логика

**2. Форматирование времени**
- `chat/Item.vue` (строки 90-98) - форматирование HH:MM
- Потенциально нужно в других компонентах

**3. Подзаголовок и аватар чата**
- Дублирование логики в `chat/[id].vue`

---

## ✨ Решение 1: Composable `useChat.ts`

### Создание файла

**Путь:** `frontend/app/composables/useChat.ts`

```typescript
import type { Chat, ChatParticipant } from '~/types/chat.types'

/**
 * Composable для работы с чатами
 *
 * Применяем паттерн: Composition API
 * Принцип: DRY - переиспользуемая логика для чатов
 */

/**
 * Получить название чата
 * Для personal - имя собеседника
 * Для group/channel - название группы
 */
export function useChatName(chat: MaybeRef<Chat | null>, previewUser?: any): ComputedRef<string> {
  const authStore = useAuthStore()
  const chatRef = toRef(chat)

  return computed(() => {
    // Preview mode: имя пользователя
    if (previewUser && previewUser.value) {
      const user = unref(previewUser)
      return user.name || user.username || 'Неизвестный пользователь'
    }

    const chatValue = chatRef.value
    if (!chatValue) return 'Чат'

    // Если есть название - используем его
    if (chatValue.name) return chatValue.name

    // Для personal чата - имя собеседника
    if (chatValue.type === 'personal' && chatValue.participants.length > 0) {
      const currentUserId = authStore.user?._id
      const otherUser = chatValue.participants.find(p => p._id !== currentUserId)
      return otherUser?.name || otherUser?.username || 'Неизвестный пользователь'
    }

    return 'Новый чат'
  })
}

/**
 * Получить собеседника в personal чате
 */
export function useChatOtherUser(chat: MaybeRef<Chat | null>): ComputedRef<ChatParticipant | null> {
  const authStore = useAuthStore()
  const chatRef = toRef(chat)

  return computed(() => {
    const chatValue = chatRef.value
    if (!chatValue || chatValue.type !== 'personal' || chatValue.participants.length === 0) {
      return null
    }

    const currentUserId = authStore.user?._id
    return chatValue.participants.find(p => p._id !== currentUserId) || null
  })
}

/**
 * Получить подзаголовок чата
 */
export function useChatSubtitle(chat: MaybeRef<Chat | null>, previewUser?: any): ComputedRef<string> {
  const chatRef = toRef(chat)

  return computed(() => {
    // Preview mode: email или userId
    if (previewUser && previewUser.value) {
      const user = unref(previewUser)
      return user.email || user.userId || ''
    }

    const chatValue = chatRef.value
    if (!chatValue) return ''

    if (chatValue.type === 'personal') {
      return '2 участника / онлайн'
    }

    return `${chatValue.participants.length} участников / время в сети`
  })
}

/**
 * Получить аватар чата
 */
export function useChatAvatar(chat: MaybeRef<Chat | null>, previewUser?: any): ComputedRef<string> {
  const authStore = useAuthStore()
  const chatRef = toRef(chat)

  return computed(() => {
    // Preview mode: аватар пользователя
    if (previewUser && previewUser.value) {
      const user = unref(previewUser)
      return user.avatar || '/default-avatar.png'
    }

    const chatValue = chatRef.value
    if (!chatValue) return '/default-avatar.png'

    // Для personal чата - аватар собеседника
    if (chatValue.type === 'personal' && chatValue.participants.length > 0) {
      const currentUserId = authStore.user?._id
      const otherUser = chatValue.participants.find(p => p._id !== currentUserId)
      return otherUser?.avatar || '/default-avatar.png'
    }

    // Для группового чата - аватар чата
    return chatValue.avatar || '/default-avatar.png'
  })
}
```

### Ключевые моменты

**1. MaybeRef Pattern**
```typescript
// MaybeRef<T> = T | Ref<T> | ComputedRef<T>
export function useChatName(chat: MaybeRef<Chat | null>)
```
- Позволяет передавать как обычные значения, так и refs
- Универсальность использования

**2. toRef() для реактивности**
```typescript
const chatRef = toRef(chat)
// chatRef.value - всегда актуальное значение
```

**3. unref() для unwrapping**
```typescript
const user = unref(previewUser)
// Извлекает значение из ref, если это ref
```

---

## ✨ Решение 2: Утилиты `date.utils.ts`

### Создание файла

**Путь:** `frontend/app/utils/date.utils.ts`

```typescript
/**
 * Утилиты для работы с датами
 *
 * Применяем паттерн: Utility Functions
 * Принцип: DRY - переиспользуемая логика для форматирования времени
 */

/**
 * Форматировать дату в формат HH:MM
 * @param date - Дата для форматирования
 * @returns Время в формате HH:MM
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Форматировать дату в формат DD.MM.YYYY
 * @param date - Дата для форматирования
 * @returns Дата в формате DD.MM.YYYY
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Форматировать дату в формат DD.MM.YYYY HH:MM
 * @param date - Дата для форматирования
 * @returns Дата и время в формате DD.MM.YYYY HH:MM
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}
```

### Преимущества

✅ **Единое место** для форматирования дат
✅ **Легко тестировать** - чистые функции
✅ **Расширяемо** - легко добавить новые форматы
✅ **Auto-import** - Nuxt автоматически импортирует из `utils/`

---

## 🔧 Рефакторинг компонентов

### chat/Item.vue

**До рефакторинга:**
```typescript
// 17+ строк дублированного кода
const chatName = computed(() => {
  if (props.chat.name) {
    return props.chat.name
  }

  if (props.chat.type === 'personal' && props.chat.participants.length > 0) {
    const authStore = useAuthStore()
    const currentUserId = authStore.user?._id
    const otherUser = props.chat.participants.find(p => p._id !== currentUserId)
    return otherUser?.name || otherUser?.username || 'Неизвестный пользователь'
  }

  return 'Новый чат'
})

const formattedTime = computed(() => {
  if (!props.chat.lastMessage) return ''
  const date = new Date(props.chat.lastMessage.createdAt)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})
```

**После рефакторинга:**
```typescript
// 5 строк - чисто и переиспользуемо
const chatName = useChatName(toRef(props, 'chat'))

const formattedTime = computed(() => {
  if (!props.chat.lastMessage) return ''
  return formatTime(props.chat.lastMessage.createdAt)
})
```

### chat/[id].vue

**До рефакторинга:**
```typescript
// 70+ строк дублированного кода для chatName, chatSubtitle, chatAvatar
const chatName = computed(() => {
  if (isPreviewMode.value && previewUser.value) {
    return previewUser.value.name || previewUser.value.username || 'Неизвестный пользователь'
  }
  const chat = chatsStore.currentChat
  if (!chat) return 'Чат'
  if (chat.name) return chat.name
  if (chat.type === 'personal' && chat.participants.length > 0) {
    const currentUserId = authStore.user?._id
    const otherUser = chat.participants.find(p => p._id !== currentUserId)
    return otherUser?.name || otherUser?.username || 'Неизвестный пользователь'
  }
  return 'Новый чат'
})
// ... аналогично для chatSubtitle и chatAvatar
```

**После рефакторинга:**
```typescript
// 3 строки - используем composables
const chatName = useChatName(computed(() => chatsStore.currentChat), previewUser)
const chatSubtitle = useChatSubtitle(computed(() => chatsStore.currentChat), previewUser)
const chatAvatar = useChatAvatar(computed(() => chatsStore.currentChat), previewUser)
```

---

## 🐛 Исправление бага: Реактивность

### Проблема

После первого рефакторинга чаты отображались как "НОВЫЙ ЧАТ" вместо имён пользователей.

**Причина:** Неправильная работа с реактивностью в composables.

### Ошибочная попытка 1

```typescript
// ❌ Неправильно - двойная обёртка computed
const chatName = useChatName(computed(() => props.chat))

// useChatName внутри:
return computed(() => {
  if (!chat) return 'Чат'  // chat - это computed, не значение!
  // ...
})
```

### Ошибочная попытка 2

```typescript
// ❌ Неправильно - toRef с функцией
const chatName = useChatName(toRef(() => props.chat))
```

### ✅ Правильное решение

**1. Изменить сигнатуру composable:**
```typescript
// Принимать MaybeRef вместо простого значения
export function useChatName(
  chat: MaybeRef<Chat | null>,  // ← MaybeRef!
  previewUser?: any
): ComputedRef<string>
```

**2. Внутри composable использовать toRef:**
```typescript
const chatRef = toRef(chat)  // Конвертируем в ref

return computed(() => {
  const chatValue = chatRef.value  // ← .value для доступа
  if (!chatValue) return 'Чат'
  // ...
})
```

**3. При вызове передавать правильный ref:**
```typescript
// В chat/Item.vue - используем toRef(props, 'chat')
const chatName = useChatName(toRef(props, 'chat'))

// В chat/[id].vue - используем computed для store
const chatName = useChatName(computed(() => chatsStore.currentChat), previewUser)
```

### Почему это работает

```typescript
// toRef(props, 'chat') создаёт ref, который:
// - Реактивно следит за props.chat
// - Обновляется при изменении props

// computed(() => chatsStore.currentChat) создаёт computed, который:
// - Реактивно следит за store.currentChat
// - Обновляется при изменении store

// toRef(chat) внутри composable конвертирует:
// - MaybeRef<T> → Ref<T>
// - Работает и с ref, и с computed, и с обычным значением
```

---

## 📊 Результаты улучшений

### Метрики кода

| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Дублирование (строк) | ~150 | 0 | -100% |
| chat/Item.vue (строк) | 98 | 77 | -21% |
| chat/[id].vue (строк) | 344 | 281 | -18% |
| Переиспользуемых функций | 0 | 7 | +7 |
| Утилит | 0 | 3 | +3 |

### Качественные улучшения

✅ **DRY принцип** - нет дублирования
✅ **Single Responsibility** - каждая функция делает одно
✅ **Testability** - легко тестировать composables и utilities
✅ **Maintainability** - одно место для изменений
✅ **Readability** - код стал чище и понятнее
✅ **Reusability** - функции можно использовать везде

---

## 🎓 Паттерны и концепции

### 1. Composition API Pattern

```typescript
// Composable = переиспользуемая логика
export function useSomething(param: MaybeRef<Type>) {
  // 1. Создать refs
  const someRef = toRef(param)

  // 2. Создать computed
  const computed = computed(() => {
    return someRef.value.transform()
  })

  // 3. Вернуть реактивные значения
  return { computed }
}
```

### 2. MaybeRef Pattern

```typescript
// Универсальный тип для реактивных и не-реактивных значений
type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

// Использование
function useData(data: MaybeRef<Data>) {
  const dataRef = toRef(data)  // Всегда ref
  return computed(() => dataRef.value)
}

// Можно передавать:
useData(rawData)              // Обычное значение
useData(ref(data))            // Ref
useData(computed(() => data)) // Computed
useData(toRef(props, 'data')) // Ref из props
```

### 3. Utility Functions Pattern

```typescript
// Чистые функции без сайд-эффектов
export function formatTime(date: string | Date): string {
  // 1. Принимает входные данные
  // 2. Выполняет трансформацию
  // 3. Возвращает результат
  // 4. Нет сайд-эффектов (не изменяет внешнее состояние)
  return result
}
```

---

## 📝 Чек-лист рефакторинга

При рефакторинге кода следуй этому чек-листу:

### Поиск дублирования
- [ ] Найди повторяющуюся логику (>10 строк)
- [ ] Найди повторяющиеся вычисления
- [ ] Найди повторяющиеся форматирования

### Создание composables
- [ ] Создай файл в `composables/`
- [ ] Используй `MaybeRef` для параметров
- [ ] Используй `toRef()` для конвертации
- [ ] Верни `ComputedRef` или объект с refs
- [ ] Добавь JSDoc комментарии

### Создание utilities
- [ ] Создай файл в `utils/`
- [ ] Сделай функции чистыми (pure)
- [ ] Добавь типы для параметров и возврата
- [ ] Добавь JSDoc с примерами

### Рефакторинг компонентов
- [ ] Замени дублированный код на composables
- [ ] Используй `toRef(props, 'name')` для props
- [ ] Используй `computed(() => store.value)` для store
- [ ] Проверь реактивность

### Тестирование
- [ ] Проверь что всё работает
- [ ] Проверь консоль на ошибки
- [ ] Проверь реактивность (изменения отображаются)
- [ ] Проверь типы TypeScript

---

## 💡 Советы

### 1. Когда создавать composable?

✅ **Создавай когда:**
- Логика повторяется в 2+ компонентах
- Логика связана с реактивностью (refs, computed)
- Нужна сложная бизнес-логика

❌ **НЕ создавай когда:**
- Логика используется только в одном месте
- Логика очень простая (1-2 строки)
- Можно использовать utility функцию

### 2. Когда создавать utility?

✅ **Создавай когда:**
- Чистая трансформация данных
- Форматирование (даты, числа, строки)
- Валидация
- Математические операции

❌ **НЕ создавай когда:**
- Нужна реактивность
- Нужен доступ к store/router
- Сложная бизнес-логика с состоянием

### 3. Debugging реактивности

```typescript
// Добавь console.log для отладки
const chatName = useChatName(toRef(props, 'chat'))

watch(chatName, (newVal) => {
  console.log('chatName changed:', newVal)
})

// Проверь что ref обновляется
const chatRef = toRef(props, 'chat')
watch(chatRef, (newVal) => {
  console.log('chat prop changed:', newVal)
})
```

---

## 🎯 Следующие шаги

После применения этих улучшений:

1. ✅ Проверь что нет TypeScript ошибок
2. ✅ Проверь что всё работает в браузере
3. ✅ Проверь что нет дублирования кода
4. ✅ Переходи к День 4 (Сообщения)

---

## 🎉 Поздравляем!

Теперь твой код:
- ✅ Следует DRY принципу
- ✅ Использует composables для переиспользования
- ✅ Использует utilities для трансформаций
- ✅ Правильно работает с реактивностью
- ✅ Легко поддерживать и расширять
- ✅ Готов для масштабирования

**Отличная работа! 🚀**
