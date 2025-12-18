/**
 * Admin Services Renderer
 * Рендеринг списка услуг с поддержкой drag & drop
 */

var AdminServicesRenderer = (function() {
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
            AdminDragDrop.init('servicesList', '.service-item', function(newOrder) {
                reorderServices(newOrder);
            });
            dragDropInitialized.services = true;
        }

        if (!dragDropInitialized.podology) {
            AdminDragDrop.init('podologyList', '.service-item', function(newOrder) {
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

        var categoryIndex = services.categories.findIndex(function(c) {
            return c.id === currentCategory;
        });

        if (categoryIndex === -1) return;

        var category = services.categories[categoryIndex];
        var reordered = newOrder.map(function(id) {
            return category.services.find(function(s) { return String(s.id) === String(id); });
        }).filter(Boolean);

        services.categories[categoryIndex].services = reordered;

        AdminAPI.save('services', services)
            .then(function() {
                AdminState.setServices(services);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
            })
            .catch(function(error) {
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

        if (!services.podology || !services.podology.services) return;

        var reordered = newOrder.map(function(id) {
            return services.podology.services.find(function(s) { return String(s.id) === String(id); });
        }).filter(Boolean);

        services.podology.services = reordered;

        AdminAPI.save('services', services)
            .then(function() {
                AdminState.setServices(services);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
            })
            .catch(function(error) {
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
            category = services.categories.find(function(c) {
                return c.id === currentCategory;
            });
        }

        if (!category || !category.services || category.services.length === 0) {
            servicesList.innerHTML = '<p class="empty-message">Нет услуг в этой категории</p>';
            return;
        }

        var html = category.services.map(function(service, index) {
            return '<div class="service-item" data-id="' + service.id + '" data-index="' + index + '" data-search="' + escapeHtml(service.name) + '" draggable="true">' +
                '<div class="drag-handle" title="Перетащите для изменения порядка">' + SharedIcons.get('grip') + '</div>' +
                '<span class="service-name">' + escapeHtml(service.name) + '</span>' +
                '<div class="service-prices">' +
                    '<span class="price-tag price-green">' + (service.priceGreen || 0) + ' ₽</span>' +
                    '<span class="price-tag price-pink">' + (service.pricePink || 0) + ' ₽</span>' +
                    '<span class="price-tag price-blue">' + (service.priceBlue || 0) + ' ₽</span>' +
                '</div>' +
                '<div class="service-actions">' +
                    '<button class="btn btn-icon" data-action="edit-service" data-category="' + currentCategory + '" data-index="' + index + '" title="Редактировать">' +
                        SharedIcons.get('edit') +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-service" data-category="' + currentCategory + '" data-index="' + index + '" data-name="' + escapeHtml(service.name) + '" title="Удалить">' +
                        SharedIcons.get('delete') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        servicesList.innerHTML = html;

        if (window.AdminDragDrop) {
            AdminDragDrop.refresh('servicesList');
        }
    }

    /**
     * Рендеринг услуг подологии
     */
    function renderPodology() {
        if (!podologyList) {
            podologyList = document.getElementById('podologyList');
            if (!podologyList) return;
        }

        var services = AdminState.services || {};
        var podologyServices = (services.podology && services.podology.services) || [];

        if (podologyServices.length === 0) {
            podologyList.innerHTML = '<p class="empty-message">Нет услуг подологии</p>';
            return;
        }

        var html = podologyServices.map(function(service, index) {
            return '<div class="service-item" data-id="' + service.id + '" data-index="' + index + '" data-search="' + escapeHtml(service.name) + '" draggable="true">' +
                '<div class="drag-handle" title="Перетащите для изменения порядка">' + SharedIcons.get('grip') + '</div>' +
                '<span class="service-name">' + escapeHtml(service.name) + '</span>' +
                '<div class="service-prices">' +
                    '<span class="price-tag price-single">' + escapeHtml(service.price) + '</span>' +
                '</div>' +
                '<div class="service-actions">' +
                    '<button class="btn btn-icon" data-action="edit-podology" data-index="' + index + '" title="Редактировать">' +
                        SharedIcons.get('edit') +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-podology" data-index="' + index + '" data-name="' + escapeHtml(service.name) + '" title="Удалить">' +
                        SharedIcons.get('delete') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        podologyList.innerHTML = html;

        if (window.AdminDragDrop) {
            AdminDragDrop.refresh('podologyList');
        }
    }

    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        if (!text) return '';
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(text);
        }
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
