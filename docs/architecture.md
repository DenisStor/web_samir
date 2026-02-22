# Архитектура проекта

## Визуальная схема

```
┌─────────────────────────────────────────────────────────────────────┐
│                           БРАУЗЕР                                    │
├─────────────────────────────────────────────────────────────────────┤
│  index.html    shop.html    admin.html    legal.html               │
│       │            │            │             │                      │
│       ▼            ▼            ▼             ▼                      │
│  ┌─────────┐  ┌─────────┐  ┌───────────┐  ┌─────────┐              │
│  │ SaysApp │  │ ShopApp │  │AdminPanel │  │LegalApp │              │
│  └────┬────┘  └────┬────┘  └─────┬─────┘  └────┬────┘              │
│       │            │             │              │                    │
│       └────────────┴──────┬──────┴──────────────┘                   │
│                           │                                          │
│                    SharedHelpers                                     │
│                      AppConfig                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP API
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                         СЕРВЕР (Python)                            │
├───────────────────────────────────────────────────────────────────┤
│  run.py → handler.py → routes.py                                   │
│                │                                                    │
│                ▼                                                    │
│         ┌──────────┐                                               │
│         │ database │ ←→ data/saysbarbers.db (SQLite)               │
│         └──────────┘                                               │
│                ↑                                                    │
│         ┌──────────┐                                               │
│         │  auth    │ ←→ sessions, rate limiting                    │
│         └──────────┘                                               │
└───────────────────────────────────────────────────────────────────┘
```

## Поток данных

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Админка    │───→│   API POST   │───→│  SQLite DB   │
│  (браузер)   │    │   /api/...   │    │              │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
┌──────────────┐    ┌──────────────┐           │
│    Сайт      │←───│   API GET    │←──────────┘
│  (браузер)   │    │   /api/...   │
└──────────────┘    └──────────────┘
```

## Процесс сборки

```
src/sections/index/*.html  ──┐
                             ├──→ python3 build.py ──→ index.html
src/css/site/*.css ──────────┘

src/js/admin/*.js ──→ python3 build.py ──→ admin.bundle.js
```

## Что где редактировать

| Задача | Файлы |
|--------|-------|
| Изменить текст на сайте | `src/sections/index/*.html` |
| Изменить стили сайта | `src/css/site/*.css` |
| Добавить JS на сайт | `src/js/site/*.js` |
| Изменить логику админки | `src/js/admin/*.js` |
| Добавить API эндпоинт | `server/routes.py` + `server/handler.py` |
| Изменить данные | через админку (данные в SQLite: `data/saysbarbers.db`) |

---

## Страницы

| Страница | Секции | CSS | JavaScript |
|----------|--------|-----|------------|
| `index.html` | `src/sections/index/` | `shared/` + `site/` | `src/js/site/*.js` |
| `shop.html` | `src/sections/shop/` | `shared/` + `shop/` | `src/js/shop/shop-app.js` |
| `admin.html` | `src/sections/admin/` | `shared/variables` + `admin/` | `admin.bundle.js` |
| `legal.html` | `src/sections/legal/` | `legal/` | `src/js/legal/legal-app.js` |

## Сборка

```bash
python3 scripts/build.py                # Все страницы + admin.bundle.js
python3 scripts/build.py --page=index   # Только index.html
python3 scripts/build.py --page=shop    # Только shop.html
python3 scripts/build.py --page=admin   # Только admin.html
python3 scripts/build.py --page=legal   # Только legal.html
python3 scripts/build.py --admin-only   # Только admin.bundle.js
python3 scripts/build.py --watch        # Автопересборка при изменениях
```

## Структура директорий

```
src/
├── sections/           # HTML секции → собираются в *.html
│   ├── index/          # Главная страница
│   ├── shop/           # Магазин
│   ├── admin/          # Админка
│   └── legal/          # Юридические документы
│
├── css/
│   ├── shared/         # Общие стили (variables, base, navigation, components, utilities)
│   ├── site/           # Стили главной
│   ├── admin/          # Стили админки
│   ├── shop/           # Стили магазина
│   └── legal/          # Стили юр. документов
│
└── js/
    ├── shared/         # Общие модули (config, helpers, icons)
    ├── site/           # Скрипты главной
    ├── admin/          # Модули админки → admin.bundle.js
    ├── shop/           # shop-app.js
    └── legal/          # legal-app.js

server/                 # Python серверные модули
├── __init__.py         # Экспорт пакета
├── handler.py          # HTTP обработчик (AdminAPIHandler)
├── routes.py           # Маршрутизатор API
├── auth.py             # Аутентификация, сессии, rate limiting
├── database.py         # SQLite storage
└── validators.py       # Валидация данных

data/                   # SQLite БД (в .gitignore, на сервере симлинк)
uploads/                # Загруженные изображения (в .gitignore, на сервере симлинк)
public/                 # Статические SEO файлы
```

## Модульная система CSS

Каждая папка CSS имеет `index.css` с `@import` всех модулей:

```css
/* src/css/site/index.css */
@import 'section-base.css';
@import 'hero.css';
@import 'services.css';
/* ... */
```

## Глобальные JS объекты

| Объект | Страница | Описание |
|--------|----------|----------|
| `SaysApp` | index.html | Модули главной страницы |
| `ShopApp` | shop.html | SPA магазина |
| `AdminPanel` | admin.html | Главный модуль админки |
| `AdminState` | admin.html | Централизованное состояние |
| `AdminRouter` | admin.html | Навигация между секциями |
| `AdminEventHandlers` | admin.html | Обработчики событий |
| `AdminImageHandler` | admin.html | Загрузка изображений |
| `BaseRenderer` | admin.html | Базовая логика renderers |
| `SiteTemplates` | index.html | HTML шаблоны контента |
| `BlogModal` | index.html | Модалка блога |
| `AppConfig` | все | Доступ к config.json |
| `SharedHelpers` | все | Общие утилиты |

## Модули админки (admin.bundle.js)

Порядок сборки важен — зависимости должны идти раньше:

```
Core modules (без зависимостей):
├── state.js          # Централизованное состояние
├── toast.js          # Уведомления
├── api.js            # HTTP клиент с checkUnauthorized()
├── auth.js           # Аутентификация
├── navigation.js     # Навигация
├── modals.js         # Модальные окна
├── image-upload.js   # Загрузка base64
├── image-handler.js  # Обработка загрузки
├── wysiwyg.js        # WYSIWYG редактор
├── dragdrop.js       # Drag & drop
├── validation.js     # Валидация форм
├── search.js         # Поиск в списках
├── router.js         # Роутинг секций
└── event-handlers.js # Обработчики событий

