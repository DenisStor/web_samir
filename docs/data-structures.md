# Структуры данных

## Master

```json
{
    "id": "master_1705312847123_k8j2m9n3x",
    "name": "Самир",
    "initial": "С",
    "badge": "blue",
    "role": "Мастер и основатель",
    "specialization": "",
    "principles": [],
    "photo": "/uploads/xxx.jpg",
    "active": true,
    "order": 1
}
```

## Service (барбершоп)

```json
{
    "categories": [
        {
            "id": "main",
            "name": "Основные услуги",
            "icon": "scissors",
            "services": [
                {
                    "id": 1,
                    "name": "Мужская стрижка",
                    "priceGreen": 900,
                    "pricePink": 1200,
                    "priceBlue": 1500
                }
            ]
        }
    ],
    "podology": {
        "title": "Подологический кабинет",
        "services": [
            {"id": 20, "name": "Консультация", "price": "Бесплатно"}
        ]
    }
}
```

**Важно:** Подология — отдельная структура внутри таблицы services (SQLite: `podology_meta` + `podology_categories`).

## Product (магазин)

```json
{
    "id": "product_1705312847123_abc",
    "name": "Название товара",
    "description": "Описание",
    "category": "category_id",
    "price": 1500,
    "images": ["/uploads/img1.jpg", "/uploads/img2.jpg"],
    "inStock": true,
    "order": 1
}
```

## Legal Document

```json
{
    "id": "legal_1705312847123_xyz",
    "slug": "privacy",
    "title": "Политика конфиденциальности",
    "content": "<h2>Заголовок</h2><p>Текст...</p>",
    "active": true
}
```

**URL:** `/legal.html?page={slug}` (НЕ `/legal/privacy`)

## Цветовая система бейджей

| Badge | Ценовая колонка |
|-------|-----------------|
| `green` | `priceGreen` |
| `pink` | `pricePink` |
| `blue` | `priceBlue` |
