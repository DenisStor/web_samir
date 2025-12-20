# Say's Barbers

Современный веб-сайт барбершопа с интегрированной CMS админ-панелью, интернет-магазином профессиональной косметики и системой аналитики посещений.

## Содержание

- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Система сборки](#система-сборки)
- [CSS архитектура](#css-архитектура)
- [HTML секции](#html-секции)
- [JavaScript модули](#javascript-модули)
- [API документация](#api-документация)
- [Админ-панель](#админ-панель)
- [Магазин](#магазин)
- [Разработка](#разработка)
- [Деплой](#деплой)

---

## Быстрый старт

### Требования

- Python 3.8+
- Node.js 16+ (для линтинга и форматирования)

### Запуск

```bash
# Клонировать репозиторий
git clone <repository-url>
cd web_samir

# Установить зависимости для разработки (опционально)
npm install

# Запустить сервер разработки
python3 server.py
```

Сервер автоматически:
1. Соберёт все HTML страницы из секций
2. Соберёт admin.bundle.js
3. Откроет браузер на http://localhost:8000

### Доступные страницы

| URL | Описание |
|-----|----------|
| http://localhost:8000 | Главная страница сайта |
| http://localhost:8000/shop.html | Интернет-магазин |
| http://localhost:8000/admin.html | Админ-панель (пароль: `admin`) |
| http://localhost:8000/legal | Юридические документы |

---

## Структура проекта

```
web_samir/
│
├── src/                           # Исходный код
│   │
│   ├── css/                       # Стили (модульная архитектура)
│   │   ├── shared/                # Общие стили для всех страниц
│   │   │   ├── index.css          # Главный файл с @import
│   │   │   ├── variables.css      # CSS переменные (цвета, шрифты, отступы)
│   │   │   ├── base.css           # Reset, типография, базовые стили
│   │   │   ├── utilities.css      # Утилиты, keyframes анимации
│   │   │   ├── navigation.css     # Навигация и мобильное меню
│   │   │   └── components.css     # Кнопки, бейджи, карточки
│   │   │
│   │   ├── site/                  # Стили главной страницы
│   │   │   ├── index.css          # Импорт всех модулей
│   │   │   ├── section-base.css   # Базовые стили секций
│   │   │   ├── hero.css           # Hero-секция
│   │   │   ├── services.css       # Услуги (табы, карточки)
│   │   │   ├── podology.css       # Подология
│   │   │   ├── masters.css        # Команда мастеров
│   │   │   ├── location.css       # Локация
│   │   │   ├── social.css         # Соцсети
│   │   │   ├── blog.css           # Блог и модальное окно статьи
│   │   │   ├── faq.css            # FAQ аккордеон
│   │   │   ├── booking.css        # CTA бронирования
│   │   │   └── footer.css         # Футер
│   │   │
│   │   ├── admin/                 # Стили админ-панели
│   │   │   ├── index.css          # Импорт всех модулей
│   │   │   ├── layout.css         # Sidebar, header, main layout
│   │   │   ├── buttons.css        # Кнопки и состояния загрузки
│   │   │   ├── cards.css          # Карточки мастеров, статей
│   │   │   ├── services.css       # Управление услугами
│   │   │   ├── modals.css         # Модальные окна
│   │   │   ├── forms.css          # Формы и валидация
│   │   │   ├── uploads.css        # Загрузка изображений
│   │   │   ├── toast.css          # Toast уведомления
│   │   │   ├── editor.css         # WYSIWYG редактор
│   │   │   ├── faq.css            # FAQ редактор
│   │   │   ├── stats.css          # Дашборд статистики
│   │   │   ├── login.css          # Экран входа
│   │   │   ├── social.css         # Настройки соцсетей
│   │   │   ├── shop-categories.css # Категории товаров
│   │   │   ├── shop-products.css  # Таблица товаров
│   │   │   ├── legal.css          # Юридические документы
│   │   │   ├── utilities.css      # Утилиты админки
│   │   │   └── responsive.css     # Адаптивные стили
│   │   │
│   │   ├── shop/                  # Стили магазина
│   │   │   ├── index.css          # Импорт всех модулей
│   │   │   ├── layout.css         # Основной layout
│   │   │   ├── search.css         # Поиск товаров
│   │   │   ├── toolbar.css        # Фильтры и сортировка
│   │   │   ├── products.css       # Сетка товаров
│   │   │   ├── product-detail.css # Страница товара
│   │   │   ├── gallery.css        # Галерея изображений
│   │   │   ├── empty-states.css   # Пустые состояния
│   │   │   ├── filter.css         # Мобильные фильтры
│   │   │   ├── footer.css         # Футер магазина
│   │   │   └── responsive.css     # Адаптивные стили
│   │   │
│   │   └── legal/                 # Стили юридических документов
│   │       ├── index.css          # Импорт
│   │       └── legal.css          # Все стили страницы
│   │
│   ├── js/                        # JavaScript
│   │   ├── site/                  # Скрипты главной страницы
│   │   │   ├── utils.js           # DOM утилиты ($, $$, byId, on, ready)
│   │   │   ├── sanitizer.js       # XSS защита
│   │   │   ├── navigation.js      # Мобильное меню
│   │   │   ├── animations.js      # Fade-in анимации
│   │   │   ├── modals.js          # Модальные окна, FAQ аккордеон
│   │   │   ├── main.js            # Табы услуг
│   │   │   ├── data-loader.js     # Загрузка данных с API
│   │   │   └── analytics.js       # Трекинг посещений
│   │   │
│   │   ├── admin/                 # Модули админ-панели
│   │   │   ├── state.js           # Глобальное состояние
│   │   │   ├── toast.js           # Уведомления
│   │   │   ├── api.js             # API клиент
│   │   │   ├── auth.js            # Аутентификация
│   │   │   ├── navigation.js      # Навигация по секциям
│   │   │   ├── modals.js          # Модальные окна
│   │   │   ├── image-upload.js    # Загрузка изображений
│   │   │   ├── wysiwyg.js         # Текстовый редактор
│   │   │   ├── dragdrop.js        # Drag & drop сортировка
│   │   │   ├── validation.js      # Валидация форм
│   │   │   ├── search.js          # Поиск
│   │   │   ├── renderers/         # Рендеры секций
│   │   │   │   ├── stats.js       # Статистика
│   │   │   │   ├── masters.js     # Мастера
│   │   │   │   ├── services.js    # Услуги
│   │   │   │   ├── articles.js    # Статьи
│   │   │   │   ├── faq.js         # FAQ
│   │   │   │   ├── social.js      # Соцсети
│   │   │   │   ├── shop-categories.js
│   │   │   │   ├── shop-products.js
│   │   │   │   └── legal.js       # Юр. документы
│   │   │   ├── forms/             # Формы редактирования
│   │   │   │   ├── master-form.js
│   │   │   │   ├── service-form.js
│   │   │   │   ├── article-form.js
│   │   │   │   ├── faq-form.js
│   │   │   │   ├── category-form.js
│   │   │   │   ├── product-form.js
│   │   │   │   └── legal-form.js
│   │   │   └── index.js           # Точка входа
│   │   │
│   │   ├── shop/                  # Скрипты магазина
│   │   │   └── shop-app.js        # SPA магазина
│   │   │
│   │   ├── legal/                 # Скрипты юр. документов
│   │   │   └── legal-app.js       # Загрузка документов
│   │   │
│   │   ├── shared/                # Общие модули
│   │   │   └── icons.js           # SVG иконки
│   │   │
│   │   └── admin.bundle.js        # Собранный бандл админки
│   │
│   └── sections/                  # HTML секции для сборки
│       ├── index/                 # Главная страница (15 секций)
│       │   ├── head.html          # DOCTYPE, meta, CSS
│       │   ├── navigation.html    # Навигация
│       │   ├── marquee.html       # Бегущая строка
│       │   ├── hero.html          # Hero секция
│       │   ├── services.html      # Услуги
│       │   ├── podology.html      # Подология
│       │   ├── masters.html       # Мастера
│       │   ├── location.html      # Локация
│       │   ├── social.html        # Соцсети
│       │   ├── blog.html          # Блог
│       │   ├── faq.html           # FAQ
│       │   ├── booking.html       # CTA бронирования
│       │   ├── blog-modal.html    # Модальное окно статьи
│       │   ├── footer.html        # Футер
│       │   └── scripts.html       # Скрипты
│       │
│       ├── shop/                  # Магазин (7 секций)
│       │   ├── head.html
│       │   ├── navigation.html
│       │   ├── main.html          # Каталог и страница товара
│       │   ├── footer.html
│       │   ├── lightbox.html      # Просмотр изображений
│       │   ├── mobile-filter.html # Мобильные фильтры
│       │   └── scripts.html
│       │
│       ├── admin/                 # Админ-панель (7 секций)
│       │   ├── head.html
│       │   ├── svg-sprite.html    # SVG иконки
│       │   ├── login.html         # Экран входа
│       │   ├── sidebar.html       # Боковое меню
│       │   ├── content.html       # Все секции контента
│       │   ├── modals.html        # Модальные окна
│       │   └── scripts.html
│       │
│       └── legal/                 # Юридические документы (5 секций)
│           ├── head.html
│           ├── header.html
│           ├── main.html
│           ├── footer.html
│           └── scripts.html
│
├── data/                          # JSON данные
│   ├── masters.json               # Мастера
│   ├── services.json              # Услуги
│   ├── articles.json              # Статьи блога
│   ├── faq.json                   # FAQ
│   ├── social.json                # Контакты и соцсети
│   ├── stats.json                 # Статистика посещений
│   ├── shop_categories.json       # Категории товаров
│   ├── shop_products.json         # Товары
│   └── legal.json                 # Юридические документы
│
├── uploads/                       # Загруженные изображения
│
├── scripts/
│   └── build.py                   # Скрипт сборки
│
├── tests/                         # Тесты
│   └── test_server.py
│
├── index.html                     # Главная (генерируется)
├── shop.html                      # Магазин (генерируется)
├── admin.html                     # Админка (генерируется)
├── legal.html                     # Юр. документы (генерируется)
│
├── server.py                      # HTTP сервер + API
├── config.json                    # Конфигурация сервера
├── package.json                   # NPM зависимости
├── requirements-dev.txt           # Python зависимости
├── .eslintrc.json                 # ESLint конфигурация
├── .prettierrc                    # Prettier конфигурация
└── CLAUDE.md                      # Инструкции для Claude Code
```

---

## Система сборки

HTML страницы генерируются из секций скриптом `build.py`.

### Команды

```bash
# Собрать все страницы и admin.bundle.js
python3 scripts/build.py

# Собрать конкретную страницу
python3 scripts/build.py --page=index
python3 scripts/build.py --page=shop
python3 scripts/build.py --page=admin
python3 scripts/build.py --page=legal

# Режим наблюдения (автопересборка при изменениях)
python3 scripts/build.py --watch

# Показать список доступных страниц
python3 scripts/build.py --list-pages

# Собрать только admin.bundle.js
python3 scripts/build.py --admin-only

# Собрать только HTML (без JS бандла)
python3 scripts/build.py --html-only
```

### Конфигурация страниц

Каждая страница определена в `PAGES` словаре:

```python
PAGES = {
    'index': {
        'sections_dir': 'index',
        'sections': ['head.html', 'navigation.html', ...],
        'output': 'index.html',
    },
    'shop': { ... },
    'admin': { ... },
    'legal': { ... },
}
```

### Admin Bundle

JavaScript модули админки собираются в один файл `admin.bundle.js`. Порядок модулей важен — зависимости идут раньше зависящих модулей.

---

## CSS архитектура

### Модульная структура

CSS организован по страницам. Каждая папка имеет `index.css` с `@import`:

```css
/* src/css/site/index.css */
@import 'section-base.css';
@import 'hero.css';
@import 'services.css';
/* ... */
```

### Подключение в HTML

```html
<!-- Главная страница -->
<link rel="stylesheet" href="src/css/shared/index.css">
<link rel="stylesheet" href="src/css/site/index.css">

<!-- Магазин -->
<link rel="stylesheet" href="src/css/shared/index.css">
<link rel="stylesheet" href="src/css/shop/index.css">

<!-- Админка -->
<link rel="stylesheet" href="src/css/shared/variables.css">
<link rel="stylesheet" href="src/css/admin/index.css">

<!-- Юр. документы -->
<link rel="stylesheet" href="src/css/legal/index.css">
```

### CSS переменные

Основные переменные в `shared/variables.css`:

```css
:root {
    /* Цвета */
    --bg-dark: #0a0a0a;
    --bg-card: #111111;
    --text-white: #ffffff;
    --text-light: #e0e0e0;
    --text-gray: #888888;
    --accent-green: #00ff88;
    --accent-pink: #ff69b4;
    --accent-blue: #4da6ff;

    /* Отступы */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    /* Скругления */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
}
```

---

## HTML секции

### Принцип работы

Вместо редактирования готовых HTML файлов, изменения вносятся в секции:

```
src/sections/index/hero.html  →  редактируем секцию
        ↓
python3 scripts/build.py     →  запускаем сборку
        ↓
index.html                   →  получаем готовый файл
```

### Структура секции

```html
<!-- src/sections/index/hero.html -->
<section class="hero" id="hero">
    <div class="container">
        <h1 class="hero-title">Say's Barbers</h1>
        <!-- ... -->
    </div>
</section>
```

### Добавление новой секции

1. Создать файл в `src/sections/{page}/`
2. Добавить в массив `sections` в `PAGES` в `build.py`
3. Запустить `python3 scripts/build.py`

---

## JavaScript модули

### Архитектура

- **IIFE паттерн** — каждый модуль изолирован
- **Глобальные объекты** — `SaysApp`, `ShopApp`, `AdminApp`
- **Event-driven** — слабая связанность через события

### Пример модуля

```javascript
// src/js/site/navigation.js
(function() {
    'use strict';

    function initMobileMenu() {
        // ...
    }

    // Публичный API
    window.SaysApp = window.SaysApp || {};
    window.SaysApp.navigation = {
        init: initMobileMenu
    };

    // Автоинициализация
    document.addEventListener('DOMContentLoaded', initMobileMenu);
})();
```

### Порядок загрузки (главная)

1. `utils.js` — DOM утилиты
2. `sanitizer.js` — XSS защита
3. `navigation.js` — мобильное меню
4. `animations.js` — анимации появления
5. `modals.js` — модальные окна
6. `main.js` — табы услуг
7. `data-loader.js` — загрузка данных API
8. `analytics.js` — трекинг посещений

---

## API документация

### Базовый URL

```
http://localhost:8000/api
```

### Аутентификация

```http
POST /api/auth/login
Content-Type: application/json

{"password": "admin"}
```

Ответ:
```json
{"success": true, "token": "..."}
```

### Эндпоинты

#### Мастера

```http
GET  /api/masters          # Получить всех мастеров
POST /api/masters          # Создать/обновить мастера
```

Формат данных:
```json
{
    "id": "uuid",
    "name": "Имя",
    "role": "Барбер",
    "badge": "green",
    "photo": "/uploads/photo.jpg",
    "order": 1
}
```

#### Услуги

```http
GET  /api/services         # Получить все услуги
POST /api/services         # Создать/обновить услугу
```

Формат данных:
```json
{
    "id": "uuid",
    "name": "Стрижка",
    "category": "main",
    "prices": {
        "green": 1500,
        "pink": 1800,
        "blue": 2000
    },
    "duration": "45 мин",
    "order": 1
}
```

#### Статьи

```http
GET  /api/articles         # Получить все статьи
POST /api/articles         # Создать/обновить статью
```

#### FAQ

```http
GET  /api/faq              # Получить все вопросы
POST /api/faq              # Создать/обновить вопрос
```

#### Соцсети и контакты

```http
GET  /api/social           # Получить контакты
POST /api/social           # Обновить контакты
```

#### Магазин

```http
GET  /api/shop/categories  # Категории товаров
POST /api/shop/categories  # Создать/обновить категорию

GET  /api/shop/products    # Товары
POST /api/shop/products    # Создать/обновить товар
```

#### Юридические документы

```http
GET  /api/legal            # Все документы
GET  /api/legal/{slug}     # Документ по slug
POST /api/legal            # Создать/обновить документ
```

#### Статистика

```http
GET  /api/stats            # Получить статистику
POST /api/stats/visit      # Записать посещение
```

#### Загрузка изображений

```http
POST /api/upload
Content-Type: application/json

{
    "image": "data:image/jpeg;base64,...",
    "filename": "photo.jpg"
}
```

Ответ:
```json
{"success": true, "url": "/uploads/uuid-photo.jpg"}
```

```http
DELETE /api/upload/{filename}  # Удалить изображение
```

---

## Админ-панель

### Вход

- URL: http://localhost:8000/admin.html
- Пароль по умолчанию: `admin`
- Изменить пароль: `config.json` → `admin_password`

### Секции

| Секция | Описание |
|--------|----------|
| Статистика | Дашборд с графиками посещений за 14 дней |
| Мастера | CRUD мастеров с фото и бейджами |
| Услуги | Управление услугами по категориям (основные/комплексные/дополнительные) |
| Подология | Услуги подологического кабинета |
| Статьи | Блог с WYSIWYG редактором |
| FAQ | Вопросы и ответы |
| Соцсети | Контакты и ссылки на соцсети |
| Документы | Политика конфиденциальности, оферта и т.д. |
| Категории товаров | Категории магазина |
| Товары | Каталог товаров с изображениями |

### Возможности

- Drag & drop сортировка
- WYSIWYG редактор статей
- Множественная загрузка изображений
- Поиск по элементам
- Валидация форм
- Toast уведомления

---

## Магазин

### Функционал

- Фильтрация по категориям
- Поиск товаров
- Сортировка (по умолчанию / цена / название)
- Галерея изображений с lightbox
- Адаптивный дизайн
- SPA навигация (без перезагрузки)

### URL структура

```
/shop.html                    # Каталог
/shop.html#product-{id}       # Страница товара
```

---

## Разработка

### Установка зависимостей

```bash
npm install
pip install -r requirements-dev.txt
```

### Линтинг

```bash
# Проверка JavaScript
npm run lint

# Автоисправление
npm run lint:fix
```

### Форматирование

```bash
# Проверка форматирования
npm run format:check

# Форматирование
npm run format
```

### Тестирование

```bash
# Все тесты
npm test

# Только серверные тесты
npm run test:server

# Конкретный тест
python3 -m pytest tests/test_server.py::test_function_name -v

# С покрытием
python3 -m pytest tests/ --cov=.
```

### Режим разработки

```bash
# Терминал 1: Сервер
python3 server.py

# Терминал 2: Автосборка при изменениях
python3 scripts/build.py --watch
```

---

## Деплой

### Подготовка

1. Изменить пароль админки в `config.json`
2. Заменить `YOUR_DOMAIN` в `src/sections/index/head.html`
3. Добавить OG изображение в `uploads/og-image.jpg`
4. Собрать все страницы: `python3 scripts/build.py`

### Статический хостинг

Проект можно разместить на любом хостинге с поддержкой Python:
- VPS с nginx + gunicorn
- Heroku
- DigitalOcean App Platform

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        alias /path/to/web_samir/uploads/;
        expires 30d;
    }

    location /src/ {
        alias /path/to/web_samir/src/;
        expires 7d;
    }
}
```

---

## Лицензия

MIT License

---

## Автор

Say's Barbers Team
