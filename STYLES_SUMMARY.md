# 📝 Краткая Справка - Стили

## 📁 Модульная структура (SOLID принцип)

```
frontend/app/assets/styles/
├── variables.scss  ← Только переменные (цвета, тени)
├── mixins.scss     ← Только mixins (адаптив, transitions, hover)
└── main.scss       ← Импорты + базовые стили
```

### Почему разделено?

**Single Responsibility Principle (S в SOLID)**:
- `variables.scss` - отвечает только за хранение значений (цвета, тени)
- `mixins.scss` - отвечает только за переиспользуемую логику (media queries, transitions)
- `main.scss` - отвечает только за импорт и базовые стили

**DRY (Don't Repeat Yourself)**:
- Mixins позволяют не дублировать код
- Переменные позволяют изменить цвет в одном месте

**KISS (Keep It Simple, Stupid)**:
- Легко найти нужный файл
- Каждый файл решает одну задачу

---

## Что есть в `variables.scss`:

### 🎨 Цветовая палитра
```scss
// Основные
$color-dark: #212121;
$color-accent: #FFC700;
$color-light: #FFFFFF;

// Фоны
$bg-primary: #212121;
$bg-secondary: #2a2a2a;
$bg-tertiary: #333333;
$bg-input: #1a1a1a;

// Текст
$text-primary: #FFFFFF;
$text-secondary: #999999;
$text-placeholder: #555555;

// Акцент
$accent-primary: #FFC700;
```

### 🎭 Тени
```scss
// Для всех блоков (кроме input)
$shadow-block: 0 0 4px 0 rgba(0, 0, 0, 0.05), 
               inset 0 0 15px 0 rgba(255, 255, 255, 0.05);

// Для input элементов
$shadow-input: 0 0 4px 0 rgba(255, 255, 255, 0.05), 
               inset 0 0 15px 0 rgba(0, 0, 0, 0.05);
```

---

## Что есть в `mixins.scss`:

### 📱 Адаптивные mixins
```scss
@mixin laptop {
  @media (max-width: 1919px) { @content; }
}

@mixin tablet {
  @media (max-width: 1364px) { @content; }
}

@mixin mobile {
  @media (max-width: 859px) { @content; }
}
```

### 🎨 Стилевые mixins
```scss
// Типографика
@mixin font-styles($font-size, $font-weight, $line-height) {
  font-size: $font-size;
  font-weight: $font-weight;
  line-height: $line-height;
}

// Transition
@mixin transition {
  transition: all 0.35s;
}

// Hover (для устройств с мышью)
@mixin hover {
  @media (hover: hover) and (pointer: fine) { @content; }
}
```

---

## Что есть в `main.scss`:

### Reset
```scss
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  color: $text-primary;
  background-color: $bg-primary;
}
```

### Input стили
```scss
input,
textarea,
select {
  color: $text-primary;
  background: $bg-input;
  box-shadow: $shadow-input;
  
  &::placeholder {
    color: $text-placeholder;
  }
}
```

---

## 💻 Примеры использования:

### Компонент с тенью и hover
```vue
<style lang="scss" scoped>
.chat-item {
  background: $bg-secondary;
  color: $text-primary;
  box-shadow: $shadow-block; // Тень блока
  @include transition; // transition: all 0.35s
  
  @include hover {
    background: $bg-tertiary;
  }
}
</style>
```

### Адаптивный layout
```vue
<style lang="scss" scoped>
.sidebar {
  width: 300px;
  
  @include laptop {
    width: 250px;
  }
  
  @include tablet {
    width: 200px;
  }
  
  @include mobile {
    width: 100%;
  }
}
</style>
```

### Типографика
```vue
<style lang="scss" scoped>
.title {
  @include font-styles(24px, 700, 1.2);
  color: $text-primary;
}

.subtitle {
  @include font-styles(16px, 400, 1.5);
  color: $text-secondary;
}
</style>
```

### Input с тенью
```vue
<style lang="scss" scoped>
input {
  background: $bg-input;
  color: $text-primary;
  box-shadow: $shadow-input; // Автоматически из main.scss
  
  &::placeholder {
    color: $text-placeholder;
  }
}
</style>
```

---

## ⚡ Быстрая шпаргалка:

| Что нужно | Используй |
|-----------|-----------|
| Фон темный | `$bg-primary` |
| Фон компонента | `$bg-secondary` |
| Фон hover | `$bg-tertiary` |
| Фон input | `$bg-input` |
| Текст основной | `$text-primary` |
| Текст вторичный | `$text-secondary` |
| Placeholder | `$text-placeholder` |
| Акцент (желтый) | `$accent-primary` |
| Тень блока | `$shadow-block` |
| Тень input | `$shadow-input` |
| Transition | `@include transition` |
| Hover | `@include hover { ... }` |
| Mobile | `@include mobile { ... }` |
| Tablet | `@include tablet { ... }` |
| Laptop | `@include laptop { ... }` |
| Шрифт | `@include font-styles(size, weight, height)` |

---

**Всё минимально и по делу! 🎯**
