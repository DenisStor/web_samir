"""
SQLite storage для Say's Barbers API.
Замена JSONStorage с тем же интерфейсом: read/write/update.
"""

import sqlite3
import json
import threading
import logging
from pathlib import Path

logger = logging.getLogger('saysbarbers')

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS masters (
    id TEXT PRIMARY KEY,
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_categories (
    id TEXT PRIMARY KEY,
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS podology_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS podology_categories (
    id TEXT PRIMARY KEY,
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_categories (
    id TEXT PRIMARY KEY,
    slug TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS faq (
    id TEXT PRIMARY KEY,
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS legal (
    id TEXT PRIMARY KEY,
    slug TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS social_links (
    id TEXT PRIMARY KEY,
    sort_order INTEGER DEFAULT 0,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stats_counters (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stats_daily (
    date TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stats_sections (
    name TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stats_sessions (
    date TEXT NOT NULL,
    session_id TEXT NOT NULL,
    PRIMARY KEY (date, session_id)
);

CREATE INDEX IF NOT EXISTS idx_legal_slug ON legal(slug);
CREATE INDEX IF NOT EXISTS idx_legal_active ON legal(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_shop_categories_slug ON shop_categories(slug);
"""


class Database:
    """SQLite storage с интерфейсом, совместимым с JSONStorage."""

    def __init__(self, db_path='data/saysbarbers.db'):
        self.db_path = str(db_path)
        self._write_lock = threading.Lock()
        self._local = threading.local()

        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _get_connection(self):
        """Thread-local соединение с БД."""
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            conn = sqlite3.connect(self.db_path, check_same_thread=False)
            conn.execute('PRAGMA journal_mode=WAL')
            conn.execute('PRAGMA foreign_keys=ON')
            conn.row_factory = sqlite3.Row
            self._local.conn = conn
        return self._local.conn

    def _init_schema(self):
        """Создание таблиц при первом подключении."""
        conn = self._get_connection()
        conn.executescript(SCHEMA_SQL)
        conn.commit()

    @staticmethod
    def _normalize_resource(filename):
        """'masters.json' → 'masters'"""
        name = filename
        if name.endswith('.json'):
            name = name[:-5]
        return name

    def _get_lock(self, filename):
        """Совместимость с JSONStorage API."""
        return self._write_lock

    def read(self, filename, default=None):
        """Чтение данных в JSON-совместимом формате."""
        if default is None:
            default = {}
        resource = self._normalize_resource(filename)
        reader = self._READERS.get(resource)
        if reader:
            try:
                result = reader(self)
                return result if result else default
            except Exception:
                logger.exception("Database read error for %s", resource)
                return default
        return default

    def write(self, filename, data):
        """Запись данных из JSON-совместимого формата."""
        with self._write_lock:
            return self._write_impl(filename, data)

    def _write_impl(self, filename, data):
        """Внутренняя запись без блокировки."""
        resource = self._normalize_resource(filename)
        writer = self._WRITERS.get(resource)
        if writer:
            try:
                writer(self, data)
                return True
            except Exception:
                logger.exception("Database write error for %s", resource)
                raise
        return False

    def update(self, filename, updater_func, default=None):
        """Атомарное чтение-модификация-запись."""
        if default is None:
            default = {}
        with self._write_lock:
            data = self.read(filename, default)
            updated = updater_func(data)
            self._write_impl(filename, updated)
            return updated

    # =========================================================================
    # Readers
    # =========================================================================

    def _read_masters(self):
        conn = self._get_connection()
        rows = conn.execute(
            'SELECT data FROM masters ORDER BY sort_order, rowid'
        ).fetchall()
        return {'masters': [json.loads(r['data']) for r in rows]}

    def _read_services(self):
        conn = self._get_connection()

        cat_rows = conn.execute(
            'SELECT data FROM service_categories ORDER BY sort_order, rowid'
        ).fetchall()
        categories = [json.loads(r['data']) for r in cat_rows]

        meta_rows = conn.execute(
            'SELECT key, value FROM podology_meta'
        ).fetchall()
        podology = {r['key']: r['value'] for r in meta_rows}

        pod_rows = conn.execute(
            'SELECT data FROM podology_categories ORDER BY sort_order, rowid'
        ).fetchall()
        podology['categories'] = [json.loads(r['data']) for r in pod_rows]

        result = {'categories': categories}
        has_podology = len(meta_rows) > 0 or len(pod_rows) > 0
        if has_podology:
            result['podology'] = podology

        return result

    def _read_articles(self):
        conn = self._get_connection()
        rows = conn.execute(
            'SELECT data FROM articles ORDER BY sort_order, rowid'
        ).fetchall()
        return {'articles': [json.loads(r['data']) for r in rows]}

    def _read_products(self):
        conn = self._get_connection()
        rows = conn.execute(
            'SELECT data FROM products ORDER BY sort_order, rowid'
        ).fetchall()
        return {'products': [json.loads(r['data']) for r in rows]}

    def _read_shop_categories(self):
        conn = self._get_connection()
        rows = conn.execute(
            'SELECT data FROM shop_categories ORDER BY sort_order, rowid'
        ).fetchall()
        return {'categories': [json.loads(r['data']) for r in rows]}

    def _read_faq(self):
        conn = self._get_connection()
        rows = conn.execute(
            'SELECT data FROM faq ORDER BY sort_order, rowid'
        ).fetchall()
        return {'faq': [json.loads(r['data']) for r in rows]}

    def _read_legal(self):
        conn = self._get_connection()
        rows = conn.execute(
            'SELECT data FROM legal ORDER BY sort_order, rowid'
        ).fetchall()
        return {'documents': [json.loads(r['data']) for r in rows]}

    def _read_social(self):
        conn = self._get_connection()

        rows = conn.execute(
            'SELECT data FROM social_links ORDER BY sort_order, rowid'
        ).fetchall()
        social = [json.loads(r['data']) for r in rows]

        result = {'social': social}

        contact_rows = conn.execute(
            'SELECT key, value FROM contacts'
        ).fetchall()
        for r in contact_rows:
            result[r['key']] = r['value']

        return result

    def _read_stats(self):
        conn = self._get_connection()
        result = {'total_views': 0, 'unique_visitors': 0}

        counter_rows = conn.execute(
            'SELECT key, value FROM stats_counters'
        ).fetchall()
        for r in counter_rows:
            key, value = r['key'], r['value']
            if key in ('total_views', 'unique_visitors'):
                try:
                    result[key] = int(value)
                except (ValueError, TypeError):
                    result[key] = 0
            else:
                result[key] = value

        daily_rows = conn.execute(
            'SELECT date, count FROM stats_daily'
        ).fetchall()
        result['daily'] = {r['date']: r['count'] for r in daily_rows}

        section_rows = conn.execute(
            'SELECT name, count FROM stats_sections'
        ).fetchall()
        result['sections'] = {r['name']: r['count'] for r in section_rows}

        session_rows = conn.execute(
            'SELECT date, session_id FROM stats_sessions ORDER BY date'
        ).fetchall()
        sessions = {}
        for r in session_rows:
            d = r['date']
            if d not in sessions:
                sessions[d] = []
            sessions[d].append(r['session_id'])
        result['sessions'] = sessions

        return result

    # =========================================================================
    # Writers
    # =========================================================================

    def _write_masters(self, data):
        conn = self._get_connection()
        masters = data.get('masters', [])
        conn.execute('DELETE FROM masters')
        for i, m in enumerate(masters):
            conn.execute(
                'INSERT INTO masters (id, sort_order, data) VALUES (?, ?, ?)',
                (m.get('id', ''), i, json.dumps(m, ensure_ascii=False))
            )
        conn.commit()

    def _write_services(self, data):
        conn = self._get_connection()

        categories = data.get('categories', [])
        conn.execute('DELETE FROM service_categories')
        for i, cat in enumerate(categories):
            conn.execute(
                'INSERT INTO service_categories (id, sort_order, data) VALUES (?, ?, ?)',
                (cat.get('id', str(i)), i, json.dumps(cat, ensure_ascii=False))
            )

        podology = data.get('podology', {})
        conn.execute('DELETE FROM podology_meta')
        conn.execute('DELETE FROM podology_categories')

        if podology:
            for key in ('title', 'description'):
                if key in podology:
                    conn.execute(
                        'INSERT INTO podology_meta (key, value) VALUES (?, ?)',
                        (key, str(podology[key]))
                    )

            pod_cats = podology.get('categories', [])
            for i, cat in enumerate(pod_cats):
                conn.execute(
                    'INSERT INTO podology_categories (id, sort_order, data) VALUES (?, ?, ?)',
                    (cat.get('id', str(i)), i, json.dumps(cat, ensure_ascii=False))
                )

        conn.commit()

    def _write_articles(self, data):
        conn = self._get_connection()
        articles = data.get('articles', [])
        conn.execute('DELETE FROM articles')
        for i, a in enumerate(articles):
            conn.execute(
                'INSERT INTO articles (id, sort_order, data) VALUES (?, ?, ?)',
                (a.get('id', ''), i, json.dumps(a, ensure_ascii=False))
            )
        conn.commit()

    def _write_products(self, data):
        conn = self._get_connection()
        products = data.get('products', [])
        conn.execute('DELETE FROM products')
        for i, p in enumerate(products):
            conn.execute(
                'INSERT INTO products (id, category_id, status, sort_order, data) '
                'VALUES (?, ?, ?, ?, ?)',
                (p.get('id', ''), p.get('categoryId', ''),
                 p.get('status', 'active'), p.get('order', i),
                 json.dumps(p, ensure_ascii=False))
            )
        conn.commit()

    def _write_shop_categories(self, data):
        conn = self._get_connection()
        categories = data.get('categories', [])
        conn.execute('DELETE FROM shop_categories')
        for i, c in enumerate(categories):
            conn.execute(
                'INSERT INTO shop_categories (id, slug, sort_order, data) '
                'VALUES (?, ?, ?, ?)',
                (c.get('id', ''), c.get('slug', ''), c.get('order', i),
                 json.dumps(c, ensure_ascii=False))
            )
        conn.commit()

    def _write_faq(self, data):
        conn = self._get_connection()
        items = data.get('faq', data.get('items', []))
        conn.execute('DELETE FROM faq')
        for i, item in enumerate(items):
            conn.execute(
                'INSERT INTO faq (id, sort_order, data) VALUES (?, ?, ?)',
                (item.get('id', ''), i, json.dumps(item, ensure_ascii=False))
            )
        conn.commit()

    def _write_legal(self, data):
        conn = self._get_connection()
        documents = data.get('documents', [])
        conn.execute('DELETE FROM legal')
        for i, doc in enumerate(documents):
            conn.execute(
                'INSERT INTO legal (id, slug, active, sort_order, data) '
                'VALUES (?, ?, ?, ?, ?)',
                (doc.get('id', ''), doc.get('slug', ''),
                 1 if doc.get('active', True) else 0, i,
                 json.dumps(doc, ensure_ascii=False))
            )
        conn.commit()

    def _write_social(self, data):
        conn = self._get_connection()

        social = data.get('social', [])
        conn.execute('DELETE FROM social_links')
        for i, link in enumerate(social):
            conn.execute(
                'INSERT INTO social_links (id, sort_order, data) VALUES (?, ?, ?)',
                (link.get('id', ''), i, json.dumps(link, ensure_ascii=False))
            )

        conn.execute('DELETE FROM contacts')
        for key in ('phone', 'email', 'address'):
            if key in data:
                conn.execute(
                    'INSERT INTO contacts (key, value) VALUES (?, ?)',
                    (key, str(data[key]))
                )

        conn.commit()

    def _write_stats(self, data):
        conn = self._get_connection()

        conn.execute('DELETE FROM stats_counters')
        for key in ('total_views', 'unique_visitors', 'created', 'last_visit'):
            if key in data:
                conn.execute(
                    'INSERT INTO stats_counters (key, value) VALUES (?, ?)',
                    (key, str(data[key]))
                )

        conn.execute('DELETE FROM stats_daily')
        for date, count in data.get('daily', {}).items():
            conn.execute(
                'INSERT INTO stats_daily (date, count) VALUES (?, ?)',
                (date, int(count))
            )

        conn.execute('DELETE FROM stats_sections')
        for name, count in data.get('sections', {}).items():
            conn.execute(
                'INSERT INTO stats_sections (name, count) VALUES (?, ?)',
                (name, int(count))
            )

        conn.execute('DELETE FROM stats_sessions')
        for date, ids in data.get('sessions', {}).items():
            for sid in ids:
                conn.execute(
                    'INSERT INTO stats_sessions (date, session_id) VALUES (?, ?)',
                    (date, str(sid))
                )

        conn.commit()

    # =========================================================================
    # Прямые запросы (оптимизация)
    # =========================================================================

    def get_legal_by_slug(self, slug):
        """Получение юридического документа по slug."""
        conn = self._get_connection()
        row = conn.execute(
            'SELECT data FROM legal WHERE slug = ? AND active = 1',
            (slug,)
        ).fetchone()
        if row:
            return json.loads(row['data'])
        return None

    def get_product_by_id(self, product_id):
        """Получение товара по ID."""
        conn = self._get_connection()
        row = conn.execute(
            'SELECT data FROM products WHERE id = ?',
            (product_id,)
        ).fetchone()
        if row:
            return json.loads(row['data'])
        return None

    def get_products_filtered(self, category_slug=None, status='active'):
        """Получение товаров с фильтрацией."""
        conn = self._get_connection()
        params = []

        if category_slug:
            query = (
                'SELECT p.data FROM products p '
                'JOIN shop_categories c ON p.category_id = c.id '
                'WHERE c.slug = ?'
            )
            params.append(category_slug)
            if status:
                query += ' AND p.status = ?'
                params.append(status)
            query += ' ORDER BY p.sort_order, p.rowid'
        else:
            query = 'SELECT data FROM products'
            conditions = []
            if status:
                conditions.append('status = ?')
                params.append(status)
            if conditions:
                query += ' WHERE ' + ' AND '.join(conditions)
            query += ' ORDER BY sort_order, rowid'

        rows = conn.execute(query, params).fetchall()
        return [json.loads(r['data']) for r in rows]

    # =========================================================================
    # Маппинг ресурсов
    # =========================================================================

    _READERS = {
        'masters': _read_masters,
        'services': _read_services,
        'articles': _read_articles,
        'products': _read_products,
        'shop-categories': _read_shop_categories,
        'faq': _read_faq,
        'legal': _read_legal,
        'social': _read_social,
        'stats': _read_stats,
    }

    _WRITERS = {
        'masters': _write_masters,
        'services': _write_services,
        'articles': _write_articles,
        'products': _write_products,
        'shop-categories': _write_shop_categories,
        'faq': _write_faq,
        'legal': _write_legal,
        'social': _write_social,
        'stats': _write_stats,
    }
