"""
Pytest configuration and fixtures
"""

import pytest
import sys
import os
import json
import base64
import tempfile
import threading
import time
from pathlib import Path
from http.server import HTTPServer
from datetime import datetime, timedelta
from unittest.mock import patch
import urllib.request
import urllib.error

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


# =============================================================================
# BASIC DATA FIXTURES
# =============================================================================

@pytest.fixture
def sample_master():
    """Sample valid master data"""
    return {
        'id': 'master_test',
        'name': 'Тестовый Мастер',
        'initial': 'Т',
        'badge': 'green',
        'role': 'Барбер',
        'specialization': 'Классические стрижки',
        'principles': ['Качество', 'Скорость'],
        'photo': None,
        'active': True
    }


@pytest.fixture
def sample_service():
    """Sample valid service data"""
    return {
        'id': 1,
        'name': 'Мужская стрижка',
        'priceGreen': 1000,
        'pricePink': 1300,
        'priceBlue': 1500
    }


@pytest.fixture
def sample_article():
    """Sample valid article data"""
    return {
        'id': 'article_test',
        'title': 'Тестовая статья',
        'tag': 'Уход',
        'date': '2024-01-15',
        'excerpt': 'Краткое описание',
        'content': '<p>Полный текст статьи</p>',
        'image': None,
        'active': True
    }


@pytest.fixture
def sample_faq():
    """Sample valid FAQ data"""
    return {
        'id': 'faq_test',
        'question': 'Как записаться?',
        'answer': 'Позвоните нам или оставьте заявку на сайте.'
    }


@pytest.fixture
def sample_product():
    """Sample valid product data"""
    return {
        'id': 'product_test_123',
        'name': 'Тестовый товар',
        'description': 'Описание тестового товара',
        'price': 1500,
        'categoryId': 'category_test',
        'images': ['/uploads/test.jpg'],
        'status': 'active',
        'order': 1
    }


@pytest.fixture
def sample_category():
    """Sample valid category data"""
    return {
        'id': 'category_test',
        'name': 'Тестовая категория',
        'slug': 'test-category',
        'order': 1
    }


@pytest.fixture
def sample_legal_document():
    """Sample valid legal document data"""
    return {
        'id': 'legal_test',
        'slug': 'privacy',
        'title': 'Политика конфиденциальности',
        'content': '<h2>Заголовок</h2><p>Содержание документа</p>',
        'active': True
    }


# =============================================================================
# IMAGE FIXTURES (Valid magic bytes for different formats)
# =============================================================================

@pytest.fixture
def valid_png_bytes():
    """Minimal valid 1x1 PNG image bytes"""
    # Minimal 1x1 red PNG (68 bytes)
    return base64.b64decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
    )


@pytest.fixture
def valid_jpeg_bytes():
    """Minimal valid JPEG image bytes"""
    # Minimal 1x1 white JPEG
    return base64.b64decode(
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a'
        'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy'
        'MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIA'
        'AhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEB'
        'AQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=='
    )


@pytest.fixture
def valid_gif_bytes():
    """Minimal valid GIF image bytes"""
    # Minimal 1x1 transparent GIF
    return base64.b64decode(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    )


@pytest.fixture
def valid_webp_bytes():
    """Minimal valid WebP image bytes"""
    # Minimal 1x1 WebP (26 bytes)
    return bytes([
        0x52, 0x49, 0x46, 0x46,  # RIFF
        0x1A, 0x00, 0x00, 0x00,  # File size - 8
        0x57, 0x45, 0x42, 0x50,  # WEBP
        0x56, 0x50, 0x38, 0x4C,  # VP8L
        0x0D, 0x00, 0x00, 0x00,  # Chunk size
        0x2F, 0x00, 0x00, 0x00,  # Signature
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ])


@pytest.fixture
def invalid_image_bytes():
    """Invalid file bytes (not an image)"""
    return b'This is not an image file at all!'


@pytest.fixture
def valid_png_base64():
    """Valid PNG as base64 data URL"""
    png_bytes = base64.b64decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
    )
    return 'data:image/png;base64,' + base64.b64encode(png_bytes).decode()


# =============================================================================
# AUTHENTICATION FIXTURES
# =============================================================================

@pytest.fixture
def test_password():
    """Test password for authentication tests"""
    return 'test_password_123'


