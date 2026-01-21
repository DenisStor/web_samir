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
import gzip
import io
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
import subprocess
import sys


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

# ============================================
# КОНФИГУРАЦИЯ И БЕЗОПАСНОСТЬ
# ============================================

def load_config():
    """Загрузка конфигурации из файла и переменных окружения."""
    # Приоритет: переменные окружения > config.json > значения по умолчанию
    default_config = {
        "session_timeout_hours": 24,
        "max_login_attempts": 5,
        "lockout_minutes": 15
    }

    # Загружаем из config.json если есть
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
                # Поддержка новой вложенной структуры (auth секция)
                if 'auth' in file_config:
                    auth = file_config['auth']
                    default_config['session_timeout_hours'] = auth.get('sessionTimeoutHours', default_config['session_timeout_hours'])
                    default_config['max_login_attempts'] = auth.get('maxLoginAttempts', default_config['max_login_attempts'])
                    default_config['lockout_minutes'] = auth.get('lockoutMinutes', default_config['lockout_minutes'])
                else:
                    # Обратная совместимость со старой структурой
                    file_config.pop('admin_password', None)
                    default_config.update(file_config)
        except json.JSONDecodeError as e:
            print(f"⚠️  Ошибка парсинга config.json: {e}")
            print("   Используются значения по умолчанию")
        except Exception as e:
            print(f"⚠️  Ошибка загрузки config.json: {e}")

    # Переопределяем из переменных окружения
    admin_password = os.environ.get('ADMIN_PASSWORD')
    if not admin_password:
        print("⚠️  ВНИМАНИЕ: ADMIN_PASSWORD не установлен!")
        print("   Установите переменную окружения ADMIN_PASSWORD или добавьте в .env файл")
        print("   Пример: ADMIN_PASSWORD=your_secure_password")
        admin_password = None  # Блокируем вход без установленного пароля

    config = {
        "admin_password": admin_password,
        "session_timeout_hours": int(os.environ.get('SESSION_TIMEOUT_HOURS', default_config['session_timeout_hours'])),
        "max_login_attempts": int(os.environ.get('MAX_LOGIN_ATTEMPTS', default_config['max_login_attempts'])),
        "lockout_minutes": int(os.environ.get('LOCKOUT_MINUTES', default_config['lockout_minutes']))
    }

    return config

CONFIG = load_config()

# Хранилище сессий и rate limiting (в памяти)
sessions = {}  # {token: {'created': datetime, 'expires': datetime}}
sessions_lock = threading.Lock()  # Lock для безопасного доступа к sessions
login_attempts = {}  # {ip: {'count': int, 'lockout_until': datetime}}
upload_attempts = {}  # {ip: {'count': int, 'window_start': datetime}}
file_locks = {}  # {filename: threading.Lock()}
file_locks_lock = threading.Lock()

# Rate limiting настройки для uploads
UPLOAD_RATE_LIMIT = 10  # Максимум загрузок
UPLOAD_RATE_WINDOW = 60  # За период в секундах

# CORS настройки
ALLOWED_ORIGINS = {
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://saysbarbers.ru',
    'https://www.saysbarbers.ru'
}


def cleanup_expired_data():
    """Очистка устаревших сессий и попыток входа (thread-safe)."""
    now = datetime.now()

    # Очистка истёкших сессий (с блокировкой)
    with sessions_lock:
        expired_tokens = [
            token for token, session in sessions.items()
            if now > session['expires']
        ]
        for token in expired_tokens:
            del sessions[token]

    # Очистка старых записей login_attempts (старше 24 часов)
    cutoff = now - timedelta(hours=24)
    old_ips = [
        ip for ip, attempt in login_attempts.items()
        if 'lockout_until' in attempt and attempt['lockout_until'] < cutoff
    ]
    for ip in old_ips:
        del login_attempts[ip]

    # Очистка старых записей upload_attempts
    upload_window = now - timedelta(seconds=UPLOAD_RATE_WINDOW * 2)
    old_upload_ips = [
        ip for ip, attempt in upload_attempts.items()
        if attempt.get('window_start', now) < upload_window
    ]
    for ip in old_upload_ips:
        del upload_attempts[ip]


