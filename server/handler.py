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
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
import subprocess
import sys
import logging
import threading

logger = logging.getLogger('saysbarbers')

# Импорт модулей из пакета
from .validators import (
    is_valid_slug, is_valid_filename, validate_image_bytes,
    SchemaValidator,
    MASTER_SCHEMA, SERVICE_SCHEMA, ARTICLE_SCHEMA, FAQ_SCHEMA,
    PRODUCT_SCHEMA, CATEGORY_SCHEMA, sanitize_html_content
)
from .database import Database
from .auth import SessionManager, RateLimiter, UploadRateLimiter, verify_password
from .routes import get_router


def load_env_file():
    """Загрузка переменных окружения из .env файла."""
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, _, value = line.partition('=')
                    os.environ.setdefault(key.strip(), value.strip())


# Загружаем .env до чтения переменных окружения
load_env_file()

# Настройки сервера
PORT = int(os.environ.get('SERVER_PORT', 8000))
HOST = os.environ.get('SERVER_HOST', 'localhost')
FILENAME = "index.html"
DATA_DIR = Path("data")
UPLOADS_DIR = Path("uploads")
BUILD_SCRIPT = Path("scripts/build.py")
CONFIG_FILE = Path("config.json")

# Создаём директории если не существуют
DATA_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)


def load_config():
    """Загрузка конфигурации из файла и переменных окружения."""
    default_config = {
        "session_timeout_hours": 24,
        "max_login_attempts": 5,
        "lockout_minutes": 15
    }

    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
                if 'auth' in file_config:
                    auth = file_config['auth']
                    default_config['session_timeout_hours'] = auth.get('sessionTimeoutHours', default_config['session_timeout_hours'])
                    default_config['max_login_attempts'] = auth.get('maxLoginAttempts', default_config['max_login_attempts'])
                    default_config['lockout_minutes'] = auth.get('lockoutMinutes', default_config['lockout_minutes'])
                else:
                    file_config.pop('admin_password', None)
                    default_config.update(file_config)
        except json.JSONDecodeError as e:
            logger.warning("Ошибка парсинга config.json: %s", e)
        except Exception as e:
            logger.warning("Ошибка загрузки config.json: %s", e)

    admin_password = os.environ.get('ADMIN_PASSWORD')
    if not admin_password:
        logger.warning("ADMIN_PASSWORD не установлен! Установите переменную окружения или добавьте в .env файл")
        admin_password = None

    return {
        "admin_password": admin_password,
        "session_timeout_hours": int(os.environ.get('SESSION_TIMEOUT_HOURS', default_config['session_timeout_hours'])),
        "max_login_attempts": int(os.environ.get('MAX_LOGIN_ATTEMPTS', default_config['max_login_attempts'])),
        "lockout_minutes": int(os.environ.get('LOCKOUT_MINUTES', default_config['lockout_minutes']))
    }


CONFIG = load_config()

# Инициализация сервисов (thread-safe)
storage = Database()
session_manager = SessionManager(timeout_hours=CONFIG['session_timeout_hours'])
login_limiter = RateLimiter(
    max_attempts=CONFIG['max_login_attempts'],
    lockout_minutes=CONFIG['lockout_minutes']
)
upload_limiter = UploadRateLimiter(max_uploads=10, window_seconds=60)
router = get_router()

SESSION_CLEANUP_INTERVAL = 3600  # 1 час


def _schedule_session_cleanup():
    """Периодическая очистка истёкших сессий и старых rate limit записей."""
    try:
        expired = session_manager.cleanup_expired()
        old = login_limiter.cleanup_old()
        if expired or old:
            logger.info("Session cleanup: %d expired sessions, %d old rate limits", expired, old)
    except Exception:
        logger.exception("Session cleanup error")

    timer = threading.Timer(SESSION_CLEANUP_INTERVAL, _schedule_session_cleanup)
    timer.daemon = True
    timer.start()

# CORS настройки
CACHE_MAX_AGE_WEEK = 604800

