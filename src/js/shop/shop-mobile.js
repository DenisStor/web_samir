/**
 * Shop Mobile Module
 * Мобильное меню и фильтры
 * @module ShopMobile
 */
var ShopMobile = (function () {
    'use strict';

    /**
     * Переключить мобильное меню
     */
    function toggleMenu() {
        var elements = ShopState.getElements();
        var menu = elements.mobileMenu;
        var burger = document.querySelector('.burger');
        if (!menu) return;

        var isOpen = menu.classList.contains('active');

        if (isOpen) {
            closeMenu();
        } else {
            menu.classList.add('active');
            menu.setAttribute('aria-hidden', 'false');
            if (burger) burger.setAttribute('aria-expanded', 'true');
            SharedHelpers.lockScroll(true);
        }
    }

    /**
     * Закрыть мобильное меню
     */
    function closeMenu() {
        var elements = ShopState.getElements();
        var menu = elements.mobileMenu;
        var burger = document.querySelector('.burger');
        if (!menu) return;

        menu.classList.remove('active');
        menu.setAttribute('aria-hidden', 'true');
        if (burger) burger.setAttribute('aria-expanded', 'false');
        SharedHelpers.lockScroll(false);
    }

    /**
     * Открыть мобильный фильтр
     */
    function openFilterSheet() {
        var elements = ShopState.getElements();

        if (elements.filterSheet) {
            elements.filterSheet.classList.add('active');
        }
        if (elements.filterBackdrop) {
            elements.filterBackdrop.classList.add('active');
        }
        SharedHelpers.lockScroll(true);
    }

    /**
     * Закрыть мобильный фильтр
     */
    function closeFilterSheet() {
        var elements = ShopState.getElements();

        if (elements.filterSheet) {
            elements.filterSheet.classList.remove('active');
        }
        if (elements.filterBackdrop) {
            elements.filterBackdrop.classList.remove('active');
        }
        SharedHelpers.lockScroll(false);
    }

    /**
     * Throttled версия handleScroll через requestAnimationFrame
     */
    function handleScrollThrottled() {
        var scrollRAF = ShopState.getScrollRAF();
        if (scrollRAF) return;

        var newRAF = requestAnimationFrame(function () {
            var elements = ShopState.getElements();
            if (elements.nav) {
                if (window.scrollY > 50) {
                    elements.nav.classList.add('scrolled');
                } else {
                    elements.nav.classList.remove('scrolled');
                }
            }
            ShopState.setScrollRAF(null);
        });
        ShopState.setScrollRAF(newRAF);
    }

    return {
        toggleMenu: toggleMenu,
        closeMenu: closeMenu,
        openFilterSheet: openFilterSheet,
        closeFilterSheet: closeFilterSheet,
        handleScrollThrottled: handleScrollThrottled
    };
})();
