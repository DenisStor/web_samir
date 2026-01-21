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
7. **data/ в .gitignore** — данные CMS не в git, на сервере через симлинк на `/var/www/saysbarbers-data/data/`

## Ссылки

- **Сайт:** http://localhost:8000
- **Админка:** http://localhost:8000/admin.html
- **Магазин:** http://localhost:8000/shop.html

## Деплой

```bash
# Деплой кода (данные не затрагиваются)
ssh root@80.90.187.187 "cd /var/www/web_samir && ./deploy.sh"

# Редактирование данных на сервере (категории, услуги и т.д.)
ssh root@80.90.187.187 "nano /var/www/saysbarbers-data/data/services.json"
```

**Важно:** `deploy.sh` обновляет только код. Данные (`data/*.json`) живут в `/var/www/saysbarbers-data/` и не перезаписываются.

## Документация

- [Архитектура](docs/architecture.md) — структура проекта, сборка, страницы
- [API](docs/api.md) — эндпоинты, аутентификация
- [Структуры данных](docs/data-structures.md) — JSON схемы
- [CSS конвенции](docs/css-conventions.md) — переменные, правила
- [JS конвенции](docs/js-conventions.md) — паттерны, SharedHelpers, AppConfig
- [Производительность](docs/performance.md) — оптимизация
- [Деплой](docs/deployment.md) — развёртывание на VPS, симлинки
