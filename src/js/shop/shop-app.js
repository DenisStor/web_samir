/**
 * Say's Barbers Shop Application
 * Каталог товаров и страница товара
 */

var ShopApp = (function() {
    'use strict';

    var API_BASE = '/api/shop';

    // State
    var categories = [];
    var products = [];
    var currentCategory = 'all';
    var searchQuery = '';
    var currentSort = localStorage.getItem('shopSort') || 'order';
    var lightboxImages = [];
    var lightboxIndex = 0;

    // DOM elements cache
    var elements = {};

    // =================================================================
    // INITIALIZATION
    // =================================================================

    function init() {
        initElements();
        initEventListeners();
        loadData();
        handleRoute();

        // Listen for hash changes
        window.addEventListener('hashchange', handleRoute);

        // Handle scroll for nav
        window.addEventListener('scroll', handleScroll);
    }

    function initElements() {
        elements.catalog = document.getElementById('shopCatalog');
        elements.productPage = document.getElementById('productPage');
        elements.categoriesChips = document.getElementById('categoriesChips');
        elements.productsGrid = document.getElementById('productsGrid');
        elements.productDetail = document.getElementById('productDetail');
        elements.searchInput = document.getElementById('shopSearch');
        elements.searchClear = document.getElementById('searchClear');
        elements.searchWrapper = elements.searchInput ? elements.searchInput.parentElement : null;
        elements.sortSelect = document.getElementById('sortSelect');
        elements.allCount = document.getElementById('allCount');
        elements.mobileMenu = document.getElementById('mobileMenu');
        elements.nav = document.querySelector('.nav');
        elements.lightbox = document.getElementById('lightbox');
        elements.lightboxImage = document.getElementById('lightboxImage');
        elements.filterSheet = document.querySelector('.filter-sheet');
        elements.filterBackdrop = document.querySelector('.filter-backdrop');
    }

    function initEventListeners() {
        // Search with debounce
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', debounce(function(e) {
                searchQuery = e.target.value.toLowerCase().trim();
                updateSearchClearButton();
                renderProducts();
            }, 300));
        }

        // Search clear button
        if (elements.searchClear) {
            elements.searchClear.addEventListener('click', function() {
                if (elements.searchInput) {
                    elements.searchInput.value = '';
                    searchQuery = '';
                    updateSearchClearButton();
                    renderProducts();
                    elements.searchInput.focus();
                }
            });
        }

        // Sort select
        if (elements.sortSelect) {
            elements.sortSelect.value = currentSort;
            elements.sortSelect.addEventListener('change', function(e) {
                currentSort = e.target.value;
                localStorage.setItem('shopSort', currentSort);
                renderProducts();
            });
        }

        // Keyboard events (Escape for lightbox)
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && elements.lightbox && elements.lightbox.style.display !== 'none') {
                closeLightbox();
            }
            if (elements.lightbox && elements.lightbox.style.display !== 'none') {
                if (e.key === 'ArrowLeft') prevImage();
                if (e.key === 'ArrowRight') nextImage();
            }
        });

        // Category clicks (delegation)
        document.addEventListener('click', function(e) {
            var categoryChip = e.target.closest('.category-chip');
            if (categoryChip) {
                var category = categoryChip.dataset.category;
                setActiveCategory(category);
                return;
            }

            var productCard = e.target.closest('.product-card');
            if (productCard && !e.target.closest('.gallery-main')) {
                var productId = productCard.dataset.id;
                window.location.hash = 'product-' + productId;
                return;
            }

            var categoryTag = e.target.closest('.product-category-tag');
            if (categoryTag) {
                var categorySlug = categoryTag.dataset.category;
                if (categorySlug) {
                    showCatalog();
                    setActiveCategory(categorySlug);
                }
                return;
            }

            // Lightbox close on backdrop click
            if (e.target.classList.contains('lightbox')) {
                closeLightbox();
                return;
            }

            // Mobile filter backdrop click
            if (e.target.classList.contains('filter-backdrop')) {
                closeFilterSheet();
                return;
            }

            // Gallery main image click for lightbox
            var galleryMain = e.target.closest('.gallery-main');
            if (galleryMain) {
                var images = [];
                document.querySelectorAll('.gallery-thumb img').forEach(function(img) {
                    images.push(img.src);
                });
                if (images.length === 0) {
                    var mainImg = galleryMain.querySelector('img');
                    if (mainImg) images.push(mainImg.src);
                }
                if (images.length > 0) {
                    var currentSrc = galleryMain.querySelector('img').src;
                    var startIndex = images.indexOf(currentSrc);
                    openLightbox(images, startIndex >= 0 ? startIndex : 0);
                }
                return;
            }
        });
    }

    // =================================================================
    // ROUTING
    // =================================================================

    function handleRoute() {
        var hash = window.location.hash;

        if (hash.startsWith('#product-')) {
            var productId = hash.replace('#product-', '');
            showProductPage(productId);
        } else {
            showCatalogView();
        }
    }

    function showCatalog() {
        window.location.hash = '';
    }

    function showCatalogView() {
        elements.catalog.style.display = 'block';
        elements.productPage.style.display = 'none';
        document.title = 'Магазин | Say\'s Barbers';
        window.scrollTo(0, 0);
    }

    function showProductPage(productId) {
        var product = products.find(function(p) { return p.id === productId; });
        if (!product) {
            // Try to fetch from API
            fetchProduct(productId);
            return;
        }

        elements.catalog.style.display = 'none';
        elements.productPage.style.display = 'block';

        renderProductDetail(product);
        document.title = product.name + ' | Say\'s Barbers';
        window.scrollTo(0, 0);
    }

    async function fetchProduct(productId) {
        try {
            var response = await fetch(API_BASE + '/products/' + productId);
            if (response.ok) {
                var product = await response.json();
                elements.catalog.style.display = 'none';
                elements.productPage.style.display = 'block';
                renderProductDetail(product);
                document.title = product.name + ' | Say\'s Barbers';
                window.scrollTo(0, 0);
            } else {
                showCatalog();
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            showCatalog();
        }
    }

    // =================================================================
    // DATA LOADING
    // =================================================================

    async function loadData() {
        // Show skeleton loading
        elements.productsGrid.innerHTML = renderSkeletons(8);

        try {
            var results = await Promise.all([
                fetch(API_BASE + '/categories').then(function(r) { return r.json(); }),
                fetch(API_BASE + '/products').then(function(r) { return r.json(); })
            ]);

            categories = results[0].categories || [];
            products = results[1].products || [];

            renderCategories();
            renderProducts();
        } catch (error) {
            console.error('Error loading shop data:', error);
            elements.productsGrid.innerHTML = '<div class="empty-message">' +
                '<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                    '<circle cx="12" cy="12" r="10"/>' +
                    '<line x1="12" y1="8" x2="12" y2="12"/>' +
                    '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
                '</svg>' +
                '<p class="empty-title">Ошибка загрузки</p>' +
                '<p class="empty-subtitle">Не удалось загрузить данные. Попробуйте обновить страницу.</p>' +
                '<button class="empty-btn" onclick="location.reload()">Обновить</button>' +
            '</div>';
        }
    }

    // =================================================================
    // RENDERING
    // =================================================================

    // Category icons map
    var categoryIcons = {
        'hair-care': '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
        'styling': '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        'beard': '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><path d="M18 15v6"/><path d="M21 18h-6"/></svg>',
        'accessories': '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="m7.5 8 .5-5h8l.5 5"/></svg>',
        'sets': '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
        'default': '<svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
    };

    function getCategoryIcon(slug) {
        return categoryIcons[slug] || categoryIcons['default'];
    }

    function renderCategories() {
        // Update "All" count
        var activeProducts = products.filter(function(p) { return p.status === 'active'; });
        if (elements.allCount) {
            elements.allCount.textContent = activeProducts.length;
        }

        // Render category chips
        var html = categories
            .filter(function(c) { return c.active; })
            .sort(function(a, b) { return (a.order || 0) - (b.order || 0); })
            .map(function(cat) {
                var count = getProductCount(cat.id);
                var icon = getCategoryIcon(cat.slug).replace('category-icon', 'chip-icon');
                var isActive = currentCategory === cat.slug ? ' active' : '';
                return '<button class="category-chip' + isActive + '" data-category="' + escapeHtml(cat.slug) + '">' +
                    icon +
                    '<span>' + escapeHtml(cat.name) + '</span>' +
                    '<span class="chip-count">' + count + '</span>' +
                '</button>';
            }).join('');

        if (elements.categoriesChips) {
            elements.categoriesChips.innerHTML = html;
        }
    }

    function updateSearchClearButton() {
        if (elements.searchWrapper) {
            if (searchQuery || (elements.searchInput && elements.searchInput.value)) {
                elements.searchWrapper.classList.add('has-value');
            } else {
                elements.searchWrapper.classList.remove('has-value');
            }
        }
    }

    function renderProducts() {
        var filtered = products.filter(function(p) { return p.status === 'active'; });

        // Filter by category
        if (currentCategory !== 'all') {
            var category = categories.find(function(c) { return c.slug === currentCategory; });
            if (category) {
                filtered = filtered.filter(function(p) { return p.categoryId === category.id; });
            }
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(function(p) {
                return p.name.toLowerCase().includes(searchQuery) ||
                       (p.description && p.description.toLowerCase().includes(searchQuery));
            });
        }

        // Sort products
        filtered = sortProducts(filtered, currentSort);

        if (filtered.length === 0) {
            var emptyText = searchQuery ? 'По запросу «' + escapeHtml(searchQuery) + '» ничего не найдено' : 'В этой категории пока нет товаров';
            elements.productsGrid.innerHTML = '<div class="empty-message">' +
                '<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
                    '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
                    '<line x1="12" y1="22.08" x2="12" y2="12"/>' +
                '</svg>' +
                '<p class="empty-title">' + emptyText + '</p>' +
                '<p class="empty-subtitle">Попробуйте изменить параметры поиска</p>' +
                '<button class="empty-btn" onclick="ShopApp.resetFilters()">Показать все товары</button>' +
            '</div>';
            return;
        }

        var html = filtered.map(function(product, index) {
            return createProductCard(product, index);
        }).join('');

        elements.productsGrid.innerHTML = html;
    }

    function sortProducts(items, sortBy) {
        var sorted = items.slice();
        switch (sortBy) {
            case 'price-asc':
                return sorted.sort(function(a, b) { return a.price - b.price; });
            case 'price-desc':
                return sorted.sort(function(a, b) { return b.price - a.price; });
            case 'name':
                return sorted.sort(function(a, b) { return a.name.localeCompare(b.name, 'ru'); });
            default:
                return sorted.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
        }
    }

    function resetFilters() {
        searchQuery = '';
        currentCategory = 'all';
        if (elements.searchInput) elements.searchInput.value = '';
        updateSearchClearButton();
        document.querySelectorAll('.category-chip').forEach(function(chip) {
            chip.classList.toggle('active', chip.dataset.category === 'all');
        });
        renderProducts();
    }

    function createProductCard(product, index) {
        var mainImage = null;
        if (product.images && product.images.length > 0) {
            mainImage = product.images.find(function(img) { return img.isMain; }) || product.images[0];
        }

        // Find category for badge
        var category = categories.find(function(c) { return c.id === product.categoryId; });
        var categoryBadge = category
            ? '<span class="category-badge">' + escapeHtml(category.name) + '</span>'
            : '';

        var imageHtml = mainImage
            ? '<img src="' + escapeHtml(mainImage.url) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">'
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
        var animDelay = index !== undefined ? ' style="animation-delay: ' + (index * 0.05) + 's"' : '';

        return '<article class="product-card" data-id="' + escapeHtml(product.id) + '"' + animDelay + '>' +
            '<div class="product-image">' + categoryBadge + imageHtml +
                '<div class="product-overlay"><span class="overlay-btn">Подробнее</span></div>' +
            '</div>' +
            '<div class="product-info">' +
                '<h3 class="product-name">' + escapeHtml(product.name) + '</h3>' +
                excerpt +
                '<div class="product-price">' + formatPrice(product.price) + '</div>' +
            '</div>' +
        '</article>';
    }

    function renderProductDetail(product) {
        var category = categories.find(function(c) { return c.id === product.categoryId; });
        var mainImage = null;
        if (product.images && product.images.length > 0) {
            mainImage = product.images.find(function(img) { return img.isMain; }) || product.images[0];
        }

        // Breadcrumbs
        var breadcrumbsHtml = renderBreadcrumbs(product, category);

        // Gallery or single image
        var galleryHtml;
        if (product.images && product.images.length > 1) {
            var sortedImages = product.images.slice().sort(function(a, b) {
                return (a.order || 0) - (b.order || 0);
            });

            galleryHtml = '<div class="product-gallery">' +
                '<div class="gallery-main" title="Нажмите для увеличения">' +
                    '<img src="' + escapeHtml(mainImage.url) + '" alt="' + escapeHtml(product.name) + '" id="galleryMainImage">' +
                    '<div class="gallery-zoom-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>' +
                '</div>' +
                '<div class="gallery-thumbs">' +
                    sortedImages.map(function(img) {
                        var isActive = img.isMain ? ' active' : '';
                        return '<button class="gallery-thumb' + isActive + '" onclick="ShopApp.setGalleryImage(\'' + escapeHtml(img.url) + '\', this)">' +
                            '<img src="' + escapeHtml(img.url) + '" alt="">' +
                        '</button>';
                    }).join('') +
                '</div>' +
            '</div>';
        } else {
            var imgSrc = mainImage ? mainImage.url : '';
            galleryHtml = '<div class="product-single-image gallery-main" title="Нажмите для увеличения">' +
                (imgSrc
                    ? '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(product.name) + '">' +
                      '<div class="gallery-zoom-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>'
                    : '<div class="product-image-placeholder" style="height:100%;display:flex;align-items:center;justify-content:center;">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:64px;height:64px;opacity:0.5;">' +
                            '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>' +
                            '<circle cx="8.5" cy="8.5" r="1.5"/>' +
                            '<polyline points="21 15 16 10 5 21"/>' +
                        '</svg>' +
                      '</div>') +
            '</div>';
        }

        var categoryTagHtml = category
            ? '<span class="product-category-tag" data-category="' + escapeHtml(category.slug) + '">' + escapeHtml(category.name) + '</span>'
            : '';

        // Related products
        var relatedHtml = renderRelatedProducts(product);

        elements.productDetail.innerHTML = breadcrumbsHtml +
            '<div class="product-detail-grid">' +
                galleryHtml +
                '<div class="product-detail-info">' +
                    categoryTagHtml +
                    '<h1 class="product-detail-name">' + escapeHtml(product.name) + '</h1>' +
                    '<div class="product-detail-price">' + formatPrice(product.price) + '</div>' +
                    '<div class="product-detail-description">' + escapeHtml(product.description || '') + '</div>' +
                '</div>' +
            '</div>' +
            relatedHtml;
    }

    function renderBreadcrumbs(product, category) {
        var categoryLink = category
            ? '<a href="#" class="breadcrumb-link" data-category="' + escapeHtml(category.slug) + '">' + escapeHtml(category.name) + '</a><span class="separator">›</span>'
            : '';
        return '<nav class="breadcrumbs">' +
            '<a href="/shop" class="breadcrumb-link">Магазин</a>' +
            '<span class="separator">›</span>' +
            categoryLink +
            '<span class="current">' + escapeHtml(product.name) + '</span>' +
        '</nav>';
    }

    function renderRelatedProducts(product) {
        var related = getRelatedProducts(product, 4);
        if (related.length === 0) return '';

        var cardsHtml = related.map(function(p, i) {
            return createProductCard(p, i);
        }).join('');

        return '<section class="related-products">' +
            '<h2 class="related-title">Похожие товары</h2>' +
            '<div class="related-grid">' + cardsHtml + '</div>' +
        '</section>';
    }

    function getRelatedProducts(product, limit) {
        var related = products.filter(function(p) {
            return p.id !== product.id &&
                   p.categoryId === product.categoryId &&
                   p.status === 'active';
        });
        return shuffleArray(related).slice(0, limit || 4);
    }

    function shuffleArray(arr) {
        var shuffled = arr.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    }

    // =================================================================
    // HELPERS
    // =================================================================

    function setActiveCategory(slug) {
        currentCategory = slug;

        // Update chip states
        document.querySelectorAll('.category-chip').forEach(function(chip) {
            chip.classList.toggle('active', chip.dataset.category === slug);
        });

        renderProducts();
    }

    function setGalleryImage(url, thumb) {
        var mainImg = document.getElementById('galleryMainImage');
        if (mainImg) mainImg.src = url;

        document.querySelectorAll('.gallery-thumb').forEach(function(t) {
            t.classList.remove('active');
        });
        if (thumb) thumb.classList.add('active');
    }

    function getProductCount(categoryId) {
        return products.filter(function(p) {
            return p.categoryId === categoryId && p.status === 'active';
        }).length;
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    // =================================================================
    // MOBILE MENU
    // =================================================================

    function toggleMenu() {
        var menu = elements.mobileMenu;
        var burger = document.querySelector('.burger');
        if (!menu) return;

        var isOpen = menu.classList.contains('active');

        if (isOpen) {
            closeMenu();
        } else {
            menu.classList.add('active');
            menu.setAttribute('aria-hidden', 'false');
            if (burger) burger.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMenu() {
        var menu = elements.mobileMenu;
        var burger = document.querySelector('.burger');
        if (!menu) return;

        menu.classList.remove('active');
        menu.setAttribute('aria-hidden', 'true');
        if (burger) burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    function handleScroll() {
        if (elements.nav) {
            if (window.scrollY > 50) {
                elements.nav.classList.add('scrolled');
            } else {
                elements.nav.classList.remove('scrolled');
            }
        }
    }

    // =================================================================
    // LIGHTBOX
    // =================================================================

    function openLightbox(images, startIndex) {
        lightboxImages = images;
        lightboxIndex = startIndex || 0;
        updateLightboxImage();
        if (elements.lightbox) {
            elements.lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeLightbox() {
        if (elements.lightbox) {
            elements.lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    function prevImage() {
        if (lightboxImages.length === 0) return;
        lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
        updateLightboxImage();
    }

    function nextImage() {
        if (lightboxImages.length === 0) return;
        lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
        updateLightboxImage();
    }

    function updateLightboxImage() {
        if (elements.lightboxImage && lightboxImages[lightboxIndex]) {
            elements.lightboxImage.src = lightboxImages[lightboxIndex];
        }
    }

    // =================================================================
    // MOBILE FILTER SHEET
    // =================================================================

    function openFilterSheet() {
        if (elements.filterSheet) {
            elements.filterSheet.classList.add('active');
        }
        if (elements.filterBackdrop) {
            elements.filterBackdrop.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    function closeFilterSheet() {
        if (elements.filterSheet) {
            elements.filterSheet.classList.remove('active');
        }
        if (elements.filterBackdrop) {
            elements.filterBackdrop.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    // =================================================================
    // SKELETON LOADING
    // =================================================================

    function renderSkeletons(count) {
        var html = '';
        for (var i = 0; i < count; i++) {
            html += '<div class="skeleton-card skeleton">' +
                '<div class="skeleton-image skeleton"></div>' +
                '<div class="skeleton-text skeleton"></div>' +
                '<div class="skeleton-text skeleton" style="width: 60%"></div>' +
            '</div>';
        }
        return html;
    }

    // =================================================================
    // INIT ON DOM READY
    // =================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // =================================================================
    // PUBLIC API
    // =================================================================

    return {
        showCatalog: showCatalog,
        setGalleryImage: setGalleryImage,
        setActiveCategory: setActiveCategory,
        toggleMenu: toggleMenu,
        closeMenu: closeMenu,
        resetFilters: resetFilters,
        openLightbox: openLightbox,
        closeLightbox: closeLightbox,
        prevImage: prevImage,
        nextImage: nextImage,
        openFilterSheet: openFilterSheet,
        closeFilterSheet: closeFilterSheet
    };
})();
