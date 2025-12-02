/**
 * Main Module
 *
 * Инициализация табов услуг.
 *
 * Зависит от: utils.js
 */

(function() {
    'use strict';

    const { $, $$, toggleClass, ready, on } = SaysApp;

    // =================================================================
    // SERVICE TABS
    // =================================================================

    /**
     * Инициализировать табы услуг
     */
    function initServiceTabs() {
        const tabButtons = $$('.service-tab');

        if (!tabButtons.length) return;

        tabButtons.forEach(button => {
            on(button, 'click', (e) => {
                e.preventDefault();

                const targetTab = button.getAttribute('data-tab-target');
                if (!targetTab) return;

                // Убрать active со всех табов
                tabButtons.forEach(btn => toggleClass(btn, 'active', false));

                // Добавить active на кликнутый таб
                toggleClass(button, 'active', true);

                // Скрыть все контенты табов
                $$('.service-tab-content').forEach(content => {
                    toggleClass(content, 'active', false);
                });

                // Показать выбранный контент
                const targetContent = $(`.service-tab-content[data-tab="${targetTab}"]`);
                if (targetContent) {
                    toggleClass(targetContent, 'active', true);
                }
            });
        });
    }

    // Запуск при готовности DOM
    ready(initServiceTabs);

})();
