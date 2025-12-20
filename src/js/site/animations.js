/**
 * Animations Module
 *
 * IntersectionObserver для fade-in анимаций при скролле.
 *
 * Зависит от: utils.js
 */

(function() {
    'use strict';

    const { $$, ready } = SaysApp;

    // Конфигурация IntersectionObserver
    const OBSERVER_CONFIG = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    // Глобальная ссылка на observer
    let fadeObserver = null;

    /**
     * Создать и запустить наблюдатель для анимаций
     */
    function initAnimations() {
        fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Прекращаем наблюдение после появления (оптимизация)
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, OBSERVER_CONFIG);

        // Наблюдать за всеми элементами с классом fade-in
        observeFadeElements();
    }

    /**
     * Регистрирует все элементы .fade-in для наблюдения
     * Можно вызывать повторно после динамического добавления элементов
     */
    function observeFadeElements() {
        if (!fadeObserver) return;

        $$('.fade-in:not(.visible)').forEach(el => {
            fadeObserver.observe(el);
        });
    }

    /**
     * Наблюдает за конкретным элементом
     * @param {Element} element - DOM элемент для наблюдения
     */
    function observeElement(element) {
        if (fadeObserver && element) {
            fadeObserver.observe(element);
        }
    }

    // Экспортируем функции для повторного использования
    SaysApp.animations = {
        reinit: observeFadeElements,
        observe: observeElement
    };

    // Запуск при готовности DOM
    ready(initAnimations);

})();
