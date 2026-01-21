#!/usr/bin/env python3
"""
Build script для сборки HTML страниц из секций и admin.bundle.js из модулей.

Использование:
    python3 build.py                    # Собрать все страницы и admin.bundle.js
    python3 build.py --watch            # Собрать и следить за изменениями
    python3 build.py --admin-only       # Собрать только admin.bundle.js
    python3 build.py --page=index       # Собрать только index.html
    python3 build.py --page=shop        # Собрать только shop.html
    python3 build.py --page=admin       # Собрать только admin.html
    python3 build.py --page=legal       # Собрать только legal.html
    python3 build.py --list-pages       # Показать список страниц

Порядок секций определён в PAGES.
Порядок модулей admin определён в ADMIN_MODULES.
"""

import hashlib
import os
import re
import sys
import time
from pathlib import Path

# Конфигурация страниц
PAGES = {
    'index': {
        'sections_dir': 'index',
        'sections': [
            'head.html',
            'navigation.html',
            'marquee.html',
            'hero.html',
            'services.html',
            'podology.html',
            'masters.html',
            'location.html',
            'social.html',
            'blog.html',
            'faq.html',
            'booking.html',
            'blog-modal.html',
            'footer.html',
            'scripts.html',
        ],
        'output': 'index.html',
    },
    'shop': {
        'sections_dir': 'shop',
        'sections': [
            'head.html',
            'navigation.html',
            'main.html',
            'footer.html',
            'lightbox.html',
            'mobile-filter.html',
            'scripts.html',
        ],
        'output': 'shop.html',
    },
    'admin': {
        'sections_dir': 'admin',
        'sections': [
            'head.html',
            'svg-sprite.html',
            'login.html',
            'sidebar.html',
            'content.html',
            'modals.html',
            'scripts.html',
        ],
        'output': 'admin.html',
    },
    'legal': {
        'sections_dir': 'legal',
        'sections': [
            'head.html',
            'header.html',
            'main.html',
            'footer.html',
            'scripts.html',
        ],
        'output': 'legal.html',
    },
}

# Shared модули для всех страниц (включая admin)
# Эти модули загружаются первыми
SHARED_MODULES = [
    'config.js',
    'helpers.js',
]

# Порядок модулей admin для сборки admin.bundle.js
# ВАЖНО: порядок имеет значение - зависимости должны идти раньше зависящих модулей
ADMIN_MODULES = [
    # Core modules (без зависимостей)
    'state.js',
    'toast.js',
    'api.js',
    'auth.js',
    'navigation.js',
    'modals.js',
    'image-upload.js',
    'image-handler.js',  # Новый модуль для обработки изображений
    'wysiwyg.js',
    'dragdrop.js',
    'validation.js',
    'search.js',
    'router.js',  # Роутинг админки
    'event-handlers.js',  # Обработчики событий

    # Renderers
    'renderers/base-renderer.js',  # Базовый модуль для renderers
    'renderers/stats.js',
    'renderers/masters.js',
    'renderers/services.js',
    'renderers/articles.js',
    'renderers/faq.js',
    'renderers/social.js',
    'renderers/shop-categories.js',
    'renderers/shop-products.js',
    'renderers/legal.js',

    # Forms
    'forms/master-form.js',
    'forms/service-form.js',
    'forms/podology-category-form.js',
    'forms/article-form.js',
    'forms/faq-form.js',
    'forms/category-form.js',
    'forms/product-form.js',
    'forms/legal-form.js',

    # Main entry point (последний, зависит от всех)
    'index.js',
]

# Пути
BASE_DIR = Path(__file__).parent.parent  # Корень проекта (на уровень выше scripts/)
SRC_DIR = BASE_DIR / 'src'
SECTIONS_DIR = SRC_DIR / 'sections'
SHARED_MODULES_DIR = SRC_DIR / 'js' / 'shared'
ADMIN_MODULES_DIR = SRC_DIR / 'js' / 'admin'
ADMIN_BUNDLE_FILE = SRC_DIR / 'js' / 'admin.bundle.js'

