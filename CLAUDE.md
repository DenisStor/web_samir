# CLAUDE.md

Say's Barbers — барбершоп с CMS админкой и интернет-магазином косметики.

## Команды

```bash
python3 run.py                         # Запуск сервера (localhost:8000)
python3 scripts/build.py               # Сборка HTML из секций
python3 scripts/build.py --admin-only  # Только admin.bundle.js
npm run lint && npm run format:check   # Проверка перед коммитом
npm test                               # Тесты
```

## Критические правила

1. **НЕ редактировать HTML в корне** — только `src/sections/{page}/`, затем `build.py`
2. **НЕ использовать** `?.`, `??`, `let`, `const` — старые браузеры
3. **Использовать `SharedHelpers`** для `escapeHtml`, `generateId`, `debounce`, `generateSlug`
4. **parseInt** — всегда с radix: `parseInt(value, 10)`
5. **Legal URL**: `/legal.html?page=privacy`, НЕ `/legal/privacy`
6. **Cache busting автоматический** — `build.py` сам заменяет `?v=X.X` на `?v={md5hash}` для CSS/JS файлов
7. **data/ в .gitignore** — SQLite БД (`saysbarbers.db`) не в git, на сервере через симлинк на `/var/www/web_samir-data/data/`

## Ссылки

- **Сайт:** http://localhost:8000
- **Админка:** http://localhost:8000/admin.html
- **Магазин:** http://localhost:8000/shop.html

## Структура проекта

```
web_samir/
├── src/
│   ├── sections/          # HTML секции → build.py → корневые .html
│   │   ├── index/         # hero, services, masters, blog, faq...
│   │   ├── shop/          # navigation, main, lightbox, footer
│   │   ├── admin/         # login, sidebar, content, modals
│   │   └── legal/         # header, main, footer
│   ├── css/               # Модульные стили (index.css = bundle)
│   │   ├── shared/        # variables, base, components, navigation, utilities
│   │   ├── site/          # hero, services, masters, blog, booking, faq, podology, social
│   │   ├── shop/          # layout, products, gallery, filter, toolbar, search
│   │   ├── admin/         # login, layout, forms, cards, modals, editor, uploads
│   │   └── legal/         # legal
│   └── js/
│       ├── shared/        # config, helpers, icons, image-loader
│       ├── site/          # main, data-loader, navigation, modals, templates, animations
│       ├── shop/          # shop-app, shop-state, shop-router, shop-filters, shop-renderer
│       ├── admin/         # index, api, auth, state, router, forms/, renderers/
│       └── legal/         # legal-app
├── server/                # Python HTTP сервер
│   ├── handler.py         # HTTP обработчик, RESOURCE_MAP, CRUD
│   ├── routes.py          # API маршруты (Router + Route)
│   ├── auth.py            # Аутентификация, сессии
│   ├── database.py        # SQLite storage
│   └── validators.py      # Валидация входных данных
├── scripts/
│   ├── build.py           # Сборка HTML + cache busting + admin.bundle.js
│   └── optimize-images.py # Оптимизация изображений
├── data/                  # SQLite БД saysbarbers.db (.gitignore)
├── uploads/               # Загруженные изображения (.gitignore)
├── tests/                 # Python (pytest) + JS (Jest)
├── docs/                  # Документация
├── config.json            # Конфигурация (пароль, лимиты, таймауты)
├── deploy.sh              # Деплой на VPS
└── run.py                 # Entry point
```

## Страницы

| Страница | Файл | JS entry point | CSS | Данные |
|----------|------|----------------|-----|--------|
| Главная | `index.html` | `site/main.js` | `site/index.css` | services, masters, articles, faq, social |
| Магазин | `shop.html` | `shop/shop-app.js` | `shop/index.css` | products, shop-categories |
| Админка | `admin.html` | `admin/index.js` → `admin.bundle.js` | `admin/index.css` | все ресурсы (SQLite) |
| Legal | `legal.html` | `legal/legal-app.js` | `legal/index.css` | legal |

## JS модули

### Глобальные объекты

| Объект | Страница | Описание |
|--------|----------|----------|
| `SharedHelpers` | все | `escapeHtml`, `generateId`, `generateSlug`, `debounce`, `throttleRAF`, `formatPrice`, `formatDate` |
| `AppConfig` | все | `AppConfig.get('site.name')`, `AppConfig.get('ui.toastDuration', 3000)` |
| `AdminState` | admin | Централизованное состояние: `AdminState.masters`, `AdminState.setMasters()` |
| `AdminRouter` | admin | Hash-роутинг: `AdminRouter.navigate('masters')` |
| `SaysApp` | index | Модули главной страницы |
| `ShopApp` | shop | SPA магазина |

