"""
Tests for server/handler.py — unit tests without starting server
Tests for get_cache_header, get_cors_origin, RESOURCE_MAP, VALIDATION_MAP
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.handler import AdminAPIHandler, ALLOWED_ORIGINS


def make_mock_handler(path='/', origin=None):
    """Create a mock handler with configurable path and headers."""
    handler = MagicMock(spec=AdminAPIHandler)
    handler.path = path
    headers = {}
    if origin:
        headers['Origin'] = origin
    handler.headers = MagicMock()
    handler.headers.get = lambda key, default='': headers.get(key, default)
    handler.get_cache_header = AdminAPIHandler.get_cache_header.__get__(handler)
    handler.get_cors_origin = AdminAPIHandler.get_cors_origin.__get__(handler)
    handler.CACHEABLE_EXTENSIONS = AdminAPIHandler.CACHEABLE_EXTENSIONS
    return handler


# =============================================================================
# get_cache_header
# =============================================================================

class TestGetCacheHeader:

    def test_api_no_cache(self):
        handler = make_mock_handler('/api/masters')
        result = handler.get_cache_header()
        assert 'no-store' in result

    def test_js_no_cache(self):
        handler = make_mock_handler('/src/js/main.js')
        result = handler.get_cache_header()
        assert 'no-cache' in result

    def test_css_cache_week(self):
        handler = make_mock_handler('/src/css/style.css')
        result = handler.get_cache_header()
        assert 'public' in result
        assert 'max-age=' in result
        assert 'immutable' in result

    def test_image_cache_week(self):
        handler = make_mock_handler('/uploads/photo.jpg')
        result = handler.get_cache_header()
        assert 'public' in result
        assert 'immutable' in result

    def test_webp_cache_week(self):
        handler = make_mock_handler('/uploads/photo.webp')
        result = handler.get_cache_header()
        assert 'public' in result

    def test_html_no_cache(self):
        handler = make_mock_handler('/index.html')
        result = handler.get_cache_header()
        assert 'no-cache' in result

    def test_root_no_cache(self):
        handler = make_mock_handler('/')
        result = handler.get_cache_header()
        assert 'no-cache' in result

    def test_api_with_query_string(self):
        handler = make_mock_handler('/api/shop/products?category=hair')
        result = handler.get_cache_header()
        assert 'no-store' in result


# =============================================================================
# get_cors_origin
# =============================================================================

class TestGetCorsOrigin:

    def test_allowed_origin(self):
        handler = make_mock_handler(origin='http://localhost:8000')
        result = handler.get_cors_origin()
        assert result == 'http://localhost:8000'

    def test_localhost_any_port(self):
        handler = make_mock_handler(origin='http://localhost:3000')
        result = handler.get_cors_origin()
        assert result == 'http://localhost:3000'

    def test_127_any_port(self):
        handler = make_mock_handler(origin='http://127.0.0.1:5000')
        result = handler.get_cors_origin()
        assert result == 'http://127.0.0.1:5000'

    def test_production_origin(self):
        handler = make_mock_handler(origin='https://saysbarbers.ru')
        result = handler.get_cors_origin()
        assert result == 'https://saysbarbers.ru'

    def test_www_production_origin(self):
        handler = make_mock_handler(origin='https://www.saysbarbers.ru')
        result = handler.get_cors_origin()
        assert result == 'https://www.saysbarbers.ru'

    def test_unknown_none(self):
        handler = make_mock_handler(origin='https://evil.com')
        result = handler.get_cors_origin()
        assert result is None

    def test_empty_none(self):
        handler = make_mock_handler(origin='')
        result = handler.get_cors_origin()
        assert result is None

    def test_no_origin_none(self):
        handler = make_mock_handler()
        result = handler.get_cors_origin()
        assert result is None


# =============================================================================
# RESOURCE_MAP
# =============================================================================

class TestResourceMap:

    def test_all_resources_present(self):
        expected = ['masters', 'services', 'articles', 'faq',
                     'social', 'legal', 'shop-categories', 'shop-products']
        for resource in expected:
            assert resource in AdminAPIHandler.RESOURCE_MAP, \
                f"Resource '{resource}' missing from RESOURCE_MAP"

    def test_filenames_end_json(self):
        for resource, filename in AdminAPIHandler.RESOURCE_MAP.items():
            assert filename.endswith('.json'), \
                f"Resource '{resource}' filename '{filename}' must end with .json"

    def test_resource_count(self):
        assert len(AdminAPIHandler.RESOURCE_MAP) == 8


# =============================================================================
# VALIDATION_MAP
# =============================================================================

class TestValidationMap:

    def test_all_schemas_present(self):
        expected_files = [
            'masters.json', 'services.json', 'articles.json',
            'faq.json', 'products.json', 'shop-categories.json'
        ]
        for filename in expected_files:
            assert filename in AdminAPIHandler.VALIDATION_MAP, \
                f"Validation schema for '{filename}' missing"

    def test_validation_map_structure(self):
        for filename, (key, schema) in AdminAPIHandler.VALIDATION_MAP.items():
            assert isinstance(key, str), f"Key for {filename} should be string"
            assert isinstance(schema, dict), f"Schema for {filename} should be dict"

    def test_social_not_in_validation(self):
        assert 'social.json' not in AdminAPIHandler.VALIDATION_MAP

    def test_legal_not_in_validation(self):
        assert 'legal.json' not in AdminAPIHandler.VALIDATION_MAP


# =============================================================================
# ALLOWED_ORIGINS
# =============================================================================

class TestAllowedOrigins:

    def test_contains_localhost(self):
        assert 'http://localhost:8000' in ALLOWED_ORIGINS

    def test_contains_production(self):
        assert 'https://saysbarbers.ru' in ALLOWED_ORIGINS
