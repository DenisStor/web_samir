# CSS Конвенции

## CSS Variables

Единый источник: `src/css/shared/variables.css`

| Категория | Примеры |
|-----------|---------|
| **Фон** | `--bg-dark`, `--bg-darker`, `--content-bg` |
| **Акцент** | `--accent-green`, `--accent-green-dim`, `--accent-green-subtle` |
| **Текст** | `--text-white`, `--text-gray`, `--text-gray-light` |
| **Бейджи** | `--badge-green`, `--badge-pink`, `--badge-blue` + `-bg` версии |
| **Danger** | `--color-danger`, `--color-danger-hover`, `--color-danger-subtle` |
| **Бордеры** | `--border-subtle`, `--border-light`, `--border-accent` |
| **Тени** | `--shadow-glow-sm/md/lg`, `--shadow-card`, `--shadow-elevated` |
| **Анимации** | `--transition-fast` (0.2s), `--transition-base` (0.3s) |
| **Радиусы** | `--radius-sm` (12px) → `--radius-2xl` (32px) |
| **Z-index** | `--z-dropdown` (100) → `--z-modal` (2000) |

## Правила

### Transitions

```css
/* Правильно — конкретные свойства */
.button {
    transition: background var(--transition-base),
                color var(--transition-base),
                border-color var(--transition-base);
}

/* Неправильно — transition: all */
.button {
    transition: all 0.3s ease;
}
```

### Цвета

```css
/* Правильно — CSS переменные */
.error {
    color: var(--color-danger);
    background: var(--color-danger-subtle);
}

/* Неправильно — hardcoded */
.error {
    color: #ff4757;
}
```

### Утилитарные классы (shared/components.css)

```css
.link-plain   /* Ссылка без подчёркивания и цвета — наследует стили родителя */
```

### Анимации

- Используется `fadeInUp` (определён в `shared/utilities.css`)
- `slideUp` удалён — везде заменён на `fadeInUp`

### Производительность

- НЕ использовать `backdrop-filter: blur()` на фиксированных элементах без `@supports`
- `will-change` добавлять только в `:hover`, не в базовые стили

## CSS линтинг (stylelint)

Конфигурация: `.stylelintrc.json` в корне проекта.

```bash
npm run lint:css              # Проверить CSS
npm run lint                  # Проверить всё (JS + CSS)
```

Запускайте перед коммитом вместе с `npm run lint`.
