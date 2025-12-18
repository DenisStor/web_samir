#!/usr/bin/env python3
"""
HTTP сервер для Say's Barbers с поддержкой Admin API
Запустите командой: python3 server.py
"""

import http.server
import socketserver
import webbrowser
import os
import json
import uuid
import base64
import re
import hashlib
import threading
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
import subprocess
import sys

# Настройки сервера
PORT = 8000
HOST = "localhost"
FILENAME = "index.html"
DATA_DIR = Path("data")
UPLOADS_DIR = Path("uploads")
BUILD_SCRIPT = Path("scripts/build.py")
CONFIG_FILE = Path("config.json")

# Создаём директории если не существуют
DATA_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

# ============================================
# КОНФИГУРАЦИЯ И БЕЗОПАСНОСТЬ
# ============================================

def load_config():
    """Загрузка конфигурации из файла."""
    default_config = {
        "admin_password": "says2024",
        "session_timeout_hours": 24,
        "max_login_attempts": 5,
        "lockout_minutes": 15
    }
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return {**default_config, **json.load(f)}
        except:
            pass
    return default_config

CONFIG = load_config()

# Хранилище сессий и rate limiting (в памяти)
sessions = {}  # {token: {'created': datetime, 'expires': datetime}}
login_attempts = {}  # {ip: {'count': int, 'lockout_until': datetime}}
file_locks = {}  # {filename: threading.Lock()}
file_locks_lock = threading.Lock()


def generate_token():
    """Генерация криптографически стойкого токена."""
    return hashlib.sha256(f"{uuid.uuid4().hex}{datetime.now().isoformat()}".encode()).hexdigest()


def validate_token(token):
    """Проверка валидности токена."""
    if not token or token not in sessions:
        return False
    session = sessions[token]
    if datetime.now() > session['expires']:
        del sessions[token]
        return False
    return True


def get_file_lock(filename):
    """Получение блокировки для файла (thread-safe)."""
    with file_locks_lock:
        if filename not in file_locks:
            file_locks[filename] = threading.Lock()
        return file_locks[filename]


def is_valid_filename(filename):
    """Проверка имени файла (защита от Path Traversal)."""
    # Только буквы, цифры, дефис, подчёркивание и точка
    if not re.match(r'^[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+$', filename):
        return False
    # Запрет опасных расширений
    dangerous_ext = ['.py', '.sh', '.exe', '.bat', '.cmd', '.php', '.js', '.html']
    if any(filename.lower().endswith(ext) for ext in dangerous_ext):
        return False
    return True


def check_rate_limit(ip):
    """Проверка rate limiting для IP."""
    if ip not in login_attempts:
        return True

    attempt = login_attempts[ip]
    if 'lockout_until' in attempt and datetime.now() < attempt['lockout_until']:
        return False

    # Сброс после периода блокировки
    if 'lockout_until' in attempt and datetime.now() >= attempt['lockout_until']:
        login_attempts[ip] = {'count': 0}

    return True


def record_login_attempt(ip, success):
    """Запись попытки входа."""
    if ip not in login_attempts:
        login_attempts[ip] = {'count': 0}

    if success:
        login_attempts[ip] = {'count': 0}
    else:
        login_attempts[ip]['count'] += 1
        if login_attempts[ip]['count'] >= CONFIG['max_login_attempts']:
            login_attempts[ip]['lockout_until'] = datetime.now() + timedelta(minutes=CONFIG['lockout_minutes'])


# ============================================
# ВАЛИДАЦИЯ ДАННЫХ
# ============================================

def validate_master(data):
    """Валидация данных мастера."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    name = data.get('name', '')
    if not name or not isinstance(name, str) or len(name) > 100:
        return False, "Invalid or missing name"

    # Защита от XSS - запрещаем HTML теги в имени
    if '<' in name or '>' in name:
        return False, "Invalid characters in name"

    badge = data.get('badge', 'green')
    if badge not in ['green', 'pink', 'blue']:
        return False, "Invalid badge color"

    return True, None


def validate_service(data):
    """Валидация данных услуги."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    name = data.get('name', '')
    if not name or not isinstance(name, str) or len(name) > 200:
        return False, "Invalid or missing name"

    # Проверка цен
    for price_key in ['priceGreen', 'pricePink', 'priceBlue', 'price']:
        price = data.get(price_key)
        if price is not None:
            if not isinstance(price, (int, float)) or price < 0 or price > 1000000:
                return False, f"Invalid {price_key}"

    return True, None


