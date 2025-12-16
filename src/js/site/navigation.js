/**
 * Navigation Module
 *
 * Управление навигацией:
 * - Мобильное меню (открытие/закрытие)
 * - Эффект при прокрутке
 *
 * Зависит от: utils.js
 */

(function() {
    'use strict';

    const { $, byId, lockScroll, setAria, toggleClass, hasClass, on, ready, onEscape } = SaysApp;

    // Кэшированные элементы
    let burger = null;
    let mobileMenu = null;
    let nav = null;

    // =================================================================
    // MOBILE MENU
    // =================================================================

    /**
     * Переключить мобильное меню
     */
    function toggleMenu() {
        if (!burger || !mobileMenu) return;

        const isActive = !hasClass(mobileMenu, 'active');

        toggleClass(burger, 'active', isActive);
        toggleClass(mobileMenu, 'active', isActive);
        lockScroll(isActive);

        setAria(burger, {
            expanded: isActive,
            label: isActive ? 'Закрыть меню' : 'Открыть меню'
        });
        setAria(mobileMenu, { hidden: !isActive });
    }

    /**
     * Закрыть мобильное меню
     */
    function closeMenu() {
        if (!burger || !mobileMenu) return;

        toggleClass(burger, 'active', false);
        toggleClass(mobileMenu, 'active', false);
        lockScroll(false);

        setAria(burger, {
            expanded: false,
            label: 'Открыть меню'
        });
        setAria(mobileMenu, { hidden: true });
    }

    // =================================================================
    // SCROLL EFFECT
    // =================================================================

    /**
     * Обработчик скролла для навигации
     */
    function handleScroll() {
        if (!nav) return;
        toggleClass(nav, 'scrolled', window.scrollY > 50);
    }

    // =================================================================
    // ИНИЦИАЛИЗАЦИЯ
    // =================================================================

    function init() {
        burger = $('.burger');
        mobileMenu = byId('mobileMenu');
        nav = $('.nav');

        if (burger && mobileMenu) {
            // Начальные aria-атрибуты
            setAria(burger, {
                expanded: false,
                controls: 'mobileMenu',
                label: 'Открыть меню'
            });
            setAria(mobileMenu, { hidden: true });

            // Закрытие по Escape
            onEscape(() => {
                if (hasClass(mobileMenu, 'active')) {
                    closeMenu();
                }
            });
        }

        // Scroll эффект
        on(window, 'scroll', handleScroll, { passive: true });
    }

    // Запуск при готовности DOM
    ready(init);

    // Экспорт глобальных функций для onclick в HTML
    window.toggleMenu = toggleMenu;
    window.closeMenu = closeMenu;

})();
