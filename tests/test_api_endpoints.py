"""
Tests for API endpoints in server.py
Тестирование REST API, аутентификации эндпоинтов и обработки данных
"""

import pytest
import json
import sys
import urllib.request
import urllib.error
import base64
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from server import (
        AdminAPIHandler,
        sessions,
        login_attempts,
        CONFIG,
        generate_token,
        DATA_DIR,
        UPLOADS_DIR,
    )
    SERVER_IMPORTS_OK = True
except ImportError as e:
    print(f"Warning: Could not import from server: {e}")
    SERVER_IMPORTS_OK = False


def make_request(url, method='GET', data=None, headers=None, timeout=5):
    """Helper function to make HTTP requests"""
    headers = headers or {}
    if data is not None:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return {
                'status': response.status,
                'data': json.loads(response.read().decode('utf-8')),
                'headers': dict(response.headers)
            }
    except urllib.error.HTTPError as e:
        return {
            'status': e.code,
            'data': json.loads(e.read().decode('utf-8')) if e.read else {},
            'headers': dict(e.headers) if e.headers else {}
        }
    except urllib.error.URLError as e:
        return {'status': 0, 'error': str(e)}


# =============================================================================
# AUTH ENDPOINTS
# =============================================================================

class TestAuthLogin:
    """Tests for POST /api/auth/login"""

    def test_login_success(self, test_server_url, clean_sessions, clean_login_attempts):
        """Should return token on successful login"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        original_password = CONFIG.get('admin_password')
        CONFIG['admin_password'] = 'test_password'

        try:
            response = make_request(
                f'{test_server_url}/api/auth/login',
                method='POST',
                data={'password': 'test_password'}
            )

            assert response['status'] == 200
            assert response['data'].get('success') is True
            assert 'token' in response['data']
            assert len(response['data']['token']) == 64
        finally:
            CONFIG['admin_password'] = original_password

    def test_login_invalid_password(self, test_server_url, clean_sessions, clean_login_attempts):
        """Should reject invalid password"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        response = make_request(
            f'{test_server_url}/api/auth/login',
            method='POST',
            data={'password': 'definitely_wrong_password_12345'}
        )

        assert response['status'] == 401
        assert response['data'].get('success') is False

    def test_login_rate_limit(self, test_server_url, clean_sessions, clean_login_attempts):
        """Should enforce rate limiting after multiple failed attempts"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Exceed rate limit
        max_attempts = CONFIG.get('max_login_attempts', 5)
        for _ in range(max_attempts + 1):
            make_request(
                f'{test_server_url}/api/auth/login',
                method='POST',
                data={'password': 'wrong_password'}
            )

        # Next attempt should be rate limited
        response = make_request(
            f'{test_server_url}/api/auth/login',
            method='POST',
            data={'password': 'any_password'}
        )

        assert response['status'] == 429

    def test_login_empty_body(self, test_server_url, clean_sessions, clean_login_attempts):
        """Should handle missing request body"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        req = urllib.request.Request(
            f'{test_server_url}/api/auth/login',
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                pass
        except urllib.error.HTTPError as e:
            assert e.code in [400, 401]


class TestAuthLogout:
    """Tests for POST /api/auth/logout"""

    def test_logout_with_token(self, test_server_url, clean_sessions):
        """Should logout successfully with valid token"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Create a session
        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        response = make_request(
            f'{test_server_url}/api/auth/logout',
            method='POST',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response['status'] == 200
        assert response['data'].get('success') is True
        assert token not in sessions

    def test_logout_without_token(self, test_server_url, clean_sessions):
        """Should succeed even without token"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        response = make_request(
            f'{test_server_url}/api/auth/logout',
            method='POST'
        )

        assert response['status'] == 200


