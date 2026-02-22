# Деплой

Инструкция по развёртыванию Say's Barbers на VPS.

## Структура на сервере

```
/var/www/web_samir-data/     ← Персистентное хранилище (вне git)
├── uploads/                   ← Загруженные изображения
└── data/                      ← SQLite БД (saysbarbers.db)

/var/www/web_samir/          ← Git репозиторий
├── uploads → symlink          ← Симлинк на ../web_samir-data/uploads
├── data → symlink             ← Симлинк на ../web_samir-data/data
└── ... остальные файлы
```

## Первоначальная установка

```bash
# 1. Клонировать репозиторий
cd /var/www
git clone <repository-url> web_samir

# 2. Создать персистентное хранилище
mkdir -p /var/www/web_samir-data/uploads
mkdir -p /var/www/web_samir-data/data

# 3. Создать симлинки
cd /var/www/web_samir
rm -rf uploads data
ln -sfn /var/www/web_samir-data/uploads uploads
ln -sfn /var/www/web_samir-data/data data

# 4. Установить права
chown -R www-data:www-data /var/www/web_samir-data
chmod -R 755 /var/www/web_samir-data

# 5. Установить зависимости
pip install -r requirements.txt
npm install
```

## Обновление (деплой)

Используйте скрипт `deploy.sh`:

```bash
cd /var/www/web_samir
./deploy.sh
```

Скрипт автоматически:
1. Проверяет/создаёт персистентное хранилище
2. Мигрирует данные если они ещё в проекте
3. Делает `git pull`
4. Пересоздаёт симлинки

### Ручной деплой

Если нужен контроль:

```bash
cd /var/www/web_samir

# Сохранить текущее состояние (на всякий случай)
# cp -r /var/www/web_samir-data /var/www/web_samir-data-backup

# Обновить код
git pull origin main

# Пересоздать симлинки (git может удалить их)
rm -rf uploads data
ln -sfn /var/www/web_samir-data/uploads uploads
ln -sfn /var/www/web_samir-data/data data

# Перезапустить сервер
sudo systemctl restart web_samir
```

## Systemd сервис

Пример `/etc/systemd/system/web_samir.service`:

```ini
[Unit]
Description=Say's Barbers Website
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/web_samir
ExecStart=/usr/bin/python3 run.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Команды:
```bash
sudo systemctl enable web_samir   # Автозапуск
sudo systemctl start web_samir    # Запуск
sudo systemctl restart web_samir  # Перезапуск
sudo systemctl status web_samir   # Статус
sudo journalctl -u web_samir -f   # Логи
```

## Nginx конфигурация

Пример `/etc/nginx/sites-available/web_samir`:

```nginx
server {
    listen 80;
    server_name saysbarbers.ru www.saysbarbers.ru;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.html$ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location ~* \.js$ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location /uploads/ {
        alias /var/www/web_samir-data/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SSL настраивается через certbot
}
```

## Хранилище данных

Данные CMS хранятся в SQLite: `/var/www/web_samir-data/data/saysbarbers.db`.

Управление данными — через админку (`/admin.html`).

## Бэкапы

Рекомендуется настроить автоматический бэкап данных:

```bash
# Ежедневный бэкап в crontab
0 3 * * * tar -czf /var/backups/web_samir-data-$(date +\%Y\%m\%d).tar.gz /var/www/web_samir-data

# Удаление старых бэкапов (старше 30 дней)
0 4 * * * find /var/backups -name "web_samir-data-*.tar.gz" -mtime +30 -delete
```

## Проверка после деплоя

1. Симлинки на месте:
   ```bash
   ls -la /var/www/web_samir/uploads /var/www/web_samir/data
   ```

2. Сайт работает:
   ```bash
   curl -I http://localhost:8000
   ```

3. Данные доступны:
   ```bash
   ls /var/www/web_samir-data/uploads/
   ```
