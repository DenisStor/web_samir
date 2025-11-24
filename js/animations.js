/**
 * Animations Module
 *
 * Модуль для работы с анимациями и эффектами:
 * - IntersectionObserver для обнаружения видимых элементов
 * - Fade-in анимации при прокрутке страницы
 */

// Параметры для наблюдателя пересечений
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

// Создание IntersectionObserver для анимации элементов при появлении в поле зрения
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Начало наблюдения за всеми элементами с классом fade-in
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
