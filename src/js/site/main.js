/**
 * Main Module
 *
 * Инициализация табов услуг.
 *
 * Зависит от: utils.js
 */

(function () {
    'use strict';

    var $ = SaysApp.$;
    var $$ = SaysApp.$$;
    var toggleClass = SaysApp.toggleClass;
    var ready = SaysApp.ready;
    var on = SaysApp.on;

    // =================================================================
    // SERVICE TABS
    // =================================================================

    /**
     * Инициализировать табы услуг
     */
    function initServiceTabs() {
        var tabButtons = $$('.service-tab');

        if (!tabButtons.length) return;

        tabButtons.forEach(function (button) {
            on(button, 'click', function (e) {
                e.preventDefault();

                var targetTab = button.getAttribute('data-tab-target');
                if (!targetTab) return;

                // Убрать active со всех табов
                tabButtons.forEach(function (btn) {
                    toggleClass(btn, 'active', false);
                });

                // Добавить active на кликнутый таб
                toggleClass(button, 'active', true);

                // Скрыть все контенты табов
                $$('.service-tab-content').forEach(function (content) {
                    toggleClass(content, 'active', false);
                });

                // Показать выбранный контент
                var targetContent = $('.service-tab-content[data-tab="' + targetTab + '"]');
                if (targetContent) {
                    toggleClass(targetContent, 'active', true);
                }
            });
        });
    }

    // =================================================================
    // PODOLOGY TABS
    // =================================================================

    /**
     * Инициализировать табы подологии
     */
    function initPodologyTabs() {
        var tabButtons = $$('.podology-tab');

        if (!tabButtons.length) return;

        tabButtons.forEach(function (button) {
            on(button, 'click', function (e) {
                e.preventDefault();

                var targetTab = button.getAttribute('data-podology-target');
                if (!targetTab) return;

                // Убрать active со всех табов
                $$('.podology-tab').forEach(function (btn) {
                    toggleClass(btn, 'active', false);
                });

                // Добавить active на кликнутый таб
                toggleClass(button, 'active', true);

                // Скрыть все контенты табов
                $$('.podology-tab-content').forEach(function (content) {
                    toggleClass(content, 'active', false);
                });

                // Показать выбранный контент
                var targetContent = $('.podology-tab-content[data-podology="' + targetTab + '"]');
                if (targetContent) {
                    toggleClass(targetContent, 'active', true);
                }
            });
        });
    }

    /**
     * Реинициализация табов подологии (после динамической загрузки)
     */
    function reinitPodologyTabs() {
        initPodologyTabs();
    }

    // Экспорт в SaysApp
    SaysApp.reinitPodologyTabs = reinitPodologyTabs;

    // Запуск при готовности DOM
    ready(initServiceTabs);
    ready(initPodologyTabs);
})();