def validate_article(data):
    """Валидация данных статьи."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    title = data.get('title', '')
    if not title or not isinstance(title, str) or len(title) > 500:
        return False, "Invalid or missing title"

    content = data.get('content', '')
    if len(content) > 100000:  # 100KB max
        return False, "Content too long"

    return True, None


def validate_faq(data):
    """Валидация FAQ."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    question = data.get('question', '')
    if not question or not isinstance(question, str) or len(question) > 500:
        return False, "Invalid or missing question"

    answer = data.get('answer', '')
    if len(answer) > 10000:
        return False, "Answer too long"

    return True, None


def build_html():
    """Собирает index.html из секций."""
    if BUILD_SCRIPT.exists():
        print("🔨 Сборка index.html из секций...")
        result = subprocess.run([sys.executable, str(BUILD_SCRIPT)], capture_output=True, text=True)
        if result.returncode == 0:
            print(result.stdout.strip())
        else:
            print(f"⚠️  Ошибка сборки: {result.stderr}")
    else:
        print("ℹ️  build.py не найден, используется существующий index.html")


class AdminAPIHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Handler с поддержкой REST API для админ-панели"""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def get_auth_token(self):
        """Извлечение токена из заголовка Authorization."""
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:]
        return None

    def get_client_ip(self):
        """Получение IP клиента."""
        return self.client_address[0] if self.client_address else '127.0.0.1'

    def require_auth(self):
        """Проверка аутентификации. Возвращает True если авторизован."""
        token = self.get_auth_token()
        if not validate_token(token):
            self.send_error_response(401, 'Unauthorized: Invalid or expired token')
            return False
        return True

    def do_OPTIONS(self):
        """Обработка CORS preflight запросов"""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """Обработка GET запросов"""
        parsed = urlparse(self.path)
        path = parsed.path

        # API endpoints
        if path == '/api/masters':
            self.handle_get_data('masters.json')
        elif path == '/api/services':
            self.handle_get_data('services.json')
        elif path == '/api/articles':
            self.handle_get_data('articles.json')
        elif path == '/api/faq':
            self.handle_get_data('faq.json')
        elif path == '/api/social':
            self.handle_get_data('social.json')
        elif path == '/api/stats':
            self.handle_get_stats()
        elif path == '/':
            self.path = f'/{FILENAME}'
            return super().do_GET()
        else:
            return super().do_GET()

    def do_POST(self):
        """Обработка POST запросов"""
        parsed = urlparse(self.path)
        path = parsed.path

        # Публичные endpoints (без аутентификации)
        if path == '/api/auth/login':
            self.handle_login()
            return
        elif path == '/api/auth/logout':
            self.handle_logout()
            return
        elif path == '/api/auth/check':
            self.handle_auth_check()
            return
        elif path == '/api/stats/visit':
            self.handle_record_visit()
            return

        # Защищённые endpoints (требуют аутентификации)
        if not self.require_auth():
            return

        if path == '/api/masters':
            self.handle_save_data('masters.json')
        elif path == '/api/services':
            self.handle_save_data('services.json')
        elif path == '/api/articles':
            self.handle_save_data('articles.json')
        elif path == '/api/faq':
            self.handle_save_data('faq.json')
        elif path == '/api/social':
            self.handle_save_data('social.json')
        elif path == '/api/upload':
            self.handle_upload()
        else:
            self.send_error(404, 'Not Found')

    def do_PUT(self):
        """Обработка PUT запросов (обновление данных)"""
        self.do_POST()

    def do_DELETE(self):
        """Обработка DELETE запросов"""
        # Все DELETE требуют аутентификации
        if not self.require_auth():
            return

        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/upload/'):
            filename = path.split('/')[-1]
            self.handle_delete_upload(filename)
        else:
            self.send_error(404, 'Not Found')

    def handle_login(self):
        """Аутентификация пользователя."""
        try:
            ip = self.get_client_ip()

            # Проверка rate limiting
            if not check_rate_limit(ip):
                self.send_error_response(429, 'Too many login attempts. Try again later.')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, 'Missing request body')
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            password = data.get('password', '')

            if password == CONFIG['admin_password']:
                # Успешный вход
                token = generate_token()
                sessions[token] = {
                    'created': datetime.now(),
                    'expires': datetime.now() + timedelta(hours=CONFIG['session_timeout_hours'])
                }
                record_login_attempt(ip, True)
                self.send_json_response({
                    'success': True,
                    'token': token,
                    'expires_in': CONFIG['session_timeout_hours'] * 3600
                })
            else:
                # Неверный пароль
                record_login_attempt(ip, False)
                self.send_error_response(401, 'Invalid password')

        except Exception as e:
            self.send_error_response(500, str(e))

    def handle_logout(self):
        """Выход из системы."""
        try:
            token = self.get_auth_token()
            if token and token in sessions:
                del sessions[token]
            self.send_json_response({'success': True, 'message': 'Logged out'})
        except Exception as e:
            self.send_error_response(500, str(e))

    def handle_auth_check(self):
        """Проверка валидности текущей сессии."""
        token = self.get_auth_token()
        if validate_token(token):
            session = sessions[token]
            remaining = (session['expires'] - datetime.now()).total_seconds()
            self.send_json_response({
                'valid': True,
                'expires_in': int(remaining)
            })
        else:
            self.send_json_response({'valid': False})

    def handle_get_data(self, filename):
        """Получение данных из JSON файла"""
        filepath = DATA_DIR / filename
        try:
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.send_json_response(data)
            else:
                self.send_json_response({})
        except Exception as e:
            self.send_error_response(500, str(e))

    def handle_save_data(self, filename):
        """Сохранение данных в JSON файл с блокировкой и атомарной записью."""
        lock = get_file_lock(filename)
        with lock:
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))

                filepath = DATA_DIR / filename

                # Атомарная запись через временный файл
                temp_filepath = filepath.with_suffix('.tmp')
                with open(temp_filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                # Атомарное переименование
                temp_filepath.replace(filepath)

                self.send_json_response({'success': True, 'message': 'Данные сохранены'})
            except Exception as e:
                # Удаляем временный файл при ошибке
                temp_filepath = (DATA_DIR / filename).with_suffix('.tmp')
                if temp_filepath.exists():
                    temp_filepath.unlink()
                self.send_error_response(500, str(e))

    def handle_upload(self):
        """Загрузка изображений с ограничением размера."""
        try:
            content_length = int(self.headers['Content-Length'])

            # Ограничение размера (10MB max)
            MAX_UPLOAD_SIZE = 10 * 1024 * 1024
            if content_length > MAX_UPLOAD_SIZE:
                self.send_error_response(413, 'File too large. Max size is 10MB.')
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            # Декодируем base64 изображение
            image_data = data.get('image', '')
            if ',' in image_data:
                # Убираем data:image/...;base64, prefix
                header, image_data = image_data.split(',', 1)
                # Определяем расширение
                if 'png' in header:
                    ext = 'png'
                elif 'gif' in header:
                    ext = 'gif'
                elif 'webp' in header:
                    ext = 'webp'
                else:
                    ext = 'jpg'
            else:
                ext = 'jpg'

            # Генерируем уникальное имя файла
            filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = UPLOADS_DIR / filename

            # Сохраняем файл
            image_bytes = base64.b64decode(image_data)
            with open(filepath, 'wb') as f:
                f.write(image_bytes)

            self.send_json_response({
                'success': True,
                'filename': filename,
                'url': f'/uploads/{filename}'
            })
        except Exception as e:
            self.send_error_response(500, str(e))

    def handle_delete_upload(self, filename):
        """Удаление загруженного файла с защитой от Path Traversal."""
        try:
            # Проверка имени файла (защита от Path Traversal)
            if not is_valid_filename(filename):
                self.send_error_response(400, 'Invalid filename')
                return

            filepath = (UPLOADS_DIR / filename).resolve()

            # Проверка что путь внутри UPLOADS_DIR
            if not filepath.is_relative_to(UPLOADS_DIR.resolve()):
                self.send_error_response(403, 'Access denied')
                return

            if filepath.exists():
                filepath.unlink()
                self.send_json_response({'success': True, 'message': 'Файл удалён'})
            else:
                self.send_error_response(404, 'Файл не найден')
        except Exception as e:
            self.send_error_response(500, str(e))

    def handle_get_stats(self):
        """Получение статистики посещений"""
        filepath = DATA_DIR / 'stats.json'
        try:
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    stats = json.load(f)
            else:
                stats = self._init_stats()

            # Добавляем вычисляемые метрики
            today = datetime.now().strftime('%Y-%m-%d')
            stats['today_views'] = stats.get('daily', {}).get(today, 0)

            # Просмотры за последние 7 дней
            week_views = 0
            for i in range(7):
                day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                week_views += stats.get('daily', {}).get(day, 0)
            stats['week_views'] = week_views

            # Просмотры за последние 30 дней
            month_views = 0
            for i in range(30):
                day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                month_views += stats.get('daily', {}).get(day, 0)
            stats['month_views'] = month_views

            # Данные для графика (последние 14 дней)
            chart_data = []
            for i in range(13, -1, -1):
                day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                chart_data.append({
                    'date': day,
                    'views': stats.get('daily', {}).get(day, 0)
                })
            stats['chart_data'] = chart_data

            self.send_json_response(stats)
        except Exception as e:
            self.send_error_response(500, str(e))

    def handle_record_visit(self):
        """Запись посещения или просмотра секции"""
        filepath = DATA_DIR / 'stats.json'
        try:
            # Читаем данные запроса
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                visit_data = json.loads(post_data.decode('utf-8'))
            else:
                visit_data = {}

            # Загружаем текущую статистику
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    stats = json.load(f)
            else:
                stats = self._init_stats()

            today = datetime.now().strftime('%Y-%m-%d')
            now = datetime.now().isoformat()
            visit_type = visit_data.get('type', 'pageview')

            if visit_type == 'pageview':
                # Обновляем счётчики просмотров страниц
                stats['total_views'] = stats.get('total_views', 0) + 1
                stats['last_visit'] = now

                # Ежедневная статистика
                if 'daily' not in stats:
                    stats['daily'] = {}
                stats['daily'][today] = stats['daily'].get(today, 0) + 1

                # Уникальные посетители (по session ID)
                session_id = visit_data.get('session_id')
                if session_id:
                    if 'sessions' not in stats:
                        stats['sessions'] = {}
                    if today not in stats['sessions']:
                        stats['sessions'][today] = []
                    if session_id not in stats['sessions'][today]:
                        stats['sessions'][today].append(session_id)
                        stats['unique_visitors'] = stats.get('unique_visitors', 0) + 1

            elif visit_type == 'section':
                # Статистика по секциям
                section = visit_data.get('section')
                if section:
                    if 'sections' not in stats:
                        stats['sections'] = {}
                    stats['sections'][section] = stats['sections'].get(section, 0) + 1

            # Очищаем старые данные (старше 90 дней)
            cutoff = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
            stats['daily'] = {k: v for k, v in stats.get('daily', {}).items() if k >= cutoff}
            stats['sessions'] = {k: v for k, v in stats.get('sessions', {}).items() if k >= cutoff}

            # Сохраняем
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)

            self.send_json_response({'success': True})
        except Exception as e:
            self.send_error_response(500, str(e))

    def _init_stats(self):
        """Инициализация пустой статистики"""
        return {
            'total_views': 0,
            'unique_visitors': 0,
            'daily': {},
            'sections': {},
            'sessions': {},
            'created': datetime.now().isoformat()
        }

    def send_json_response(self, data, status=200):
        """Отправка JSON ответа"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def send_error_response(self, status, message):
        """Отправка ошибки в JSON формате"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': False,
            'error': message
        }, ensure_ascii=False).encode('utf-8'))


def main():
    # Собираем HTML из секций
    build_html()

    # Проверяем наличие HTML файла
    if not Path(FILENAME).exists():
        print(f"Ошибка: Файл {FILENAME} не найден в текущей директории!")
        print(f"Текущая директория: {os.getcwd()}")
        return

    # Создаём и запускаем сервер
    # Разрешаем переиспользование порта (для быстрого перезапуска)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), AdminAPIHandler) as httpd:
        url = f"http://{HOST}:{PORT}"

        print("=" * 60)
        print("  Say's Barbers - Локальный сервер запущен!")
        print("=" * 60)
        print(f"  Сайт: {url}")
        print(f"  Админ-панель: {url}/admin.html")
        print(f"  Директория: {os.getcwd()}")
        print("=" * 60)
        print("  API Endpoints:")
        print("    POST     /api/auth/login   - Вход (возвращает токен)")
        print("    POST     /api/auth/logout  - Выход")
        print("    POST     /api/auth/check   - Проверка токена")
        print("    GET/POST /api/masters      - Мастера (POST требует токен)")
        print("    GET/POST /api/services     - Услуги (POST требует токен)")
        print("    GET/POST /api/articles     - Статьи (POST требует токен)")
        print("    POST     /api/upload       - Загрузка изображений (требует токен)")
        print("    DELETE   /api/upload/{name}- Удаление файла (требует токен)")
        print("    GET      /api/stats        - Статистика")
        print("    POST     /api/stats/visit  - Запись посещения")
        print("=" * 60)
        print("  Нажмите Ctrl+C для остановки сервера")
        print("=" * 60)

        # Автоматически открываем браузер
        try:
            webbrowser.open(url)
            print(f"  Браузер открыт: {url}")
        except:
            print(f"  Не удалось автоматически открыть браузер.")
            print(f"  Откройте вручную: {url}")

        print()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n")
            print("=" * 60)
            print("  Сервер остановлен")
            print("=" * 60)


if __name__ == "__main__":
    main()
