"""
Integration tests — E2E сценарии через test server
"""

import pytest
import json
import sys
import urllib.request
import urllib.error
import base64
import threading
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from server.handler import AdminAPIHandler, CONFIG, storage, session_manager, login_limiter
    from server.auth import generate_token
    SERVER_IMPORTS_OK = True
except ImportError as e:
    print(f"Warning: Could not import server modules: {e}")
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
            body = response.read().decode('utf-8')
            return {
                'status': response.status,
                'data': json.loads(body) if body else {},
                'headers': dict(response.headers)
            }
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8') if e.read else ''
        return {
            'status': e.code,
            'data': json.loads(body) if body else {},
            'headers': dict(e.headers) if e.headers else {}
        }
    except urllib.error.URLError as e:
        return {'status': 0, 'error': str(e)}


def get_auth_token():
    """Create a valid session token."""
    return session_manager.create()


# =============================================================================
# Integration scenarios
# =============================================================================

class TestLoginCrudLogout:
    """E2E: login → CRUD → logout"""

    def test_login_create_get_logout(self, test_server_url, mock_data_dir, clean_sessions, clean_login_attempts):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        original = CONFIG.get('admin_password')
        CONFIG['admin_password'] = 'integration_test'

        try:
            # Login
            resp = make_request(
                f'{test_server_url}/api/auth/login',
                method='POST',
                data={'password': 'integration_test'}
            )
            assert resp['status'] == 200
            token = resp['data']['token']

            # Create master
            resp = make_request(
                f'{test_server_url}/api/masters',
                method='POST',
                data={'masters': [{'id': 'master_1234567890', 'name': 'Интеграционный', 'badge': 'green'}]},
                headers={'Authorization': f'Bearer {token}'}
            )
            assert resp['status'] == 200

            # GET masters
            resp = make_request(f'{test_server_url}/api/masters')
            assert resp['status'] == 200

            # Logout
            resp = make_request(
                f'{test_server_url}/api/auth/logout',
                method='POST',
                headers={'Authorization': f'Bearer {token}'}
            )
            assert resp['status'] == 200

            # POST after logout should fail
            resp = make_request(
                f'{test_server_url}/api/masters',
                method='POST',
                data={'masters': []},
                headers={'Authorization': f'Bearer {token}'}
            )
            assert resp['status'] == 401
        finally:
            CONFIG['admin_password'] = original


class TestStatsRecording:
    """E2E: stats visit recording"""

    def test_stats_recording(self, test_server_url, mock_data_dir):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Record visit
        resp = make_request(
            f'{test_server_url}/api/stats/visit',
            method='POST',
            data={'type': 'pageview', 'session_id': 'integration_session'}
        )
        assert resp['status'] == 200

        # Get stats
        resp = make_request(f'{test_server_url}/api/stats')
        assert resp['status'] == 200
        assert resp['data'].get('total_views', 0) >= 1


