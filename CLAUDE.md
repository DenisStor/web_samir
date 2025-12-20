# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Say's Barbers — барбершоп веб-сайт с CMS админ-панелью, интернет-магазином и аналитикой посещений.

## Development Commands

```bash
# Запуск сервера (автооткрытие браузера на http://localhost:8000)
python3 server.py

# Сборка всех HTML страниц из секций
python3 scripts/build.py

# Сборка конкретной страницы
python3 scripts/build.py --page=index|shop|admin|legal

# Автопересборка при изменениях
python3 scripts/build.py --watch

# Сборка только admin.bundle.js
python3 scripts/build.py --admin-only

# Линтинг и форматирование
npm run lint && npm run lint:fix
npm run format && npm run format:check

# Тесты
npm test                                                    # Все тесты
python3 -m pytest tests/test_server.py::test_name -v       # Один тест
python3 -m pytest tests/ --cov=.                           # С покрытием
```

## Architecture

### 4 страницы (генерируются из секций)

| Страница | Секции | CSS |
|----------|--------|-----|
| `index.html` | `src/sections/index/` (15 файлов) | `shared/` + `site/` |
| `shop.html` | `src/sections/shop/` (7 файлов) | `shared/` + `shop/` |
| `admin.html` | `src/sections/admin/` (7 файлов) | `shared/variables` + `admin/` |
| `legal.html` | `src/sections/legal/` (5 файлов) | `legal/` |

**Не редактировать HTML файлы напрямую** — изменения вносить в `src/sections/{page}/`, затем `python3 scripts/build.py`.

### CSS модульная структура

```
src/css/
├── shared/      # Общие стили (variables, base, components, navigation)
├── site/        # Главная страница (11 модулей)
├── admin/       # Админ-панель (18 модулей)
├── shop/        # Магазин (10 модулей)
└── legal/       # Юридические документы (2 модуля)
```

Каждая папка имеет `index.css` с `@import` всех модулей.

### JavaScript

- **IIFE паттерн**: `(function() { 'use strict'; ... })();`
- **Глобальные объекты**: `SaysApp`, `ShopApp`, `AdminApp`
- **Admin bundle**: модули из `src/js/admin/` собираются в `admin.bundle.js`

Порядок загрузки site скриптов: utils → sanitizer → navigation → animations → modals → main → data-loader → analytics

### API эндпоинты

```
GET/POST  /api/masters           # Мастера
GET/POST  /api/services          # Услуги (3 ценовых тира: green/pink/blue)
GET/POST  /api/articles          # Статьи блога
GET/POST  /api/faq               # FAQ
GET/POST  /api/social            # Контакты и соцсети
GET/POST  /api/shop/categories   # Категории товаров
GET/POST  /api/shop/products     # Товары
GET/POST  /api/legal             # Юридические документы
GET/POST  /api/stats             # Статистика
POST      /api/upload            # Загрузка изображения (base64)
DELETE    /api/upload/{filename}
POST      /api/auth/login        # Авторизация (пароль в config.json)
```

### Data Flow

1. `server.py` запускает `build.py` при старте
2. Браузер загружает HTML (собранный из секций)
3. `data-loader.js` / `shop-app.js` / `legal-app.js` запрашивает данные с API
4. Админка: CRUD → POST API → сервер пишет в JSON файлы (`data/*.json`)

## Key Patterns

- **CSS переменные**: `src/css/shared/variables.css` (цвета, отступы, скругления)
- **Badge цвета мастеров**: `badge-green`, `badge-pink`, `badge-blue`
- **Цены услуг**: 3 колонки соответствуют badge цветам
- **Данные**: JSON файлы в `data/`, изображения в `uploads/`
- **XSS защита**: DOMPurify + `sanitizer.js`
