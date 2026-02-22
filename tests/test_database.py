"""
Tests for server/database.py — SQLite storage
"""

import pytest
import json
import threading
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.database import Database


@pytest.fixture
def db(tmp_path):
    """Isolated Database for each test."""
    return Database(db_path=str(tmp_path / 'test.db'))


# =============================================================================
# Masters
# =============================================================================

class TestMasters:

    def test_roundtrip(self, db):
        """Should write and read masters correctly."""
        data = {'masters': [
            {'id': 'master_1', 'name': 'Иван', 'badge': 'green', 'role': 'Барбер',
             'principles': ['Качество'], 'photo': None, 'active': True},
            {'id': 'master_2', 'name': 'Петр', 'badge': 'pink', 'role': 'Стилист',
             'principles': [], 'active': False}
        ]}

        db.write('masters.json', data)
        result = db.read('masters.json')

        assert result['masters'] == data['masters']
        assert len(result['masters']) == 2
        assert result['masters'][0]['name'] == 'Иван'
        assert result['masters'][0]['principles'] == ['Качество']

    def test_empty(self, db):
        """Should return empty list for empty DB."""
        result = db.read('masters.json')
        assert result == {'masters': []}

    def test_order_preserved(self, db):
        """Should preserve insertion order."""
        data = {'masters': [
            {'id': 'master_3', 'name': 'Third'},
            {'id': 'master_1', 'name': 'First'},
            {'id': 'master_2', 'name': 'Second'},
        ]}
        db.write('masters.json', data)
        result = db.read('masters.json')
        assert [m['name'] for m in result['masters']] == ['Third', 'First', 'Second']

    def test_overwrite(self, db):
        """Should overwrite previous data."""
        db.write('masters.json', {'masters': [{'id': 'master_1', 'name': 'Old'}]})
        db.write('masters.json', {'masters': [{'id': 'master_2', 'name': 'New'}]})
        result = db.read('masters.json')
        assert len(result['masters']) == 1
        assert result['masters'][0]['name'] == 'New'


# =============================================================================
# Services
# =============================================================================

class TestServices:

    def test_roundtrip(self, db):
        """Should write and read services with categories and podology."""
        data = {
            'categories': [
                {
                    'id': 'main', 'name': 'Основные',
                    'services': [
                        {'id': 1, 'name': 'Стрижка', 'priceGreen': 1000, 'pricePink': 1300}
                    ]
                }
            ],
            'podology': {
                'title': 'Подология',
                'description': 'Уход за стопами',
                'categories': [
                    {
                        'id': 'pod1', 'name': 'Базовые',
                        'services': [
                            {'id': 1, 'name': 'Обработка', 'price': 2000}
                        ]
                    }
                ]
            }
        }

        db.write('services.json', data)
        result = db.read('services.json')

        assert len(result['categories']) == 1
        assert result['categories'][0]['name'] == 'Основные'
        assert result['categories'][0]['services'][0]['priceGreen'] == 1000
        assert result['podology']['title'] == 'Подология'
        assert len(result['podology']['categories']) == 1

    def test_without_podology(self, db):
        """Should work without podology section."""
        data = {'categories': [{'id': 'main', 'name': 'Услуги'}]}
        db.write('services.json', data)
        result = db.read('services.json')
        assert len(result['categories']) == 1
        assert 'podology' not in result

    def test_empty(self, db):
        """Should return empty categories for empty DB."""
        result = db.read('services.json')
        assert result == {'categories': []}


# =============================================================================
# Articles
# =============================================================================

class TestArticles:

    def test_roundtrip(self, db):
        """Should write and read articles."""
        data = {'articles': [
            {'id': 'article_1', 'title': 'Статья', 'tag': 'Уход',
             'content': '<p>Текст</p>', 'active': True}
        ]}
        db.write('articles.json', data)
        result = db.read('articles.json')
        assert result['articles'][0]['title'] == 'Статья'
        assert result['articles'][0]['content'] == '<p>Текст</p>'