ALLOWED_ORIGINS = {
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://saysbarbers.ru',
    'https://www.saysbarbers.ru'
}


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

    COMPRESSIBLE_TYPES = {'.html', '.css', '.js', '.json', '.svg', '.xml', '.txt'}
    CACHEABLE_EXTENSIONS = {'.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.woff', '.woff2', '.ttf', '.eot'}

    # Маппинг файлов на схемы валидации и ключи массивов
    VALIDATION_MAP = {
        'masters.json': ('masters', MASTER_SCHEMA),
        'services.json': ('services', SERVICE_SCHEMA),
        'articles.json': ('articles', ARTICLE_SCHEMA),
        'faq.json': ('items', FAQ_SCHEMA),
        'products.json': ('products', PRODUCT_SCHEMA),
        'shop-categories.json': ('categories', CATEGORY_SCHEMA),
    }

    def get_cache_header(self):
        """Определяет правильный Cache-Control заголовок."""
        path = self.path.split('?')[0]
        ext = os.path.splitext(path)[1].lower()

        if path.startswith('/api/'):
            return 'no-store, no-cache, must-revalidate'
        if ext == '.js':
            return 'no-cache, must-revalidate'
        if ext in self.CACHEABLE_EXTENSIONS:
            return f'public, max-age={CACHE_MAX_AGE_WEEK}, immutable'
        if ext == '.html' or path in ('/', ''):
            return 'no-cache, must-revalidate'
        return 'public, max-age=300, must-revalidate'

    def get_cors_origin(self):
        """Получение разрешённого CORS origin."""
        origin = self.headers.get('Origin', '')
        if origin in ALLOWED_ORIGINS:
            return origin
        if origin.startswith('http://localhost:') or origin.startswith('http://127.0.0.1:'):
            return origin
        return None

    def end_headers(self):
        self.send_header('Cache-Control', self.get_cache_header())
        cors_origin = self.get_cors_origin()
        if cors_origin:
            self.send_header('Access-Control-Allow-Origin', cors_origin)
            self.send_header('Access-Control-Allow-Credentials', 'true')
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
        """Проверка аутентификации."""
        token = self.get_auth_token()
        if not session_manager.validate(token):
            self.send_error_response(401, 'Unauthorized: Invalid or expired token')
            return False
        return True

    def send_json_response(self, data, status=200):
        """Отправка JSON ответа."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def send_error_response(self, status, message):
        """Отправка ошибки в JSON формате."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': False,
            'error': message
        }, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        """Обработка CORS preflight запросов."""
        self.send_response(200)
        self.end_headers()

    def _handle_request(self, method):
        """Единый метод обработки запросов через роутер."""
        parsed = urlparse(self.path)
        path = parsed.path

        # Пробуем найти обработчик в роутере
        handler_name, params, auth_required = router.resolve(path, method)

        if handler_name:
            # Проверка аутентификации если требуется
            if auth_required and not self.require_auth():
                return True

            # Вызов обработчика
            handler = getattr(self, handler_name, None)
            if handler:
                if params:
                    handler(**params)
                else:
                    handler()
                return True

        # Fallback для статических файлов и страниц
        return None  # Сигнал для вызова родительского обработчика

    def do_GET(self):
        """Обработка GET запросов."""
        parsed = urlparse(self.path)
        path = parsed.path

        # Пробуем роутер
        result = self._handle_request('GET')
        if result is None:
            # Статические файлы и страницы
            if path in ('/robots.txt', '/sitemap.xml', '/favicon.ico'):
                self.path = '/public' + path
                return super().do_GET()
            elif path == '/legal' or path.startswith('/legal/'):
                self.path = '/legal.html'
                return super().do_GET()
            elif path == '/shop' or path.startswith('/shop/'):
                self.path = '/shop.html'
                return super().do_GET()
            elif path == '/':
                self.path = f'/{FILENAME}'
                return super().do_GET()
            else:
                return super().do_GET()

    def do_POST(self):
        """Обработка POST запросов."""
        result = self._handle_request('POST')
        if result is None:
            self.send_error_response(404, 'Not Found')

    def do_PUT(self):
        """Обработка PUT запросов."""
        result = self._handle_request('PUT')
        if result is None:
            self.send_error_response(404, 'Not Found')

    def do_DELETE(self):
        """Обработка DELETE запросов."""
        result = self._handle_request('DELETE')
        if result is None:
            self.send_error_response(404, 'Not Found')

    # === Auth handlers ===

    def handle_login(self):
        """Аутентификация пользователя."""
        try:
            ip = self.get_client_ip()

            if not login_limiter.check(ip):
                self.send_error_response(429, 'Too many login attempts. Try again later.')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, 'Missing request body')
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            password = data.get('password', '')

            if CONFIG['admin_password'] and verify_password(password, CONFIG['admin_password']):
                token = session_manager.create()
                login_limiter.record(ip, True)
                self.send_json_response({
                    'success': True,
                    'token': token,
                    'expires_in': CONFIG['session_timeout_hours'] * 3600
                })
            else:
                login_limiter.record(ip, False)
                self.send_error_response(401, 'Invalid password')

        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    def handle_logout(self):
        """Выход из системы."""
        try:
            token = self.get_auth_token()
            if token:
                session_manager.delete(token)
            self.send_json_response({'success': True, 'message': 'Logged out'})
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    def handle_auth_check(self):
        """Проверка валидности текущей сессии."""
        token = self.get_auth_token()
        if session_manager.validate(token):
            remaining = session_manager.get_remaining_time(token)
            self.send_json_response({
                'valid': True,
                'expires_in': remaining
            })
        else:
            self.send_json_response({'valid': False})

    # === Data handlers ===

    def _handle_get_data(self, filename):
        """Получение данных из JSON файла."""
        try:
            data = storage.read(filename, {})
            self.send_json_response(data)
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    def _handle_save_data(self, filename):
        """Сохранение данных в JSON файл."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, 'Missing request body')
                return

            max_post_size = 5 * 1024 * 1024
            if content_length > max_post_size:
                self.send_error_response(413, 'Request too large. Max size is 5MB.')
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            if not isinstance(data, dict):
                self.send_error_response(400, 'Expected JSON object')
                return

            # Валидация элементов если есть схема
            validation = self.VALIDATION_MAP.get(filename)
            if validation:
                list_key, schema = validation
                items = data.get(list_key, [])
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            is_valid, error = SchemaValidator.validate(item, schema)
                            if not is_valid:
                                self.send_error_response(400, error)
                                return

            storage.write(filename, data)
            self.send_json_response({'success': True, 'message': 'Данные сохранены'})
        except json.JSONDecodeError:
            self.send_error_response(400, 'Invalid JSON')
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    # Маппинг ресурсов на файлы JSON
    RESOURCE_MAP = {
        'masters': 'masters.json',
        'services': 'services.json',
        'articles': 'articles.json',
        'faq': 'faq.json',
        'social': 'social.json',
        'legal': 'legal.json',
        'shop-categories': 'shop-categories.json',
        'shop-products': 'products.json',
    }

    def handle_generic_get(self, resource):
        """Generic GET handler для ресурсов из RESOURCE_MAP."""
        filename = self.RESOURCE_MAP.get(resource)
        if filename:
            self._handle_get_data(filename)
        else:
            self.send_error_response(404, 'Resource not found')

    def handle_generic_save(self, resource):
        """Generic POST/PUT handler для ресурсов из RESOURCE_MAP."""
        filename = self.RESOURCE_MAP.get(resource)
        if filename:
            self._handle_save_data(filename)
        else:
            self.send_error_response(404, 'Resource not found')

    def handle_get_legal_document(self, slug):
        """Получение юридического документа по slug."""
        try:
            if not is_valid_slug(slug):
                self.send_error_response(400, 'Invalid slug format')
                return

            document = storage.get_legal_by_slug(slug)

            if document:
                self.send_json_response(document)
            else:
                self.send_error_response(404, 'Document not found')
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    def handle_get_products(self):
        """Получение товаров с фильтрацией."""
        try:
            parsed = urlparse(self.path)
            query = parse_qs(parsed.query)
            category_slug = query.get('category', [None])[0]

            if category_slug == 'all':
                category_slug = None

            products = storage.get_products_filtered(
                category_slug=category_slug,
                status='active'
            )
            self.send_json_response({'products': products})
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    def handle_get_product(self, id):
        """Получение товара по ID."""
        try:
            product = storage.get_product_by_id(id)

            if product:
                self.send_json_response(product)
            else:
                self.send_error_response(404, 'Product not found')
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    # === Stats handlers ===

    def handle_get_stats(self):
        """Получение статистики посещений."""
        try:
            stats = storage.read('stats.json', self._init_stats())
            today = datetime.now().strftime('%Y-%m-%d')
            stats['today_views'] = stats.get('daily', {}).get(today, 0)

            week_views = 0
            for i in range(7):
                day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                week_views += stats.get('daily', {}).get(day, 0)
            stats['week_views'] = week_views

            month_views = 0
            for i in range(30):
                day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                month_views += stats.get('daily', {}).get(day, 0)
            stats['month_views'] = month_views

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
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    def handle_record_visit(self):
        """Запись посещения."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                visit_data = json.loads(post_data.decode('utf-8'))
            else:
                visit_data = {}

            def update_stats(stats):
                today = datetime.now().strftime('%Y-%m-%d')
                now = datetime.now().isoformat()
                visit_type = visit_data.get('type', 'pageview')

                if visit_type == 'pageview':
                    stats['total_views'] = stats.get('total_views', 0) + 1
                    stats['last_visit'] = now

                    if 'daily' not in stats:
                        stats['daily'] = {}
                    stats['daily'][today] = stats['daily'].get(today, 0) + 1

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
                    section = visit_data.get('section')
                    if section:
                        if 'sections' not in stats:
                            stats['sections'] = {}
                        stats['sections'][section] = stats['sections'].get(section, 0) + 1

                # Очистка старых данных
                cutoff = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
                stats['daily'] = {k: v for k, v in stats.get('daily', {}).items() if k >= cutoff}
                stats['sessions'] = {k: v for k, v in stats.get('sessions', {}).items() if k >= cutoff}

                return stats

            storage.update('stats.json', update_stats, self._init_stats())
            self.send_json_response({'success': True})
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    def _init_stats(self):
        """Инициализация пустой статистики."""
        return {
            'total_views': 0,
            'unique_visitors': 0,
            'daily': {},
            'sections': {},
            'sessions': {},
            'created': datetime.now().isoformat()
        }

    # === Upload handlers ===

    def handle_upload(self):
        """Загрузка изображений."""
        try:
            ip = self.get_client_ip()
            if not upload_limiter.check(ip):
                self.send_error_response(429, 'Too many uploads. Please wait and try again.')
                return

            content_length = int(self.headers['Content-Length'])
            max_upload_size = 5 * 1024 * 1024
            if content_length > max_upload_size:
                self.send_error_response(413, 'File too large. Max size is 5MB.')
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            image_data = data.get('image', '')
            if ',' in image_data:
                _, image_data = image_data.split(',', 1)

            try:
                image_bytes = base64.b64decode(image_data)
            except Exception:
                self.send_error_response(400, 'Invalid base64 data')
                return

            is_valid, detected_ext = validate_image_bytes(image_bytes)
            if not is_valid:
                self.send_error_response(400, 'Invalid image format. Only PNG, JPG, GIF, WebP allowed.')
                return

            filename = f"{uuid.uuid4().hex}.{detected_ext}"
            filepath = UPLOADS_DIR / filename

            with open(filepath, 'wb') as f:
                f.write(image_bytes)

            self.send_json_response({
                'success': True,
                'filename': filename,
                'url': f'/uploads/{filename}'
            })
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')

    def handle_delete_upload(self, filename):
        """Удаление загруженного файла."""
        try:
            if not is_valid_filename(filename):
                self.send_error_response(400, 'Invalid filename')
                return

            filepath = (UPLOADS_DIR / filename).resolve()

            try:
                filepath.relative_to(UPLOADS_DIR.resolve())
            except ValueError:
                self.send_error_response(403, 'Access denied')
                return

            try:
                filepath.unlink()
                self.send_json_response({'success': True, 'message': 'Файл удалён'})
            except FileNotFoundError:
                self.send_error_response(404, 'Файл не найден')
        except Exception as e:
            logger.exception("Server error")
            self.send_error_response(500, 'Internal server error')


def main():
    build_html()

    if not Path(FILENAME).exists():
        print(f"Ошибка: Файл {FILENAME} не найден в текущей директории!")
        print(f"Текущая директория: {os.getcwd()}")
        return

    # Запуск периодической очистки сессий
    _schedule_session_cleanup()

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
