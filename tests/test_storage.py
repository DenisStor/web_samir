"""
Tests for server/storage.py — JSONStorage, Repository, atomic_write_json
"""

import pytest
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.storage import JSONStorage, Repository, atomic_write_json


# =============================================================================
# JSONStorage — read
# =============================================================================

class TestJSONStorageRead:

    def test_read_existing_file(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        data = {'masters': [{'id': 'master_1', 'name': 'Test'}]}
        (tmp_path / 'test.json').write_text(json.dumps(data), encoding='utf-8')

        result = storage.read('test.json')
        assert result == data

    def test_read_nonexistent_default(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        result = storage.read('nonexistent.json')
        assert result == {}

    def test_read_nonexistent_custom_default(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        result = storage.read('nonexistent.json', default=[])
        assert result == []

    def test_read_corrupted_json_default(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        (tmp_path / 'bad.json').write_text('not valid json{{{', encoding='utf-8')
        result = storage.read('bad.json', default={'fallback': True})
        assert result == {'fallback': True}

    def test_read_empty_file_default(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        (tmp_path / 'empty.json').write_text('', encoding='utf-8')
        result = storage.read('empty.json')
        assert result == {}


# =============================================================================
# JSONStorage — write
# =============================================================================

class TestJSONStorageWrite:

    def test_write_creates_file(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        data = {'key': 'value'}
        result = storage.write('new.json', data)
        assert result is True
        assert (tmp_path / 'new.json').exists()
        saved = json.loads((tmp_path / 'new.json').read_text(encoding='utf-8'))
        assert saved == data

    def test_write_overwrites(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        storage.write('file.json', {'old': True})
        storage.write('file.json', {'new': True})
        saved = json.loads((tmp_path / 'file.json').read_text(encoding='utf-8'))
        assert saved == {'new': True}

    def test_write_no_tmp_left(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        storage.write('file.json', {'data': True})
        tmp_files = list(tmp_path.glob('*.tmp'))
        assert len(tmp_files) == 0

    def test_write_russian_encoding(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        data = {'name': 'Тестовый мастер', 'role': 'Барбер'}
        storage.write('russian.json', data)
        content = (tmp_path / 'russian.json').read_text(encoding='utf-8')
        assert 'Тестовый мастер' in content
        assert '\\u' not in content  # ensure_ascii=False


# =============================================================================
# JSONStorage — update
# =============================================================================

class TestJSONStorageUpdate:

    def test_update_nonexistent_creates(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))

        def updater(data):
            data['counter'] = 1
            return data

        result = storage.update('new.json', updater)
        assert result == {'counter': 1}
        assert (tmp_path / 'new.json').exists()

    def test_update_existing(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        storage.write('file.json', {'counter': 5})

        def updater(data):
            data['counter'] += 1
            return data

        result = storage.update('file.json', updater)
        assert result == {'counter': 6}

    def test_update_returns_result(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))

        def updater(data):
            return {'completely': 'new'}

        result = storage.update('file.json', updater)
        assert result == {'completely': 'new'}

    def test_update_with_custom_default(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))

        def updater(data):
            data.append('item')
            return data

        result = storage.update('list.json', updater, default=[])
        assert result == ['item']


# =============================================================================
# JSONStorage — locking
# =============================================================================

class TestJSONStorageLocking:

    def test_same_file_same_lock(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        lock1 = storage._get_lock('file.json')
        lock2 = storage._get_lock('file.json')
        assert lock1 is lock2

    def test_different_file_different_lock(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        lock1 = storage._get_lock('file1.json')
        lock2 = storage._get_lock('file2.json')
        assert lock1 is not lock2


# =============================================================================
# Repository
# =============================================================================

class TestRepository:

    def test_get_all_with_key(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        storage.write('masters.json', {'masters': [{'id': '1'}, {'id': '2'}]})
        repo = Repository(storage, 'masters.json', collection_key='masters')
        result = repo.get_all()
        assert len(result) == 2

    def test_get_all_without_key(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        data = {'total': 100, 'daily': {}}
        storage.write('stats.json', data)
        repo = Repository(storage, 'stats.json')
        result = repo.get_all()
        assert result == data

    def test_get_by_id_found(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        items = [{'id': 'a', 'name': 'A'}, {'id': 'b', 'name': 'B'}]
        storage.write('items.json', {'items': items})
        repo = Repository(storage, 'items.json', collection_key='items')
        result = repo.get_by_id('b')
        assert result['name'] == 'B'

    def test_get_by_id_not_found(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        storage.write('items.json', {'items': [{'id': 'a'}]})
        repo = Repository(storage, 'items.json', collection_key='items')
        result = repo.get_by_id('nonexistent')
        assert result is None

    def test_get_by_id_dict(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        storage.write('stats.json', {'total': 100})
        repo = Repository(storage, 'stats.json')
        result = repo.get_by_id('total')
        assert result == 100

    def test_save_all_with_key(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        storage.write('masters.json', {'masters': [], 'meta': 'keep'})
        repo = Repository(storage, 'masters.json', collection_key='masters')
        repo.save_all([{'id': 'new'}])
        data = storage.read('masters.json')
        assert data['masters'] == [{'id': 'new'}]
        assert data['meta'] == 'keep'

    def test_save_all_without_key(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        repo = Repository(storage, 'stats.json')
        repo.save_all({'total': 200})
        data = storage.read('stats.json')
        assert data == {'total': 200}

    def test_save_raw(self, tmp_path):
        storage = JSONStorage(data_dir=str(tmp_path))
        repo = Repository(storage, 'raw.json')
        repo.save_raw({'any': 'data'})
        data = storage.read('raw.json')
        assert data == {'any': 'data'}


# =============================================================================
# atomic_write_json
# =============================================================================

class TestAtomicWriteJson:

    def test_standalone_write(self, tmp_path):
        filepath = tmp_path / 'atomic.json'
        result = atomic_write_json(filepath, {'key': 'value'})
        assert result is True
        data = json.loads(filepath.read_text(encoding='utf-8'))
        assert data == {'key': 'value'}

    def test_no_tmp_left_after_write(self, tmp_path):
        filepath = tmp_path / 'atomic.json'
        atomic_write_json(filepath, {'data': True})
        tmp_files = list(tmp_path.glob('*.tmp'))
        assert len(tmp_files) == 0

    def test_cleanup_on_error(self, tmp_path):
        filepath = tmp_path / 'atomic.json'

        class BadObj:
            pass

        with pytest.raises(TypeError):
            atomic_write_json(filepath, BadObj())

        tmp_files = list(tmp_path.glob('*.tmp'))
        assert len(tmp_files) == 0