# =============================================================================
# FAQ
# =============================================================================

class TestFaq:

    def test_roundtrip_faq_key(self, db):
        """Should handle 'faq' key."""
        data = {'faq': [
            {'id': 'faq_1', 'question': 'Вопрос?', 'answer': 'Ответ'}
        ]}
        db.write('faq.json', data)
        result = db.read('faq.json')
        assert len(result['faq']) == 1
        assert result['faq'][0]['question'] == 'Вопрос?'

    def test_roundtrip_items_key(self, db):
        """Should handle 'items' key on write."""
        data = {'items': [
            {'id': 'faq_1', 'question': 'Q?', 'answer': 'A'}
        ]}
        db.write('faq.json', data)
        result = db.read('faq.json')
        assert len(result['faq']) == 1
        assert result['faq'][0]['question'] == 'Q?'


# =============================================================================
# Legal
# =============================================================================

class TestLegal:

    def test_roundtrip(self, db):
        """Should write and read legal documents."""
        data = {'documents': [
            {'id': 'legal_1', 'slug': 'privacy', 'title': 'Privacy',
             'content': '<p>Text</p>', 'active': True},
            {'id': 'legal_2', 'slug': 'terms', 'title': 'Terms',
             'content': '<p>Terms</p>', 'active': False}
        ]}
        db.write('legal.json', data)
        result = db.read('legal.json')
        assert len(result['documents']) == 2

    def test_get_by_slug(self, db):
        """Should find document by slug."""
        data = {'documents': [
            {'id': 'legal_1', 'slug': 'privacy', 'title': 'Privacy', 'active': True},
            {'id': 'legal_2', 'slug': 'terms', 'title': 'Terms', 'active': True}
        ]}
        db.write('legal.json', data)

        doc = db.get_legal_by_slug('privacy')
        assert doc is not None
        assert doc['title'] == 'Privacy'

    def test_get_by_slug_inactive(self, db):
        """Should not return inactive documents."""
        data = {'documents': [
            {'id': 'legal_1', 'slug': 'old', 'title': 'Old', 'active': False}
        ]}
        db.write('legal.json', data)
        assert db.get_legal_by_slug('old') is None

    def test_get_by_slug_not_found(self, db):
        """Should return None for non-existent slug."""
        assert db.get_legal_by_slug('nonexistent') is None


# =============================================================================
# Social
# =============================================================================

class TestSocial:

    def test_roundtrip(self, db):
        """Should write and read social links with contacts."""
        data = {
            'social': [
                {'id': 'social_1', 'type': 'telegram', 'url': 'https://t.me/test'}
            ],
            'phone': '+7 999 123-45-67',
            'email': 'test@example.com',
            'address': 'ул. Тестовая, д. 1'
        }
        db.write('social.json', data)
        result = db.read('social.json')

        assert len(result['social']) == 1
        assert result['social'][0]['type'] == 'telegram'
        assert result['phone'] == '+7 999 123-45-67'
        assert result['email'] == 'test@example.com'
        assert result['address'] == 'ул. Тестовая, д. 1'

    def test_without_contacts(self, db):
        """Should work with social links only."""
        data = {'social': [{'id': 's1', 'type': 'vk', 'url': 'https://vk.com'}]}
        db.write('social.json', data)
        result = db.read('social.json')
        assert len(result['social']) == 1
        assert 'phone' not in result


# =============================================================================
# Shop Categories
# =============================================================================

class TestShopCategories:

    def test_roundtrip(self, db):
        """Should write and read shop categories."""
        data = {'categories': [
            {'id': 'cat_1', 'name': 'Hair', 'slug': 'hair', 'order': 1},
            {'id': 'cat_2', 'name': 'Beard', 'slug': 'beard', 'order': 2}
        ]}
        db.write('shop-categories.json', data)
        result = db.read('shop-categories.json')
        assert len(result['categories']) == 2
        assert result['categories'][0]['slug'] == 'hair'


