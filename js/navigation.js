/**
 * Navigation Module
 *
 * Модуль для работы с навигацией:
 * - Управление мобильным меню (открытие/закрытие)
 * - Эффект изменения стиля при прокрутке страницы
 */

// Переключение мобильного меню
function toggleMenu() {
    const burger = document.querySelector('.burger');
    const mobileMenu = document.getElementById('mobileMenu');
    const isActive = !mobileMenu.classList.contains('active');

    burger.classList.toggle('active', isActive);
    mobileMenu.classList.toggle('active', isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
    burger.setAttribute('aria-expanded', isActive.toString());
    burger.setAttribute('aria-label', isActive ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.setAttribute('aria-hidden', (!isActive).toString());
}

// Закрытие мобильного меню
function closeMenu() {
    const burger = document.querySelector('.burger');
    const mobileMenu = document.getElementById('mobileMenu');
    burger.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    mobileMenu.setAttribute('aria-hidden', 'true');
}

// Эффект навигации при прокрутке страницы
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Настройки доступности и закрытие меню по Esc
document.addEventListener('DOMContentLoaded', () => {
    const burger = document.querySelector('.burger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (burger && mobileMenu) {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-controls', 'mobileMenu');
        burger.setAttribute('aria-label', 'Открыть меню');
        mobileMenu.setAttribute('aria-hidden', 'true');

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }
});
