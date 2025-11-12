# 🎭 Тени - Полное Руководство

## ⚠️ ВАЖНО
**Используем ТОЛЬКО официальные тени для темной темы!**  
**НЕ создавать свои тени!**

---

## 📋 Две Главные Тени

### 1. $shadow-block (для всех блоков)
```scss
box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.05), 
            inset 0 0 15px 0 rgba(255, 255, 255, 0.05);
```

**Используется для:**
- ✅ Карточки чатов (ChatItem)
- ✅ Сообщения (Message)
- ✅ Модальные окна (Modal)
- ✅ Dropdown меню
- ✅ Badge/уведомления
- ✅ Кнопки (если они как блоки)
- ✅ Headers/хедеры
- ✅ Карточки пользователей (UserCard)
- ✅ Любые другие блочные элементы

### 2. $shadow-input (только для input)
```scss
box-shadow: 0 0 4px 0 rgba(255, 255, 255, 0.05), 
            inset 0 0 15px 0 rgba(0, 0, 0, 0.05);
```

**Используется для:**
- ✅ `<input>`
- ✅ `<textarea>`
- ✅ `<select>`

---

## 💻 Примеры Использования

### Vue Component с блоком

```vue
<template>
  <div class="chat-item">
    <h4>Название чата</h4>
    <p>Последнее сообщение</p>
  </div>
</template>

<style lang="scss" scoped>
.chat-item {
  background: $bg-secondary;
  border-radius: $radius-md;
  padding: $space-md;
  
  // ✅ Применяем тень блока
  box-shadow: $shadow-block;
  
  &:hover {
    background: $bg-tertiary;
    // Тень остается той же!
  }
}
</style>
```

### Vue Component с input

```vue
<template>
  <div class="input-wrapper">
    <input 
      v-model="text" 
      placeholder="Введите сообщение..."
    />
  </div>
</template>

<style lang="scss" scoped>
input {
  background: $bg-input;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: $space-sm $space-md;
  
  // ✅ Применяем тень input
  box-shadow: $shadow-input;
  
  &:focus {
    border-color: $accent-primary;
    
    // ✅ При фокусе комбинируем с focus тенью
    box-shadow: $shadow-input, $shadow-focus;
  }
}
</style>
```

### Сложный компонент (Message с разными элементами)

```vue
<template>
  <div class="message">
    <div class="message-content">
      <p>{{ text }}</p>
      
      <!-- Если внутри есть кнопка -->
      <button class="reply-btn">Ответить</button>
      
      <!-- Если внутри есть input -->
      <input 
        v-if="editing" 
        v-model="editText"
        class="edit-input"
      />
    </div>
    
    <span class="badge">Важно</span>
  </div>
</template>

<style lang="scss" scoped>
// Само сообщение - блок
.message {
  background: $msg-incoming;
  border-radius: $radius-md;
  padding: $space-md;
  box-shadow: $shadow-block; // ✅ Тень блока
}

// Кнопка внутри - тоже блок
.reply-btn {
  background: $bg-tertiary;
  border-radius: $radius-sm;
  padding: $space-xs $space-sm;
  box-shadow: $shadow-block; // ✅ Тень блока
}

// Input внутри - использует свою тень
.edit-input {
  box-shadow: $shadow-input; // ✅ Тень input
  
  &:focus {
    box-shadow: $shadow-input, $shadow-focus;
  }
}

// Badge - блок
.badge {
  background: $accent-primary;
  border-radius: $radius-full;
  box-shadow: $shadow-block; // ✅ Тень блока
}
</style>
```

---

## 🚫 Что НЕ нужно делать

### ❌ Не создавать свои тени
```scss
// ❌ ПЛОХО
.my-component {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

// ❌ ПЛОХО
.my-component {
  box-shadow: 0 5px 10px rgba(255,255,255,0.2);
}

// ✅ ХОРОШО
.my-component {
  box-shadow: $shadow-block;
}
```

