"""
Модуль маршрутизации для Say's Barbers API.
Декларативное определение маршрутов с поддержкой параметров.
"""

import re


class Route:
    """Маршрут с поддержкой параметров {id}, {slug}."""

    def __init__(self, pattern, handler, methods=None, auth_required=False, context=None):
        self.pattern = pattern
        self.handler = handler
        self.methods = methods if methods else ['GET']
        self.auth_required = auth_required
        self.context = context or {}
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
            params = match.groupdict()
            if self.context:
                params.update(self.context)
            return params
        return None


class Router:
    """Маршрутизатор с поддержкой параметров."""

    def __init__(self):
        self._routes = []

    def add(self, pattern, handler, methods=None, auth_required=False, context=None):
        """Добавление маршрута."""
        route = Route(pattern, handler, methods, auth_required, context)
        self._routes.append(route)
        return self

    def get(self, pattern, handler, auth_required=False, context=None):
        """Shortcut для GET маршрута."""
        return self.add(pattern, handler, ['GET'], auth_required, context)

    def post(self, pattern, handler, auth_required=False, context=None):
        """Shortcut для POST маршрута."""
        return self.add(pattern, handler, ['POST'], auth_required, context)

    def put(self, pattern, handler, auth_required=False, context=None):
        """Shortcut для PUT маршрута."""
        return self.add(pattern, handler, ['PUT'], auth_required, context)

    def delete(self, pattern, handler, auth_required=False, context=None):
        """Shortcut для DELETE маршрута."""
        return self.add(pattern, handler, ['DELETE'], auth_required, context)

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

    # Generic CRUD ресурсы (маппинг в handler.py RESOURCE_MAP)
    generic_resources = [
        ('masters', '/api/masters'),
        ('services', '/api/services'),
        ('articles', '/api/articles'),
        ('faq', '/api/faq'),
        ('social', '/api/social'),
        ('legal', '/api/legal'),
        ('shop-categories', '/api/shop/categories'),
    ]
    for resource, path in generic_resources:
        ctx = {'resource': resource}
        router.get(path, 'handle_generic_get', context=ctx)
        router.post(path, 'handle_generic_save', auth_required=True, context=ctx)
        router.put(path, 'handle_generic_save', auth_required=True, context=ctx)

    # Кастомные endpoints
    router.get('/api/legal/{slug}', 'handle_get_legal_document')

    # Shop products — кастомный GET (фильтрация), generic SAVE
    router.get('/api/shop/products', 'handle_get_products')
    router.get('/api/shop/products/{id}', 'handle_get_product')
    ctx_products = {'resource': 'shop-products'}
    router.post('/api/shop/products', 'handle_generic_save', auth_required=True, context=ctx_products)
    router.put('/api/shop/products', 'handle_generic_save', auth_required=True, context=ctx_products)

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
