"""
Tests for server/validators.py
"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.validators import (
    is_valid_slug, is_valid_id, contains_html_chars,
    is_valid_filename, validate_image_bytes, sanitize_html_content,
    SchemaValidator,
    validate_master, validate_service, validate_article,
    validate_faq, validate_product, validate_category,
    MASTER_SCHEMA, PRODUCT_SCHEMA, CATEGORY_SCHEMA
)


# =============================================================================
# is_valid_slug
# =============================================================================

class TestIsValidSlug:

    def test_valid_simple(self):
        assert is_valid_slug('hair-care') is True

    def test_valid_with_numbers(self):
        assert is_valid_slug('category-1') is True

    def test_valid_single_word(self):
        assert is_valid_slug('styling') is True

    def test_invalid_uppercase(self):
        assert is_valid_slug('Hair-Care') is False

    def test_invalid_spaces(self):
        assert is_valid_slug('hair care') is False

    def test_invalid_underscore(self):
        assert is_valid_slug('hair_care') is False

    def test_invalid_empty(self):
        assert is_valid_slug('') is False

    def test_invalid_none(self):
        assert is_valid_slug(None) is False

    def test_invalid_too_long(self):
        assert is_valid_slug('a' * 101) is False

    def test_valid_max_length(self):
        assert is_valid_slug('a' * 100) is True

    def test_invalid_leading_hyphen(self):
        assert is_valid_slug('-hair') is False

    def test_invalid_trailing_hyphen(self):
        assert is_valid_slug('hair-') is False

    def test_invalid_double_hyphen(self):
        assert is_valid_slug('hair--care') is False


# =============================================================================
# is_valid_id
# =============================================================================

class TestIsValidId:

    def test_valid_master_id(self):
        assert is_valid_id('master_1234567890', 'master') is True

    def test_valid_master_with_random(self):
        assert is_valid_id('master_1234567890_abc123', 'master') is True

    def test_valid_service_numeric(self):
        assert is_valid_id('1', 'service') is True

    def test_valid_service_large_number(self):
        assert is_valid_id('999', 'service') is True

    def test_invalid_wrong_prefix(self):
        assert is_valid_id('article_123', 'master') is False

    def test_invalid_empty(self):
        assert is_valid_id('', 'master') is False

    def test_invalid_none(self):
        assert is_valid_id(None, 'master') is False

    def test_invalid_special_chars(self):
        assert is_valid_id('master_<script>', 'master') is False

    def test_service_non_numeric(self):
        assert is_valid_id('abc', 'service') is False

    def test_valid_article_id(self):
        assert is_valid_id('article_1234567890', 'article') is True

    def test_valid_product_id(self):
        assert is_valid_id('product_1234567890', 'product') is True

    def test_valid_category_id(self):
        assert is_valid_id('category_1234567890', 'category') is True


# =============================================================================
# contains_html_chars
# =============================================================================

class TestContainsHtmlChars:

    def test_plain_text(self):
        assert contains_html_chars('Hello World') is False

    def test_angle_brackets(self):
        assert contains_html_chars('<div>') is True

    def test_encoded_html_lt(self):
        assert contains_html_chars('&lt;') is True

    def test_encoded_html_gt(self):
        assert contains_html_chars('&gt;') is True

    def test_javascript_protocol(self):
        assert contains_html_chars('javascript:alert(1)') is True

    def test_data_protocol(self):
        assert contains_html_chars('data:text/html') is True

    def test_vbscript_protocol(self):
        assert contains_html_chars('vbscript:code') is True

    def test_non_string(self):
        assert contains_html_chars(123) is True

    def test_none_input(self):
        assert contains_html_chars(None) is True

    def test_case_insensitive(self):
        assert contains_html_chars('JAVASCRIPT:alert()') is True

    def test_cyrillic_text(self):
        assert contains_html_chars('Привет мир') is False


# =============================================================================
# is_valid_filename
# =============================================================================

class TestIsValidFilename:

    def test_valid_jpg(self):
        assert is_valid_filename('photo123.jpg') is True

    def test_valid_png(self):
        assert is_valid_filename('image_test.png') is True

    def test_invalid_path_traversal(self):
        assert is_valid_filename('../etc/passwd') is False

    def test_invalid_dangerous_ext_py(self):
        assert is_valid_filename('script.py') is False

    def test_invalid_dangerous_ext_js(self):
        assert is_valid_filename('code.js') is False

    def test_invalid_dangerous_ext_html(self):
        assert is_valid_filename('page.html') is False

    def test_invalid_spaces(self):
        assert is_valid_filename('my file.jpg') is False

    def test_invalid_no_extension(self):
        assert is_valid_filename('filename') is False


# =============================================================================
# validate_image_bytes
# =============================================================================

class TestValidateImageBytes:

    def test_valid_png(self, valid_png_bytes):
        is_valid, ext = validate_image_bytes(valid_png_bytes)
        assert is_valid is True
        assert ext == 'png'

    def test_valid_jpeg(self, valid_jpeg_bytes):
        is_valid, ext = validate_image_bytes(valid_jpeg_bytes)
        assert is_valid is True
        assert ext == 'jpg'

    def test_valid_gif(self, valid_gif_bytes):
        is_valid, ext = validate_image_bytes(valid_gif_bytes)
        assert is_valid is True
        assert ext == 'gif'

    def test_valid_webp(self, valid_webp_bytes):
        is_valid, ext = validate_image_bytes(valid_webp_bytes)
        assert is_valid is True
        assert ext == 'webp'

    def test_invalid_bytes(self, invalid_image_bytes):
        is_valid, ext = validate_image_bytes(invalid_image_bytes)
        assert is_valid is False
        assert ext is None

    def test_too_short(self):
        is_valid, ext = validate_image_bytes(b'\x89PNG')
        assert is_valid is False


# =============================================================================
# sanitize_html_content
# =============================================================================

class TestSanitizeHtmlContent:

    def test_removes_script_tags(self):
        result = sanitize_html_content('<p>Hello</p><script>alert(1)</script>')
        assert '<script' not in result
        assert '<p>Hello</p>' in result

    def test_removes_iframe(self):
        result = sanitize_html_content('<iframe src="evil.com"></iframe>')
        assert '<iframe' not in result

    def test_removes_on_handlers(self):
        result = sanitize_html_content('<div onclick="alert(1)">text</div>')
        assert 'onclick' not in result

    def test_removes_javascript_href(self):
        result = sanitize_html_content('<a href="javascript:alert(1)">link</a>')
        assert 'javascript:' not in result

    def test_preserves_safe_html(self):
        safe = '<p>Hello <strong>World</strong></p>'
        assert sanitize_html_content(safe) == safe

    def test_none_input(self):
        assert sanitize_html_content(None) is None

    def test_empty_string(self):
        assert sanitize_html_content('') == ''


# =============================================================================
# SchemaValidator
# =============================================================================

class TestSchemaValidator:

    def test_valid_data(self):
        schema = {'name': {'required': True, 'type': 'string', 'max_length': 100}}
        is_valid, error = SchemaValidator.validate({'name': 'Test'}, schema)
        assert is_valid is True
        assert error is None

    def test_missing_required(self):
        schema = {'name': {'required': True}}
        is_valid, error = SchemaValidator.validate({'name': ''}, schema)
        assert is_valid is False
        assert 'name' in error

    def test_non_dict_data(self):
        schema = {'name': {'required': True}}
        is_valid, error = SchemaValidator.validate([1, 2, 3], schema)
        assert is_valid is False
        assert 'Invalid data format' in error

    def test_wrong_type_string(self):
        schema = {'name': {'type': 'string'}}
        is_valid, error = SchemaValidator.validate({'name': 123}, schema)
        assert is_valid is False

    def test_wrong_type_number(self):
        schema = {'price': {'type': 'number'}}
        is_valid, error = SchemaValidator.validate({'price': 'abc'}, schema)
        assert is_valid is False

    def test_wrong_type_list(self):
        schema = {'items': {'type': 'list'}}
        is_valid, error = SchemaValidator.validate({'items': 'not-a-list'}, schema)
        assert is_valid is False

    def test_max_length(self):
        schema = {'name': {'type': 'string', 'max_length': 5}}
        is_valid, error = SchemaValidator.validate({'name': 'toolong'}, schema)
        assert is_valid is False
        assert 'too long' in error.lower()

    def test_min_value(self):
        schema = {'price': {'type': 'number', 'min': 0}}
        is_valid, error = SchemaValidator.validate({'price': -100}, schema)
        assert is_valid is False

    def test_max_value(self):
        schema = {'price': {'type': 'number', 'max': 1000}}
        is_valid, error = SchemaValidator.validate({'price': 2000}, schema)
        assert is_valid is False

    def test_allowed_values(self):
        schema = {'status': {'allowed': ['active', 'inactive']}}
        is_valid, error = SchemaValidator.validate({'status': 'sold'}, schema)
        assert is_valid is False
        assert 'Must be one of' in error

    def test_no_html(self):
        schema = {'name': {'no_html': True}}
        is_valid, error = SchemaValidator.validate({'name': '<script>xss</script>'}, schema)
        assert is_valid is False

    def test_sanitize_mutates_data(self):
        schema = {'content': {'sanitize': True}}
        data = {'content': '<p>OK</p><script>bad</script>'}
        is_valid, error = SchemaValidator.validate(data, schema)
        assert is_valid is True
        assert '<script>' not in data['content']

    def test_id_validation(self):
        schema = {'id': {'id_type': 'master'}}
        is_valid, error = SchemaValidator.validate({'id': 'invalid!'}, schema)
        assert is_valid is False
        assert 'Invalid ID' in error

    def test_slug_validation(self):
        schema = {'slug': {'slug': True}}
        is_valid, error = SchemaValidator.validate({'slug': 'INVALID SLUG'}, schema)
        assert is_valid is False
        assert 'Invalid slug' in error

    def test_float_nan(self):
        schema = {'price': {'type': 'number', 'min': 0}}
        is_valid, error = SchemaValidator.validate({'price': float('nan')}, schema)
        assert is_valid is False

    def test_float_infinity(self):
        schema = {'price': {'type': 'number', 'min': 0}}
        is_valid, error = SchemaValidator.validate({'price': float('inf')}, schema)
        assert is_valid is False

    def test_optional_field_skipped(self):
        schema = {'name': {'type': 'string', 'max_length': 100}}
        is_valid, error = SchemaValidator.validate({}, schema)
        assert is_valid is True


# =============================================================================
# validate_category
# =============================================================================

class TestValidateCategory:

    def test_valid_category(self):
        data = {'id': 'category_1234567890', 'name': 'Тестовая категория', 'slug': 'test-category'}
        is_valid, error = validate_category(data)
        assert is_valid is True

    def test_missing_name(self):
        is_valid, error = validate_category({'id': 'category_1', 'slug': 'test'})
        assert is_valid is False

    def test_invalid_slug(self):
        is_valid, error = validate_category({'name': 'Test', 'slug': 'INVALID SLUG'})
        assert is_valid is False

    def test_html_in_name(self):
        is_valid, error = validate_category({'name': '<script>xss</script>', 'slug': 'test'})
        assert is_valid is False


# =============================================================================
# validate_product
# =============================================================================

class TestValidateProduct:

    def test_valid_product(self):
        data = {
            'id': 'product_1234567890',
            'name': 'Тестовый товар',
            'price': 1500,
            'categoryId': 'category_1234567890',
            'status': 'active'
        }
        is_valid, error = validate_product(data)
        assert is_valid is True

    def test_invalid_status(self):
        is_valid, error = validate_product({
            'name': 'Test', 'status': 'sold', 'price': 100
        })
        assert is_valid is False

    def test_negative_price(self):
        is_valid, error = validate_product({
            'name': 'Test', 'price': -100
        })
        assert is_valid is False

    def test_html_in_name(self):
        is_valid, error = validate_product({
            'name': '<script>xss</script>', 'price': 100
        })
        assert is_valid is False

    def test_missing_name(self):
        is_valid, error = validate_product({
            'price': 100, 'status': 'active'
        })
        assert is_valid is False


# =============================================================================
# validate_master
# =============================================================================

class TestValidateMaster:

    def test_valid_master(self):
        data = {
            'id': 'master_1234567890',
            'name': 'Тестовый Мастер',
            'badge': 'green'
        }
        is_valid, error = validate_master(data)
        assert is_valid is True

    def test_missing_name(self):
        is_valid, error = validate_master({'id': 'master_123', 'badge': 'green'})
        assert is_valid is False

    def test_invalid_badge(self):
        is_valid, error = validate_master({'name': 'Test', 'badge': 'red'})
        assert is_valid is False

    def test_html_in_name(self):
        is_valid, error = validate_master({'name': '<b>XSS</b>'})
        assert is_valid is False
