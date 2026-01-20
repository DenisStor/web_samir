#!/usr/bin/env python3
"""
Скрипт оптимизации изображений.
Требует: pip install Pillow

Использование:
    python3 scripts/optimize-images.py           # Оптимизировать все
    python3 scripts/optimize-images.py --dry-run # Показать что будет сделано
"""

import os
import sys
from pathlib import Path

UPLOADS_DIR = Path(__file__).parent.parent / 'uploads'
MAX_SIZE = 1200  # Максимальный размер по большей стороне
JPEG_QUALITY = 85
PNG_QUALITY = 85


def get_image_size(filepath):
    """Получить размер файла в человекочитаемом формате"""
    size = os.path.getsize(filepath)
    for unit in ['B', 'KB', 'MB']:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def optimize_image(filepath, dry_run=False):
    """Оптимизировать одно изображение"""
    try:
        from PIL import Image
    except ImportError:
        print("Ошибка: Pillow не установлен. Запустите: pip install Pillow")
        sys.exit(1)

    original_size = os.path.getsize(filepath)

    with Image.open(filepath) as img:
        width, height = img.size

        # Пропускаем маленькие изображения
        if max(width, height) <= MAX_SIZE and original_size < 500000:  # 500KB
            return None

        # Вычисляем новый размер
        if width > height:
            new_width = min(width, MAX_SIZE)
            new_height = int(height * (new_width / width))
        else:
            new_height = min(height, MAX_SIZE)
            new_width = int(width * (new_height / height))

        if dry_run:
            return {
                'file': filepath.name,
                'original_size': original_size,
                'dimensions': f"{width}x{height} -> {new_width}x{new_height}"
            }

        # Ресайз
        if (new_width, new_height) != (width, height):
            img = img.resize((new_width, new_height), Image.LANCZOS)

        # Сохраняем
        ext = filepath.suffix.lower()
        if ext in ['.jpg', '.jpeg']:
            img = img.convert('RGB')
            img.save(filepath, 'JPEG', quality=JPEG_QUALITY, optimize=True)
        elif ext == '.png':
            img.save(filepath, 'PNG', optimize=True)
        elif ext == '.webp':
            img.save(filepath, 'WEBP', quality=JPEG_QUALITY)

        new_size = os.path.getsize(filepath)
        return {
            'file': filepath.name,
            'original_size': original_size,
            'new_size': new_size,
            'saved': original_size - new_size
        }


def main():
    dry_run = '--dry-run' in sys.argv

    if not UPLOADS_DIR.exists():
        print(f"Папка {UPLOADS_DIR} не найдена")
        sys.exit(1)

    # Собираем изображения
    images = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp']:
        images.extend(UPLOADS_DIR.glob(ext))

    if not images:
        print("Изображения не найдены")
        return

    print(f"{'[DRY RUN] ' if dry_run else ''}Найдено {len(images)} изображений\n")

    total_saved = 0
    optimized = 0

    for img_path in sorted(images, key=lambda p: os.path.getsize(p), reverse=True):
        result = optimize_image(img_path, dry_run)

        if result:
            optimized += 1
            if dry_run:
                print(f"  {result['file']}: {get_image_size(result['original_size'])} ({result['dimensions']})")
            else:
                saved = result.get('saved', 0)
                total_saved += saved
                if saved > 0:
                    print(f"  ✅ {result['file']}: {get_image_size(result['original_size'])} -> {get_image_size(result['new_size'])} (сэкономлено {get_image_size(saved)})")
                else:
                    print(f"  ⏭️  {result['file']}: уже оптимизирован")

    print(f"\n{'Будет оптимизировано' if dry_run else 'Оптимизировано'}: {optimized} файлов")
    if not dry_run and total_saved > 0:
        print(f"Всего сэкономлено: {get_image_size(total_saved)}")


if __name__ == '__main__':
    main()