### Паттерны JS

- **IIFE** — каждый модуль обёрнут в `(function() { 'use strict'; ... })();`
- **var** — только `var`, никогда `let`/`const`
- **Renderers** — `renderers/base-renderer.js` базовый класс, наследники: articles, faq, legal, masters, services, shop-categories, shop-products, social, stats
- **Forms** — отдельные модули для каждой сущности: article-form, category-form, faq-form, legal-form, master-form, podology-category-form, product-form, service-form
- **admin.bundle.js** — собирается `build.py --admin-only` из `src/js/admin/*.js`

## Python сервер

Модули в `server/`. Entry point — `run.py` (порт 8000). Хранилище — SQLite (`data/saysbarbers.db`) через `server/database.py`.

### RESOURCE_MAP (handler.py)

| Ресурс | Ключ хранилища | API endpoint |
|--------|---------------|--------------|
| masters | masters | `/api/masters` |
| services | services | `/api/services` |
| articles | articles | `/api/articles` |
| faq | faq | `/api/faq` |
| social | social | `/api/social` |
| legal | legal | `/api/legal` |
| shop-categories | shop-categories | `/api/shop/categories` |
| shop-products | products | `/api/shop/products` |

### Специальные endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/login` | Авторизация |
| POST | `/api/auth/logout` | Выход |
| POST | `/api/auth/check` | Проверка сессии |
| GET | `/api/stats` | Статистика |
| POST | `/api/stats/visit` | Фиксация визита |
| GET | `/api/legal/{slug}` | Документ по slug |
| GET | `/api/shop/products/{id}` | Товар по ID |
| POST | `/api/upload` | Загрузка файла (auth) |
| DELETE | `/api/upload/{filename}` | Удаление файла (auth) |

## Данные

### SQLite (data/saysbarbers.db)

9 ресурсов в 15 таблицах: masters, services (service_categories + podology_meta + podology_categories), articles, products, shop_categories, faq, legal, social (social_links + contacts), stats (stats_counters + stats_daily + stats_sections + stats_sessions).

### Хранение

- **Локально:** `./data/saysbarbers.db` (в `.gitignore`)
- **На сервере:** `/var/www/web_samir-data/data/` — симлинк из `/var/www/web_samir/data`
- **Uploads:** `/var/www/web_samir-data/uploads/` — симлинк из `/var/www/web_samir/uploads`

## CSS

- Модульная архитектура: каждая страница имеет `index.css` который импортирует остальные через `@import`
- Переменные в `shared/variables.css`: цвета (`--color-*`), шрифты (`--font-*`), отступы (`--spacing-*`)
- `shared/` — подключается на всех страницах (base, components, navigation, utilities)

## Деплой

```bash
# Деплой кода (данные не затрагиваются)
ssh root@80.90.187.187 "cd /var/www/web_samir && ./deploy.sh"
```

**Важно:** `deploy.sh` обновляет только код. БД (`saysbarbers.db`) живёт в `/var/www/web_samir-data/data/` и не перезаписывается.

## Документация

- [Навигация по документации](docs/README.md) — полный список
- [Архитектура](docs/architecture.md) — структура проекта, сборка, страницы
- [API](docs/api.md) — эндпоинты, аутентификация
- [Структуры данных](docs/data-structures.md) — JSON схемы
- [CSS конвенции](docs/css-conventions.md) — переменные, правила
- [JS конвенции](docs/js-conventions.md) — паттерны, SharedHelpers, AppConfig
- [Производительность](docs/performance.md) — оптимизация
- [Деплой](docs/deployment.md) — развёртывание на VPS, симлинки

## Для новых разработчиков

Начните здесь:

1. [Быстрый старт](docs/quick-start.md) — установка и первый запуск
2. [Критические правила](docs/rules.md) — что нельзя делать
3. [Глоссарий](docs/glossary.md) — термины проекта
4. [Решение проблем](docs/troubleshooting.md) — FAQ по ошибкам

Практические гайды:

- [Как изменить секцию](docs/how-to/edit-section.md)
- [Как добавить услугу](docs/how-to/add-service.md)
- [Как добавить стили](docs/how-to/add-css-style.md)
- [Как создать JS модуль](docs/how-to/add-js-module.md)
- [Как задеплоить](docs/how-to/deploy-changes.md)

Шаблоны кода:

- [HTML секция](docs/examples/new-section.html)
- [CSS модуль](docs/examples/new-css-module.css)
- [JS renderer](docs/examples/new-renderer.js)
- [JS форма](docs/examples/new-form.js)
- [API эндпоинт](docs/examples/api-endpoint.py)
