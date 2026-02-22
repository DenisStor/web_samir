"""
Шаблон API эндпоинта для Say's Barbers.

Этот файл показывает паттерн добавления нового эндпоинта.
НЕ копируйте файл целиком — добавляйте части в существующие файлы.
"""


# =============================================================================
# 1. ДОБАВЬТЕ МАРШРУТ В server/routes.py
# =============================================================================

def create_api_router():
    """Добавьте маршруты в функцию create_api_router()."""
    router = Router()

    # ... существующие маршруты ...

    # Публичные эндпоинты (без авторизации)
    router.get('/api/examples', 'handle_get_examples')
    router.get('/api/examples/{id}', 'handle_get_example_by_id')

    # Приватные эндпоинты (требуют авторизацию)
    router.post('/api/examples', 'handle_save_examples', auth_required=True)
    router.put('/api/examples', 'handle_save_examples', auth_required=True)
    router.delete('/api/examples/{id}', 'handle_delete_example', auth_required=True)

    return router


# =============================================================================
# 2. ДОБАВЬТЕ ОБРАБОТЧИКИ В server/handler.py (в класс AdminAPIHandler)
# =============================================================================

class AdminAPIHandler:
    """Добавьте методы в существующий класс."""

    def handle_get_examples(self, params):
        """
        GET /api/examples
        Получение списка всех элементов.
        """
        data = self.storage.load('examples')
        self.send_json_response(data)

    def handle_get_example_by_id(self, params):
        """
        GET /api/examples/{id}
        Получение одного элемента по ID.
        """
        example_id = params.get('id')
        data = self.storage.load('examples')

        for item in data.get('items', []):
            if item.get('id') == example_id:
                self.send_json_response(item)
                return

        self.send_error_response('Не найдено', 404)

    def handle_save_examples(self, params):
        """
        POST/PUT /api/examples
        Сохранение списка элементов.
        """
        data = self.get_json_body()

        if not data:
            self.send_error_response('Пустое тело запроса', 400)
            return

        # Валидация
        items = data.get('items', [])
        for item in items:
            if not item.get('name'):
                self.send_error_response('Поле name обязательно', 400)
                return

            if not item.get('id'):
                self.send_error_response('Поле id обязательно', 400)
                return

        # Сохранение
        self.storage.save('examples', data)
        self.send_json_response({'success': True})

    def handle_delete_example(self, params):
        """
        DELETE /api/examples/{id}
        Удаление элемента по ID.
        """
        example_id = params.get('id')
        data = self.storage.load('examples')

        items = data.get('items', [])
        original_count = len(items)

        data['items'] = [i for i in items if i.get('id') != example_id]

        if len(data['items']) == original_count:
            self.send_error_response('Не найдено', 404)
            return

        self.storage.save('examples', data)
        self.send_json_response({'success': True})


# =============================================================================
# 3. ДАННЫЕ
# =============================================================================

# Данные хранятся в SQLite (data/saysbarbers.db).
# Новые ресурсы автоматически создаются при первом обращении через storage.


# =============================================================================
# 4. ВАЛИДАЦИЯ (опционально, в server/validators.py)
# =============================================================================

def validate_example(data):
    """
    Валидация данных примера.

    Args:
        data: Словарь с данными

    Returns:
        list: Список ошибок (пустой, если валидация прошла)
    """
    errors = []

    if not data.get('name'):
        errors.append('Название обязательно')

    if data.get('name') and len(data['name']) > 100:
        errors.append('Название слишком длинное (макс. 100 символов)')

    if data.get('status') and data['status'] not in ['active', 'draft', 'archived']:
        errors.append('Неверный статус')

    return errors


# =============================================================================
# 5. ТЕСТИРОВАНИЕ
# =============================================================================

# GET (публичный)
# curl http://localhost:8000/api/examples

# GET по ID
# curl http://localhost:8000/api/examples/example_123

# POST (требует авторизацию)
# curl -X POST http://localhost:8000/api/examples \
#   -H "Content-Type: application/json" \
#   -H "Cookie: session=YOUR_SESSION" \
#   -d '{"items":[{"id":"example_123","name":"Test","status":"draft"}]}'

# DELETE
# curl -X DELETE http://localhost:8000/api/examples/example_123 \
#   -H "Cookie: session=YOUR_SESSION"