@pytest.fixture
def auth_token(test_server_url, test_password):
    """Get valid auth token from test server"""
    from server import generate_token, session_manager, CONFIG

    # Store original password and set test password
    original_password = CONFIG.get('admin_password')
    CONFIG['admin_password'] = test_password

    # Generate token directly via session_manager
    token = session_manager.create()

    yield token

    # Cleanup
    session_manager.delete(token)
    CONFIG['admin_password'] = original_password


@pytest.fixture
def expired_token():
    """Generate an expired token for testing"""
    from server import generate_token, sessions

    token = generate_token()
    sessions[token] = {
        'created': datetime.now() - timedelta(hours=48),
        'expires': datetime.now() - timedelta(hours=24)  # Expired 24 hours ago
    }

    yield token

    if token in sessions:
        del sessions[token]


# =============================================================================
# SERVER FIXTURES
# =============================================================================

@pytest.fixture(scope='function')
def test_server():
    """HTTP server for integration tests"""
    from server import AdminAPIHandler

    # Find available port
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        port = s.getsockname()[1]

    http_server = HTTPServer(('localhost', port), AdminAPIHandler)
    thread = threading.Thread(target=http_server.serve_forever)
    thread.daemon = True
    thread.start()

    yield http_server

    http_server.shutdown()


@pytest.fixture
def test_server_url(test_server):
    """URL of the test server"""
    return f'http://localhost:{test_server.server_address[1]}'


# =============================================================================
# TEMPORARY FILE/DIRECTORY FIXTURES
# =============================================================================

@pytest.fixture
def temp_data_dir(tmp_path):
    """Temporary data directory for tests"""
    data_dir = tmp_path / 'data'
    data_dir.mkdir()
    return data_dir


@pytest.fixture
def temp_uploads_dir(tmp_path):
    """Temporary uploads directory for tests"""
    uploads_dir = tmp_path / 'uploads'
    uploads_dir.mkdir()
    return uploads_dir


@pytest.fixture
def mock_data_dir(temp_data_dir, monkeypatch):
    """Mock storage with temp Database instance.

    Returns the Database instance. Use db.write('file.json', data) to seed test data.
    """
    from server.database import Database
    import server.handler as handler_module
    db = Database(db_path=str(temp_data_dir / 'test.db'))
    monkeypatch.setattr(handler_module, 'DATA_DIR', temp_data_dir)
    monkeypatch.setattr(handler_module, 'storage', db)
    return db


@pytest.fixture
def mock_uploads_dir(temp_uploads_dir, monkeypatch):
    """Mock the UPLOADS_DIR to use temp directory"""
    import server.handler as handler_module
    monkeypatch.setattr(handler_module, 'UPLOADS_DIR', temp_uploads_dir)
    return temp_uploads_dir


# =============================================================================
# RATE LIMITING FIXTURES
# =============================================================================

@pytest.fixture
def clean_login_attempts():
    """Clear login attempts before and after test"""
    from server import login_limiter
    login_limiter._attempts.clear()
    yield login_limiter._attempts
    login_limiter._attempts.clear()


@pytest.fixture
def clean_sessions():
    """Clear sessions before and after test"""
    from server import session_manager
    session_manager._sessions.clear()
    yield session_manager._sessions
    session_manager._sessions.clear()


# =============================================================================
# ISOLATED COMPONENT FIXTURES
# =============================================================================

@pytest.fixture
def isolated_database(tmp_path):
    """Isolated Database for unit tests"""
    from server.database import Database
    return Database(db_path=str(tmp_path / 'test.db'))


@pytest.fixture
def isolated_session_manager():
    """Isolated SessionManager for unit tests"""
    from server.auth import SessionManager
    return SessionManager(timeout_hours=1)


@pytest.fixture
def isolated_rate_limiter():
    """Isolated RateLimiter for unit tests"""
    from server.auth import RateLimiter
    return RateLimiter(max_attempts=3, lockout_minutes=1)


@pytest.fixture
def isolated_upload_limiter():
    """Isolated UploadRateLimiter for unit tests"""
    from server.auth import UploadRateLimiter
    return UploadRateLimiter(max_uploads=3, window_seconds=10)


@pytest.fixture
def sample_social_data():
    """Sample social data"""
    return {
        'social': [
            {'id': 'social_1', 'type': 'telegram', 'url': 'https://t.me/test'}
        ],
        'phone': '+7 999 123-45-67',
        'email': 'test@example.com',
        'address': 'ул. Тестовая, д. 1'
    }
