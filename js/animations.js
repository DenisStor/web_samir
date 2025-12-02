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

    /**
     * Создать и запустить наблюдатель для анимаций
     */
    function initAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, OBSERVER_CONFIG);

        // Наблюдать за всеми элементами с классом fade-in
        $$('.fade-in').forEach(el => observer.observe(el));
    }

    // Запуск при готовности DOM
    ready(initAnimations);

})();
