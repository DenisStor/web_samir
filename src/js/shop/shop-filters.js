/**
 * Shop Filters Module
 * Фильтрация и категории магазина
 * @module ShopFilters
 */
var ShopFilters = (function () {
    'use strict';

    var escapeHtml = window.escapeHtml;

    /**
     * Рендер категорий
     */
    function renderCategories() {
        var elements = ShopState.getElements();
        var categories = ShopState.getCategories();
        var products = ShopState.getProducts();
        var currentCategory = ShopState.getCurrentCategory();

        // Update "All" count
        var activeProducts = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].status === 'active') {
                activeProducts.push(products[i]);
            }
        }

        if (elements.allCount) {
            elements.allCount.textContent = activeProducts.length;
        }

        // Filter active categories and sort
        var activeCategories = [];
        for (var j = 0; j < categories.length; j++) {
            if (categories[j].active) {
                activeCategories.push(categories[j]);
            }
        }
        activeCategories.sort(function (a, b) {
            return (a.order || 0) - (b.order || 0);
        });

        // Render category chips
        var html = '';
        for (var k = 0; k < activeCategories.length; k++) {
            var cat = activeCategories[k];
            var count = getProductCount(cat.id);
            var icon = ShopRenderer.getCategoryIcon(cat.slug).replace('category-icon', 'chip-icon');
            var isActive = currentCategory === cat.slug ? ' active' : '';
            html +=
                '<button class="category-chip' +
                isActive +
                '" data-category="' +
                escapeHtml(cat.slug) +
                '">' +
                icon +
                '<span>' +
                escapeHtml(cat.name) +
                '</span>' +
                '<span class="chip-count">' +
                count +
                '</span>' +
                '</button>';
        }

        if (elements.categoriesChips) {
            elements.categoriesChips.innerHTML = html;
        }
    }

    /**
     * Рендер товаров с фильтрацией
     */
    function renderProducts() {
        var elements = ShopState.getElements();
        var products = ShopState.getProducts();
        var currentCategory = ShopState.getCurrentCategory();
        var searchQuery = ShopState.getSearchQuery();
        var currentSort = ShopState.getCurrentSort();

        // Filter active products
        var filtered = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].status === 'active') {
                filtered.push(products[i]);
            }
        }

        // Filter by category
        if (currentCategory !== 'all') {
            var category = ShopState.getCategoryBySlug(currentCategory);
            if (category) {
                var categoryFiltered = [];
                for (var k = 0; k < filtered.length; k++) {
                    if (filtered[k].categoryId === category.id) {
                        categoryFiltered.push(filtered[k]);
                    }
                }
                filtered = categoryFiltered;
            }
        }

        // Filter by search
        if (searchQuery) {
            var searchFiltered = [];
            for (var m = 0; m < filtered.length; m++) {
                var p = filtered[m];
                var nameMatch = p.name.toLowerCase().indexOf(searchQuery) !== -1;
                var descMatch =
                    p.description && p.description.toLowerCase().indexOf(searchQuery) !== -1;
                if (nameMatch || descMatch) {
                    searchFiltered.push(p);
                }
            }
            filtered = searchFiltered;
        }

        // Sort products
        filtered = sortProducts(filtered, currentSort);

        if (filtered.length === 0) {
            var emptyText = searchQuery
                ? 'По запросу «' + escapeHtml(searchQuery) + '» ничего не найдено'
                : 'В этой категории пока нет товаров';
            elements.productsGrid.innerHTML = ShopRenderer.renderEmptyState(
                emptyText,
                'Попробуйте изменить параметры поиска'
            );
            return;
        }

        var html = '';
        for (var n = 0; n < filtered.length; n++) {
            html += ShopRenderer.createProductCard(filtered[n], n);
        }

        elements.productsGrid.innerHTML = html;
    }

    /**
     * Сортировка товаров
     * @param {Array} items - Массив товаров
     * @param {string} sortBy - Параметр сортировки
     * @returns {Array} Отсортированный массив
     */
    function sortProducts(items, sortBy) {
        var sorted = items.slice();
        switch (sortBy) {
            case 'price-asc':
                return sorted.sort(function (a, b) {
                    return a.price - b.price;
                });
            case 'price-desc':
                return sorted.sort(function (a, b) {
                    return b.price - a.price;
                });
            case 'name':
                return sorted.sort(function (a, b) {
                    return a.name.localeCompare(b.name, 'ru');
                });
            default:
                return sorted.sort(function (a, b) {
                    return (a.order || 0) - (b.order || 0);
                });
        }
    }

    /**
     * Установить активную категорию
     * @param {string} slug - Slug категории
     */
    function setActiveCategory(slug) {
        ShopState.setCurrentCategory(slug);

        // Update chip states
        var chips = document.querySelectorAll('.category-chip');
        for (var i = 0; i < chips.length; i++) {
            var chip = chips[i];
            if (chip.dataset.category === slug) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        }

        renderProducts();
    }

    /**
     * Сбросить фильтры
     */
    function resetFilters() {
        var elements = ShopState.getElements();

        ShopState.setSearchQuery('');
        ShopState.setCurrentCategory('all');

        if (elements.searchInput) {
            elements.searchInput.value = '';
        }
        updateSearchClearButton();

        var chips = document.querySelectorAll('.category-chip');
        for (var i = 0; i < chips.length; i++) {
            var chip = chips[i];
            if (chip.dataset.category === 'all') {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        }

        renderProducts();
    }

    /**
     * Получить количество активных товаров в категории
     * @param {string} categoryId - ID категории
     * @returns {number} Количество товаров
     */
    function getProductCount(categoryId) {
        var products = ShopState.getProducts();
        var count = 0;
        for (var i = 0; i < products.length; i++) {
            if (products[i].categoryId === categoryId && products[i].status === 'active') {
                count++;
            }
        }
        return count;
    }

    /**
     * Обновить состояние кнопки очистки поиска
     */
    function updateSearchClearButton() {
        var elements = ShopState.getElements();
        var searchQuery = ShopState.getSearchQuery();

        if (elements.searchWrapper) {
            if (searchQuery || (elements.searchInput && elements.searchInput.value)) {
                elements.searchWrapper.classList.add('has-value');
            } else {
                elements.searchWrapper.classList.remove('has-value');
            }
        }
    }

    return {
        renderCategories: renderCategories,
        renderProducts: renderProducts,
        sortProducts: sortProducts,
        setActiveCategory: setActiveCategory,
        resetFilters: resetFilters,
        getProductCount: getProductCount,
        updateSearchClearButton: updateSearchClearButton
    };
})();
