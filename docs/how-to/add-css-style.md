# Как добавить стили

## Структура CSS

```
src/css/
├── shared/          # Общие стили
│   ├── variables.css
│   ├── base.css
│   ├── navigation.css
│   ├── components.css
│   └── utilities.css
│
├── site/            # Главная страница
│   ├── index.css    # Импорты
│   ├── hero.css
│   ├── services.css
│   └── ...
│
├── admin/           # Админка
├── shop/            # Магазин
└── legal/           # Юридические
```

## Добавление стилей к существующей секции

### 1. Найдите CSS файл секции

```bash
ls src/css/site/
# hero.css, services.css, masters.css...
```

### 2. Добавьте стили

```css
/* src/css/site/hero.css */

.hero-new-element {
    color: var(--accent-green);
    padding: var(--spacing-md);
}
```

### 3. Обновите браузер

Стили применятся автоматически (если сервер запущен).

---

## Создание нового CSS модуля

### 1. Создайте файл

```bash
touch src/css/site/new-section.css
```

### 2. Добавьте стили

```css
/* =====================================================================
   NEW-SECTION.CSS - Описание
   ===================================================================== */

.new-section {
    padding: var(--section-padding);
    background: var(--surface-primary);
}

.new-section-title {
    font-size: var(--text-3xl);
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
}

/* Responsive */
@media (max-width: 768px) {
    .new-section {
        padding: var(--section-padding-mobile);
    }
}
```

### 3. Добавьте импорт

В `src/css/site/index.css`:

```css
@import 'new-section.css';
```

---

## CSS переменные

### Цвета

```css
/* Текст */
var(--text-primary)      /* Основной текст */
var(--text-secondary)    /* Вторичный текст */
var(--text-gray)         /* Серый текст */

/* Фоны */
var(--surface-primary)   /* Основной фон */
var(--surface-secondary) /* Вторичный фон */
var(--surface-card)      /* Фон карточки */

/* Акцент */
var(--accent-green)      /* Зелёный акцент */
var(--accent-green-hover) /* Зелёный при наведении */
```

### Отступы

```css
var(--spacing-xs)   /* 4px */
var(--spacing-sm)   /* 8px */
var(--spacing-md)   /* 16px */
var(--spacing-lg)   /* 24px */
var(--spacing-xl)   /* 32px */
var(--spacing-2xl)  /* 48px */

var(--section-padding)        /* 80px 0 */
var(--section-padding-mobile) /* 60px 0 */
```

### Типографика

```css
var(--text-sm)   /* 0.875rem */
var(--text-base) /* 1rem */
var(--text-lg)   /* 1.125rem */
var(--text-xl)   /* 1.25rem */
var(--text-2xl)  /* 1.5rem */
var(--text-3xl)  /* 2rem */
```

### Радиусы

```css
var(--radius-sm)   /* 4px */
var(--radius-md)   /* 8px */
var(--radius-lg)   /* 12px */
var(--radius-xl)   /* 16px */
var(--radius-full) /* 9999px */
```

---

## Компоненты

### Кнопки

```html
<button class="btn btn-primary">Основная</button>
<button class="btn btn-secondary">Вторичная</button>
<button class="btn btn-outline">Контурная</button>
```

### Карточки

```html
<div class="card">
    <div class="card-header">Заголовок</div>
    <div class="card-body">Контент</div>
</div>
```

### Сетка

```html
<div class="grid grid-2">  <!-- 2 колонки -->
<div class="grid grid-3">  <!-- 3 колонки -->
<div class="grid grid-4">  <!-- 4 колонки -->
```

---

## Утилиты

```css
.text-center    /* text-align: center */
.text-left      /* text-align: left */
.text-right     /* text-align: right */

.mt-1, .mt-2... /* margin-top */
.mb-1, .mb-2... /* margin-bottom */
.py-1, .py-2... /* padding вертикальный */
.px-1, .px-2... /* padding горизонтальный */

.hidden         /* display: none */
.visible        /* display: block */
```

---

## Responsive

```css
/* Mobile first */
.element {
    padding: 16px;
}

/* Tablet */
@media (min-width: 768px) {
    .element {
        padding: 24px;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .element {
        padding: 32px;
    }
}
```

Брейкпоинты:
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px

---

## Частые ошибки

### Стили не применяются

1. Проверьте импорт в `index.css`
2. Проверьте специфичность селектора
3. Очистите кэш браузера

### Конфликт имён

Используйте префиксы секций:

```css
/* Правильно */
.hero-title { }
.services-title { }

/* Неправильно */
.title { }  /* Слишком общий */
```

---

## Шаблон модуля

См. [examples/new-css-module.css](../examples/new-css-module.css)
