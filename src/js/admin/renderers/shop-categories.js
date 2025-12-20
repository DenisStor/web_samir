/**
 * Shop Categories Renderer
 * Отображение списка категорий товаров
 */

var AdminShopCategoriesRenderer = (function() {
    'use strict';

    var container = null;

    function init() {
        container = document.getElementById('shopCategoriesGrid');
    }

    function render() {
        if (!container) {
            container = document.getElementById('shopCategoriesGrid');
            if (!container) return;
        }

        var categories = AdminState.shopCategories || [];

        if (categories.length === 0) {
            container.innerHTML = '<div class="empty-state">' +
                '<p>Категории ещё не добавлены</p>' +
                '<p class="empty-hint">Нажмите "Добавить" для создания первой категории</p>' +
            '</div>';
            return;
        }

        var html = categories
            .sort(function(a, b) { return (a.order || 0) - (b.order || 0); })
            .map(function(cat) {
                var productsCount = (AdminState.products || []).filter(function(p) {
                    return p.categoryId === cat.id;
                }).length;

                var iconHtml = SharedIcons.get(cat.icon || 'folder');
                var isInactive = cat.active === false;
                var statusBadge = isInactive
                    ? '<span class="category-card-badge inactive">Скрыта</span>'
                    : '';

                var productWord = getProductWord(productsCount);
                var descriptionHtml = cat.description
                    ? '<p class="category-card-description">' + escapeHtml(cat.description) + '</p>'
                    : '';

                return '<div class="shop-category-card' + (isInactive ? ' inactive' : '') + '" data-id="' + escapeHtml(cat.id) + '">' +
                    '<div class="category-card-icon">' + iconHtml + '</div>' +
                    '<div class="category-card-info">' +
                        '<h3 class="category-card-name">' +
                            escapeHtml(cat.name) +
                            statusBadge +
                        '</h3>' +
                        descriptionHtml +
                        '<span class="category-card-count">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>' +
                            productsCount + ' ' + productWord +
                        '</span>' +
                    '</div>' +
                    '<div class="category-card-actions">' +
                        '<button class="btn btn-icon" data-action="edit-shop-category" data-id="' + escapeHtml(cat.id) + '" title="Редактировать">' +
                            SharedIcons.get('edit') +
                        '</button>' +
                        '<button class="btn btn-icon danger" data-action="delete-shop-category" data-id="' + escapeHtml(cat.id) + '" title="Удалить">' +
                            SharedIcons.get('delete') +
                        '</button>' +
                    '</div>' +
                '</div>';
            }).join('');

        container.innerHTML = html;
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getProductWord(count) {
        var n = Math.abs(count) % 100;
        var n1 = n % 10;
        if (n > 10 && n < 20) return 'товаров';
        if (n1 > 1 && n1 < 5) return 'товара';
        if (n1 === 1) return 'товар';
        return 'товаров';
    }

    return {
        init: init,
        render: render
    };
})();

window.AdminShopCategoriesRenderer = AdminShopCategoriesRenderer;
