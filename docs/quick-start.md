# Быстрый старт

## Требования

| Компонент | Минимальная версия |
|-----------|-------------------|
| Python | 3.8+ |
| Node.js | 16+ |
| npm | 8+ |

## Установка

### 1. Клонирование репозитория

```bash
git clone git@github.com:Den191601/web_samir.git
cd web_samir
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Создание data директории

```bash
mkdir -p data
```

SQLite БД (`data/saysbarbers.db`) создаётся автоматически при первом запуске сервера.

### 4. Создание конфигурации

```bash
cp config.example.json config.json
```

Отредактируйте `config.json`:

```json
{
  "admin": {
    "password": "ваш_пароль"
  }
}
```

## Первый запуск

### Сборка HTML

```bash
python3 scripts/build.py
```

### Запуск сервера

```bash
python3 run.py
```

### Открытие в браузере

| Страница | URL |
|----------|-----|
| Главная | http://localhost:8000 |
| Админка | http://localhost:8000/admin.html |
| Магазин | http://localhost:8000/shop.html |

## Первое изменение (практика)

Изменим текст в hero секции:

### 1. Откройте файл секции

```
src/sections/index/hero.html
```

### 2. Найдите заголовок

```html
<h1>Say's Barbers<br><span class="accent">— громко<br>стильно<br>уверенно!</span></h1>
```

### 3. Измените текст

```html
<h1>Say's Barbers<br><span class="accent">— ваш текст</span></h1>
```

### 4. Соберите HTML

```bash
python3 scripts/build.py --page=index
```

### 5. Обновите браузер

Изменения появятся на http://localhost:8000

## Режим автопересборки

Для автоматической пересборки при изменениях:

```bash
python3 scripts/build.py --watch
```

## Проверка кода

Перед коммитом:

```bash
npm run lint && npm run lint:css && npm run format:check
```

## Следующие шаги

1. [Критические правила](rules.md) — что нельзя делать
2. [Архитектура](architecture.md) — как устроен проект
3. [Как изменить секцию](how-to/edit-section.md) — подробный гайд
