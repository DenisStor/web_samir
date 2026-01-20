# Архитектура проекта

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

data/                   # JSON данные (редактируются через админку)
uploads/                # Загруженные изображения
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
| `AppConfig` | все | Доступ к config.json |
| `SharedHelpers` | все | Общие утилиты |
