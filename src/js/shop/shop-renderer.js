/**
 * Shop Renderer Module
 * HTML шаблоны для магазина
 * @module ShopRenderer
 */
var ShopRenderer = (function () {
    'use strict';

    var escapeHtml = window.escapeHtml;
    var escapeAttr = window.SharedHelpers ? SharedHelpers.escapeAttr : window.escapeAttr;

    // Category icons map
    var categoryIcons = {
        'hair-care':
            '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
        styling:
            '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        beard: '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><path d="M18 15v6"/><path d="M21 18h-6"/></svg>',
        accessories:
            '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="m7.5 8 .5-5h8l.5 5"/></svg>',
        sets: '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
        default:
            '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
    };

    /**
     * Получить иконку категории по slug
     * @param {string} slug - Slug категории
     * @returns {string} SVG иконка
     */
    function getCategoryIcon(slug) {
        return categoryIcons[slug] || categoryIcons['default'];
    }

    /**
     * Создать карточку товара
     * @param {Object} product - Данные товара
     * @param {number} index - Индекс для анимации
     * @returns {string} HTML карточки
     */
    function createProductCard(product, index) {
        var mainImage = null;

        if (product.images && product.images.length > 0) {
            mainImage = null;
            for (var i = 0; i < product.images.length; i++) {
                if (product.images[i].isMain) {
                    mainImage = product.images[i];
                    break;
                }
            }
            if (!mainImage) mainImage = product.images[0];
        }

        // Find category for badge
        var category = ShopState.getCategoryById(product.categoryId);

        var categoryBadge = category
            ? '<span class="category-badge">' + escapeHtml(category.name) + '</span>'
            : '';

        var imageHtml = mainImage
            ? '<img src="' +
              escapeAttr(mainImage.url) +
              '" alt="' +
              escapeAttr(product.name) +
              '" loading="lazy" decoding="async">'
            : '<div class="product-image-placeholder">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>' +
              '<circle cx="8.5" cy="8.5" r="1.5"/>' +
              '<polyline points="21 15 16 10 5 21"/>' +
              '</svg>' +
              '</div>';

        // Short excerpt from description
        var excerpt = '';
        if (product.description) {
            var shortDesc = product.description.substring(0, 80);
            if (product.description.length > 80) shortDesc += '...';
            excerpt = '<p class="product-excerpt">' + escapeHtml(shortDesc) + '</p>';
        }

        // Animation delay for stagger effect
        var animDelay =
            index !== undefined ? ' style="animation-delay: ' + index * 0.05 + 's"' : '';

        return (
            '<article class="product-card" data-id="' +
            escapeHtml(product.id) +
            '"' +
            animDelay +
            '>' +
            '<div class="product-image">' +
            categoryBadge +
            imageHtml +
            '<div class="product-overlay"><span class="overlay-btn">Подробнее</span></div>' +
            '</div>' +
            '<div class="product-info">' +
            '<h3 class="product-name">' +
            escapeHtml(product.name) +
            '</h3>' +
            excerpt +
            '<div class="product-price">' +
            SharedHelpers.formatPrice(product.price) +
            '</div>' +
            '</div>' +
            '</article>'
        );
    }

    /**
     * Рендер детальной страницы товара
     * @param {Object} product - Данные товара
     */
    function renderProductDetail(product) {
        var elements = ShopState.getElements();
        var category = ShopState.getCategoryById(product.categoryId);

        var mainImage = null;
        if (product.images && product.images.length > 0) {
            for (var j = 0; j < product.images.length; j++) {
                if (product.images[j].isMain) {
                    mainImage = product.images[j];
                    break;
                }
            }
            if (!mainImage) mainImage = product.images[0];
        }

        // Breadcrumbs
        var breadcrumbsHtml = renderBreadcrumbs(product, category);

        // Gallery or single image
        var galleryHtml = renderGallery(product, mainImage);

        var categoryTagHtml = category
            ? '<span class="product-category-tag" data-category="' +
              escapeHtml(category.slug) +
              '">' +
              escapeHtml(category.name) +
              '</span>'
            : '';

        // Related products
        var relatedHtml = renderRelatedProducts(product);

        // Description with fallback
        var descriptionHtml = product.description
            ? '<div class="product-detail-description">' +
              escapeHtml(product.description) +
              '</div>'
            : '';

        elements.productDetail.innerHTML =
            breadcrumbsHtml +
            '<div class="product-detail-grid">' +
            galleryHtml +
            '<div class="product-detail-info">' +
            categoryTagHtml +
            '<h1 class="product-detail-name">' +
            escapeHtml(product.name) +
            '</h1>' +
            '<div class="product-detail-price">' +
            SharedHelpers.formatPrice(product.price) +
            '</div>' +
            descriptionHtml +
            '</div>' +
            '</div>' +
            relatedHtml;
    }

    /**
     * Рендер галереи изображений
     * @param {Object} product - Данные товара
     * @param {Object} mainImage - Главное изображение
     * @returns {string} HTML галереи
     */
    function renderGallery(product, mainImage) {
        if (product.images && product.images.length > 1) {
            var sortedImages = product.images.slice().sort(function (a, b) {
                return (a.order || 0) - (b.order || 0);
            });

            var thumbsHtml = '';
            for (var i = 0; i < sortedImages.length; i++) {
                var img = sortedImages[i];
                var isActive = img.isMain ? ' active' : '';
                thumbsHtml +=
                    '<button class="gallery-thumb' +
                    isActive +
                    '" onclick="ShopApp.setGalleryImage(\'' +
                    escapeAttr(img.url) +
                    '\', this)">' +
                    '<img src="' +
                    escapeAttr(img.url) +
                    '" alt="' +
                    escapeAttr(product.name) +
                    '" loading="lazy" decoding="async">' +
                    '</button>';
            }

            return (
                '<div class="product-gallery">' +
                '<div class="gallery-main" title="Нажмите для увеличения">' +
                '<img src="' +
                escapeAttr(mainImage.url) +
                '" alt="' +
                escapeAttr(product.name) +
                '" id="galleryMainImage">' +
                '<div class="gallery-zoom-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>' +
                '</div>' +
                '<div class="gallery-thumbs">' +
                thumbsHtml +
                '</div>' +
                '</div>'
            );
        } else {
            var imgSrc = mainImage ? mainImage.url : '';
            return (
                '<div class="product-single-image gallery-main" title="Нажмите для увеличения">' +
                (imgSrc
                    ? '<img src="' +
                      escapeAttr(imgSrc) +
                      '" alt="' +
                      escapeAttr(product.name) +
                      '">' +
                      '<div class="gallery-zoom-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>'
                    : '<div class="product-image-placeholder" style="height:100%;display:flex;align-items:center;justify-content:center;">' +
                      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:64px;height:64px;opacity:0.5;">' +
                      '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>' +
                      '<circle cx="8.5" cy="8.5" r="1.5"/>' +
                      '<polyline points="21 15 16 10 5 21"/>' +
                      '</svg>' +
                      '</div>') +
                '</div>'
            );
        }
    }

    /**
     * Рендер хлебных крошек
     * @param {Object} product - Данные товара
     * @param {Object} category - Категория товара
     * @returns {string} HTML хлебных крошек
     */
    function renderBreadcrumbs(product, category) {
        var categoryLink = category
            ? '<a href="#" class="breadcrumb-link" data-category="' +
              escapeHtml(category.slug) +
              '">' +
              escapeHtml(category.name) +
              '</a><span class="separator">›</span>'
            : '';
        return (
            '<nav class="breadcrumbs">' +
            '<a href="/shop" class="breadcrumb-link">Магазин</a>' +
            '<span class="separator">›</span>' +
            categoryLink +
            '<span class="current">' +
            escapeHtml(product.name) +
            '</span>' +
            '</nav>'
        );
    }

    /**
     * Рендер похожих товаров
     * @param {Object} product - Текущий товар
     * @returns {string} HTML похожих товаров
     */
    function renderRelatedProducts(product) {
        var related = getRelatedProducts(product, 4);
        if (related.length === 0) return '';

        var cardsHtml = '';
        for (var i = 0; i < related.length; i++) {
            cardsHtml += createProductCard(related[i], i);
        }

        return (
            '<section class="related-products">' +
            '<h2 class="related-title">Похожие товары</h2>' +
            '<div class="related-grid">' +
            cardsHtml +
            '</div>' +
            '</section>'
        );
    }

    /**
     * Получить похожие товары
     * @param {Object} product - Текущий товар
     * @param {number} limit - Лимит товаров
     * @returns {Array} Массив похожих товаров
     */
    function getRelatedProducts(product, limit) {
        var products = ShopState.getProducts();
        var related = [];

        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            if (
                p.id !== product.id &&
                p.categoryId === product.categoryId &&
                p.status === 'active'
            ) {
                related.push(p);
            }
        }

        return shuffleArray(related).slice(0, limit || 4);
    }

    /**
     * Перемешивание массива (Fisher-Yates shuffle)
     * @param {Array} arr - Исходный массив
     * @returns {Array} Новый перемешанный массив
     */
    function shuffleArray(arr) {
        var shuffled = arr.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var swapValue = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = swapValue;
        }
        return shuffled;
    }

    /**
     * Рендер скелетонов загрузки
     * @param {number} count - Количество скелетонов
     * @returns {string} HTML скелетонов
     */
    function renderSkeletons(count) {
        var html = '';
        for (var i = 0; i < count; i++) {
            html +=
                '<div class="skeleton-card skeleton">' +
                '<div class="skeleton-image skeleton"></div>' +
                '<div class="skeleton-text skeleton"></div>' +
                '<div class="skeleton-text skeleton" style="width: 60%"></div>' +
                '</div>';
        }
        return html;
    }

    /**
     * Рендер пустого состояния
     * @param {string} message - Сообщение
     * @param {string} subtitle - Подзаголовок
     * @returns {string} HTML пустого состояния
     */
    function renderEmptyState(message, subtitle) {
        return (
            '<div class="empty-message">' +
            '<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
            '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
            '<line x1="12" y1="22.08" x2="12" y2="12"/>' +
            '</svg>' +
            '<p class="empty-title">' +
            message +
            '</p>' +
            '<p class="empty-subtitle">' +
            subtitle +
            '</p>' +
            '<button class="empty-btn" onclick="ShopApp.resetFilters()">Показать все товары</button>' +
            '</div>'
        );
    }

    /**
     * Рендер ошибки загрузки
     * @returns {string} HTML ошибки
     */
    function renderError() {
        return (
            '<div class="empty-message">' +
            '<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<line x1="12" y1="8" x2="12" y2="12"/>' +
            '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
            '</svg>' +
            '<p class="empty-title">Ошибка загрузки</p>' +
            '<p class="empty-subtitle">Не удалось загрузить данные. Попробуйте обновить страницу.</p>' +
            '<button class="empty-btn" onclick="location.reload()">Обновить</button>' +
            '</div>'
        );
    }

    return {
        getCategoryIcon: getCategoryIcon,
        createProductCard: createProductCard,
        renderProductDetail: renderProductDetail,
        renderBreadcrumbs: renderBreadcrumbs,
        renderRelatedProducts: renderRelatedProducts,
        renderSkeletons: renderSkeletons,
        renderEmptyState: renderEmptyState,
        renderError: renderError
    };
})();
