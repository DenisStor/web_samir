#!/usr/bin/env python3
"""
Простой HTTP сервер для запуска сайта Say's Barbers
Запустите командой: python3 server.py
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

# Настройки сервера
PORT = 8000
HOST = "localhost"
FILENAME = "index.html"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Добавляем заголовки для корректной работы
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # Перенаправляем корневой путь на HTML файл
        if self.path == '/':
            self.path = f'/{FILENAME}'
        return super().do_GET()

def main():
    # Проверяем наличие HTML файла
    if not Path(FILENAME).exists():
        print(f"❌ Ошибка: Файл {FILENAME} не найден в текущей директории!")
        print(f"📁 Текущая директория: {os.getcwd()}")
        return

    # Создаём и запускаем сервер
    with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        url = f"http://{HOST}:{PORT}"

        print("=" * 60)
        print("🚀  Say's Barbers - Локальный сервер запущен!")
        print("=" * 60)
        print(f"📍  URL сайта: {url}")
        print(f"📁  Директория: {os.getcwd()}")
        print(f"🌐  Порт: {PORT}")
        print("=" * 60)
        print("💡  Нажмите Ctrl+C для остановки сервера")
        print("=" * 60)

        # Автоматически открываем браузер
        try:
            webbrowser.open(url)
            print(f"✅  Браузер открыт: {url}")
        except:
            print(f"⚠️   Не удалось автоматически открыть браузер.")
            print(f"    Откройте вручную: {url}")

        print()

        try:
            # Запускаем сервер
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n")
            print("=" * 60)
            print("🛑  Сервер остановлен")
            print("=" * 60)

if __name__ == "__main__":
    main()