class TestAuthCheck:
    """Tests for POST /api/auth/check"""

    def test_check_valid_token(self, test_server_url, clean_sessions):
        """Should return valid=true for valid token"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        response = make_request(
            f'{test_server_url}/api/auth/check',
            method='POST',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response['status'] == 200
        assert response['data'].get('valid') is True
        assert 'expires_in' in response['data']

    def test_check_expired_token(self, test_server_url, clean_sessions):
        """Should return valid=false for expired token"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now() - timedelta(hours=48),
            'expires': datetime.now() - timedelta(hours=24)
        }

        response = make_request(
            f'{test_server_url}/api/auth/check',
            method='POST',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response['status'] == 200
        assert response['data'].get('valid') is False

    def test_check_missing_token(self, test_server_url, clean_sessions):
        """Should return valid=false for missing token"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        response = make_request(
            f'{test_server_url}/api/auth/check',
            method='POST'
        )

        assert response['status'] == 200
        assert response['data'].get('valid') is False


# =============================================================================
# DATA GET ENDPOINTS
# =============================================================================

class TestGetMasters:
    """Tests for GET /api/masters"""

    def test_get_masters(self, test_server_url, mock_data_dir):
        """Should return masters data"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Create test data
        mock_data_dir.write('masters.json', {'masters': [{'id': 'master_1', 'name': 'Test Master'}]})

        response = make_request(f'{test_server_url}/api/masters')

        assert response['status'] == 200

    def test_get_masters_empty(self, test_server_url, mock_data_dir):
        """Should return empty object when file doesn't exist"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        response = make_request(f'{test_server_url}/api/masters')

        assert response['status'] == 200


class TestGetServices:
    """Tests for GET /api/services"""

    def test_get_services(self, test_server_url, mock_data_dir):
        """Should return services data with categories and podology"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        test_data = {
            'categories': [{'id': 'main', 'name': 'Основные услуги'}],
            'podology': {'title': 'Подология', 'description': '', 'categories': []}
        }
        mock_data_dir.write('services.json', test_data)

        response = make_request(f'{test_server_url}/api/services')

        assert response['status'] == 200


class TestGetArticles:
    """Tests for GET /api/articles"""

    def test_get_articles(self, test_server_url, mock_data_dir):
        """Should return articles list"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('articles.json', {'articles': [{'id': 'article_1', 'title': 'Test Article'}]})

        response = make_request(f'{test_server_url}/api/articles')

        assert response['status'] == 200


class TestGetFaq:
    """Tests for GET /api/faq"""

    def test_get_faq(self, test_server_url, mock_data_dir):
        """Should return FAQ list"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('faq.json', {'faq': [{'id': 'faq_1', 'question': 'Test?', 'answer': 'Answer'}]})

        response = make_request(f'{test_server_url}/api/faq')

        assert response['status'] == 200


class TestGetLegal:
    """Tests for GET /api/legal and GET /api/legal/{slug}"""

    def test_get_all_legal(self, test_server_url, mock_data_dir):
        """Should return all legal documents"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('legal.json', {
            'documents': [
                {'id': 'legal_1', 'slug': 'privacy', 'title': 'Privacy', 'active': True}
            ]
        })

        response = make_request(f'{test_server_url}/api/legal')

        assert response['status'] == 200

    def test_get_legal_by_slug(self, test_server_url, mock_data_dir):
        """Should return specific legal document by slug"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('legal.json', {
            'documents': [
                {'id': 'legal_1', 'slug': 'privacy', 'title': 'Privacy Policy', 'active': True}
            ]
        })

        response = make_request(f'{test_server_url}/api/legal/privacy')

        assert response['status'] == 200
        assert response['data'].get('slug') == 'privacy'

    def test_get_legal_not_found(self, test_server_url, mock_data_dir):
        """Should return 404 for non-existent document"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('legal.json', {'documents': []})

        response = make_request(f'{test_server_url}/api/legal/nonexistent')

        assert response['status'] == 404


# =============================================================================
# SHOP ENDPOINTS
# =============================================================================

class TestGetShopCategories:
    """Tests for GET /api/shop/categories"""

    def test_get_categories(self, test_server_url, mock_data_dir):
        """Should return shop categories"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('shop-categories.json', {'categories': [{'id': 'cat_1', 'name': 'Category 1'}]})

        response = make_request(f'{test_server_url}/api/shop/categories')

        assert response['status'] == 200


