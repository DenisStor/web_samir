# Глоссарий

## Термины проекта

### Секция (Section)

HTML-фрагмент в `src/sections/{page}/`. Собирается в итоговый HTML файл.

```
src/sections/index/hero.html  →  часть index.html
src/sections/index/services.html  →  часть index.html
```

### Бандл (Bundle)

Объединённый JS файл из нескольких модулей.

```
src/js/admin/*.js  →  admin.bundle.js
```

### Badge

Уровень мастера в системе. Три уровня:

| Badge | Цвет | Описание |
|-------|------|----------|
| `green` | Зелёный | Начинающий |
| `pink` | Розовый | Опытный |
| `blue` | Синий | Топ-мастер |

### Renderer

Модуль админки для отображения списка сущностей.

```
AdminMastersRenderer  — отображает список мастеров
AdminServicesRenderer — отображает список услуг
```

### Form

Модуль админки для редактирования сущности.

```
AdminMasterForm   — форма редактирования мастера
AdminServiceForm  — форма редактирования услуги
```

### IIFE (Immediately Invoked Function Expression)

Паттерн изоляции JavaScript модуля:

```javascript
(function() {
    'use strict';
    // Код модуля
})();
```

Защищает переменные от конфликтов с другими скриптами.

### Симлинк (Symlink)

Символическая ссылка на директорию. На сервере:

```
/var/www/web_samir/data  →  /var/www/web_samir-data/data
```

Позволяет обновлять код без потери данных CMS.

### SharedHelpers

Глобальный объект с утилитами (`src/js/shared/helpers.js`):

```javascript
SharedHelpers.escapeHtml(text)
SharedHelpers.generateId('prefix')
SharedHelpers.generateSlug('Текст')
```

### AppConfig

Глобальный объект для доступа к `config.json`:

```javascript
AppConfig.get('api.timeout', 30000)
AppConfig.get('site.name', "Say's Barbers")
```

### AdminState

Централизованное хранилище состояния админки:

```javascript
AdminState.masters      // Массив мастеров
AdminState.setMasters() // Обновление мастеров
```

### AdminRouter

Навигация между секциями админки:

```javascript
AdminRouter.navigate('masters')  // Переход к мастерам
AdminRouter.navigate('services') // Переход к услугам
```

### Toast

Всплывающее уведомление:

```javascript
showToast('Сохранено', 'success')
showToast('Ошибка', 'error')
```

### Drag & Drop (D&D)

Перетаскивание элементов для изменения порядка. Используется в списках мастеров, услуг, FAQ.

### WYSIWYG

What You See Is What You Get — визуальный редактор текста в админке для статей.

### lockScroll

Функция блокировки прокрутки страницы. Используется при открытии модалок и мобильного меню.

```javascript
SharedHelpers.lockScroll(true);   // Заблокировать
SharedHelpers.lockScroll(false);  // Разблокировать
```

### Shared секции

HTML-секции в `src/sections/shared/`, общие для нескольких страниц. Подключаются через префикс `shared/` в конфиге сборки (например, `shared/footer.html`).

### Cache Busting

Добавление хэша к URL ресурса для сброса кэша браузера:

```html
style.css?v=a1b2c3d4
```

### Rate Limiting

Ограничение частоты запросов к API для защиты от атак:

```
Максимум 5 попыток входа за 15 минут
```

## Файловая структура

| Путь | Описание |
|------|----------|
| `src/sections/` | HTML секции |
| `src/css/` | CSS модули |
| `src/js/` | JavaScript модули |
| `server/` | Python серверные модули |
| `data/` | SQLite БД CMS (`saysbarbers.db`) |
| `uploads/` | Загруженные изображения |
| `scripts/` | Утилиты сборки |

## Глобальные объекты

| Объект | Страница | Описание |
|--------|----------|----------|
| `SaysApp` | index.html | Модули главной |
| `ShopApp` | shop.html | SPA магазина |
| `AdminPanel` | admin.html | Главный модуль админки |
| `AdminState` | admin.html | Состояние админки |
| `SharedHelpers` | все | Утилиты |
| `AppConfig` | все | Конфигурация |