# CSS файлы с @import (требуют рекурсивного хеша)
CSS_BUNDLES = {
    '/src/css/shared/index.css',
    '/src/css/site/index.css',
    '/src/css/shop/index.css',
    '/src/css/admin/index.css',
    '/src/css/legal/index.css',
}


def get_file_hash(filepath, length=8):
    """Вычисляет MD5 хеш файла."""
    if not filepath.exists():
        return None
    content = filepath.read_bytes()
    return hashlib.md5(content).hexdigest()[:length]


def get_css_bundle_hash(css_path, length=8):
    """Хеширует CSS с учётом всех @import."""
    if not css_path.exists():
        return None

    hasher = hashlib.md5()
    visited = set()

    def process_file(filepath):
        if filepath in visited or not filepath.exists():
            return
        visited.add(filepath)

        content = filepath.read_text(encoding='utf-8')
        hasher.update(content.encode('utf-8'))

        # Парсим @import
        import_pattern = r"@import\s+['\"]([^'\"]+)['\"]"
        for match in re.finditer(import_pattern, content):
            import_path = filepath.parent / match.group(1)
            process_file(import_path)

    process_file(css_path)
    return hasher.hexdigest()[:length]


def update_asset_versions(html, base_dir):
    """Заменяет ?v=X.X на ?v={hash} для CSS и JS."""

    def replace_version(match):
        attr = match.group(1)   # href или src
        path = match.group(2)   # /src/css/... или /src/js/...
        filepath = base_dir / path.lstrip('/')

        if path in CSS_BUNDLES:
            file_hash = get_css_bundle_hash(filepath)
        else:
            file_hash = get_file_hash(filepath)

        if file_hash:
            return '{}="{}"'.format(attr, path + '?v=' + file_hash)
        return match.group(0)

    pattern = r'(href|src)="(/src/(?:css|js)/[^"]+)\?v=[^"]*"'
    return re.sub(pattern, replace_version, html)


def build_page(page_name):
    """Собирает HTML страницу из секций."""
    if page_name not in PAGES:
        print(f'❌ Неизвестная страница: {page_name}')
        print(f'   Доступные: {", ".join(PAGES.keys())}')
        return None

    config = PAGES[page_name]
    sections_dir = SECTIONS_DIR / config['sections_dir']
    output_file = BASE_DIR / config['output']

    parts = []

    for section in config['sections']:
        section_path = sections_dir / section
        if not section_path.exists():
            print(f'⚠️  [{page_name}] Секция не найдена: {section}')
            continue

        content = section_path.read_text(encoding='utf-8')
        parts.append(content)

    # Собираем финальный HTML
    html = '\n'.join(parts)

    # Автоматический cache busting
    html = update_asset_versions(html, BASE_DIR)

    # Записываем результат
    output_file.write_text(html, encoding='utf-8')
    print(f'✅ Собран {config["output"]} ({len(html):,} байт)')

    return html


def build_all_pages():
    """Собирает все HTML страницы."""
    for page_name in PAGES:
        build_page(page_name)


def build_admin():
    """Собирает admin.bundle.js из модулей."""
    parts = []

    # Заголовок бандла
    header = '''/**
 * Say's Barbers Admin Panel Bundle
 * Auto-generated by build.py - DO NOT EDIT DIRECTLY
 * Edit individual modules in src/js/admin/ instead
 */

'''
    parts.append(header)

    # Сначала добавляем shared модули
    for module in SHARED_MODULES:
        module_path = SHARED_MODULES_DIR / module
        if not module_path.exists():
            print(f'⚠️  Shared модуль не найден: {module}')
            continue

        content = module_path.read_text(encoding='utf-8')
        parts.append(f'\n// ============= shared/{module} =============\n')
        parts.append(content)

    # Затем admin модули
    for module in ADMIN_MODULES:
        module_path = ADMIN_MODULES_DIR / module
        if not module_path.exists():
            print(f'⚠️  Модуль не найден: {module}')
            continue

        content = module_path.read_text(encoding='utf-8')
        # Добавляем комментарий с именем файла для отладки
        parts.append(f'\n// ============= {module} =============\n')
        parts.append(content)

    # Собираем бандл
    bundle = '\n'.join(parts)

    # Записываем результат
    ADMIN_BUNDLE_FILE.write_text(bundle, encoding='utf-8')
    total_modules = len(SHARED_MODULES) + len(ADMIN_MODULES)
    print(f'✅ Собран admin.bundle.js ({len(bundle):,} байт, {total_modules} модулей)')

    return bundle