class TestGetProducts:
    """Tests for GET /api/shop/products"""

    def test_get_all_products(self, test_server_url, mock_data_dir):
        """Should return active products"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('products.json', {
            'products': [
                {'id': 'prod_1', 'name': 'Product 1', 'status': 'active', 'categoryId': ''},
                {'id': 'prod_2', 'name': 'Product 2', 'status': 'draft', 'categoryId': ''}
            ]
        })

        response = make_request(f'{test_server_url}/api/shop/products')

        assert response['status'] == 200
        # Should only return active products
        assert len(response['data'].get('products', [])) == 1

    def test_get_products_by_category(self, test_server_url, mock_data_dir):
        """Should filter products by category"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('shop-categories.json', {'categories': [{'id': 'cat_1', 'slug': 'hair-care'}]})
        mock_data_dir.write('products.json', {
            'products': [
                {'id': 'prod_1', 'categoryId': 'cat_1', 'status': 'active'},
                {'id': 'prod_2', 'categoryId': 'cat_2', 'status': 'active'}
            ]
        })

        response = make_request(f'{test_server_url}/api/shop/products?category=hair-care')

        assert response['status'] == 200


class TestGetProductById:
    """Tests for GET /api/shop/products/{id}"""

    def test_get_product_by_id(self, test_server_url, mock_data_dir):
        """Should return single product by ID"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('products.json', {
            'products': [
                {'id': 'prod_1', 'name': 'Product 1', 'status': 'active', 'categoryId': ''}
            ]
        })

        response = make_request(f'{test_server_url}/api/shop/products/prod_1')

        assert response['status'] == 200
        assert response['data'].get('id') == 'prod_1'

    def test_get_product_not_found(self, test_server_url, mock_data_dir):
        """Should return 404 for non-existent product"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('products.json', {'products': []})

        response = make_request(f'{test_server_url}/api/shop/products/nonexistent')

        assert response['status'] == 404


# =============================================================================
# PROTECTED ENDPOINTS (POST)
# =============================================================================

