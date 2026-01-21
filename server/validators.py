"""
Модуль валидации данных для Say's Barbers API.
Содержит схемы валидации и вспомогательные функции.
"""

import re


# ID prefixes for different entity types
ID_PREFIXES = {
    'master': 'master_',
    'article': 'article_',
    'product': 'product_',
    'category': 'category_',
    'legal': 'legal_',
    'faq': 'faq_',
    'service': ''  # Services use numeric IDs
}


def contains_html_chars(text):
    """Проверка наличия HTML символов в тексте."""
    if not isinstance(text, str):
        return True
    dangerous_patterns = ['<', '>', '&lt;', '&gt;', 'javascript:', 'data:', 'vbscript:']
    text_lower = text.lower()
    return any(pattern in text_lower for pattern in dangerous_patterns)


def is_valid_slug(slug):
    """Проверка валидности slug (только буквы, цифры, дефис)."""
    if not slug or not isinstance(slug, str):
        return False
    if len(slug) > 100:
        return False
    return bool(re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', slug))


def is_valid_id(id_value, entity_type):
    """
    Validate ID format for the given entity type.
    IDs should match pattern: prefix_timestamp(_random)?
    """
    if not id_value or not isinstance(id_value, str):
        return False

    prefix = ID_PREFIXES.get(entity_type, '')

    # Services use numeric IDs
    if entity_type == 'service':
        try:
            int(id_value)
            return True
        except (ValueError, TypeError):
            return False

    # Check prefix
    if prefix and not id_value.startswith(prefix):
        return False

    # Check format: only alphanumeric and underscores allowed
    if not re.match(r'^[a-z]+_[0-9]+(_[a-z0-9]+)?$', id_value):
        return False

    return True


def is_valid_filename(filename):
    """Проверка имени файла (защита от Path Traversal)."""
    if not re.match(r'^[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+$', filename):
        return False
    dangerous_ext = [
        '.py', '.sh', '.exe', '.bat', '.cmd', '.php', '.js', '.html',
        '.jsp', '.aspx', '.asp', '.cgi', '.pl', '.phtml', '.phar',
        '.htaccess', '.htpasswd', '.config', '.ini', '.env',
        '.rb', '.erb', '.lua', '.ps1', '.vbs', '.wsf'
    ]
    if any(filename.lower().endswith(ext) for ext in dangerous_ext):
        return False
    return True


def validate_image_bytes(image_bytes):
    """Проверка magic bytes изображения. Возвращает (is_valid, detected_extension)."""
    if len(image_bytes) < 12:
        return False, None

    # PNG
    if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return True, 'png'

    # JPEG
    if image_bytes[:3] == b'\xff\xd8\xff':
        return True, 'jpg'

    # GIF
    if image_bytes[:6] in (b'GIF87a', b'GIF89a'):
        return True, 'gif'

    # WebP (RIFF....WEBP)
    if image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
        return True, 'webp'

    return False, None


def sanitize_html_content(text):
    """
    Простая санитизация HTML контента.
    Удаляет опасные теги и атрибуты.
    """
    if not text:
        return text

    # Удаляем script теги
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем style теги
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем iframe
    text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем object/embed
    text = re.sub(r'<object[^>]*>.*?</object>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<embed[^>]*/?>', '', text, flags=re.IGNORECASE)
    # Удаляем svg теги
    text = re.sub(r'<svg[^>]*>.*?</svg>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем math теги
    text = re.sub(r'<math[^>]*>.*?</math>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Удаляем base теги
    text = re.sub(r'<base[^>]*/?>', '', text, flags=re.IGNORECASE)
    # Удаляем опасные атрибуты
    text = re.sub(r'\s+on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+on\w+\s*=\s*\S+', '', text, flags=re.IGNORECASE)
    # Удаляем javascript: в href/src
    text = re.sub(r'(href|src)\s*=\s*["\']?\s*javascript:[^"\'>\s]*', r'\1=""', text, flags=re.IGNORECASE)
    text = re.sub(r'(href|src)\s*=\s*["\']?\s*data:[^"\'>\s]*', r'\1=""', text, flags=re.IGNORECASE)

    return text


class SchemaValidator:
    """Декларативный валидатор на основе схем."""

    @staticmethod
    def validate(data, schema):
        """
        Валидирует данные по схеме.
        Возвращает (is_valid, error_message или None).
        """
        if not isinstance(data, dict):
            return False, "Invalid data format"

        for field, rules in schema.items():
            value = data.get(field)
            required = rules.get('required', False)
            field_type = rules.get('type')
            max_length = rules.get('max_length')
            min_value = rules.get('min')
            max_value = rules.get('max')
            allowed = rules.get('allowed')
            no_html = rules.get('no_html', False)
            sanitize = rules.get('sanitize', False)
            id_type = rules.get('id_type')
            slug = rules.get('slug', False)

            # Required check
            if required and not value:
                return False, f"Invalid or missing {field}"

            # Skip further validation if value is empty and not required
            if not value:
                continue

            # Type check
            if field_type:
                if field_type == 'string' and not isinstance(value, str):
                    return False, f"Invalid {field} type"
                elif field_type == 'number' and not isinstance(value, (int, float)):
                    return False, f"Invalid {field}"
                elif field_type == 'list' and not isinstance(value, list):
                    return False, f"Invalid {field} type"

            # Max length check
            if max_length and isinstance(value, str) and len(value) > max_length:
                return False, f"{field.capitalize()} too long"

            # Number range check
            if isinstance(value, (int, float)):
                if min_value is not None and value < min_value:
                    return False, f"Invalid {field}"
                if max_value is not None and value > max_value:
                    return False, f"Invalid {field}"
                # Check for Infinity and NaN
                if isinstance(value, float):
                    if value != value or value == float('inf') or value == float('-inf'):
                        return False, f"Invalid {field} value"

            # Allowed values check
            if allowed and value not in allowed:
                return False, f"Invalid {field}. Must be one of: {', '.join(map(str, allowed))}"

            # HTML check
            if no_html and isinstance(value, str) and contains_html_chars(value):
                return False, f"Invalid characters in {field}"

            # Sanitize HTML
            if sanitize and isinstance(value, str):
                data[field] = sanitize_html_content(value)

            # ID validation
            if id_type and not is_valid_id(value, id_type):
                return False, "Invalid ID format"

            # Slug validation
            if slug and not is_valid_slug(value):
                return False, "Invalid slug format"

        return True, None


# Схемы валидации для каждого типа сущности
MASTER_SCHEMA = {
    'id': {'id_type': 'master'},
    'name': {'required': True, 'type': 'string', 'max_length': 100, 'no_html': True},
    'badge': {'allowed': ['green', 'pink', 'blue']}
}

SERVICE_SCHEMA = {
    'name': {'required': True, 'type': 'string', 'max_length': 200},
    'priceGreen': {'type': 'number', 'min': 0, 'max': 1000000},
    'pricePink': {'type': 'number', 'min': 0, 'max': 1000000},
    'priceBlue': {'type': 'number', 'min': 0, 'max': 1000000},
    'price': {'type': 'number', 'min': 0, 'max': 1000000}
}

ARTICLE_SCHEMA = {
    'id': {'id_type': 'article'},
    'title': {'required': True, 'type': 'string', 'max_length': 500, 'no_html': True},
    'content': {'type': 'string', 'max_length': 100000, 'sanitize': True},
    'excerpt': {'type': 'string', 'sanitize': True}
}

FAQ_SCHEMA = {
    'id': {'id_type': 'faq'},
    'question': {'required': True, 'type': 'string', 'max_length': 500, 'no_html': True},
    'answer': {'type': 'string', 'max_length': 10000, 'no_html': True}
}

PRODUCT_SCHEMA = {
    'id': {'id_type': 'product'},
    'name': {'required': True, 'type': 'string', 'max_length': 200, 'no_html': True},
    'status': {'allowed': ['active', 'inactive', 'draft']},
    'price': {'type': 'number', 'min': 0, 'max': 10000000},
    'categoryId': {'id_type': 'category'},
    'description': {'type': 'string', 'max_length': 10000, 'sanitize': True}
}

CATEGORY_SCHEMA = {
    'id': {'id_type': 'category'},
    'name': {'required': True, 'type': 'string', 'max_length': 100, 'no_html': True},
    'slug': {'slug': True}
}

PRINCIPLE_SCHEMA = {
    'title': {'required': True, 'type': 'string', 'max_length': 200, 'no_html': True},
    'description': {'type': 'string', 'max_length': 1000, 'no_html': True}
}


# Функции валидации для обратной совместимости
def validate_master(data):
    """Валидация данных мастера."""
    return SchemaValidator.validate(data, MASTER_SCHEMA)


def validate_service(data):
    """Валидация данных услуги."""
    return SchemaValidator.validate(data, SERVICE_SCHEMA)


def validate_article(data):
    """Валидация данных статьи."""
    return SchemaValidator.validate(data, ARTICLE_SCHEMA)


def validate_faq(data):
    """Валидация FAQ."""
    return SchemaValidator.validate(data, FAQ_SCHEMA)


def validate_product(data):
    """Валидация данных товара."""
    return SchemaValidator.validate(data, PRODUCT_SCHEMA)


def validate_category(data):
    """Валидация данных категории."""
    return SchemaValidator.validate(data, CATEGORY_SCHEMA)


def validate_principle(data):
    """Валидация принципа качества."""
    return SchemaValidator.validate(data, PRINCIPLE_SCHEMA)
