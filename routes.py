"""
Модуль маршрутизации для Say's Barbers API.
Декларативное определение маршрутов с поддержкой параметров.
"""

import re


class Route:
    """Маршрут с поддержкой параметров {id}, {slug}."""

    def __init__(self, pattern, handler, methods=None, auth_required=False):
        self.pattern = pattern
        self.handler = handler
        self.methods = methods if methods else ['GET']
        self.auth_required = auth_required
        self._regex = self._compile_pattern(pattern)

    def _compile_pattern(self, pattern):
        """Компилирует паттерн в regex."""
        # Заменяем {param} на именованные группы
        regex_pattern = re.sub(r'\{(\w+)\}', r'(?P<\1>[^/]+)', pattern)
        return re.compile('^' + regex_pattern + '$')

    def match(self, path, method):
        """Проверка соответствия пути и метода."""
        if method not in self.methods:
            return None
        match = self._regex.match(path)
        if match:
            return match.groupdict()
        return None


class Router:
    """Маршрутизатор с поддержкой параметров."""

    def __init__(self):
        self._routes = []

    def add(self, pattern, handler, methods=None, auth_required=False):
        """Добавление маршрута."""
        route = Route(pattern, handler, methods, auth_required)
        self._routes.append(route)
        return self

    def get(self, pattern, handler, auth_required=False):
        """Shortcut для GET маршрута."""
        return self.add(pattern, handler, ['GET'], auth_required)

    def post(self, pattern, handler, auth_required=False):
        """Shortcut для POST маршрута."""
        return self.add(pattern, handler, ['POST'], auth_required)

    def put(self, pattern, handler, auth_required=False):
        """Shortcut для PUT маршрута."""
        return self.add(pattern, handler, ['PUT'], auth_required)

    def delete(self, pattern, handler, auth_required=False):
        """Shortcut для DELETE маршрута."""
        return self.add(pattern, handler, ['DELETE'], auth_required)

    def resolve(self, path, method):
        """
        Поиск обработчика для пути и метода.
        Возвращает (handler, params, auth_required) или (None, None, None).
        """
        for route in self._routes:
            params = route.match(path, method)
            if params is not None:
                return route.handler, params, route.auth_required
        return None, None, None


def create_api_router():
    """
    Создание роутера с маппингом всех API endpoints.
    Возвращает Router с настроенными маршрутами.
    """
    router = Router()

    # Auth endpoints (публичные)
    router.post('/api/auth/login', 'handle_login')
    router.post('/api/auth/logout', 'handle_logout')
    router.post('/api/auth/check', 'handle_auth_check')

    # Stats (публичные)
    router.get('/api/stats', 'handle_get_stats')
    router.post('/api/stats/visit', 'handle_record_visit')

    # Masters
    router.get('/api/masters', 'handle_get_masters')
    router.post('/api/masters', 'handle_save_masters', auth_required=True)
    router.put('/api/masters', 'handle_save_masters', auth_required=True)

    # Services
    router.get('/api/services', 'handle_get_services')
    router.post('/api/services', 'handle_save_services', auth_required=True)
    router.put('/api/services', 'handle_save_services', auth_required=True)

    # Articles
    router.get('/api/articles', 'handle_get_articles')
    router.post('/api/articles', 'handle_save_articles', auth_required=True)
    router.put('/api/articles', 'handle_save_articles', auth_required=True)

    # FAQ
    router.get('/api/faq', 'handle_get_faq')
    router.post('/api/faq', 'handle_save_faq', auth_required=True)
    router.put('/api/faq', 'handle_save_faq', auth_required=True)

    # Social
    router.get('/api/social', 'handle_get_social')
    router.post('/api/social', 'handle_save_social', auth_required=True)
    router.put('/api/social', 'handle_save_social', auth_required=True)

    # Legal
    router.get('/api/legal', 'handle_get_legal')
    router.get('/api/legal/{slug}', 'handle_get_legal_document')
    router.post('/api/legal', 'handle_save_legal', auth_required=True)
    router.put('/api/legal', 'handle_save_legal', auth_required=True)

    # Shop categories
    router.get('/api/shop/categories', 'handle_get_shop_categories')
    router.post('/api/shop/categories', 'handle_save_shop_categories', auth_required=True)
    router.put('/api/shop/categories', 'handle_save_shop_categories', auth_required=True)

    # Shop products
    router.get('/api/shop/products', 'handle_get_products')
    router.get('/api/shop/products/{id}', 'handle_get_product')
    router.post('/api/shop/products', 'handle_save_products', auth_required=True)
    router.put('/api/shop/products', 'handle_save_products', auth_required=True)

    # Upload
    router.post('/api/upload', 'handle_upload', auth_required=True)
    router.delete('/api/upload/{filename}', 'handle_delete_upload', auth_required=True)

    return router


# Глобальный экземпляр роутера
_router = None


def get_router():
    """Получение глобального экземпляра роутера."""
    global _router
    if _router is None:
        _router = create_api_router()
    return _router
