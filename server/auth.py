"""
Модуль аутентификации для Say's Barbers API.
Thread-safe управление сессиями и rate limiting.
"""

import hashlib
import os
import uuid
import threading
from datetime import datetime, timedelta


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
        try:
            salt_hex, _ = stored_password.split(':', 1)
            return hash_password(password, salt_hex) == stored_password
        except (ValueError, TypeError):
            return False
    else:
        return password == stored_password


class SessionManager:
    """Thread-safe управление сессиями."""

    def __init__(self, timeout_hours=24):
        self._sessions = {}
        self._lock = threading.Lock()
        self.timeout_hours = timeout_hours

    def create(self):
        """Создание новой сессии. Возвращает токен."""
        token = generate_token()
        now = datetime.now()
        with self._lock:
            self._sessions[token] = {
                'created': now,
                'expires': now + timedelta(hours=self.timeout_hours)
            }
        return token

    def validate(self, token):
        """Проверка валидности токена."""
        if not token:
            return False
        with self._lock:
            if token not in self._sessions:
                return False
            session = self._sessions[token]
            if datetime.now() > session['expires']:
                del self._sessions[token]
                return False
            # Очистка истёкших токенов
            now = datetime.now()
            expired = [t for t, s in self._sessions.items() if now > s['expires']]
            for t in expired:
                del self._sessions[t]
            return True

    def get(self, token):
        """Получение данных сессии."""
        with self._lock:
            return self._sessions.get(token)

    def delete(self, token):
        """Удаление сессии."""
        with self._lock:
            if token in self._sessions:
                del self._sessions[token]
                return True
            return False

    def cleanup_expired(self):
        """Очистка истёкших сессий."""
        now = datetime.now()
        with self._lock:
            expired = [
                token for token, session in self._sessions.items()
                if now > session['expires']
            ]
            for token in expired:
                del self._sessions[token]
            return len(expired)

    def get_remaining_time(self, token):
        """Получение оставшегося времени сессии в секундах."""
        with self._lock:
            session = self._sessions.get(token)
            if session:
                remaining = (session['expires'] - datetime.now()).total_seconds()
                return int(remaining) if remaining > 0 else 0
            return 0


class RateLimiter:
    """Thread-safe rate limiter для защиты от брутфорса."""

    def __init__(self, max_attempts=5, lockout_minutes=15):
        self._attempts = {}
        self._lock = threading.Lock()
        self.max_attempts = max_attempts
        self.lockout_minutes = lockout_minutes

    def check(self, ip):
        """Проверка можно ли делать попытку с данного IP."""
        with self._lock:
            if ip not in self._attempts:
                return True
            attempt = self._attempts[ip]
            if 'lockout_until' in attempt:
                if datetime.now() < attempt['lockout_until']:
                    return False
                # Сброс после окончания блокировки
                self._attempts[ip] = {'count': 0}
            return True

    def record(self, ip, success):
        """Запись попытки."""
        with self._lock:
            if ip not in self._attempts:
                self._attempts[ip] = {'count': 0}

            if success:
                self._attempts[ip] = {'count': 0}
            else:
                self._attempts[ip]['count'] += 1
                if self._attempts[ip]['count'] >= self.max_attempts:
                    self._attempts[ip]['lockout_until'] = datetime.now() + timedelta(minutes=self.lockout_minutes)

    def get_lockout_remaining(self, ip):
        """Получение оставшегося времени блокировки в секундах."""
        with self._lock:
            attempt = self._attempts.get(ip)
            if attempt and 'lockout_until' in attempt:
                remaining = (attempt['lockout_until'] - datetime.now()).total_seconds()
                return int(remaining) if remaining > 0 else 0
            return 0

    def cleanup_old(self, hours=24):
        """Очистка старых записей."""
        cutoff = datetime.now() - timedelta(hours=hours)
        with self._lock:
            old_ips = [
                ip for ip, attempt in self._attempts.items()
                if 'lockout_until' in attempt and attempt['lockout_until'] < cutoff
            ]
            for ip in old_ips:
                del self._attempts[ip]
            return len(old_ips)


class UploadRateLimiter:
    """Thread-safe rate limiter для загрузок файлов."""

    def __init__(self, max_uploads=10, window_seconds=60):
        self._attempts = {}
        self._lock = threading.Lock()
        self.max_uploads = max_uploads
        self.window_seconds = window_seconds

    def check(self, ip):
        """Проверка и запись попытки загрузки. Возвращает True если разрешено."""
        now = datetime.now()
        with self._lock:
            if ip not in self._attempts:
                self._attempts[ip] = {'count': 1, 'window_start': now}
                return True

            attempt = self._attempts[ip]
            window_start = attempt.get('window_start', now)

            # Если окно истекло, сбрасываем
            if (now - window_start).total_seconds() > self.window_seconds:
                self._attempts[ip] = {'count': 1, 'window_start': now}
                return True

            # Проверяем лимит
            if attempt['count'] >= self.max_uploads:
                return False

            # Увеличиваем счётчик
            self._attempts[ip]['count'] += 1
            return True

    def cleanup_old(self):
        """Очистка старых записей."""
        now = datetime.now()
        window = timedelta(seconds=self.window_seconds * 2)
        with self._lock:
            old_ips = [
                ip for ip, attempt in self._attempts.items()
                if attempt.get('window_start', now) < now - window
            ]
            for ip in old_ips:
                del self._attempts[ip]
            return len(old_ips)
