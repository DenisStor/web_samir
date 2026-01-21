#!/bin/bash
# deploy.sh — безопасный деплой с сохранением данных
#
# Использование:
#   ./deploy.sh
#
# Скрипт:
# 1. Создаёт персистентное хранилище вне git-директории
# 2. Переносит существующие данные (uploads, data)
# 3. Делает git pull
# 4. Создаёт симлинки на персистентное хранилище

set -e

DATA_DIR="/var/www/saysbarbers-data"
PROJECT_DIR="/var/www/saysbarbers"

echo "=== Деплой Say's Barbers ==="

# 1. Создать директорию для данных (если не существует)
echo "→ Проверка персистентного хранилища..."
mkdir -p "$DATA_DIR/uploads"
mkdir -p "$DATA_DIR/data"

# 2. Если данные ещё в проекте — переместить их
echo "→ Миграция данных..."

if [ -d "$PROJECT_DIR/uploads" ] && [ ! -L "$PROJECT_DIR/uploads" ]; then
    echo "  Перенос uploads/..."
    mv "$PROJECT_DIR/uploads"/* "$DATA_DIR/uploads/" 2>/dev/null || true
    rm -rf "$PROJECT_DIR/uploads"
fi

if [ -d "$PROJECT_DIR/data" ] && [ ! -L "$PROJECT_DIR/data" ]; then
    echo "  Перенос data/..."
    mv "$PROJECT_DIR/data"/* "$DATA_DIR/data/" 2>/dev/null || true
    rm -rf "$PROJECT_DIR/data"
fi

# 3. Git pull
echo "→ Обновление из репозитория..."
cd "$PROJECT_DIR"
git pull origin main

# 4. Удалить директории если git их создал (например, .gitkeep)
rm -rf "$PROJECT_DIR/uploads" "$PROJECT_DIR/data" 2>/dev/null || true

# 5. Создать симлинки
echo "→ Создание симлинков..."
ln -sfn "$DATA_DIR/uploads" "$PROJECT_DIR/uploads"
ln -sfn "$DATA_DIR/data" "$PROJECT_DIR/data"

# 6. Установить права (опционально)
# chown -R www-data:www-data "$DATA_DIR"
# chmod -R 755 "$DATA_DIR"

# 7. Перезапустить сервер (если используется systemd)
# echo "→ Перезапуск сервера..."
# sudo systemctl restart saysbarbers

echo ""
echo "✓ Деплой завершён успешно!"
echo ""
echo "Проверка симлинков:"
ls -la "$PROJECT_DIR/uploads" "$PROJECT_DIR/data" 2>/dev/null || echo "  (симлинки будут созданы при первом запуске на сервере)"