class TestProtectedEndpoints:
    """Tests for protected POST endpoints requiring authentication"""

    def test_post_without_auth(self, test_server_url):
        """Should reject POST without authentication"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        endpoints = [
            '/api/masters',
            '/api/services',
            '/api/articles',
            '/api/faq',
            '/api/upload'
        ]

        for endpoint in endpoints:
            response = make_request(
                f'{test_server_url}{endpoint}',
                method='POST',
                data={'test': 'data'}
            )
            assert response['status'] == 401, f"Endpoint {endpoint} should require auth"

    def test_post_with_auth(self, test_server_url, mock_data_dir, clean_sessions):
        """Should accept POST with valid authentication"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Create valid token
        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        response = make_request(
            f'{test_server_url}/api/masters',
            method='POST',
            data={'masters': [{'id': 'master_1', 'name': 'Test', 'initial': 'T', 'badge': 'green', 'role': 'Барбер'}]},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response['status'] == 200
        assert response['data'].get('success') is True


class TestUploadEndpoint:
    """Tests for POST /api/upload"""

    def test_upload_valid_png(self, test_server_url, mock_uploads_dir, clean_sessions, valid_png_base64):
        """Should accept valid PNG upload"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        response = make_request(
            f'{test_server_url}/api/upload',
            method='POST',
            data={
                'image': valid_png_base64,
                'filename': 'test.png'
            },
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response['status'] == 200
        assert response['data'].get('success') is True
        assert 'url' in response['data']
        assert response['data']['url'].endswith('.png')

    def test_upload_invalid_format(self, test_server_url, mock_uploads_dir, clean_sessions):
        """Should reject invalid image format"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        # Create invalid base64 (not an image)
        invalid_base64 = 'data:image/png;base64,' + base64.b64encode(b'not an image').decode()

        response = make_request(
            f'{test_server_url}/api/upload',
            method='POST',
            data={'image': invalid_base64},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response['status'] == 400


class TestDeleteUpload:
    """Tests for DELETE /api/upload/{filename}"""

    def test_delete_existing_file(self, test_server_url, mock_uploads_dir, clean_sessions):
        """Should delete existing file"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Create a test file
        test_file = mock_uploads_dir / 'test123.jpg'
        test_file.write_bytes(b'test content')

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        response = make_request(
            f'{test_server_url}/api/upload/test123.jpg',
            method='DELETE',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response['status'] == 200
        assert not test_file.exists()

    def test_delete_path_traversal(self, test_server_url, mock_uploads_dir, clean_sessions):
        """Should reject path traversal attempts"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        malicious_names = [
            '../etc/passwd',
            '..%2F..%2Fetc/passwd',
            'folder/file.jpg',
            '....//....//etc/passwd'
        ]

        for name in malicious_names:
            response = make_request(
                f'{test_server_url}/api/upload/{name}',
                method='DELETE',
                headers={'Authorization': f'Bearer {token}'}
            )
            assert response['status'] in [400, 403, 404], f"Should block: {name}"

    def test_delete_without_auth(self, test_server_url):
        """Should require authentication for delete"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        response = make_request(
            f'{test_server_url}/api/upload/test.jpg',
            method='DELETE'
        )

        assert response['status'] == 401


# =============================================================================
# STATS ENDPOINTS
# =============================================================================

class TestStatsEndpoints:
    """Tests for stats endpoints"""

    def test_get_stats(self, test_server_url, mock_data_dir):
        """Should return stats data"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('stats.json', {
            'total_views': 100,
            'unique_visitors': 50,
            'daily': {},
            'sessions': {},
            'sections': {}
        })

        response = make_request(f'{test_server_url}/api/stats')

        assert response['status'] == 200
        assert 'total_views' in response['data']

    def test_record_visit(self, test_server_url, mock_data_dir):
        """Should record a visit"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        response = make_request(
            f'{test_server_url}/api/stats/visit',
            method='POST',
            data={'type': 'pageview', 'session_id': 'test_session_123'}
        )

        assert response['status'] == 200
        assert response['data'].get('success') is True


# =============================================================================
# CORS
# =============================================================================

class TestCORS:
    """Tests for CORS handling"""

    def test_options_preflight(self, test_server_url):
        """Should respond 200 to OPTIONS requests"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        req = urllib.request.Request(
            f'{test_server_url}/api/masters',
            method='OPTIONS'
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                assert response.status == 200
        except urllib.error.HTTPError:
            pytest.fail("OPTIONS should return 200")

    def test_cors_allowed_origin(self, test_server_url):
        """Should include CORS headers for allowed origins"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        req = urllib.request.Request(
            f'{test_server_url}/api/masters',
            method='OPTIONS',
            headers={'Origin': 'http://localhost:8000'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            allow_origin = response.headers.get('Access-Control-Allow-Origin', '')
            assert allow_origin == 'http://localhost:8000'


# =============================================================================
# ERROR HANDLING
# =============================================================================

class TestErrorHandling:
    """Tests for error handling in data endpoints"""

    def test_post_invalid_json(self, test_server_url, clean_sessions):
        """Should return 400 for invalid JSON body"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        req = urllib.request.Request(
            f'{test_server_url}/api/masters',
            data=b'not valid json{{{',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )
        try:
            urllib.request.urlopen(req, timeout=5)
        except urllib.error.HTTPError as e:
            assert e.code == 400

    def test_post_array_instead_dict(self, test_server_url, clean_sessions):
        """Should reject non-dict JSON body"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        response = make_request(
            f'{test_server_url}/api/masters',
            method='POST',
            data=[1, 2, 3],
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response['status'] == 400


# =============================================================================
# SOCIAL ENDPOINTS
# =============================================================================

class TestSocialEndpoints:
    """Tests for social data endpoints"""

    def test_get_social(self, test_server_url, mock_data_dir):
        """Should return social data"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        mock_data_dir.write('social.json', {
            'social': [{'id': 'social_1', 'type': 'telegram', 'url': 'https://t.me/test'}],
            'phone': '+7 999 123-45-67'
        })

        response = make_request(f'{test_server_url}/api/social')
        assert response['status'] == 200
        assert 'social' in response['data']

    def test_save_social_with_auth(self, test_server_url, mock_data_dir, clean_sessions):
        """Should save social data with authentication"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        response = make_request(
            f'{test_server_url}/api/social',
            method='POST',
            data={'social': [{'id': 'social_1', 'type': 'vk', 'url': 'https://vk.com/test'}]},
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response['status'] == 200
        assert response['data'].get('success') is True


# Run tests with pytest
if __name__ == '__main__':
    pytest.main([__file__, '-v'])
