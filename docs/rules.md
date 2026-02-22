# Критические правила

## Чеклист перед коммитом

- [ ] Не редактировал HTML в корне (только `src/sections/`)
- [ ] Не использовал `?.`, `??`, `let`, `const`
- [ ] Использовал `SharedHelpers` для утилит
- [ ] `parseInt()` с radix: `parseInt(value, 10)`
- [ ] Запустил `npm run lint && npm run lint:css && npm run format:check`
- [ ] Запустил `python3 scripts/build.py`

---

## 1. НЕ редактировать HTML в корне

**Неправильно:**
```bash
# Редактирование index.html напрямую
nano index.html  # НЕТ!
```

**Правильно:**
```bash
# Редактирование секции
nano src/sections/index/hero.html

# Сборка
python3 scripts/build.py --page=index
```

**Почему:** HTML файлы в корне (`index.html`, `shop.html`, `admin.html`, `legal.html`) генерируются автоматически из `src/sections/`. При следующей сборке ваши изменения будут перезаписаны.

---

## 2. НЕ использовать современный JavaScript

Проект поддерживает старые браузеры.

**Запрещено:**

| Синтаксис | Альтернатива |
|-----------|-------------|
| `let` / `const` | `var` |
| `?.` (optional chaining) | `obj && obj.prop` |
| `??` (nullish coalescing) | `value || default` |
| Arrow functions в глобальном контексте | `function() {}` |

**Неправильно:**
```javascript
const name = user?.name ?? 'Guest';
const items = data?.items || [];
```

**Правильно:**
```javascript
var name = (user && user.name) ? user.name : 'Guest';
var items = (data && data.items) ? data.items : [];
```

---

## 3. ВСЕГДА использовать SharedHelpers

Не дублируйте утилиты — используйте `SharedHelpers`.

| Задача | Метод |
|--------|-------|
| XSS защита | `SharedHelpers.escapeHtml(text)` |
| Генерация ID | `SharedHelpers.generateId('prefix')` |
| Генерация slug | `SharedHelpers.generateSlug('Текст')` |
| Debounce | `SharedHelpers.debounce(fn, delay)` |
| Throttle | `SharedHelpers.throttleRAF(fn)` |
| Форматирование цены | `SharedHelpers.formatPrice(1500)` |
| Форматирование даты | `SharedHelpers.formatDate('2024-01-15')` |

**Неправильно:**
```javascript
var id = 'master_' + Date.now();
var safe = text.replace(/</g, '&lt;');
```

**Правильно:**
```javascript
var id = SharedHelpers.generateId('master');
var safe = SharedHelpers.escapeHtml(text);
```

---

## 4. parseInt всегда с radix

**Неправильно:**
```javascript
var num = parseInt(value);
```

**Правильно:**
```javascript
var num = parseInt(value, 10);
```

**Почему:** Без radix `parseInt('08')` может вернуть `0` в старых браузерах (восьмеричная система).

---

## 5. Legal URL формат

**Неправильно:**
```html
<a href="/legal/privacy">Политика</a>
```

**Правильно:**
```html
<a href="/legal.html?page=privacy">Политика</a>
```

---

## 6. Данные НЕ в git

Директория `data/` в `.gitignore`. Данные CMS хранятся:

- **Локально:** `./data/`
- **На сервере:** `/var/www/web_samir-data/data/` (симлинк)

Не добавляйте файлы из `data/` в git. Данные хранятся в SQLite (`data/saysbarbers.db`).

---

## 7. Cache busting автоматический

Не указывайте версии вручную:

**Неправильно:**
```html
<link rel="stylesheet" href="src/css/site/index.css?v=1.5">
```

**Правильно:**
```html
<link rel="stylesheet" href="src/css/site/index.css?v=1.0">
```

`build.py` автоматически заменит `?v=1.0` на `?v={md5hash}` файла.

---

## Частые ошибки

### ESLint ошибки

```
error  Unexpected var, use let or const instead
```

**Решение:** ESLint настроен разрешать `var`. Если видите эту ошибку — проверьте `.eslintrc.json`.

### Сборка не видит изменений

```bash
# Очистите кэш и пересоберите
python3 scripts/build.py --force
```

### Изменения не появляются в браузере

1. Hard refresh: `Cmd+Shift+R` (Mac) или `Ctrl+Shift+R` (Win)
2. Очистите кэш браузера
3. Проверьте, что сборка прошла без ошибок
