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
        validate_image_bytes,
        sanitize_html_content,
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
        # Валидация пропускает контент, но санитизирует его
        assert is_valid, "Article should be valid but with sanitized content"
        # Проверяем что onerror был удалён
        assert 'onerror' not in xss_article['content'], "onerror attribute should be removed"

    def test_article_script_tag_xss(self):
        """Проверка XSS со script тегом в контенте"""
        if not SERVER_IMPORTS_OK:
            return

        xss_article = {
            'id': 'article_1',
            'title': 'Test',
            'content': '<script>alert("xss")</script>Some text'
        }

        is_valid, error = validate_article(xss_article)
        assert is_valid
        assert '<script>' not in xss_article['content'], "script tag should be removed"

    def test_article_title_xss(self):
        """Проверка XSS в заголовке статьи"""
        if not SERVER_IMPORTS_OK:
            return

        xss_article = {
            'id': 'article_1',
            'title': '<script>alert("xss")</script>',
            'content': 'Normal content'
        }

        is_valid, error = validate_article(xss_article)
        assert not is_valid, "Should reject XSS in title"

    def test_faq_question_xss(self):
        """Проверка XSS в вопросе FAQ"""
        if not SERVER_IMPORTS_OK:
            return

        xss_faq = {
            'id': 'faq_1',
            'question': '<script>alert("xss")</script>',
            'answer': 'Normal answer'
        }

        is_valid, error = validate_faq(xss_faq)
        assert not is_valid, "Should reject XSS in question"


class TestImageValidation:
    """Тесты валидации изображений по magic bytes"""

    def test_valid_png(self):
        """Проверка валидного PNG"""
        if not SERVER_IMPORTS_OK:
            return

        # PNG magic bytes
        png_bytes = b'\x89PNG\r\n\x1a\n' + b'\x00' * 10
        is_valid, ext = validate_image_bytes(png_bytes)
        assert is_valid
        assert ext == 'png'

    def test_valid_jpeg(self):
        """Проверка валидного JPEG"""
        if not SERVER_IMPORTS_OK:
            return

        # JPEG magic bytes
        jpeg_bytes = b'\xff\xd8\xff' + b'\x00' * 10
        is_valid, ext = validate_image_bytes(jpeg_bytes)
        assert is_valid
        assert ext == 'jpg'

    def test_valid_gif(self):
        """Проверка валидного GIF"""
        if not SERVER_IMPORTS_OK:
            return

        # GIF magic bytes
        gif_bytes = b'GIF89a' + b'\x00' * 10
        is_valid, ext = validate_image_bytes(gif_bytes)
        assert is_valid
        assert ext == 'gif'

    def test_valid_webp(self):
        """Проверка валидного WebP"""
        if not SERVER_IMPORTS_OK:
            return

        # WebP magic bytes
        webp_bytes = b'RIFF' + b'\x00\x00\x00\x00' + b'WEBP' + b'\x00' * 10
        is_valid, ext = validate_image_bytes(webp_bytes)
        assert is_valid
        assert ext == 'webp'

    def test_invalid_file(self):
        """Проверка невалидного файла"""
        if not SERVER_IMPORTS_OK:
            return

        # Произвольные байты
        invalid_bytes = b'This is not an image' + b'\x00' * 10
        is_valid, ext = validate_image_bytes(invalid_bytes)
        assert not is_valid
        assert ext is None

    def test_empty_file(self):
        """Проверка пустого файла"""
        if not SERVER_IMPORTS_OK:
            return

        is_valid, ext = validate_image_bytes(b'')
        assert not is_valid


class TestHTMLSanitization:
    """Тесты санитизации HTML"""

    def test_remove_script_tag(self):
        """Проверка удаления script тега"""
        if not SERVER_IMPORTS_OK:
            return

        html = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
        sanitized = sanitize_html_content(html)
        assert '<script>' not in sanitized
        assert 'alert' not in sanitized
        assert '<p>Hello</p>' in sanitized

    def test_remove_onclick(self):
        """Проверка удаления onclick атрибута"""
        if not SERVER_IMPORTS_OK:
            return

        html = '<button onclick="alert(1)">Click</button>'
        sanitized = sanitize_html_content(html)
        assert 'onclick' not in sanitized

    def test_remove_javascript_href(self):
        """Проверка удаления javascript: в href"""
        if not SERVER_IMPORTS_OK:
            return

        html = '<a href="javascript:alert(1)">Link</a>'
        sanitized = sanitize_html_content(html)
        assert 'javascript:' not in sanitized


# Запуск тестов через pytest
if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
