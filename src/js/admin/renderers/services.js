/**
 * Admin Services Renderer
 * Рендеринг списка услуг с поддержкой drag & drop
 */

var AdminServicesRenderer = (function () {
    'use strict';

    var servicesList = null;
    var podologyList = null;
    var dragDropInitialized = {};

    /**
     * Инициализация
     */
    function init() {
        servicesList = document.getElementById('servicesList');
        podologyList = document.getElementById('podologyList');
        initDragDrop();
    }

    /**
     * Инициализация drag & drop для услуг
     */
    function initDragDrop() {
        if (!window.AdminDragDrop) return;

        if (!dragDropInitialized.services) {
            AdminDragDrop.init('servicesList', '.service-item', function (newOrder) {
                reorderServices(newOrder);
            });
            dragDropInitialized.services = true;
        }

        if (!dragDropInitialized.podology) {
            AdminDragDrop.init('podologyList', '.service-item', function (newOrder) {
                reorderPodology(newOrder);
            });
            dragDropInitialized.podology = true;
        }
    }

    /**
     * Изменение порядка услуг в категории
     */
    function reorderServices(newOrder) {
        var currentCategory = AdminState.currentCategory || 'main';
        var services = AdminState.services || {};

        if (!services.categories) return;

        var categoryIndex = services.categories.findIndex(function (c) {
            return c.id === currentCategory;
        });

        if (categoryIndex === -1) return;

        var category = services.categories[categoryIndex];
        var reordered = newOrder
            .map(function (id) {
                return category.services.find(function (s) {
                    return String(s.id) === String(id);
                });
            })
            .filter(Boolean);

        services.categories[categoryIndex].services = reordered;

        AdminAPI.save('services', services)
            .then(function () {
                AdminState.setServices(services);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
            })
            .catch(function (error) {
                if (window.showToast) {
                    showToast('Ошибка сохранения порядка', 'error');
                }
                render();
            });
    }

    /**
     * Изменение порядка услуг подологии
     */
    function reorderPodology(newOrder) {
        var services = AdminState.services || {};
        var currentCategory = AdminState.currentPodologyCategory || 'complex';

        if (!services.podology || !services.podology.categories) return;

        var category = services.podology.categories.find(function (c) {
            return c.id === currentCategory;
        });

        if (!category || !category.services) return;

        var reordered = newOrder
            .map(function (id) {
                return category.services.find(function (s) {
                    return String(s.id) === String(id);
                });
            })
            .filter(Boolean);

        category.services = reordered;

        AdminAPI.save('services', services)
            .then(function () {
                AdminState.setServices(services);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
            })
            .catch(function (error) {
                if (window.showToast) {
                    showToast('Ошибка сохранения порядка', 'error');
                }
                renderPodology();
            });
    }

    /**
     * Рендеринг услуг категории
     */
    function render() {
        if (!servicesList) {
            servicesList = document.getElementById('servicesList');
            if (!servicesList) return;
        }

        var currentCategory = AdminState.currentCategory || 'main';
        var services = AdminState.services || {};
        var category = null;

        if (services.categories) {
            category = services.categories.find(function (c) {
                return c.id === currentCategory;
            });
        }

        if (!category || !category.services || category.services.length === 0) {
            servicesList.innerHTML = '<p class="empty-message">Нет услуг в этой категории</p>';
            return;
        }

        var html = category.services
            .map(function (service, index) {
                return (
                    '<div class="service-item" data-id="' +
                    service.id +
                    '" data-index="' +
                    index +
                    '" data-search="' +
                    escapeAttr(service.name) +
                    '" draggable="true">' +
                    '<div class="drag-handle" title="Перетащите для изменения порядка">' +
                    SharedIcons.get('grip') +
                    '</div>' +
                    '<span class="service-name">' +
                    escapeHtml(service.name) +
                    (service.description ? '<span class="service-description">' + escapeHtml(service.description) + '</span>' : '') +
                    '</span>' +
                    '<div class="service-prices">' +
                    '<span class="price-tag price-green">' +
                    (service.priceGreen || 0) +
                    ' ₽</span>' +
                    '<span class="price-tag price-pink">' +
                    (service.pricePink || 0) +
                    ' ₽</span>' +
                    '<span class="price-tag price-blue">' +
                    (service.priceBlue || 0) +
                    ' ₽</span>' +
                    '</div>' +
                    '<div class="service-actions">' +
                    '<button class="btn btn-icon" data-action="edit-service" data-category="' +
                    currentCategory +
                    '" data-index="' +
                    index +
                    '" title="Редактировать">' +
                    SharedIcons.get('edit') +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-service" data-category="' +
                    currentCategory +
                    '" data-index="' +
                    index +
                    '" data-name="' +
                    escapeAttr(service.name) +
                    '" title="Удалить">' +
                    SharedIcons.get('delete') +
                    '</button>' +
                    '</div>' +
                    '</div>'
                );
            })
            .join('');

        servicesList.innerHTML = html;

        if (window.AdminDragDrop) {
            AdminDragDrop.refresh('servicesList');
        }
    }

    /**
     * Рендеринг табов категорий подологии
     */
    function renderPodologyTabs() {
        var tabsContainer = document.getElementById('podologyCategoryTabs');
        if (!tabsContainer) return;

        var services = AdminState.services || {};
        var podology = services.podology || {};
        var categories = podology.categories || [];

        if (categories.length === 0) {
            tabsContainer.innerHTML = '';
            return;
        }

        var currentCategory = AdminState.currentPodologyCategory || categories[0].id;

        var html = categories
            .map(function (cat) {
                var activeClass = cat.id === currentCategory ? ' active' : '';
                return (
                    '<button class="tab' +
                    activeClass +
                    '" data-podology-category="' +
                    cat.id +
                    '">' +
                    escapeHtml(cat.name) +
                    '</button>'
                );
            })
            .join('');

        tabsContainer.innerHTML = html;
    }

    /**
     * Рендеринг услуг подологии
     */
    function renderPodology() {
        // Рендерим табы категорий
        renderPodologyTabs();

        if (!podologyList) {
            podologyList = document.getElementById('podologyList');
            if (!podologyList) return;
        }

        var services = AdminState.services || {};
        var podology = services.podology || {};
        var categories = podology.categories || [];

        if (categories.length === 0) {
            podologyList.innerHTML =
                '<p class="empty-message">Нет категорий. Добавьте категорию через кнопку "Категории".</p>';
            return;
        }

        var currentCategory = AdminState.currentPodologyCategory || categories[0].id;
        var category = categories.find(function (c) {
            return c.id === currentCategory;
        });

        if (!category) {
            category = categories[0];
            AdminState.currentPodologyCategory = category.id;
        }

        var categoryServices = category.services || [];

        if (categoryServices.length === 0) {
            podologyList.innerHTML = '<p class="empty-message">Нет услуг в этой категории</p>';
            return;
        }

        var html = categoryServices
            .map(function (service, index) {
                var featuredClass = service.featured ? ' featured' : '';
                var durationHtml = service.duration
                    ? '<span class="service-duration">' + escapeHtml(service.duration) + '</span>'
                    : '';
                var descriptionHtml = service.description
                    ? '<span class="service-description">' + escapeHtml(service.description) + '</span>'
                    : '';

                return (
                    '<div class="service-item' +
                    featuredClass +
                    '" data-id="' +
                    service.id +
                    '" data-index="' +
                    index +
                    '" data-search="' +
                    escapeAttr(service.name) +
                    '" draggable="true">' +
                    '<div class="drag-handle" title="Перетащите для изменения порядка">' +
                    SharedIcons.get('grip') +
                    '</div>' +
                    '<span class="service-name">' +
                    escapeHtml(service.name) +
                    durationHtml +
                    descriptionHtml +
                    '</span>' +
                    '<div class="service-prices">' +
                    '<span class="price-tag price-single">' +
                    escapeHtml(service.price) +
                    '</span>' +
                    '</div>' +
                    '<div class="service-actions">' +
                    '<button class="btn btn-icon" data-action="edit-podology" data-category="' +
                    currentCategory +
                    '" data-index="' +
                    index +
                    '" title="Редактировать">' +
                    SharedIcons.get('edit') +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-podology" data-category="' +
                    currentCategory +
                    '" data-index="' +
                    index +
                    '" data-name="' +
                    escapeAttr(service.name) +
                    '" title="Удалить">' +
                    SharedIcons.get('delete') +
                    '</button>' +
                    '</div>' +
                    '</div>'
                );
            })
            .join('');

        podologyList.innerHTML = html;

        if (window.AdminDragDrop) {
            AdminDragDrop.refresh('podologyList');
        }
    }

    // Публичный API
    return {
        init: init,
        render: render,
        renderPodology: renderPodology,
        reorderServices: reorderServices,
        reorderPodology: reorderPodology
    };
})();

// Экспорт
window.AdminServicesRenderer = AdminServicesRenderer;
