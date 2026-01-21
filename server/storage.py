"""
Модуль хранения данных для Say's Barbers API.
Thread-safe JSON storage с атомарной записью.
"""

import json
import threading
from pathlib import Path


class JSONStorage:
    """Thread-safe JSON storage с атомарной записью."""

    def __init__(self, data_dir='data'):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self._file_locks = {}
        self._locks_lock = threading.Lock()

    def _get_lock(self, filename):
        """Получение блокировки для файла (thread-safe)."""
        with self._locks_lock:
            if filename not in self._file_locks:
                self._file_locks[filename] = threading.Lock()
            return self._file_locks[filename]

    def read(self, filename, default=None):
        """Чтение JSON файла."""
        filepath = self.data_dir / filename
        if default is None:
            default = {}
        try:
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return default
        except (json.JSONDecodeError, IOError):
            return default

    def write(self, filename, data):
        """Атомарная запись JSON файла с блокировкой."""
        lock = self._get_lock(filename)
        filepath = self.data_dir / filename
        temp_filepath = filepath.with_suffix('.tmp')

        with lock:
            try:
                with open(temp_filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                temp_filepath.replace(filepath)
                return True
            except Exception:
                if temp_filepath.exists():
                    temp_filepath.unlink()
                raise

    def update(self, filename, updater_func, default=None):
        """
        Атомарное чтение-модификация-запись с блокировкой.
        updater_func получает текущие данные и возвращает обновлённые.
        """
        lock = self._get_lock(filename)
        filepath = self.data_dir / filename
        temp_filepath = filepath.with_suffix('.tmp')

        if default is None:
            default = {}

        with lock:
            try:
                # Читаем текущие данные
                if filepath.exists():
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                else:
                    data = default

                # Применяем обновление
                updated_data = updater_func(data)

                # Атомарная запись
                with open(temp_filepath, 'w', encoding='utf-8') as f:
                    json.dump(updated_data, f, ensure_ascii=False, indent=2)
                temp_filepath.replace(filepath)

                return updated_data
            except Exception:
                if temp_filepath.exists():
                    temp_filepath.unlink()
                raise


class Repository:
    """Базовый репозиторий для работы с коллекциями сущностей."""

    def __init__(self, storage, filename, collection_key=None):
        self.storage = storage
        self.filename = filename
        self.collection_key = collection_key

    def get_all(self):
        """Получение всех записей."""
        data = self.storage.read(self.filename, {})
        if self.collection_key:
            return data.get(self.collection_key, [])
        return data

    def get_by_id(self, item_id):
        """Получение записи по ID."""
        items = self.get_all()
        if isinstance(items, list):
            return next((item for item in items if item.get('id') == item_id), None)
        return items.get(item_id)

    def save_all(self, items):
        """Сохранение всех записей."""
        if self.collection_key:
            data = self.storage.read(self.filename, {})
            data[self.collection_key] = items
            return self.storage.write(self.filename, data)
        return self.storage.write(self.filename, items)

    def save_raw(self, data):
        """Сохранение данных как есть."""
        return self.storage.write(self.filename, data)


# Глобальный экземпляр storage
_storage = None


def get_storage():
    """Получение глобального экземпляра storage."""
    global _storage
    if _storage is None:
        _storage = JSONStorage()
    return _storage


def atomic_write_json(filepath, data):
    """
    Атомарная запись JSON в файл.
    Standalone функция для обратной совместимости.
    """
    filepath = Path(filepath)
    temp_filepath = filepath.with_suffix('.tmp')
    try:
        with open(temp_filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        temp_filepath.replace(filepath)
        return True
    except Exception:
        if temp_filepath.exists():
            temp_filepath.unlink()
        raise
