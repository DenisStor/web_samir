# Производительность

## Event Listeners

```javascript
// Scroll с throttle
var throttledScroll = SharedHelpers.throttleRAF(onScroll);
window.addEventListener('scroll', throttledScroll, { passive: true });

// Cleanup при уничтожении модуля
function destroy() {
    window.removeEventListener('scroll', throttledScroll);
}
```

## CSS

| Правило | Причина |
|---------|---------|
| НЕ `transition: all` | Перерасчёт всех свойств |
| НЕ `backdrop-filter: blur()` без `@supports` | Тормозит на старых GPU |
| `will-change` только в `:hover` | Создаёт отдельный слой |

## Изображения

- `loading="lazy" decoding="async"` на всех `<img>`
- Максимум 1200px по большей стороне
- WebP предпочтителен
- Лимит загрузки: 5MB (`config.ui.maxImageSize`)
