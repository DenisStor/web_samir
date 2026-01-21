# Деплой

Инструкция по развёртыванию Say's Barbers на VPS.

## Структура на сервере

```
/var/www/saysbarbers-data/     ← Персистентное хранилище (вне git)
├── uploads/                   ← Загруженные изображения
└── data/                      ← JSON данные CMS

/var/www/saysbarbers/          ← Git репозиторий
├── uploads → symlink          ← Симлинк на ../saysbarbers-data/uploads
├── data → symlink             ← Симлинк на ../saysbarbers-data/data
└── ... остальные файлы
```

## Первоначальная установка

```bash
# 1. Клонировать репозиторий
cd /var/www
git clone <repository-url> saysbarbers

# 2. Создать персистентное хранилище
mkdir -p /var/www/saysbarbers-data/uploads
mkdir -p /var/www/saysbarbers-data/data

# 3. Создать симлинки
cd /var/www/saysbarbers
rm -rf uploads data
ln -sfn /var/www/saysbarbers-data/uploads uploads
ln -sfn /var/www/saysbarbers-data/data data

# 4. Установить права
chown -R www-data:www-data /var/www/saysbarbers-data
chmod -R 755 /var/www/saysbarbers-data

# 5. Установить зависимости
pip install -r requirements.txt
npm install
```

## Обновление (деплой)

Используйте скрипт `deploy.sh`:

```bash
cd /var/www/saysbarbers
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
cd /var/www/saysbarbers

# Сохранить текущее состояние (на всякий случай)
# cp -r /var/www/saysbarbers-data /var/www/saysbarbers-data-backup

# Обновить код
git pull origin main

# Пересоздать симлинки (git может удалить их)
rm -rf uploads data
ln -sfn /var/www/saysbarbers-data/uploads uploads
ln -sfn /var/www/saysbarbers-data/data data

# Перезапустить сервер
sudo systemctl restart saysbarbers
```

## Systemd сервис

Пример `/etc/systemd/system/saysbarbers.service`:

```ini
[Unit]
Description=Say's Barbers Website
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/saysbarbers
ExecStart=/usr/bin/python3 server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Команды:
```bash
sudo systemctl enable saysbarbers   # Автозапуск
sudo systemctl start saysbarbers    # Запуск
sudo systemctl restart saysbarbers  # Перезапуск
sudo systemctl status saysbarbers   # Статус
sudo journalctl -u saysbarbers -f   # Логи
```

## Nginx конфигурация

Пример `/etc/nginx/sites-available/saysbarbers`:

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
        alias /var/www/saysbarbers-data/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SSL настраивается через certbot
}
```

## Редактирование данных на сервере

Данные CMS (`data/*.json`) не отслеживаются в git и хранятся в `/var/www/saysbarbers-data/data/`.

**Для изменения структуры данных** (названия категорий, порядок и т.д.):

```bash
# Подключиться к серверу
ssh root@80.90.187.187

# Редактировать нужный файл
nano /var/www/saysbarbers-data/data/services.json
```

Файлы данных:
- `services.json` — услуги барбершопа и подологии
- `masters.json` — мастера
- `articles.json` — статьи блога
- `products.json` — товары магазина
- `faq.json` — FAQ
- `legal.json` — юридические документы

**Важно:** `deploy.sh` НЕ перезаписывает эти файлы — они персистентны.

## Бэкапы

Рекомендуется настроить автоматический бэкап данных:

```bash
# Ежедневный бэкап в crontab
0 3 * * * tar -czf /var/backups/saysbarbers-data-$(date +\%Y\%m\%d).tar.gz /var/www/saysbarbers-data

# Удаление старых бэкапов (старше 30 дней)
0 4 * * * find /var/backups -name "saysbarbers-data-*.tar.gz" -mtime +30 -delete
```

## Проверка после деплоя

1. Симлинки на месте:
   ```bash
   ls -la /var/www/saysbarbers/uploads /var/www/saysbarbers/data
   ```

2. Сайт работает:
   ```bash
   curl -I http://localhost:8000
   ```

3. Данные доступны:
   ```bash
   ls /var/www/saysbarbers-data/uploads/
   ```