def generate_token():
    """Генерация криптографически стойкого токена."""
    return hashlib.sha256(f"{uuid.uuid4().hex}{datetime.now().isoformat()}".encode()).hexdigest()


def hash_password(password, salt=None):
    """Хеширование пароля с использованием PBKDF2-SHA256."""
    if salt is None:
        salt = os.urandom(16)
    elif isinstance(salt, str):
        salt = bytes.fromhex(salt)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return salt.hex() + ':' + key.hex()


def verify_password(password, stored_password):
    """
    Проверка пароля. Поддерживает:
    - Хешированные пароли (формат: salt:hash)
    - Plaintext пароли (для обратной совместимости)
    """
    if ':' in stored_password and len(stored_password) > 70:
        # Хешированный пароль
        try:
            salt_hex, _ = stored_password.split(':', 1)
            return hash_password(password, salt_hex) == stored_password
        except (ValueError, TypeError):
            return False
    else:
        # Plaintext пароль (deprecated, для обратной совместимости)
        return password == stored_password


def validate_token(token):
    """Проверка валидности токена (thread-safe)."""
    # Периодическая очистка устаревших данных (при каждой проверке токена)
    cleanup_expired_data()

    if not token:
        return False

    with sessions_lock:
        if token not in sessions:
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
    # Расширенный список опасных расширений
    dangerous_ext = [
        '.py', '.sh', '.exe', '.bat', '.cmd', '.php', '.js', '.html',
        '.jsp', '.aspx', '.asp', '.cgi', '.pl', '.phtml', '.phar',
        '.htaccess', '.htpasswd', '.config', '.ini', '.env',
        '.rb', '.erb', '.lua', '.ps1', '.vbs', '.wsf'
    ]
    if any(filename.lower().endswith(ext) for ext in dangerous_ext):
        return False
    return True


# Magic bytes для проверки типа файла
IMAGE_SIGNATURES = {
    b'\x89PNG\r\n\x1a\n': 'png',
    b'\xff\xd8\xff': 'jpg',
    b'GIF87a': 'gif',
    b'GIF89a': 'gif',
    b'RIFF': 'webp',  # Начало WEBP (после RIFF идёт размер и WEBP)
}


def validate_image_bytes(image_bytes):
    """Проверка magic bytes изображения. Возвращает (is_valid, detected_extension)."""
    if len(image_bytes) < 12:
        return False, None

    # Проверяем PNG
    if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return True, 'png'

    # Проверяем JPEG (начинается с FF D8 FF)
    if image_bytes[:3] == b'\xff\xd8\xff':
        return True, 'jpg'

    # Проверяем GIF
    if image_bytes[:6] in (b'GIF87a', b'GIF89a'):
        return True, 'gif'

    # Проверяем WebP (RIFF....WEBP)
    if image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
        return True, 'webp'

    return False, None


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

# ID prefixes for different entity types
ID_PREFIXES = {
    'master': 'master_',
    'article': 'article_',
    'product': 'product_',
    'category': 'category_',
    'legal': 'legal_',
    'faq': 'faq_',
    'service': ''  # Services use numeric IDs
}


def is_valid_id(id_value, entity_type):
    """
    Validate ID format for the given entity type.
    IDs should match pattern: prefix_timestamp(_random)?
    """
    if not id_value or not isinstance(id_value, str):
        return False

    prefix = ID_PREFIXES.get(entity_type, '')

    # Services use numeric IDs
    if entity_type == 'service':
        try:
            int(id_value)
            return True
        except (ValueError, TypeError):
            return False

    # Check prefix
    if prefix and not id_value.startswith(prefix):
        return False

    # Check format: only alphanumeric and underscores allowed
    if not re.match(r'^[a-z]+_[0-9]+(_[a-z0-9]+)?$', id_value):
        return False

    return True