### ❌ Не применять тени к неподходящим элементам
```scss
// ❌ ПЛОХО - текст не нуждается в тени
h1 {
  box-shadow: $shadow-block;
}

// ❌ ПЛОХО - иконки не нуждаются в тени
.icon {
  box-shadow: $shadow-block;
}

// ❌ ПЛОХО - инлайн элементы
span {
  box-shadow: $shadow-block;
}

// ✅ ХОРОШО - блочные элементы
.card {
  box-shadow: $shadow-block;
}
```

### ❌ Не менять тени при состояниях (обычно)
```scss
// ❌ ПЛОХО - менять тень при hover
.card {
  box-shadow: $shadow-block;
  
  &:hover {
    box-shadow: 0 10px 20px rgba(0,0,0,0.3); // Не надо!
  }
}

// ✅ ХОРОШО - менять только background
.card {
  box-shadow: $shadow-block;
  background: $bg-secondary;
  
  &:hover {
    background: $bg-tertiary; // Меняем фон, тень остается
  }
}
```

---

## 📝 Utility Классы

Если не хотите писать `box-shadow` каждый раз, используйте готовые классы:

```vue
<template>
  <!-- С классом -->
  <div class="chat-item shadow-block">
    Контент
  </div>
  
  <!-- С инпутом -->
  <input class="shadow-input" placeholder="..." />
  
  <!-- Без тени -->
  <div class="chat-item shadow-none">
    Контент без тени
  </div>
</template>
```

---

## 🎯 Быстрая Шпаргалка

| Элемент | Тень |
|---------|------|
| Карточка чата | `$shadow-block` |
| Сообщение | `$shadow-block` |
| Badge/уведомление | `$shadow-block` |
| Кнопка (блок) | `$shadow-block` |
| Header | `$shadow-block` |
| Modal | `$shadow-block` |
| Dropdown | `$shadow-block` |
| Карточка юзера | `$shadow-block` |
| `<input>` | `$shadow-input` |
| `<textarea>` | `$shadow-input` |
| `<select>` | `$shadow-input` |
| Текст | Нет тени |
| Иконка | Нет тени |
| Background | Нет тени |

---

## 🔍 Как проверить что тени применены правильно

### 1. Визуально
- Откройте DevTools
- Найдите элемент
- Проверьте `box-shadow` в Styles
- Должно быть:
  - `0 0 4px 0 rgba(0, 0, 0, 0.05), inset 0 0 15px 0 rgba(255, 255, 255, 0.05)` для блоков
  - `0 0 4px 0 rgba(255, 255, 255, 0.05), inset 0 0 15px 0 rgba(0, 0, 0, 0.05)` для input

### 2. В коде
```scss
// Правильный импорт
@import '@/assets/styles/variables';

// Использование переменных
.my-component {
  box-shadow: $shadow-block; // ✅
}

input {
  box-shadow: $shadow-input; // ✅
}
```

---

## 💡 Частые Вопросы

**Q: Что если мне нужна более сильная тень?**  
A: Нет. Используем только официальные тени. Если нужен акцент - меняем background или border.

**Q: Можно ли комбинировать тени?**  
A: Да, только для focus состояния input:
```scss
input:focus {
  box-shadow: $shadow-input, $shadow-focus;
}
```

**Q: Что делать с анимациями теней?**  
A: Не анимируем тени (это тяжело для производительности). Анимируем transform, opacity, background.

**Q: Нужны ли тени в светлой теме?**  
A: Мы делаем только темную тему, светлая не предусмотрена.

**Q: Что если дизайнер даст другие тени?**  
A: Используем официальные из `цветовая палитра.png`. Это стандарт проекта.

---

## 📚 Связанные файлы

- `frontend/app/assets/styles/variables.scss` - определение теней
- `frontend/app/assets/styles/main.scss` - применение к базовым элементам
- `DESIGN_REFERENCE.md` - полный справочник дизайна
- `layout(img)/цветовая палитра.png` - источник дизайн-системы

---

**Запомните: Две тени, никаких исключений! 🎭**
