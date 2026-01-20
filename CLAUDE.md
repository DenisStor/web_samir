# CLAUDE.md

Say's Barbers — барбершоп с CMS админкой и интернет-магазином косметики.

## Команды

```bash
python3 server.py                      # Запуск сервера (localhost:8000)
python3 scripts/build.py               # Сборка HTML из секций
python3 scripts/build.py --admin-only  # Только admin.bundle.js
npm run lint && npm run format:check   # Проверка перед коммитом
npm test                               # Тесты
```

## Критические правила

1. **НЕ редактировать HTML в корне** — только `src/sections/{page}/`, затем `build.py`
2. **НЕ использовать** `?.`, `??`, `let`, `const` — старые браузеры
3. **Использовать `SharedHelpers`** для `escapeHtml`, `generateId`, `debounce`
4. **parseInt** — всегда с radix: `parseInt(value, 10)`
5. **Legal URL**: `/legal.html?page=privacy`, НЕ `/legal/privacy`
6. **ВАЖНО: Версионирование CSS/JS** — при изменении любого CSS/JS файла **обязательно** увеличить версию `?v=X.X` в соответствующем `head.html` или `scripts.html`, затем `build.py`. Иначе пользователи увидят закешированную версию!

## Ссылки

- **Сайт:** http://localhost:8000
- **Админка:** http://localhost:8000/admin.html
- **Магазин:** http://localhost:8000/shop.html

## Документация

- [Архитектура](docs/architecture.md) — структура проекта, сборка, страницы
- [API](docs/api.md) — эндпоинты, аутентификация
- [Структуры данных](docs/data-structures.md) — JSON схемы
- [CSS конвенции](docs/css-conventions.md) — переменные, правила
- [JS конвенции](docs/js-conventions.md) — паттерны, SharedHelpers, AppConfig
- [Производительность](docs/performance.md) — оптимизация