class TestLegalSlugFlow:
    """E2E: create legal → get by slug"""

    def test_legal_slug_flow(self, test_server_url, mock_data_dir, clean_sessions):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = get_auth_token()

        # Save legal document
        resp = make_request(
            f'{test_server_url}/api/legal',
            method='POST',
            data={
                'documents': [
                    {'id': 'legal_1234567890', 'slug': 'privacy', 'title': 'Privacy', 'content': '<p>Text</p>', 'active': True}
                ]
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        assert resp['status'] == 200

        # Get by slug
        resp = make_request(f'{test_server_url}/api/legal/privacy')
        assert resp['status'] == 200
        assert resp['data']['slug'] == 'privacy'


class TestXSSPrevention:
    """E2E: XSS prevention"""

    def test_xss_in_master_name_rejected(self, test_server_url, mock_data_dir, clean_sessions):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = get_auth_token()

        resp = make_request(
            f'{test_server_url}/api/masters',
            method='POST',
            data={'masters': [{'id': 'master_1234567890', 'name': '<script>alert(1)</script>', 'badge': 'green'}]},
            headers={'Authorization': f'Bearer {token}'}
        )
        assert resp['status'] == 400


class TestInvalidInput:
    """E2E: invalid input handling"""

    def test_invalid_json_body(self, test_server_url, clean_sessions):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = get_auth_token()

        req = urllib.request.Request(
            f'{test_server_url}/api/masters',
            data=b'this is not json',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )
        try:
            urllib.request.urlopen(req, timeout=5)
            pytest.fail("Should have returned error")
        except urllib.error.HTTPError as e:
            assert e.code == 400

    def test_unknown_endpoint_404(self, test_server_url):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        resp = make_request(
            f'{test_server_url}/api/nonexistent',
            method='DELETE'
        )
        assert resp['status'] == 404


class TestSaveAllResourceTypes:
    """E2E: save all resource types"""

    def test_save_all_resources(self, test_server_url, mock_data_dir, clean_sessions):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = get_auth_token()
        headers = {'Authorization': f'Bearer {token}'}

        resources = {
            '/api/masters': {'masters': [{'id': 'master_1234567890', 'name': 'Test', 'badge': 'green'}]},
            '/api/services': {'services': [{'name': 'Стрижка', 'priceGreen': 1000}]},
            '/api/articles': {'articles': [{'id': 'article_1234567890', 'title': 'Test'}]},
            '/api/faq': {'items': [{'id': 'faq_1234567890', 'question': 'Test?', 'answer': 'Yes'}]},
            '/api/social': {'social': [{'id': 'social_1', 'type': 'vk', 'url': 'https://vk.com'}]},
            '/api/legal': {'documents': [{'id': 'legal_1234567890', 'slug': 'terms', 'title': 'Terms'}]},
            '/api/shop/categories': {'categories': [{'id': 'category_1234567890', 'name': 'Hair', 'slug': 'hair'}]},
        }

        for endpoint, data in resources.items():
            resp = make_request(
                f'{test_server_url}{endpoint}',
                method='POST',
                data=data,
                headers=headers
            )
            assert resp['status'] == 200, f"Failed to save {endpoint}: {resp.get('data', {})}"


class TestProductFiltering:
    """E2E: product category filtering"""

    def test_product_filtering_by_category(self, test_server_url, mock_data_dir, clean_sessions):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = get_auth_token()
        headers = {'Authorization': f'Bearer {token}'}

        # Save categories
        make_request(
            f'{test_server_url}/api/shop/categories',
            method='POST',
            data={'categories': [
                {'id': 'category_1234567890', 'name': 'Hair', 'slug': 'hair'},
                {'id': 'category_9876543210', 'name': 'Beard', 'slug': 'beard'}
            ]},
            headers=headers
        )

        # Save products
        make_request(
            f'{test_server_url}/api/shop/products',
            method='POST',
            data={'products': [
                {'id': 'product_1', 'name': 'Shampoo', 'categoryId': 'category_1234567890', 'status': 'active', 'price': 500},
                {'id': 'product_2', 'name': 'Oil', 'categoryId': 'category_9876543210', 'status': 'active', 'price': 700},
                {'id': 'product_3', 'name': 'Draft', 'categoryId': 'category_1234567890', 'status': 'draft', 'price': 300}
            ]},
            headers=headers
        )

        # Filter by category
        resp = make_request(f'{test_server_url}/api/shop/products?category=hair')
        assert resp['status'] == 200
        products = resp['data'].get('products', [])
        # Should only return active products from 'hair' category
        assert len(products) == 1
        assert products[0]['name'] == 'Shampoo'

        # Get all active
        resp = make_request(f'{test_server_url}/api/shop/products')
        assert resp['status'] == 200
        all_products = resp['data'].get('products', [])
        assert len(all_products) == 2  # Only active ones


class TestSessionExpiry:
    """E2E: session expiry"""

    def test_expired_session_returns_401(self, test_server_url, mock_data_dir, clean_sessions):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Create expired token manually
        token = generate_token()
        session_manager._sessions[token] = {
            'created': datetime.now() - timedelta(hours=48),
            'expires': datetime.now() - timedelta(hours=24)
        }

        resp = make_request(
            f'{test_server_url}/api/masters',
            method='POST',
            data={'masters': []},
            headers={'Authorization': f'Bearer {token}'}
        )
        assert resp['status'] == 401


class TestConcurrentSaves:
    """E2E: concurrent saves"""

    def test_concurrent_saves_consistent(self, test_server_url, mock_data_dir, clean_sessions):
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = get_auth_token()
        headers = {'Authorization': f'Bearer {token}'}
        results = []
        errors = []

        def save_data(i):
            try:
                resp = make_request(
                    f'{test_server_url}/api/faq',
                    method='POST',
                    data={'items': [{'id': f'faq_{i}234567890', 'question': f'Q{i}?', 'answer': f'A{i}'}]},
                    headers=headers
                )
                results.append(resp['status'])
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=save_data, args=(i,)) for i in range(3)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=10)

        assert len(errors) == 0, f"Errors: {errors}"
        assert all(s == 200 for s in results), f"Not all 200: {results}"
