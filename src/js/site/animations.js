/**
 * Animations Module
 *
 * IntersectionObserver для fade-in анимаций при скролле.
 *
 * Зависит от: utils.js
 */

(function () {
    'use strict';

    var $$ = SaysApp.$$;
    var ready = SaysApp.ready;

    // Конфигурация IntersectionObserver
    var OBSERVER_CONFIG = {
        threshold: 0.1,
        rootMargin: '0px'
    };

    // Глобальная ссылка на observer
    var fadeObserver = null;

    // Задержка между элементами в пачке (мс)
    var STAGGER_DELAY = 80;

    // Очередь элементов для stagger-анимации
    var staggerQueue = [];
    var staggerTimer = null;

    /**
     * Обработать очередь stagger-анимаций через rAF
     */
    function processStaggerQueue() {
        var queue = staggerQueue.slice();
        staggerQueue = [];
        staggerTimer = null;

        queue.forEach(function (item, index) {
            setTimeout(function () {
                requestAnimationFrame(function () {
                    item.classList.add('visible');
                });
            }, index * STAGGER_DELAY);
        });
    }

    /**
     * Добавить элемент в очередь stagger-анимации
     */
    function enqueueStagger(element) {
        staggerQueue.push(element);

        if (!staggerTimer) {
            staggerTimer = requestAnimationFrame(processStaggerQueue);
        }
    }

    /**
     * Создать и запустить наблюдатель для анимаций
     */
    function initAnimations() {
        // Проверяем prefers-reduced-motion
        var prefersReducedMotion =
            window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            $$('.fade-in').forEach(function (el) {
                el.classList.add('visible');
            });
            return;
        }

        fadeObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    enqueueStagger(entry.target);
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

        $$('.fade-in:not(.visible)').forEach(function (el) {
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
