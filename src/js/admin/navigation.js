/**
 * Admin Navigation Module
 * Управление навигацией между секциями админ-панели
 */

var AdminNavigation = (function () {
    'use strict';

    var currentSection = 'stats';
    var sectionTitles = {
        stats: 'Статистика',
        masters: 'Мастера',
        services: 'Услуги',
        articles: 'Статьи',
        principles: 'Принципы',
        faq: 'FAQ',
        social: 'Соцсети'
    };

    /**
     * Переключение на секцию
     */
    function switchSection(sectionId) {
        // Скрыть все секции
        var sections = document.querySelectorAll('.admin-section');
        sections.forEach(function (section) {
            section.classList.remove('active');
        });

        // Показать выбранную секцию
        var targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Обновить активный пункт меню
        var navItems = document.querySelectorAll('.sidebar-nav a');
        navItems.forEach(function (item) {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });

        // Обновить заголовок
        var pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = sectionTitles[sectionId] || sectionId;
        }

        currentSection = sectionId;

        // Обновить состояние
        if (window.AdminState) {
            window.AdminState.currentSection = sectionId;
        }
    }

    /**
     * Получить текущую секцию
     */
    function getCurrentSection() {
        return currentSection;
    }

    /**
     * Инициализация навигации
     */
    function init() {
        var navItems = document.querySelectorAll('.sidebar-nav a[data-section]');
        navItems.forEach(function (item) {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                var sectionId = this.getAttribute('data-section');
                if (sectionId) {
                    switchSection(sectionId);
                }
            });
        });
    }

    // Публичный API
    return {
        init: init,
        switchSection: switchSection,
        getCurrentSection: getCurrentSection,
        sectionTitles: sectionTitles
    };
})();

// Экспорт
window.AdminNavigation = AdminNavigation;
