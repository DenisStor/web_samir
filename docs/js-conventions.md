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

---

## Шаблоны кода

### Модуль для site (главная страница)

```javascript
/**
 * Module Name
 * Описание модуля
 */

(function() {
    'use strict';

    var container = null;
    var isInitialized = false;

    function init() {
        if (isInitialized) return;
        container = document.getElementById('my-element');
        if (!container) return;
        bindEvents();
        isInitialized = true;
    }

    function bindEvents() {
        container.addEventListener('click', handleClick);
    }

    function handleClick(event) {
        var target = event.target;
        if (target.matches('.action-btn')) {
            doAction(target);
        }
    }

    function doAction(element) {
        var id = element.getAttribute('data-id');
        var text = SharedHelpers.escapeHtml(element.textContent);
        // Логика
    }

    function cleanup() {
        if (container) {
            container.removeEventListener('click', handleClick);
        }
        isInitialized = false;
    }

    // Публичный API
    window.SaysApp = window.SaysApp || {};
    window.SaysApp.ModuleName = {
        init: init,
        cleanup: cleanup
    };

    document.addEventListener('DOMContentLoaded', init);
})();
```

### Renderer для админки

```javascript
/**
 * Admin Entity Renderer
 */

var AdminEntityRenderer = (function() {
    'use strict';

    var container = null;

    function init() {
        container = document.getElementById('entityGrid');
    }

    function render() {
        if (!container) {
            container = document.getElementById('entityGrid');
            if (!container) return;
        }

        var items = AdminState.entities || [];

        if (items.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет данных</p>';
            return;
        }

        var html = items.map(function(item) {
            return '<div class="entity-card" data-id="' + item.id + '">' +
                '<h3>' + window.escapeHtml(item.name) + '</h3>' +
                '<button data-action="edit-entity" data-id="' + item.id + '">' +
                    'Редактировать' +
                '</button>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
    }

    return { init: init, render: render };
})();

window.AdminEntityRenderer = AdminEntityRenderer;
```

### Полные примеры

- [Шаблон renderer](examples/new-renderer.js)
- [Шаблон формы](examples/new-form.js)

---

## Связанные документы

- [Как создать JS модуль](how-to/add-js-module.md) — пошаговый гайд
- [Глоссарий](glossary.md) — термины (IIFE, Renderer, Form)
