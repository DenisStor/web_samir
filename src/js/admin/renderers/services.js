/**
 * Admin Services Renderer
 * Рендеринг списка услуг
 */

var AdminServicesRenderer = (function() {
    'use strict';

    var servicesList = null;
    var podologyList = null;

    /**
     * Инициализация
     */
    function init() {
        servicesList = document.getElementById('servicesList');
        podologyList = document.getElementById('podologyList');
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
            return '<div class="service-item" data-id="' + service.id + '">' +
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
                    '<button class="btn btn-icon danger" data-action="delete-service" data-category="' + currentCategory + '" data-index="' + index + '" title="Удалить">' +
                        SharedIcons.get('delete') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        servicesList.innerHTML = html;
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
            return '<div class="service-item" data-id="' + service.id + '">' +
                '<span class="service-name">' + escapeHtml(service.name) + '</span>' +
                '<div class="service-prices">' +
                    '<span class="price-tag price-single">' + escapeHtml(service.price) + '</span>' +
                '</div>' +
                '<div class="service-actions">' +
                    '<button class="btn btn-icon" data-action="edit-podology" data-index="' + index + '" title="Редактировать">' +
                        SharedIcons.get('edit') +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-podology" data-index="' + index + '" title="Удалить">' +
                        SharedIcons.get('delete') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        podologyList.innerHTML = html;
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
        renderPodology: renderPodology
    };
})();

// Экспорт
window.AdminServicesRenderer = AdminServicesRenderer;