def validate_master(data):
    """Валидация данных мастера."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    # Validate ID if provided
    master_id = data.get('id')
    if master_id and not is_valid_id(master_id, 'master'):
        return False, "Invalid ID format"

    name = data.get('name', '')
    if not name or not isinstance(name, str) or len(name) > 100:
        return False, "Invalid or missing name"

    # Защита от XSS - запрещаем HTML теги в имени
    if contains_html_chars(name):
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
            # Проверка на Infinity и NaN
            if isinstance(price, float) and (price != price or price == float('inf') or price == float('-inf')):
                return False, f"Invalid {price_key} value"

    return True, None


def contains_html_chars(text):
    """Проверка наличия HTML символов в тексте."""
    if not isinstance(text, str):
        return True
    # Проверяем на наличие HTML тегов и других опасных паттернов
    dangerous_patterns = ['<', '>', '&lt;', '&gt;', 'javascript:', 'data:', 'vbscript:']
    text_lower = text.lower()
    return any(pattern in text_lower for pattern in dangerous_patterns)


def is_valid_slug(slug):
    """Проверка валидности slug (только буквы, цифры, дефис)."""
    if not slug or not isinstance(slug, str):
        return False
    if len(slug) > 100:
        return False
    # Slug может содержать только a-z, 0-9, дефис
    return bool(re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', slug))


def check_upload_rate_limit(ip):
    """Проверка rate limiting для загрузок."""
    now = datetime.now()

    if ip not in upload_attempts:
        upload_attempts[ip] = {'count': 1, 'window_start': now}
        return True

    attempt = upload_attempts[ip]
    window_start = attempt.get('window_start', now)

    # Если окно истекло, сбрасываем счётчик
    if (now - window_start).total_seconds() > UPLOAD_RATE_WINDOW:
        upload_attempts[ip] = {'count': 1, 'window_start': now}
        return True

    # Проверяем лимит
    if attempt['count'] >= UPLOAD_RATE_LIMIT:
        return False

    # Увеличиваем счётчик
    upload_attempts[ip]['count'] += 1
    return True


def sanitize_html_content(text):
    """
    Простая санитизация HTML контента.
    Удаляет опасные теги и атрибуты.
    """
    if not text:
        return text

    # Удаляем script теги
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем style теги
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем iframe
    text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем object/embed
    text = re.sub(r'<object[^>]*>.*?</object>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<embed[^>]*/?>', '', text, flags=re.IGNORECASE)
    # Удаляем svg теги (XSS через onload)
    text = re.sub(r'<svg[^>]*>.*?</svg>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем math теги
    text = re.sub(r'<math[^>]*>.*?</math>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем base теги (могут изменить базовый URL)
    text = re.sub(r'<base[^>]*/?>', '', text, flags=re.IGNORECASE)
    # Удаляем опасные атрибуты (onclick, onerror, etc.)
    text = re.sub(r'\s+on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+on\w+\s*=\s*\S+', '', text, flags=re.IGNORECASE)
    # Удаляем javascript: в href/src
    text = re.sub(r'(href|src)\s*=\s*["\']?\s*javascript:[^"\'>\s]*', r'\1=""', text, flags=re.IGNORECASE)
    text = re.sub(r'(href|src)\s*=\s*["\']?\s*data:[^"\'>\s]*', r'\1=""', text, flags=re.IGNORECASE)

    return text


def validate_article(data):
    """Валидация данных статьи."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    # Validate ID if provided
    article_id = data.get('id')
    if article_id and not is_valid_id(article_id, 'article'):
        return False, "Invalid ID format"

    title = data.get('title', '')
    if not title or not isinstance(title, str) or len(title) > 500:
        return False, "Invalid or missing title"

    # Защита от XSS в заголовке
    if contains_html_chars(title):
        return False, "Invalid characters in title"

    content = data.get('content', '')
    if len(content) > 100000:  # 100KB max
        return False, "Content too long"

    # Санитизируем контент
    if content:
        data['content'] = sanitize_html_content(content)

    # Санитизируем excerpt если есть
    excerpt = data.get('excerpt', '')
    if excerpt:
        data['excerpt'] = sanitize_html_content(excerpt)

    return True, None


