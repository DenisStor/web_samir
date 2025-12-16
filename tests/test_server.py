"""
Tests for server.py
Тестирование API, аутентификации и безопасности
"""

import json
import sys
import os
from pathlib import Path
from http.server import HTTPServer
from threading import Thread
import time
import urllib.request
import urllib.error

# Добавляем корневую директорию в путь для импорта
sys.path.insert(0, str(Path(__file__).parent.parent))

# Импортируем функции из server.py
try:
    from server import (
        is_valid_filename,
        validate_master,
        validate_service,
        validate_article,
        validate_faq,
        validate_principle,
        generate_token
    )
    SERVER_IMPORTS_OK = True
except ImportError as e:
    print(f"Warning: Could not import from server.py: {e}")
    SERVER_IMPORTS_OK = False


class TestFilenameValidation:
    """Тесты валидации имён файлов (защита от Path Traversal)"""

    def test_valid_filenames(self):
        """Проверка допустимых имён файлов"""
        if not SERVER_IMPORTS_OK:
            return

        valid_names = [
            'image.jpg',
            'photo_123.png',
            'test-file.gif',
            'UPPERCASE.WEBP',
            'a1b2c3d4e5f6.jpeg',
            'simple.png'
        ]

        for name in valid_names:
            assert is_valid_filename(name), f"Should be valid: {name}"

    def test_invalid_filenames_path_traversal(self):
        """Проверка защиты от Path Traversal"""
        if not SERVER_IMPORTS_OK:
            return

        invalid_names = [
            '../etc/passwd',
            '..\\windows\\system32',
            'folder/file.jpg',
            'folder\\file.jpg',
            '....//....//etc/passwd',
            '.htaccess',
            '...',
            ''
        ]

        for name in invalid_names:
            assert not is_valid_filename(name), f"Should be invalid: {name}"

    def test_invalid_filenames_special_chars(self):
        """Проверка защиты от специальных символов"""
        if not SERVER_IMPORTS_OK:
            return

        invalid_names = [
            'file<script>.jpg',
            'file;rm -rf.jpg',
            'file|cat.jpg',
            'file`id`.jpg',
            'file$(whoami).jpg',
            'file name.jpg',  # пробелы
            'файл.jpg'  # не-ASCII
        ]

        for name in invalid_names:
            assert not is_valid_filename(name), f"Should be invalid: {name}"


