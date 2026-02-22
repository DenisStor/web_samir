# Как задеплоить изменения

## Перед деплоем

### Чеклист

- [ ] Код работает локально
- [ ] `npm run lint` без ошибок (JS)
- [ ] `npm run lint:css` без ошибок (CSS)
- [ ] `npm run format:check` без ошибок
- [ ] `python3 scripts/build.py` успешно
- [ ] Изменения закоммичены

### Проверка

```bash
npm run lint && npm run lint:css && npm run format:check && python3 scripts/build.py
```

---

## Деплой кода

### Команда

```bash
ssh root@80.90.187.187 "cd /var/www/web_samir && ./deploy.sh"
```

### Что делает deploy.sh

1. `git pull` — загружает изменения
2. `npm install` — устанавливает зависимости (если изменились)
3. `python3 scripts/build.py` — собирает HTML и бандлы
4. Перезапуск сервера (если настроен)

---

## Данные на сервере

Данные CMS хранятся в SQLite отдельно от кода:

```
/var/www/web_samir-data/data/
└── saysbarbers.db          ← SQLite БД
```

Управление данными — через админку (`/admin.html`).

При необходимости прямого доступа к БД:

```bash
ssh root@80.90.187.187 "sqlite3 /var/www/web_samir-data/data/saysbarbers.db '.tables'"
```

---

## Просмотр логов

### Логи nginx

```bash
# Последние 50 строк ошибок
ssh root@80.90.187.187 "tail -50 /var/log/nginx/error.log"

# Последние 50 строк доступа
ssh root@80.90.187.187 "tail -50 /var/log/nginx/access.log"
```

### Следить за логами в реальном времени

```bash
ssh root@80.90.187.187 "tail -f /var/log/nginx/error.log"
```

---

## Откат изменений

### Откат кода

```bash
ssh root@80.90.187.187 "cd /var/www/web_samir && git checkout HEAD~1"
```

### Откат на конкретный коммит

```bash
# Найти хэш коммита
git log --oneline -10

# Откатить
ssh root@80.90.187.187 "cd /var/www/web_samir && git checkout <commit-hash>"
```

---

## Симлинки

На сервере настроены симлинки для данных:

```
/var/www/web_samir/data    →  /var/www/web_samir-data/data
/var/www/web_samir/uploads →  /var/www/web_samir-data/uploads
```

**Это позволяет:**
- Обновлять код без потери данных
- Хранить данные отдельно от репозитория

### Проверка симлинков

```bash
ssh root@80.90.187.187 "ls -la /var/www/web_samir/ | grep -E 'data|uploads'"
```

---

## Первый деплой (настройка сервера)

### 1. Клонирование

```bash
ssh root@80.90.187.187
cd /var/www
git clone git@github.com:Den191601/web_samir.git
```

### 2. Создание директории данных

```bash
mkdir -p /var/www/web_samir-data/data
mkdir -p /var/www/web_samir-data/uploads
```

### 3. Симлинки

```bash
cd /var/www/web_samir
ln -s /var/www/web_samir-data/data data
ln -s /var/www/web_samir-data/uploads uploads
```

### 4. Зависимости

```bash
npm install
```

### 5. Конфигурация

```bash
cp config.example.json config.json
nano config.json  # Установите пароль админа
```

### 6. Сборка

```bash
python3 scripts/build.py
```

### 7. Права

```bash
chmod 755 /var/www/web_samir-data/data
chmod 755 /var/www/web_samir-data/uploads
chmod +x deploy.sh
```

---

## Частые проблемы

### Permission denied

```bash
ssh root@80.90.187.187 "chmod +x /var/www/web_samir/deploy.sh"
```

### Данные не сохраняются

Проверьте права:
```bash
ssh root@80.90.187.187 "ls -la /var/www/web_samir-data/"
```

### Изменения не видны

1. Очистите кэш браузера: `Ctrl+Shift+R`
2. Проверьте версию файла на сервере:
   ```bash
   ssh root@80.90.187.187 "head -5 /var/www/web_samir/index.html"
   ```

---

## Полезные команды

```bash
# Статус сервера
ssh root@80.90.187.187 "systemctl status nginx"

# Перезапуск nginx
ssh root@80.90.187.187 "systemctl restart nginx"

# Свободное место
ssh root@80.90.187.187 "df -h"

# Текущая версия кода
ssh root@80.90.187.187 "cd /var/www/web_samir && git log -1 --oneline"
```
