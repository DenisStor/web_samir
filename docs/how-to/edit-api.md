# Как добавить API эндпоинт

## Архитектура API

```
server/
├── handler.py     # HTTP обработчик (AdminAPIHandler)
├── routes.py      # Маршрутизатор
├── auth.py        # Аутентификация
├── database.py    # SQLite хранилище
└── validators.py  # Валидация данных
```

---

## Добавление GET эндпоинта

### 1. Добавьте маршрут

В `server/routes.py`:

```python
def create_api_router():
    router = Router()

    # ... существующие маршруты

    # Новый эндпоинт
    router.get('/api/new-entity', 'handle_get_new_entity')

    return router
```

### 2. Добавьте обработчик

В `server/handler.py`:

```python
def handle_get_new_entity(self, params):
    """Получение списка новых сущностей."""
    data = self.storage.load('new-entity')
    self.send_json_response(data)
```

---

## Добавление POST эндпоинта (с авторизацией)

### 1. Добавьте маршрут

```python
router.post('/api/new-entity', 'handle_save_new_entity', auth_required=True)
```

### 2. Добавьте обработчик

```python
def handle_save_new_entity(self, params):
    """Сохранение новых сущностей."""
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

    # Сохранение
    self.storage.save('new-entity', data)
    self.send_json_response({'success': True})
```

---

## Эндпоинт с параметром

### 1. Маршрут с параметром

```python
router.get('/api/new-entity/{id}', 'handle_get_new_entity_by_id')
```

### 2. Обработчик с параметром

```python
def handle_get_new_entity_by_id(self, params):
    """Получение сущности по ID."""
    entity_id = params.get('id')

    data = self.storage.load('new-entity')
    items = data.get('items', [])

    item = None
    for i in items:
        if i.get('id') == entity_id:
            item = i
            break

    if not item:
        self.send_error_response('Не найдено', 404)
        return

    self.send_json_response(item)
```

---

## Полный пример: CRUD для сущности

### routes.py

```python
# New Entity
router.get('/api/new-entity', 'handle_get_new_entity')
router.get('/api/new-entity/{id}', 'handle_get_new_entity_by_id')
router.post('/api/new-entity', 'handle_save_new_entity', auth_required=True)
router.put('/api/new-entity', 'handle_save_new_entity', auth_required=True)
router.delete('/api/new-entity/{id}', 'handle_delete_new_entity', auth_required=True)
```

### handler.py

```python
def handle_get_new_entity(self, params):
    """GET /api/new-entity — список всех."""
    data = self.storage.load('new-entity')
    self.send_json_response(data)

def handle_get_new_entity_by_id(self, params):
    """GET /api/new-entity/{id} — одна запись."""
    entity_id = params.get('id')
    data = self.storage.load('new-entity')

    for item in data.get('items', []):
        if item.get('id') == entity_id:
            self.send_json_response(item)
            return

    self.send_error_response('Не найдено', 404)

def handle_save_new_entity(self, params):
    """POST/PUT /api/new-entity — сохранение."""
    data = self.get_json_body()
    if not data:
        self.send_error_response('Пустое тело', 400)
        return

    self.storage.save('new-entity', data)
    self.send_json_response({'success': True})

def handle_delete_new_entity(self, params):
    """DELETE /api/new-entity/{id} — удаление."""
    entity_id = params.get('id')
    data = self.storage.load('new-entity')

    items = data.get('items', [])
    data['items'] = [i for i in items if i.get('id') != entity_id]

    self.storage.save('new-entity', data)
    self.send_json_response({'success': True})
```

---

## Валидация

### Встроенные методы

```python
from server.validators import validate_required, validate_email

def handle_save(self, params):
    data = self.get_json_body()

    # Проверка обязательных полей
    errors = validate_required(data, ['name', 'email'])
    if errors:
        self.send_error_response(errors[0], 400)
        return

    # Проверка email
    if not validate_email(data.get('email')):
        self.send_error_response('Некорректный email', 400)
        return
```

---

## Вызов API из JavaScript

```javascript
// GET
AdminAPI.get('/api/new-entity')
    .then(function(data) {
        console.log(data);
    });

// POST
AdminAPI.save('new-entity', { items: items })
    .then(function(response) {
        showToast('Сохранено', 'success');
    })
    .catch(function(error) {
        showToast('Ошибка: ' + error.message, 'error');
    });
```

---

## Тестирование

### curl

```bash
# GET
curl http://localhost:8000/api/new-entity

# POST (с авторизацией)
curl -X POST http://localhost:8000/api/new-entity \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION" \
  -d '{"items":[{"id":"1","name":"Test"}]}'
```

---

## Шаблон эндпоинта

См. [examples/api-endpoint.py](../examples/api-endpoint.py)
