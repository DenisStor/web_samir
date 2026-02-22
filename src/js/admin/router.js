/**
 * Admin Router Module
 * Навигация между секциями админ-панели
 */

var AdminRouter = (function () {
    'use strict';

    /**
     * Конфигурация секций
     */
    var SECTION_CONFIG = {
        stats: {
            element: '#statsSection',
            title: 'Статистика',
            description: 'Аналитика посещений сайта',
            hideAddBtn: true
        },
        masters: {
            element: '#mastersSection',
            title: 'Мастера',
            description: 'Управление командой барберов',
            addText: 'Добавить мастера'
        },
        services: {
            element: '#servicesSection',
            title: 'Услуги',
            description: 'Прайс-лист барбершопа',
            addText: 'Добавить услугу'
        },
        podology: {
            element: '#podologySection',
            title: 'Подология',
            description: 'Услуги подологического кабинета',
            addText: 'Добавить услугу'
        },
        articles: {
            element: '#articlesSection',
            title: 'Статьи',
            description: 'Блог и полезные материалы',
            addText: 'Добавить статью'
        },
        faq: {
            element: '#faqSection',
            title: 'FAQ',
            description: 'Часто задаваемые вопросы',
            addText: 'Добавить вопрос'
        },
        social: {
            element: '#socialSection',
            title: 'Соцсети и контакты',
            description: 'Настройка социальных сетей и контактной информации',
            hideAddBtn: true
        },
        'shop-categories': {
            element: '#shopCategoriesSection',
            title: 'Категории товаров',
            description: 'Управление категориями интернет-магазина',
            addText: 'Добавить категорию'
        },
        'shop-products': {
            element: '#shopProductsSection',
            title: 'Товары',
            description: 'Управление товарами интернет-магазина',
            addText: 'Добавить товар'
        },
        legal: {
            element: '#legalSection',
            title: 'Юридические документы',
            description: 'Политики, соглашения и правовая информация',
            addText: 'Добавить документ'
        }
    };

    /**
     * Рендереры секций
     */
    var SECTION_RENDERERS = {
        stats: function () {
            if (window.AdminStatsRenderer) {
                AdminRouter.loadStats();
            }
        },
        masters: function () {
            if (window.AdminMastersRenderer) {
                AdminMastersRenderer.render();
            }
        },
        services: function () {
            if (window.AdminServicesRenderer) {
                AdminServicesRenderer.render();
            }
        },
        podology: function () {
            if (window.AdminServicesRenderer) {
                AdminServicesRenderer.renderPodology();
            }
        },
        articles: function () {
            if (window.AdminArticlesRenderer) {
                AdminArticlesRenderer.render();
            }
        },
        faq: function () {
            if (window.AdminFaqRenderer) {
                AdminFaqRenderer.render();
            }
        },
        social: function () {
            if (window.AdminSocialRenderer) {
                AdminSocialRenderer.render();
            }
        },
        'shop-categories': function () {
            if (window.AdminShopCategoriesRenderer) {
                AdminShopCategoriesRenderer.render();
            }
        },
        'shop-products': function () {
            if (window.AdminShopProductsRenderer) {
                AdminShopProductsRenderer.render();
            }
        },
        legal: function () {
            if (window.AdminLegalRenderer) {
                AdminLegalRenderer.render();
            }
        }
    };

    // Кэшированные элементы
    var elements = null;

    /**
     * Инициализация с элементами
     * @param {Object} els - Объект с DOM элементами
     */
    function init(els) {
        elements = els;
    }

    /**
     * Рендеринг текущей секции
     */
    function renderCurrentSection() {
        var section = AdminState.currentSection;
        var renderer = SECTION_RENDERERS[section];

        if (renderer) {
            renderer();
        }
    }

    /**
     * Загрузка статистики
     */
    async function loadStats() {
        try {
            var stats = await AdminAPI.get('stats');
            AdminStatsRenderer.render(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    /**
     * Переключение секции
     * @param {string} section - ID секции
     */
    function switchSection(section) {
        AdminState.currentSection = section;

        // Обновляем навигацию
        if (elements && elements.navItems) {
            elements.navItems.forEach(function (item) {
                item.classList.toggle('active', item.dataset.section === section);
            });
        }

        // Скрываем все секции
        if (elements && elements.sections) {
            elements.sections.forEach(function (sec) {
                sec.classList.remove('active');
            });
        }

        var config = SECTION_CONFIG[section];
        if (config) {
            var sectionEl = document.querySelector(config.element);
            if (sectionEl) {
                sectionEl.classList.add('active');
            }

            if (elements && elements.pageTitle) {
                elements.pageTitle.textContent = config.title;
            }
            if (elements && elements.pageDescription) {
                elements.pageDescription.textContent = config.description;
            }

            // Кнопка добавления
            if (elements && elements.addNewBtn) {
                elements.addNewBtn.style.display = config.hideAddBtn ? 'none' : 'flex';
                var addBtnText = elements.addNewBtn.querySelector('span');
                if (addBtnText && config.addText) {
                    addBtnText.textContent = config.addText;
                }
            }
        }

        renderCurrentSection();
    }

    /**
     * Переключение категории услуг
     * @param {string} category - ID категории
     */
    function switchServiceCategory(category) {
        AdminState.currentCategory = category;

        if (elements && elements.serviceTabs) {
            elements.serviceTabs.forEach(function (tab) {
                tab.classList.toggle('active', tab.dataset.category === category);
            });
        }

        if (window.AdminServicesRenderer) {
            AdminServicesRenderer.render();
        }
    }

    /**
     * Переключение категории подологии
     * @param {string} category - ID категории
     */
    function switchPodologyCategory(category) {
        AdminState.currentPodologyCategory = category;

        var tabs = document.querySelectorAll('[data-podology-category]');
        tabs.forEach(function (tab) {
            tab.classList.toggle('active', tab.getAttribute('data-podology-category') === category);
        });

        if (window.AdminServicesRenderer) {
            AdminServicesRenderer.renderPodology();
        }
    }

    // Публичный API
    return {
        init: init,
        switchSection: switchSection,
        switchServiceCategory: switchServiceCategory,
        switchPodologyCategory: switchPodologyCategory,
        renderCurrentSection: renderCurrentSection,
        loadStats: loadStats,
        SECTION_CONFIG: SECTION_CONFIG
    };
})();

// Экспорт
window.AdminRouter = AdminRouter;
