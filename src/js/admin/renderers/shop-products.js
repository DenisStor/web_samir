/**
 * Shop Products Renderer
 * Отображение таблицы товаров с пагинацией
 */

var AdminShopProductsRenderer = (function () {
    'use strict';

    var container = null;
    var currentPage = 1;
    var itemsPerPage = 10;
    var filterCategory = 'all';

    function init() {
        container = document.getElementById('productsTableBody');

        // Filter change handler
        var filterSelect = document.getElementById('productsFilterCategory');
        if (filterSelect) {
            filterSelect.addEventListener('change', function (e) {
                setFilter(e.target.value);
            });
        }
    }

    function render() {
        if (!container) {
            container = document.getElementById('productsTableBody');
            if (!container) return;
        }

        // Update filter select options
        updateFilterOptions();

        var products = AdminState.products || [];

        // Filter by category
        if (filterCategory !== 'all') {
            products = products.filter(function (p) {
                return p.categoryId === filterCategory;
            });
        }

        // Sort by order
        products.sort(function (a, b) {
            return (a.order || 0) - (b.order || 0);
        });

        // Pagination
        var total = products.length;
        var totalPages = Math.ceil(total / itemsPerPage);
        var start = (currentPage - 1) * itemsPerPage;
        var end = start + itemsPerPage;
        var pageProducts = products.slice(start, end);

        if (pageProducts.length === 0) {
            container.innerHTML =
                '<tr><td colspan="5" class="empty-cell">' +
                '<div class="empty-state">' +
                '<p>Товары ещё не добавлены</p>' +
                '<p class="empty-hint">Нажмите "Добавить" для создания первого товара</p>' +
                '</div>' +
                '</td></tr>';
            renderPagination(0, 0);
            return;
        }

        var html = pageProducts
            .map(function (product) {
                var category = AdminState.findShopCategory(product.categoryId);
                var mainImage = null;
                if (product.images && product.images.length > 0) {
                    mainImage =
                        product.images.find(function (img) {
                            return img.isMain;
                        }) || product.images[0];
                }

                var statusClass =
                    {
                        active: 'success',
                        draft: 'warning',
                        archived: 'secondary'
                    }[product.status] || 'secondary';

                var statusText =
                    {
                        active: 'Активен',
                        draft: 'Черновик',
                        archived: 'В архиве'
                    }[product.status] || product.status;

                return (
                    '<tr>' +
                    '<td>' +
                    '<div class="product-cell">' +
                    (mainImage
                        ? '<img src="' +
                          escapeHtml(mainImage.url) +
                          '" class="product-thumb" alt="">'
                        : '<div class="product-thumb-placeholder">' +
                          SharedIcons.get('box') +
                          '</div>') +
                    '<span class="product-cell-name">' +
                    escapeHtml(product.name) +
                    '</span>' +
                    '</div>' +
                    '</td>' +
                    '<td>' +
                    (category ? escapeHtml(category.name) : '-') +
                    '</td>' +
                    '<td class="price-cell">' +
                    SharedHelpers.formatPrice(product.price) +
                    '</td>' +
                    '<td><span class="status-badge ' +
                    statusClass +
                    '">' +
                    statusText +
                    '</span></td>' +
                    '<td class="actions-cell">' +
                    '<button class="btn btn-icon" data-action="edit-product" data-id="' +
                    escapeAttr(product.id) +
                    '" title="Редактировать">' +
                    SharedIcons.get('edit') +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-product" data-id="' +
                    escapeAttr(product.id) +
                    '" title="Удалить">' +
                    SharedIcons.get('delete') +
                    '</button>' +
                    '</td>' +
                    '</tr>'
                );
            })
            .join('');

        container.innerHTML = html;
        renderPagination(totalPages, total);
    }

    function updateFilterOptions() {
        var filterSelect = document.getElementById('productsFilterCategory');
        if (!filterSelect) return;

        var categories = AdminState.shopCategories || [];
        var html = '<option value="all">Все категории</option>';

        categories.forEach(function (cat) {
            var selected = filterCategory === cat.id ? ' selected' : '';
            html +=
                '<option value="' +
                escapeHtml(cat.id) +
                '"' +
                selected +
                '>' +
                escapeHtml(cat.name) +
                '</option>';
        });

        filterSelect.innerHTML = html;
    }

    function renderPagination(totalPages, total) {
        var paginationEl = document.getElementById('productsPagination');
        if (!paginationEl) return;

        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        var html =
            '<div class="pagination">' +
            '<span class="pagination-info">Показано ' +
            Math.min(itemsPerPage, total) +
            ' из ' +
            total +
            '</span>' +
            '<div class="pagination-buttons">';

        for (var i = 1; i <= totalPages; i++) {
            var activeClass = i === currentPage ? ' active' : '';
            html +=
                '<button class="pagination-btn' +
                activeClass +
                '" onclick="AdminShopProductsRenderer.goToPage(' +
                i +
                ')">' +
                i +
                '</button>';
        }

        html += '</div></div>';
        paginationEl.innerHTML = html;
    }

    function setFilter(categoryId) {
        filterCategory = categoryId;
        currentPage = 1;
        render();
    }

    function goToPage(page) {
        currentPage = page;
        render();
    }

    return {
        init: init,
        render: render,
        setFilter: setFilter,
        goToPage: goToPage
    };
})();

window.AdminShopProductsRenderer = AdminShopProductsRenderer;