def get_admin_modules_mtime():
    """Возвращает максимальное время модификации admin и shared модулей."""
    max_mtime = 0

    # Проверяем shared модули
    for module in SHARED_MODULES:
        module_path = SHARED_MODULES_DIR / module
        if module_path.exists():
            mtime = module_path.stat().st_mtime
            if mtime > max_mtime:
                max_mtime = mtime

    # Проверяем admin модули
    for module in ADMIN_MODULES:
        module_path = ADMIN_MODULES_DIR / module
        if module_path.exists():
            mtime = module_path.stat().st_mtime
            if mtime > max_mtime:
                max_mtime = mtime

    return max_mtime


def get_page_sections_mtime(page_name):
    """Возвращает максимальное время модификации секций страницы."""
    if page_name not in PAGES:
        return 0

    config = PAGES[page_name]
    sections_dir = SECTIONS_DIR / config['sections_dir']
    max_mtime = 0

    for section in config['sections']:
        section_path = sections_dir / section
        if section_path.exists():
            mtime = section_path.stat().st_mtime
            if mtime > max_mtime:
                max_mtime = mtime
    return max_mtime


def watch():
    """Следит за изменениями в секциях всех страниц и admin модулях."""
    print('👀 Режим наблюдения. Нажмите Ctrl+C для выхода.')
    print(f'   Отслеживаемые страницы: {", ".join(PAGES.keys())}')

    # Инициализация времени модификации для всех страниц
    last_page_mtimes = {page: 0 for page in PAGES}
    last_admin_mtime = 0

    try:
        while True:
            # Проверка секций каждой страницы
            for page_name in PAGES:
                current_mtime = get_page_sections_mtime(page_name)
                if current_mtime > last_page_mtimes[page_name]:
                    if last_page_mtimes[page_name] > 0:
                        print(f'🔄 [{page_name}] Обнаружены изменения, пересборка...')
                    build_page(page_name)
                    last_page_mtimes[page_name] = current_mtime

            # Проверка admin модулей
            current_admin_mtime = get_admin_modules_mtime()
            if current_admin_mtime > last_admin_mtime:
                if last_admin_mtime > 0:
                    print('🔄 Обнаружены изменения в admin модулях, пересборка...')
                build_admin()
                last_admin_mtime = current_admin_mtime

            time.sleep(1)
    except KeyboardInterrupt:
        print('\n👋 Наблюдение остановлено.')


def list_pages():
    """Выводит список доступных страниц."""
    print('📄 Доступные страницы:')
    for page_name, config in PAGES.items():
        sections_count = len(config['sections'])
        print(f'   • {page_name:10} → {config["output"]:15} ({sections_count} секций)')


def build_all():
    """Собирает все страницы и admin.bundle.js."""
    build_all_pages()
    build_admin()


# Для обратной совместимости
def build():
    """Собирает только index.html (для обратной совместимости)."""
    return build_page('index')


def get_sections_mtime():
    """Возвращает mtime для index страницы (обратная совместимость)."""
    return get_page_sections_mtime('index')


if __name__ == '__main__':
    # Парсинг аргументов
    args = sys.argv[1:]

    if '--list-pages' in args:
        list_pages()
    elif '--watch' in args or '-w' in args:
        build_all()
        watch()
    elif '--admin-only' in args:
        build_admin()
    elif '--html-only' in args:
        build_all_pages()
    else:
        # Проверка --page=xxx
        page_arg = None
        for arg in args:
            if arg.startswith('--page='):
                page_arg = arg.split('=', 1)[1]
                break

        if page_arg:
            build_page(page_arg)
        else:
            build_all()