# =============================================================================
# Products
# =============================================================================

class TestProducts:

    def test_roundtrip(self, db):
        """Should write and read products."""
        data = {'products': [
            {'id': 'prod_1', 'name': 'Shampoo', 'price': 500,
             'categoryId': 'cat_1', 'status': 'active',
             'images': ['/uploads/a.jpg', '/uploads/b.jpg']},
            {'id': 'prod_2', 'name': 'Oil', 'price': 700,
             'categoryId': 'cat_2', 'status': 'draft',
             'images': []}
        ]}
        db.write('products.json', data)
        result = db.read('products.json')

        assert len(result['products']) == 2
        assert result['products'][0]['images'] == ['/uploads/a.jpg', '/uploads/b.jpg']

    def test_get_by_id(self, db):
        """Should find product by ID."""
        data = {'products': [
            {'id': 'prod_1', 'name': 'Shampoo', 'status': 'active'},
            {'id': 'prod_2', 'name': 'Oil', 'status': 'active'}
        ]}
        db.write('products.json', data)

        product = db.get_product_by_id('prod_1')
        assert product is not None
        assert product['name'] == 'Shampoo'

    def test_get_by_id_not_found(self, db):
        """Should return None for non-existent product."""
        assert db.get_product_by_id('nonexistent') is None

    def test_filtered_by_status(self, db):
        """Should filter products by status."""
        data = {'products': [
            {'id': 'prod_1', 'name': 'Active', 'status': 'active', 'categoryId': ''},
            {'id': 'prod_2', 'name': 'Draft', 'status': 'draft', 'categoryId': ''}
        ]}
        db.write('products.json', data)

        active = db.get_products_filtered(status='active')
        assert len(active) == 1
        assert active[0]['name'] == 'Active'

    def test_filtered_by_category(self, db):
        """Should filter products by category slug."""
        db.write('shop-categories.json', {'categories': [
            {'id': 'cat_1', 'slug': 'hair', 'name': 'Hair'},
            {'id': 'cat_2', 'slug': 'beard', 'name': 'Beard'}
        ]})
        db.write('products.json', {'products': [
            {'id': 'p1', 'name': 'Shampoo', 'categoryId': 'cat_1', 'status': 'active'},
            {'id': 'p2', 'name': 'Oil', 'categoryId': 'cat_2', 'status': 'active'},
            {'id': 'p3', 'name': 'Draft', 'categoryId': 'cat_1', 'status': 'draft'}
        ]})

        hair = db.get_products_filtered(category_slug='hair', status='active')
        assert len(hair) == 1
        assert hair[0]['name'] == 'Shampoo'

    def test_filtered_no_filter(self, db):
        """Should return all products without filters."""
        data = {'products': [
            {'id': 'p1', 'name': 'A', 'status': 'active', 'categoryId': ''},
            {'id': 'p2', 'name': 'B', 'status': 'draft', 'categoryId': ''}
        ]}
        db.write('products.json', data)

        all_products = db.get_products_filtered(status=None)
        assert len(all_products) == 2


# =============================================================================
# Stats
# =============================================================================