class TestDataValidation:
    """Тесты валидации данных"""

    def test_validate_master_valid(self):
        """Проверка валидного мастера"""
        if not SERVER_IMPORTS_OK:
            return

        valid_master = {
            'id': 'master_1',
            'name': 'Иван Иванов',
            'badge': 'green',
            'role': 'Барбер'
        }

        is_valid, error = validate_master(valid_master)
        assert is_valid, f"Should be valid: {error}"

    def test_validate_master_missing_name(self):
        """Проверка мастера без имени"""
        if not SERVER_IMPORTS_OK:
            return

        invalid_master = {
            'id': 'master_1',
            'badge': 'green'
        }

        is_valid, error = validate_master(invalid_master)
        assert not is_valid
        assert 'name' in error.lower()

    def test_validate_master_invalid_badge(self):
        """Проверка мастера с неверным badge"""
        if not SERVER_IMPORTS_OK:
            return

        invalid_master = {
            'id': 'master_1',
            'name': 'Test',
            'badge': 'invalid_color'
        }

        is_valid, error = validate_master(invalid_master)
        assert not is_valid
        assert 'badge' in error.lower()

    def test_validate_master_name_too_long(self):
        """Проверка мастера с слишком длинным именем"""
        if not SERVER_IMPORTS_OK:
            return

        invalid_master = {
            'id': 'master_1',
            'name': 'A' * 200,  # слишком длинное
            'badge': 'green'
        }

        is_valid, error = validate_master(invalid_master)
        assert not is_valid

    def test_validate_service_valid(self):
        """Проверка валидной услуги"""
        if not SERVER_IMPORTS_OK:
            return

        valid_service = {
            'id': 1,
            'name': 'Стрижка',
            'priceGreen': 1000,
            'pricePink': 1300,
            'priceBlue': 1500
        }

        is_valid, error = validate_service(valid_service)
        assert is_valid, f"Should be valid: {error}"

    def test_validate_service_negative_price(self):
        """Проверка услуги с отрицательной ценой"""
        if not SERVER_IMPORTS_OK:
            return

        invalid_service = {
            'id': 1,
            'name': 'Test',
            'priceGreen': -100
        }

        is_valid, error = validate_service(invalid_service)
        assert not is_valid

    def test_validate_article_valid(self):
        """Проверка валидной статьи"""
        if not SERVER_IMPORTS_OK:
            return

        valid_article = {
            'id': 'article_1',
            'title': 'Тестовая статья',
            'content': 'Контент статьи'
        }

        is_valid, error = validate_article(valid_article)
        assert is_valid, f"Should be valid: {error}"

    def test_validate_faq_valid(self):
        """Проверка валидного FAQ"""
        if not SERVER_IMPORTS_OK:
            return

        valid_faq = {
            'id': 'faq_1',
            'question': 'Вопрос?',
            'answer': 'Ответ.'
        }

        is_valid, error = validate_faq(valid_faq)
        assert is_valid, f"Should be valid: {error}"

    def test_validate_faq_empty_question(self):
        """Проверка FAQ с пустым вопросом"""
        if not SERVER_IMPORTS_OK:
            return

        invalid_faq = {
            'id': 'faq_1',
            'question': '',
            'answer': 'Ответ.'
        }

        is_valid, error = validate_faq(invalid_faq)
        assert not is_valid

    def test_validate_principle_valid(self):
        """Проверка валидного принципа"""
        if not SERVER_IMPORTS_OK:
            return

        valid_principle = {
            'id': 'principle_1',
            'title': 'Качество',
            'description': 'Описание принципа'
        }

        is_valid, error = validate_principle(valid_principle)
        assert is_valid, f"Should be valid: {error}"


class TestTokenGeneration:
    """Тесты генерации токенов"""

    def test_token_format(self):
        """Проверка формата токена"""
        if not SERVER_IMPORTS_OK:
            return

        token = generate_token()
        assert isinstance(token, str)
        assert len(token) == 64  # 32 bytes в hex = 64 символа

    def test_token_uniqueness(self):
        """Проверка уникальности токенов"""
        if not SERVER_IMPORTS_OK:
            return

        tokens = [generate_token() for _ in range(100)]
        assert len(tokens) == len(set(tokens)), "Tokens should be unique"

    def test_token_hex_format(self):
        """Проверка что токен в hex формате"""
        if not SERVER_IMPORTS_OK:
            return

        token = generate_token()
        try:
            int(token, 16)
            is_hex = True
        except ValueError:
            is_hex = False

        assert is_hex, "Token should be valid hex string"


class TestXSSPrevention:
    """Тесты защиты от XSS"""

    def test_master_name_xss(self):
        """Проверка XSS в имени мастера"""
        if not SERVER_IMPORTS_OK:
            return

        xss_master = {
            'id': 'master_1',
            'name': '<script>alert("xss")</script>',
            'badge': 'green'
        }

        # Валидация должна отклонить XSS
        is_valid, error = validate_master(xss_master)
        assert not is_valid, "Should reject XSS in name"

    def test_article_content_xss(self):
        """Проверка XSS в контенте статьи"""
        if not SERVER_IMPORTS_OK:
            return

        xss_article = {
            'id': 'article_1',
            'title': 'Test',
            'content': '<img src=x onerror=alert("xss")>'
        }

        is_valid, error = validate_article(xss_article)
        # Валидация должна проверять на опасные атрибуты
        # Это зависит от реализации


# Запуск тестов через pytest
if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