Renderers:
├── renderers/base-renderer.js  # Базовая логика (reorderItems)
├── renderers/stats.js          # Статистика (drawChartGrid/Bars/Labels)
├── renderers/masters.js
├── renderers/services.js
├── renderers/articles.js
├── renderers/faq.js
├── renderers/social.js
├── renderers/shop-categories.js
├── renderers/shop-products.js
└── renderers/legal.js

Forms:
├── forms/master-form.js
├── forms/service-form.js
├── forms/article-form.js
├── forms/faq-form.js
├── forms/category-form.js
├── forms/product-form.js
└── forms/legal-form.js

Entry point:
└── index.js          # Инициализация
```

## Модули главной страницы (site)

```
src/js/site/
├── utils.js          # Утилиты SaysApp
├── sanitizer.js      # XSS защита
├── navigation.js     # Меню, scroll
├── animations.js     # Fade-in анимации
├── modals.js         # FAQ accordion, blog modal
├── templates.js      # HTML шаблоны (createMasterCard, createBlogCard, etc.)
├── blog-modal.js     # Динамическая модалка блога
├── data-loader.js    # Загрузка данных из API
├── main.js           # Инициализация
└── analytics.js      # Отслеживание секций
```

## Связанные документы

- [Быстрый старт](quick-start.md) — первый запуск
- [Критические правила](rules.md) — что нельзя делать
- [Как изменить секцию](how-to/edit-section.md) — редактирование HTML
- [Как создать JS модуль](how-to/add-js-module.md) — добавление скриптов
