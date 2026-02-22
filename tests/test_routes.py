"""
Tests for server/routes.py — Route, Router, create_api_router
"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.routes import Route, Router, create_api_router


# =============================================================================
# Route
# =============================================================================

class TestRouteCompile:
    """Route._compile_pattern tests"""

    def test_compile_simple_path(self):
        route = Route('/api/masters', 'handler')
        assert route._regex.match('/api/masters')
        assert not route._regex.match('/api/masters/')
        assert not route._regex.match('/api/services')

    def test_compile_path_with_param(self):
        route = Route('/api/legal/{slug}', 'handler')
        m = route._regex.match('/api/legal/privacy')
        assert m is not None
        assert m.group('slug') == 'privacy'

    def test_compile_multiple_params(self):
        route = Route('/api/{type}/{id}', 'handler')
        m = route._regex.match('/api/masters/123')
        assert m is not None
        assert m.group('type') == 'masters'
        assert m.group('id') == '123'


class TestRouteMatch:
    """Route.match tests"""

    def test_match_correct_method(self):
        route = Route('/api/masters', 'handler', methods=['GET'])
        result = route.match('/api/masters', 'GET')
        assert result == {}

    def test_match_wrong_method(self):
        route = Route('/api/masters', 'handler', methods=['GET'])
        result = route.match('/api/masters', 'POST')
        assert result is None

    def test_match_param_extraction(self):
        route = Route('/api/legal/{slug}', 'handler', methods=['GET'])
        result = route.match('/api/legal/privacy', 'GET')
        assert result == {'slug': 'privacy'}

    def test_match_no_match(self):
        route = Route('/api/masters', 'handler', methods=['GET'])
        result = route.match('/api/unknown', 'GET')
        assert result is None

    def test_match_with_context(self):
        route = Route('/api/masters', 'handler', methods=['GET'],
                       context={'resource': 'masters'})
        result = route.match('/api/masters', 'GET')
        assert result == {'resource': 'masters'}

    def test_match_context_merged_with_params(self):
        route = Route('/api/{type}/{id}', 'handler', methods=['GET'],
                       context={'extra': 'value'})
        result = route.match('/api/masters/123', 'GET')
        assert result == {'type': 'masters', 'id': '123', 'extra': 'value'}

    def test_match_multiple_methods(self):
        route = Route('/api/masters', 'handler', methods=['GET', 'POST'])
        assert route.match('/api/masters', 'GET') is not None
        assert route.match('/api/masters', 'POST') is not None
        assert route.match('/api/masters', 'DELETE') is None


# =============================================================================
# Router
# =============================================================================

class TestRouter:
    """Router tests"""

    def test_resolve_known_endpoint(self):
        router = Router()
        router.get('/api/masters', 'handle_masters')
        handler, params, auth = router.resolve('/api/masters', 'GET')
        assert handler == 'handle_masters'
        assert params == {}
        assert auth is False

    def test_resolve_param_endpoint(self):
        router = Router()
        router.get('/api/legal/{slug}', 'handle_legal')
        handler, params, auth = router.resolve('/api/legal/privacy', 'GET')
        assert handler == 'handle_legal'
        assert params == {'slug': 'privacy'}

    def test_resolve_unknown_returns_none(self):
        router = Router()
        router.get('/api/masters', 'handler')
        handler, params, auth = router.resolve('/api/xyz', 'GET')
        assert handler is None
        assert params is None
        assert auth is None

    def test_resolve_auth_required_flag(self):
        router = Router()
        router.post('/api/masters', 'handler', auth_required=True)
        handler, params, auth = router.resolve('/api/masters', 'POST')
        assert auth is True

    def test_resolve_public_endpoint(self):
        router = Router()
        router.get('/api/masters', 'handler')
        _, _, auth = router.resolve('/api/masters', 'GET')
        assert auth is False

    def test_get_shortcut(self):
        router = Router()
        result = router.get('/test', 'handler')
        assert result is router  # returns self for chaining
        handler, _, _ = router.resolve('/test', 'GET')
        assert handler == 'handler'

    def test_post_shortcut(self):
        router = Router()
        router.post('/test', 'handler')
        handler, _, _ = router.resolve('/test', 'POST')
        assert handler == 'handler'

    def test_put_shortcut(self):
        router = Router()
        router.put('/test', 'handler')
        handler, _, _ = router.resolve('/test', 'PUT')
        assert handler == 'handler'

    def test_delete_shortcut(self):
        router = Router()
        router.delete('/test', 'handler')
        handler, _, _ = router.resolve('/test', 'DELETE')
        assert handler == 'handler'

    def test_first_match_wins(self):
        router = Router()
        router.get('/api/masters', 'first_handler')
        router.get('/api/masters', 'second_handler')
        handler, _, _ = router.resolve('/api/masters', 'GET')
        assert handler == 'first_handler'


# =============================================================================
# create_api_router
# =============================================================================

class TestCreateApiRouter:
    """create_api_router tests"""

    @pytest.fixture
    def api_router(self):
        return create_api_router()

    def test_all_generic_resources_registered(self, api_router):
        resources = ['masters', 'services', 'articles', 'faq',
                     'social', 'legal', 'shop/categories']
        for res in resources:
            handler, params, _ = api_router.resolve(f'/api/{res}', 'GET')
            assert handler == 'handle_generic_get', f"GET /api/{res} not registered"
            handler, params, auth = api_router.resolve(f'/api/{res}', 'POST')
            assert handler == 'handle_generic_save', f"POST /api/{res} not registered"
            assert auth is True

    def test_auth_endpoints_registered(self, api_router):
        handler, _, _ = api_router.resolve('/api/auth/login', 'POST')
        assert handler == 'handle_login'
        handler, _, _ = api_router.resolve('/api/auth/logout', 'POST')
        assert handler == 'handle_logout'
        handler, _, _ = api_router.resolve('/api/auth/check', 'POST')
        assert handler == 'handle_auth_check'

    def test_shop_product_endpoints(self, api_router):
        handler, _, _ = api_router.resolve('/api/shop/products', 'GET')
        assert handler == 'handle_get_products'
        handler, params, _ = api_router.resolve('/api/shop/products/prod_123', 'GET')
        assert handler == 'handle_get_product'
        assert params['id'] == 'prod_123'
        handler, _, auth = api_router.resolve('/api/shop/products', 'POST')
        assert handler == 'handle_generic_save'
        assert auth is True

    def test_upload_endpoints(self, api_router):
        handler, _, auth = api_router.resolve('/api/upload', 'POST')
        assert handler == 'handle_upload'
        assert auth is True
        handler, params, auth = api_router.resolve('/api/upload/test.jpg', 'DELETE')
        assert handler == 'handle_delete_upload'
        assert params['filename'] == 'test.jpg'
        assert auth is True

    def test_legal_slug_endpoint(self, api_router):
        handler, params, _ = api_router.resolve('/api/legal/privacy', 'GET')
        assert handler == 'handle_get_legal_document'
        assert params['slug'] == 'privacy'

    def test_stats_endpoints(self, api_router):
        handler, _, _ = api_router.resolve('/api/stats', 'GET')
        assert handler == 'handle_get_stats'
        handler, _, _ = api_router.resolve('/api/stats/visit', 'POST')
        assert handler == 'handle_record_visit'

    def test_unknown_endpoint_returns_none(self, api_router):
        handler, _, _ = api_router.resolve('/api/nonexistent', 'GET')
        assert handler is None
