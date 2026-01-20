# JavaScript Конвенции

## Совместимость со старыми браузерами

Проект поддерживает старые браузеры. Запрещено:

- `?.` (optional chaining)
- `??` (nullish coalescing)
- `let` / `const` — использовать `var`
- Arrow functions в глобальном контексте
- Template literals без полифиллов

## IIFE паттерн

Все модули изолированы в IIFE:

```javascript
(function() {
    'use strict';

    function init() { /* ... */ }

    // Публичный API
    window.SaysApp = window.SaysApp || {};
    window.SaysApp.moduleName = { init: init };

    // Автоинициализация
    document.addEventListener('DOMContentLoaded', init);
})();
```

## SharedHelpers

Использовать утилиты из `src/js/shared/helpers.js`:

```javascript
// XSS защита
SharedHelpers.escapeHtml(userInput);

// Генерация ID
SharedHelpers.generateId('master');
// → 'master_1705312847123_k8j2m9n3x'

// Генерация slug
SharedHelpers.generateSlug('Привет Мир!');
// → 'privet-mir'

// Debounce / Throttle
var debouncedSearch = SharedHelpers.debounce(search, 300);
var throttledScroll = SharedHelpers.throttleRAF(onScroll);

// Форматирование
SharedHelpers.formatPrice(1500);        // → '1 500 ₽'
SharedHelpers.formatDate('2024-01-15'); // → '15 января 2024 г.'
```

**Глобальные алиасы:** `escapeHtml()`, `generateId()`, `generateSlug()`, `debounce()`

## AppConfig

Доступ к `config.json`:

```javascript
var timeout = AppConfig.get('api.timeout', 30000);
var siteName = AppConfig.get('site.name', "Say's Barbers");
```

## Правила

```javascript
// Правильно
var price = parseInt(document.getElementById('price').value, 10);
var id = SharedHelpers.generateId('master');
var safe = SharedHelpers.escapeHtml(userInput);

// Неправильно
var price = parseInt(value);           // Нет radix
var id = 'master_' + Date.now();       // Дублирование логики
text?.trim();                          // Optional chaining
```

## Event Listeners

- Все модули должны иметь функцию `cleanup()` или `destroy()`
- Scroll listeners: использовать `SharedHelpers.throttleRAF()`
- Добавлять `{ passive: true }` к scroll/touch listeners
