# Решение проблем

## Ошибки сборки

### `FileNotFoundError: src/sections/index/...`

**Причина:** Отсутствует файл секции.

**Решение:**
```bash
ls src/sections/index/
# Проверьте наличие нужного файла
```

### `SyntaxError` в admin.bundle.js

**Причина:** Ошибка в JavaScript коде.

**Решение:**
```bash
npm run lint
# Исправьте ошибки в указанных файлах
```

### Cache busting не работает

**Причина:** Файл не изменился.

**Решение:**
```bash
python3 scripts/build.py --force
```

---

## Проблемы админки

### Не могу войти в админку

| Симптом | Причина | Решение |
|---------|---------|---------|
| "Неверный пароль" | Неправильный пароль | Проверьте `config.json` → `admin.password` |
| "Слишком много попыток" | Rate limiting | Подождите 15 минут |
| Пустая страница | Ошибка JS | Откройте DevTools → Console |

### Данные не сохраняются

**Проверьте:**

1. Директория `data/` существует:
   ```bash
   ls -la data/
   ```

2. Права на запись:
   ```bash
   chmod 755 data/
   chmod 644 data/saysbarbers.db
   ```

3. SQLite БД не повреждена:
   ```bash
   python3 -c "import sqlite3; c=sqlite3.connect('data/saysbarbers.db'); print(c.execute('PRAGMA integrity_check').fetchone())"
   ```

### Изображения не загружаются

**Проверьте:**

1. Директория `uploads/` существует:
   ```bash
   mkdir -p uploads
   chmod 755 uploads
   ```

2. Размер файла < 5MB

3. Формат: JPG, PNG, GIF, WebP

### Drag & Drop не работает

**Причина:** JavaScript ошибка.

**Решение:**
1. Откройте DevTools → Console
2. Найдите ошибку
3. Перезагрузите страницу

---

## Проблемы сервера

### `Address already in use`

**Причина:** Порт 8000 занят.

**Решение:**
```bash
# Найти процесс
lsof -i :8000

# Убить процесс
kill -9 <PID>

# Или использовать другой порт
python3 run.py --port 8001
```

### `ModuleNotFoundError`

**Причина:** Отсутствует Python модуль.

**Решение:**
```bash
# Проверьте версию Python
python3 --version

# Должно быть 3.8+
```

### CORS ошибки

**Причина:** Запрос с другого домена.

**Решение:** Сервер должен отдавать заголовки:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

---

## Проблемы деплоя

### `Permission denied`

**Причина:** Нет прав на SSH.

**Решение:**
```bash
# Проверьте SSH ключ
ssh -T root@80.90.187.187

# Добавьте ключ
ssh-copy-id root@80.90.187.187
```

### Данные пропали после деплоя

**Причина:** Неправильный симлинк.

**Проверьте:**
```bash
ssh root@80.90.187.187 "ls -la /var/www/web_samir/data"
# Должно быть: data -> /var/www/web_samir-data/data
```

### Изменения не появились на сайте

**Чеклист:**

1. Деплой прошёл успешно:
   ```bash
   ssh root@80.90.187.187 "cd /var/www/web_samir && ./deploy.sh"
   ```

2. Очистите кэш браузера: `Ctrl+Shift+R`

3. Проверьте версию файла:
   ```bash
   ssh root@80.90.187.187 "head -5 /var/www/web_samir/index.html"
   ```

### Сервер не отвечает

**Проверьте:**
```bash
# Статус nginx
ssh root@80.90.187.187 "systemctl status nginx"

# Логи
ssh root@80.90.187.187 "tail -50 /var/log/nginx/error.log"
```

---

## Проблемы с ESLint

### `Parsing error: Unexpected token`

**Причина:** Использован современный синтаксис.

**Решение:** Замените на ES5:
```javascript
// Неправильно
const x = obj?.prop ?? 'default';

// Правильно
var x = (obj && obj.prop) ? obj.prop : 'default';
```

### `no-unused-vars`

**Причина:** Переменная объявлена, но не используется.

**Решение:** Удалите неиспользуемую переменную или добавьте `_` префикс:
```javascript
function callback(_event) {  // _ показывает, что аргумент намеренно не используется
    // ...
}
```

---

## Проблемы с Git

### Конфликты в HTML файлах корня

**Причина:** HTML файлы генерируются автоматически.

**Решение:**
```bash
# Принять версию из main
git checkout --theirs index.html shop.html admin.html legal.html

# Пересобрать
python3 scripts/build.py
git add .
git commit -m "Rebuild HTML"
```

### Случайно закоммитил data/

**Решение:**
```bash
# Удалить из git, оставить локально
git rm -r --cached data/
git commit -m "Remove data from git"
```

---

## Быстрая диагностика

```bash
# Проверить всё перед коммитом
npm run lint && npm run format:check && python3 scripts/build.py

# Проверить сервер
curl -I http://localhost:8000

# Проверить API
curl http://localhost:8000/api/masters

# Проверить права
ls -la data/ uploads/
```