class TestStats:

    def test_roundtrip(self, db):
        """Should write and read stats."""
        data = {
            'total_views': 100,
            'unique_visitors': 50,
            'created': '2024-01-01T00:00:00',
            'last_visit': '2024-06-15T12:00:00',
            'daily': {'2024-06-14': 10, '2024-06-15': 15},
            'sections': {'hero': 100, 'services': 80},
            'sessions': {
                '2024-06-14': ['sess_1', 'sess_2'],
                '2024-06-15': ['sess_3']
            }
        }
        db.write('stats.json', data)
        result = db.read('stats.json')

        assert result['total_views'] == 100
        assert result['unique_visitors'] == 50
        assert result['created'] == '2024-01-01T00:00:00'
        assert result['daily']['2024-06-14'] == 10
        assert result['sections']['hero'] == 100
        assert result['sessions']['2024-06-14'] == ['sess_1', 'sess_2']
        assert result['sessions']['2024-06-15'] == ['sess_3']

    def test_empty_stats(self, db):
        """Should return zero counters for empty DB."""
        result = db.read('stats.json')
        assert result['total_views'] == 0
        assert result['unique_visitors'] == 0
        assert result['daily'] == {}
        assert result['sessions'] == {}

    def test_update_stats(self, db):
        """Should atomically update stats."""
        db.write('stats.json', {'total_views': 10, 'unique_visitors': 5,
                                'daily': {}, 'sessions': {}, 'sections': {}})

        def increment(stats):
            stats['total_views'] = stats.get('total_views', 0) + 1
            return stats

        result = db.update('stats.json', increment)
        assert result['total_views'] == 11

        result = db.read('stats.json')
        assert result['total_views'] == 11


# =============================================================================
# Normalize resource
# =============================================================================

class TestNormalize:

    def test_strip_json(self, db):
        """Should strip .json extension."""
        assert db._normalize_resource('masters.json') == 'masters'

    def test_no_extension(self, db):
        """Should keep name without extension."""
        assert db._normalize_resource('masters') == 'masters'

    def test_shop_categories(self, db):
        """Should handle hyphenated names."""
        assert db._normalize_resource('shop-categories.json') == 'shop-categories'


# =============================================================================
# Update method
# =============================================================================

class TestUpdate:

    def test_update_creates_data(self, db):
        """Should use default when no data exists."""
        def add_master(data):
            data['masters'] = [{'id': 'master_1', 'name': 'New'}]
            return data

        result = db.update('masters.json', add_master, {'masters': []})
        assert len(result['masters']) == 1

    def test_update_modifies_existing(self, db):
        """Should modify existing data."""
        db.write('faq.json', {'faq': [
            {'id': 'faq_1', 'question': 'Q1?', 'answer': 'A1'}
        ]})

        def add_faq(data):
            data['faq'].append({'id': 'faq_2', 'question': 'Q2?', 'answer': 'A2'})
            return data

        result = db.update('faq.json', add_faq)
        assert len(result['faq']) == 2


# =============================================================================
# Thread safety
# =============================================================================

class TestThreadSafety:

    def test_concurrent_writes(self, db):
        """Should handle concurrent writes without errors."""
        errors = []

        def write_data(i):
            try:
                db.write('faq.json', {
                    'faq': [{'id': 'faq_%d' % i, 'question': 'Q%d?' % i, 'answer': 'A%d' % i}]
                })
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=write_data, args=(i,)) for i in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=10)

        assert len(errors) == 0
        result = db.read('faq.json')
        assert len(result['faq']) == 1  # Last write wins

    def test_concurrent_reads(self, db):
        """Should handle concurrent reads without errors."""
        db.write('masters.json', {'masters': [
            {'id': 'master_1', 'name': 'Test'}
        ]})

        results = []
        errors = []

        def read_data():
            try:
                data = db.read('masters.json')
                results.append(len(data['masters']))
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=read_data) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=10)

        assert len(errors) == 0
        assert all(r == 1 for r in results)


# =============================================================================
# Default & unknown resource
# =============================================================================

class TestDefaults:

    def test_unknown_resource_returns_default(self, db):
        """Should return default for unknown resources."""
        result = db.read('unknown.json', {'fallback': True})
        assert result == {'fallback': True}

    def test_default_none_becomes_empty_dict(self, db):
        """Should use empty dict when default is None."""
        result = db.read('unknown.json')
        assert result == {}

    def test_write_unknown_returns_false(self, db):
        """Should return False for unknown resources."""
        result = db.write('unknown.json', {'data': True})
        assert result is False


# =============================================================================
# _get_lock compatibility
# =============================================================================

class TestCompat:

    def test_get_lock(self, db):
        """Should return a lock for backward compatibility."""
        lock = db._get_lock('masters.json')
        assert lock is db._write_lock