def validate_faq(data):
    """Валидация FAQ."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    # Validate ID if provided
    faq_id = data.get('id')
    if faq_id and not is_valid_id(faq_id, 'faq'):
        return False, "Invalid ID format"

    question = data.get('question', '')
    if not question or not isinstance(question, str) or len(question) > 500:
        return False, "Invalid or missing question"

    # Защита от XSS в вопросе
    if contains_html_chars(question):
        return False, "Invalid characters in question"

    answer = data.get('answer', '')
    if len(answer) > 10000:
        return False, "Answer too long"

    # Защита от XSS в ответе
    if contains_html_chars(answer):
        return False, "Invalid characters in answer"

    return True, None


def validate_principle(data):
    """Валидация принципа качества."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    title = data.get('title', '')
    if not title or not isinstance(title, str) or len(title) > 200:
        return False, "Invalid or missing title"

    # Защита от XSS
    if contains_html_chars(title):
        return False, "Invalid characters in title"

    description = data.get('description', '')
    if len(description) > 1000:
        return False, "Description too long"

    if contains_html_chars(description):
        return False, "Invalid characters in description"

    return True, None


def validate_product(data):
    """Валидация данных товара."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    # Validate ID if provided
    product_id = data.get('id')
    if product_id and not is_valid_id(product_id, 'product'):
        return False, "Invalid ID format"

    name = data.get('name', '')
    if not name or not isinstance(name, str) or len(name) > 200:
        return False, "Invalid or missing name"

    # Защита от XSS в названии
    if contains_html_chars(name):
        return False, "Invalid characters in name"

    # Валидация статуса
    status = data.get('status', 'active')
    if status not in ['active', 'inactive', 'draft']:
        return False, "Invalid status. Must be 'active', 'inactive', or 'draft'"

    # Валидация цены
    price = data.get('price')
    if price is not None:
        if not isinstance(price, (int, float)) or price < 0 or price > 10000000:
            return False, "Invalid price"
        # Проверка на Infinity и NaN
        if isinstance(price, float) and (price != price or price == float('inf') or price == float('-inf')):
            return False, "Invalid price value"

    # Валидация categoryId
    category_id = data.get('categoryId', '')
    if category_id and not is_valid_id(category_id, 'category'):
        return False, "Invalid categoryId format"

    # Санитизируем описание если есть
    description = data.get('description', '')
    if description:
        if len(description) > 10000:
            return False, "Description too long"
        data['description'] = sanitize_html_content(description)

    return True, None


def validate_category(data):
    """Валидация данных категории."""
    if not isinstance(data, dict):
        return False, "Invalid data format"

    # Validate ID if provided
    category_id = data.get('id')
    if category_id and not is_valid_id(category_id, 'category'):
        return False, "Invalid ID format"

    name = data.get('name', '')
    if not name or not isinstance(name, str) or len(name) > 100:
        return False, "Invalid or missing name"

    # Защита от XSS
    if contains_html_chars(name):
        return False, "Invalid characters in name"

    # Валидация slug
    slug = data.get('slug', '')
    if slug and not is_valid_slug(slug):
        return False, "Invalid slug format"

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

    # Типы файлов для gzip сжатия
    COMPRESSIBLE_TYPES = {'.html', '.css', '.js', '.json', '.svg', '.xml', '.txt'}
    # Типы файлов для долгого кеширования (1 неделя)
    CACHEABLE_EXTENSIONS = {'.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.woff', '.woff2', '.ttf', '.eot'}

    def send_response_with_gzip(self, content, content_type='text/html; charset=utf-8'):
        """Отправка ответа с gzip сжатием если клиент поддерживает."""
        accept_encoding = self.headers.get('Accept-Encoding', '')
        use_gzip = 'gzip' in accept_encoding and len(content) > 1024

        if use_gzip:
            buf = io.BytesIO()
            with gzip.GzipFile(fileobj=buf, mode='wb') as gz:
                gz.write(content if isinstance(content, bytes) else content.encode('utf-8'))
            compressed = buf.getvalue()

            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Content-Length', len(compressed))
            self.end_headers()
            self.wfile.write(compressed)
        else:
            data = content if isinstance(content, bytes) else content.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)

    def get_cache_header(self):
        """Определяет правильный Cache-Control заголовок для запроса."""
        path = self.path.split('?')[0]  # Убираем query string
        ext = os.path.splitext(path)[1].lower()

        # API запросы - без кеша
        if path.startswith('/api/'):
            return 'no-store, no-cache, must-revalidate'

        # Статические ресурсы - кеш на неделю
        if ext in self.CACHEABLE_EXTENSIONS:
            return 'public, max-age=604800, immutable'

        # HTML - без кеша, всегда проверять актуальность
        if ext == '.html' or path in ('/', ''):
            return 'no-cache, must-revalidate'

        # Прочее - короткий кеш
        return 'public, max-age=300, must-revalidate'

    def get_cors_origin(self):
        """Получение разрешённого CORS origin."""
        origin = self.headers.get('Origin', '')
        if origin in ALLOWED_ORIGINS:
            return origin
        # Для локальной разработки разрешаем localhost с любым портом
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
        elif path == '/api/legal':
            self.handle_get_data('legal.json')
        elif path.startswith('/api/legal/'):
            slug = path.split('/')[-1]
            self.handle_get_legal_document(slug)
        # Shop API
        elif path == '/api/shop/categories':
            self.handle_get_data('shop-categories.json')
        elif path == '/api/shop/products':
            self.handle_get_products()
        elif path.startswith('/api/shop/products/'):
            product_id = path.split('/')[-1]
            self.handle_get_product(product_id)
        # Public files (robots.txt, sitemap.xml, etc.)
        elif path in ('/robots.txt', '/sitemap.xml', '/favicon.ico'):
            self.path = '/public' + path
            return super().do_GET()
        # Legal page routing
        elif path == '/legal' or path.startswith('/legal/'):
            self.path = '/legal.html'
            return super().do_GET()
        # Shop page routing
        elif path == '/shop' or path.startswith('/shop/'):
            self.path = '/shop.html'
            return super().do_GET()
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
        elif path == '/api/shop/categories':
            self.handle_save_data('shop-categories.json')
        elif path == '/api/shop/products':
            self.handle_save_data('products.json')
        elif path == '/api/legal':
            self.handle_save_data('legal.json')
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

            if CONFIG['admin_password'] and verify_password(password, CONFIG['admin_password']):
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
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

    def handle_logout(self):
        """Выход из системы."""
        try:
            token = self.get_auth_token()
            if token and token in sessions:
                del sessions[token]
            self.send_json_response({'success': True, 'message': 'Logged out'})
        except Exception as e:
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

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
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

    def handle_get_products(self):
        """Получение товаров с фильтрацией по категории"""
        try:
            # Парсим query параметры
            parsed = urlparse(self.path)
            query = parse_qs(parsed.query)
            category_slug = query.get('category', [None])[0]

            filepath = DATA_DIR / 'products.json'
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                products = data.get('products', [])
            else:
                products = []

            # Фильтрация по категории
            if category_slug and category_slug != 'all':
                cat_filepath = DATA_DIR / 'shop-categories.json'
                if cat_filepath.exists():
                    with open(cat_filepath, 'r', encoding='utf-8') as f:
                        cat_data = json.load(f)
                    category = next(
                        (c for c in cat_data.get('categories', [])
                         if c.get('slug') == category_slug),
                        None
                    )
                    if category:
                        products = [p for p in products
                                   if p.get('categoryId') == category.get('id')]

            # Фильтруем только активные для публичного API
            products = [p for p in products if p.get('status') == 'active']

            self.send_json_response({'products': products})
        except Exception as e:
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

    def handle_get_product(self, product_id):
        """Получение одного товара по ID"""
        try:
            filepath = DATA_DIR / 'products.json'
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                product = next(
                    (p for p in data.get('products', []) if p.get('id') == product_id),
                    None
                )

                if product:
                    self.send_json_response(product)
                else:
                    self.send_error_response(404, 'Product not found')
            else:
                self.send_error_response(404, 'Product not found')
        except Exception as e:
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

    def handle_get_legal_document(self, slug):
        """Получение одного юридического документа по slug"""
        try:
            # Валидация slug параметра
            if not is_valid_slug(slug):
                self.send_error_response(400, 'Invalid slug format')
                return

            filepath = DATA_DIR / 'legal.json'
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                document = next(
                    (d for d in data.get('documents', [])
                     if d.get('slug') == slug and d.get('active', True)),
                    None
                )

                if document:
                    self.send_json_response(document)
                else:
                    self.send_error_response(404, 'Document not found')
            else:
                self.send_error_response(404, 'Document not found')
        except Exception as e:
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

    def handle_save_data(self, filename):
        """Сохранение данных в JSON файл с блокировкой и атомарной записью."""
        lock = get_file_lock(filename)
        with lock:
            try:
                content_length = int(self.headers['Content-Length'])

                # Лимит размера POST данных (5MB для JSON, синхронизировано с ui.maxImageSize)
                max_post_size = 5 * 1024 * 1024
                if content_length > max_post_size:
                    self.send_error_response(413, 'Request too large. Max size is 5MB.')
                    return

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
                print(f"Server error: {e}")  # Логируем для отладки
                self.send_error_response(500, 'Internal server error')

    def handle_upload(self):
        """Загрузка изображений с ограничением размера и валидацией типа."""
        try:
            # Rate limiting для загрузок
            ip = self.get_client_ip()
            if not check_upload_rate_limit(ip):
                self.send_error_response(429, 'Too many uploads. Please wait and try again.')
                return

            content_length = int(self.headers['Content-Length'])

            # Ограничение размера (5MB max - синхронизировано с config.json)
            max_upload_size = 5 * 1024 * 1024
            if content_length > max_upload_size:
                self.send_error_response(413, 'File too large. Max size is 5MB.')
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            # Декодируем base64 изображение
            image_data = data.get('image', '')
            if ',' in image_data:
                # Убираем data:image/...;base64, prefix
                _, image_data = image_data.split(',', 1)

            # Декодируем и валидируем изображение
            try:
                image_bytes = base64.b64decode(image_data)
            except Exception:
                self.send_error_response(400, 'Invalid base64 data')
                return

            # Проверяем magic bytes для определения реального типа файла
            is_valid, detected_ext = validate_image_bytes(image_bytes)
            if not is_valid:
                self.send_error_response(400, 'Invalid image format. Only PNG, JPG, GIF, WebP allowed.')
                return

            # Используем расширение, определённое по magic bytes
            ext = detected_ext

            # Генерируем уникальное имя файла
            filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = UPLOADS_DIR / filename

            # Сохраняем файл
            with open(filepath, 'wb') as f:
                f.write(image_bytes)

            self.send_json_response({
                'success': True,
                'filename': filename,
                'url': f'/uploads/{filename}'
            })
        except Exception as e:
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

    def handle_delete_upload(self, filename):
        """Удаление загруженного файла с защитой от Path Traversal."""
        try:
            # Проверка имени файла (защита от Path Traversal)
            if not is_valid_filename(filename):
                self.send_error_response(400, 'Invalid filename')
                return

            filepath = (UPLOADS_DIR / filename).resolve()

            # Проверка что путь внутри UPLOADS_DIR (Python 3.8 совместимость)
            try:
                filepath.relative_to(UPLOADS_DIR.resolve())
            except ValueError:
                self.send_error_response(403, 'Access denied')
                return

            # Используем try/except вместо exists() для избежания TOCTOU
            try:
                filepath.unlink()
                self.send_json_response({'success': True, 'message': 'Файл удалён'})
            except FileNotFoundError:
                self.send_error_response(404, 'Файл не найден')
        except Exception as e:
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

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
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

    def handle_record_visit(self):
        """Запись посещения или просмотра секции (с атомарной записью)"""
        filepath = DATA_DIR / 'stats.json'
        lock = get_file_lock('stats.json')

        try:
            # Читаем данные запроса
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                visit_data = json.loads(post_data.decode('utf-8'))
            else:
                visit_data = {}

            with lock:  # Thread-safe блокировка
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

                # Атомарная запись через временный файл
                temp_filepath = filepath.with_suffix('.tmp')
                with open(temp_filepath, 'w', encoding='utf-8') as f:
                    json.dump(stats, f, ensure_ascii=False, indent=2)
                temp_filepath.replace(filepath)

            self.send_json_response({'success': True})
        except Exception as e:
            # Удаляем временный файл при ошибке
            temp_filepath = filepath.with_suffix('.tmp')
            if temp_filepath.exists():
                temp_filepath.unlink()
            print(f"Server error: {e}")  # Логируем для отладки
            self.send_error_response(500, 'Internal server error')

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
