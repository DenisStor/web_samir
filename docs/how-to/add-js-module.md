# Как создать JS модуль

## Типы модулей

| Тип | Расположение | Глобальный объект |
|-----|--------------|-------------------|
| Site (главная) | `src/js/site/` | `SaysApp` |
| Admin (админка) | `src/js/admin/` | `AdminPanel` |
| Shop (магазин) | `src/js/shop/` | `ShopApp` |
| Shared (общие) | `src/js/shared/` | `SharedHelpers` |

---

## Модуль для главной страницы (site)

### 1. Создайте файл

```bash
touch src/js/site/new-feature.js
```

### 2. Напишите код (IIFE паттерн)

```javascript
/**
 * New Feature Module
 * Описание модуля
 */

(function() {
    'use strict';

    // Приватные переменные
    var container = null;
    var isInitialized = false;

    /**
     * Инициализация модуля
     */
    function init() {
        if (isInitialized) return;

        container = document.getElementById('new-feature');
        if (!container) return;

        bindEvents();
        isInitialized = true;
    }

    /**
     * Привязка событий
     */
    function bindEvents() {
        container.addEventListener('click', handleClick);
    }

    /**
     * Обработчик клика
     */
    function handleClick(event) {
        var target = event.target;
        if (target.matches('.action-button')) {
            doSomething(target);
        }
    }

    /**
     * Основная логика
     */
    function doSomething(element) {
        var id = element.getAttribute('data-id');
        var text = SharedHelpers.escapeHtml(element.textContent);
        // ...
    }

    /**
     * Очистка (вызывается при уничтожении)
     */
    function cleanup() {
        if (container) {
            container.removeEventListener('click', handleClick);
        }
        isInitialized = false;
    }

    // Публичный API
    window.SaysApp = window.SaysApp || {};
    window.SaysApp.NewFeature = {
        init: init,
        cleanup: cleanup
    };

    // Автоинициализация при загрузке DOM
    document.addEventListener('DOMContentLoaded', init);
})();
```

### 3. Подключите в HTML

В `src/sections/index/scripts.html`:

```html
<script src="src/js/site/new-feature.js"></script>
```

### 4. Соберите страницу

```bash
python3 scripts/build.py --page=index
```

---

## Модуль для админки (Renderer)

### 1. Создайте файл

```bash
touch src/js/admin/renderers/new-entity.js
```

### 2. Напишите код

```javascript
/**
 * Admin New Entity Renderer
 * Рендеринг списка сущностей
 */

var AdminNewEntityRenderer = (function() {
    'use strict';

    var container = null;

    /**
     * Инициализация
     */
    function init() {
        container = document.getElementById('newEntityGrid');
    }

    /**
     * Рендеринг списка
     */
    function render() {
        if (!container) {
            container = document.getElementById('newEntityGrid');
            if (!container) return;
        }

        var items = AdminState.newEntities || [];

        if (items.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет данных</p>';
            return;
        }

        var html = items.map(function(item, index) {
            return '<div class="entity-card" data-id="' + item.id + '">' +
                '<h3>' + window.escapeHtml(item.name) + '</h3>' +
                '<div class="entity-actions">' +
                    '<button class="btn btn-secondary" data-action="edit-entity" data-id="' + item.id + '">' +
                        'Редактировать' +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-entity" data-id="' + item.id + '">' +
                        SharedIcons.get('delete') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
    }

    // Публичный API
    return {
        init: init,
        render: render
    };
})();

// Экспорт
window.AdminNewEntityRenderer = AdminNewEntityRenderer;
```

### 3. Добавьте в бандл

В `scripts/build.py` в списке файлов админки:

```python
'renderers/new-entity.js',
```

### 4. Соберите бандл

```bash
python3 scripts/build.py --admin-only
```

---

## Правила JavaScript

### Используйте var вместо let/const

```javascript
// Правильно
var name = 'value';

// Неправильно
const name = 'value';
let name = 'value';
```

### Не используйте optional chaining

```javascript
// Правильно
var name = (user && user.name) ? user.name : 'Guest';

// Неправильно
var name = user?.name ?? 'Guest';
```

### Используйте SharedHelpers

```javascript
// XSS защита
var safe = SharedHelpers.escapeHtml(userInput);

// Генерация ID
var id = SharedHelpers.generateId('entity');

// Debounce
var debouncedFn = SharedHelpers.debounce(fn, 300);
```

### parseInt с radix

```javascript
// Правильно
var num = parseInt(value, 10);

// Неправильно
var num = parseInt(value);
```

---

## Event Listeners

### Делегирование событий

```javascript
// Правильно — один listener на контейнер
container.addEventListener('click', function(event) {
    var target = event.target;
    if (target.matches('.button-edit')) {
        handleEdit(target);
    }
    if (target.matches('.button-delete')) {
        handleDelete(target);
    }
});

// Неправильно — listener на каждый элемент
buttons.forEach(function(btn) {
    btn.addEventListener('click', handler);
});
```

### Passive listeners

```javascript
// Для scroll/touch
element.addEventListener('scroll', handler, { passive: true });
```

### Throttle для scroll

```javascript
var throttledScroll = SharedHelpers.throttleRAF(onScroll);
window.addEventListener('scroll', throttledScroll, { passive: true });
```

---

## Шаблоны

- [Renderer для админки](../examples/new-renderer.js)
- [Форма админки](../examples/new-form.js)
