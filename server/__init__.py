"""
Say's Barbers Server Package.
HTTP сервер с REST API для админ-панели.
"""

from .handler import (
    AdminAPIHandler,
    load_env_file,
    load_config,
    build_html,
    main,
    CONFIG,
    DATA_DIR,
    UPLOADS_DIR,
    storage,
    session_manager,
    login_limiter,
    upload_limiter,
    router,
    ALLOWED_ORIGINS,
)

from .auth import (
    generate_token,
    hash_password,
    verify_password,
    SessionManager,
    RateLimiter,
    UploadRateLimiter,
)

from .storage import (
    JSONStorage,
    Repository,
    get_storage,
    atomic_write_json,
)

from .validators import (
    is_valid_slug,
    is_valid_id,
    is_valid_filename,
    validate_image_bytes,
    contains_html_chars,
    sanitize_html_content,
    SchemaValidator,
    validate_master,
    validate_service,
    validate_article,
    validate_faq,
    validate_product,
    validate_category,
    validate_principle,
)

from .routes import (
    Route,
    Router,
    get_router,
    create_api_router,
)

# Алиасы для обратной совместимости с тестами
sessions = session_manager._sessions
login_attempts = login_limiter._attempts


def validate_token(token):
    """Проверка валидности токена (алиас для обратной совместимости)."""
    return session_manager.validate(token)


def check_rate_limit(ip):
    """Проверка rate limit (алиас для обратной совместимости)."""
    return login_limiter.check(ip)


def record_login_attempt(ip, success):
    """Запись попытки логина (алиас для обратной совместимости)."""
    return login_limiter.record(ip, success)


def get_file_lock(filename):
    """Получение блокировки для файла (алиас для обратной совместимости)."""
    return storage._get_lock(filename)


__all__ = [
    # Handler
    'AdminAPIHandler',
    'main',
    'build_html',
    'load_env_file',
    'load_config',
    'CONFIG',
    'DATA_DIR',
    'UPLOADS_DIR',
    'storage',
    'session_manager',
    'login_limiter',
    'upload_limiter',
    'router',
    'ALLOWED_ORIGINS',

    # Auth
    'generate_token',
    'hash_password',
    'verify_password',
    'SessionManager',
    'RateLimiter',
    'UploadRateLimiter',

    # Storage
    'JSONStorage',
    'Repository',
    'get_storage',
    'atomic_write_json',

    # Validators
    'is_valid_slug',
    'is_valid_id',
    'is_valid_filename',
    'validate_image_bytes',
    'contains_html_chars',
    'sanitize_html_content',
    'SchemaValidator',
    'validate_master',
    'validate_service',
    'validate_article',
    'validate_faq',
    'validate_product',
    'validate_category',
    'validate_principle',

    # Routes
    'Route',
    'Router',
    'get_router',
    'create_api_router',

    # Backward compatibility
    'sessions',
    'login_attempts',
    'validate_token',
    'check_rate_limit',
    'record_login_attempt',
    'get_file_lock',
]
