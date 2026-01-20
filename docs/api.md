# API Documentation

Base URL: `http://localhost:8000/api`

## Эндпоинты

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET/POST | `/api/masters` | Мастера |
| GET/POST | `/api/services` | Услуги барбершопа + подология (в поле `podology`) |
| GET/POST | `/api/articles` | Статьи блога |
| GET/POST | `/api/faq` | FAQ |
| GET/POST | `/api/social` | Контакты и соцсети |
| GET/POST | `/api/shop/categories` | Категории товаров |
| GET/POST | `/api/shop/products` | Товары |
| GET/POST | `/api/legal` | Юридические документы |
| GET | `/api/legal/{slug}` | Документ по slug |
| GET/POST | `/api/stats` | Статистика посещений |
| POST | `/api/stats/visit` | Записать посещение |
| POST | `/api/upload` | Загрузка изображения (base64) |
| DELETE | `/api/upload/{filename}` | Удаление изображения |
| POST | `/api/auth/login` | Авторизация |

## Аутентификация

```http
POST /api/auth/login
Content-Type: application/json

{"password": "admin"}
```

## Загрузка изображений

```http
POST /api/upload
Content-Type: application/json

{
    "image": "data:image/jpeg;base64,...",
    "filename": "photo.jpg"
}

Response: {"success": true, "url": "/uploads/uuid-photo.jpg"}
```

## Обработка ошибок

API возвращает `null` при ошибке — всегда проверять:
```javascript
if (data && data.field) { /* ... */ }
```
