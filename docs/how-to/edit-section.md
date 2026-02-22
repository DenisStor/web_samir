# Как изменить HTML секцию

## Обзор

HTML страницы собираются из секций в `src/sections/{page}/`.

```
src/sections/index/hero.html      ─┐
src/sections/index/services.html   ├─→ index.html
src/sections/index/masters.html   ─┘
```

## Пошаговая инструкция

### 1. Найдите нужную секцию

```bash
ls src/sections/index/
```

Основные секции index.html:

| Файл | Содержимое |
|------|------------|
| `hero.html` | Главный баннер |
| `services.html` | Блок услуг |
| `masters.html` | Команда |
| `booking.html` | Форма записи |
| `blog.html` | Статьи |
| `faq.html` | Вопросы-ответы |
| `location.html` | Карта и адрес |
| `footer.html` | Подвал |

### 2. Откройте файл секции

```bash
nano src/sections/index/hero.html
```

### 3. Внесите изменения

Пример — изменить заголовок:

```html
<!-- Было -->
<h1>Say's Barbers<br><span class="accent">— громко<br>стильно<br>уверенно!</span></h1>

<!-- Стало -->
<h1>Say's Barbers<br><span class="accent">— новый текст</span></h1>
```

### 4. Соберите страницу

```bash
python3 scripts/build.py --page=index
```

### 5. Проверьте результат

Откройте http://localhost:8000 (сервер должен быть запущен).

## Создание новой секции

### 1. Создайте файл

```bash
touch src/sections/index/new-section.html
```

### 2. Добавьте HTML

```html
    <!-- New Section -->
    <section class="new-section" id="new-section">
        <div class="container">
            <h2 class="section-title">Заголовок секции</h2>
            <p>Содержимое секции</p>
        </div>
    </section>
```

### 3. Добавьте секцию в конфиг сборки

Откройте `scripts/build.py` и найдите список секций для index:

```python
'index': [
    'head.html',
    'body-start.html',
    'navigation.html',
    'hero.html',
    'marquee.html',
    'services.html',
    # ... другие секции
    'new-section.html',  # Добавьте здесь
    'footer.html',
    'scripts.html',
],
```

### 4. Добавьте стили

Создайте `src/css/site/new-section.css`:

```css
.new-section {
    padding: var(--section-padding);
}
```

Добавьте импорт в `src/css/site/index.css`:

```css
@import 'new-section.css';
```

### 5. Соберите

```bash
python3 scripts/build.py --page=index
```

## Советы

### Отступы в 4 пробела

Секции начинаются с 4 пробелов (один уровень внутри `<body>`):

```html
    <!-- Section -->
    <section class="example">
        <div class="container">
```

### Используйте container

Для ограничения ширины контента:

```html
<section class="my-section">
    <div class="container">
        <!-- Контент -->
    </div>
</section>
```

### Семантические теги

```html
<section>  <!-- Логический раздел -->
<article>  <!-- Самостоятельный контент -->
<aside>    <!-- Дополнительный контент -->
<nav>      <!-- Навигация -->
```

### ID для навигации

Для прокрутки к секции добавьте `id`:

```html
<section id="services">
```

Ссылка:
```html
<a href="#services">Услуги</a>
```

## Частые ошибки

### Изменения не появляются

1. Забыли запустить `build.py`
2. Редактировали HTML в корне (а не в `src/sections/`)
3. Кэш браузера — нажмите `Cmd+Shift+R`

### Сломалась вёрстка

1. Проверьте закрытие тегов
2. Проверьте кавычки в атрибутах
3. Используйте DevTools для отладки

## Шаблон секции

См. [examples/new-section.html](../examples/new-section.html)
