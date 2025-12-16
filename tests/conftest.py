"""
Pytest configuration and fixtures
"""

import pytest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def sample_master():
    """Sample valid master data"""
    return {
        'id': 'master_test',
        'name': 'Тестовый Мастер',
        'initial': 'Т',
        'badge': 'green',
        'role': 'Барбер',
        'specialization': 'Классические стрижки',
        'principles': ['Качество', 'Скорость'],
        'photo': None,
        'active': True
    }


@pytest.fixture
def sample_service():
    """Sample valid service data"""
    return {
        'id': 1,
        'name': 'Мужская стрижка',
        'priceGreen': 1000,
        'pricePink': 1300,
        'priceBlue': 1500
    }


@pytest.fixture
def sample_article():
    """Sample valid article data"""
    return {
        'id': 'article_test',
        'title': 'Тестовая статья',
        'tag': 'Уход',
        'date': '2024-01-15',
        'excerpt': 'Краткое описание',
        'content': '<p>Полный текст статьи</p>',
        'image': None,
        'active': True
    }


@pytest.fixture
def sample_faq():
    """Sample valid FAQ data"""
    return {
        'id': 'faq_test',
        'question': 'Как записаться?',
        'answer': 'Позвоните нам или оставьте заявку на сайте.'
    }


@pytest.fixture
def sample_principle():
    """Sample valid principle data"""
    return {
        'id': 'principle_test',
        'title': 'Качество',
        'description': 'Мы гарантируем высокое качество услуг',
        'icon': 'check',
        'image': None
    }
