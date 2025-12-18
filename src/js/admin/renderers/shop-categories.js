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

                return '<div class="shop-category-card" data-id="' + escapeHtml(cat.id) + '">' +
                    '<div class="category-card-icon">' + iconHtml + '</div>' +
                    '<div class="category-card-info">' +
                        '<h3 class="category-card-name">' + escapeHtml(cat.name) + '</h3>' +
                        '<p class="category-card-description">' + escapeHtml(cat.description || '') + '</p>' +
                        '<span class="category-card-count">' + productsCount + ' товаров</span>' +
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

    return {
        init: init,
        render: render
    };
})();

window.AdminShopCategoriesRenderer = AdminShopCategoriesRenderer;
