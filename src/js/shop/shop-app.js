/**
 * Say's Barbers Shop Application
 * Главный модуль магазина — инициализация и оркестрация
 * @module ShopApp
 */
var ShopApp = (function() {
    'use strict';

    // =================================================================
    // INITIALIZATION
    // =================================================================

    function init() {
        ShopState.initElements();
        initEventListeners();
        loadData();
        ShopRouter.handleRoute();

        // Сохраняем ссылки на handlers для возможности cleanup
        var boundHandlers = ShopState.getBoundHandlers();
        boundHandlers.hashchange = ShopRouter.handleRoute;
        boundHandlers.scroll = ShopMobile.handleScrollThrottled;

        // Listen for hash changes
        window.addEventListener('hashchange', boundHandlers.hashchange);

        // Handle scroll for nav с throttle и passive
        window.addEventListener('scroll', boundHandlers.scroll, { passive: true });
    }

    // =================================================================
    // EVENT LISTENERS
    // =================================================================

    function initEventListeners() {
        var elements = ShopState.getElements();

        // Search with debounce
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', debounce(function(e) {
                ShopState.setSearchQuery(e.target.value.toLowerCase().trim());
                ShopFilters.updateSearchClearButton();
                ShopFilters.renderProducts();
            }, 300));
        }

        // Search clear button
        if (elements.searchClear) {
            elements.searchClear.addEventListener('click', function() {
                if (elements.searchInput) {
                    elements.searchInput.value = '';
                    ShopState.setSearchQuery('');
                    ShopFilters.updateSearchClearButton();
                    ShopFilters.renderProducts();
                    elements.searchInput.focus();
                }
            });
        }

        // Sort select
        if (elements.sortSelect) {
            elements.sortSelect.value = ShopState.getCurrentSort();
            elements.sortSelect.addEventListener('change', function(e) {
                ShopState.setCurrentSort(e.target.value);
                ShopFilters.renderProducts();
            });
        }

        // Keyboard events (Escape for lightbox)
        document.addEventListener('keydown', function(e) {
            var lightbox = elements.lightbox;
            if (e.key === 'Escape' && lightbox && lightbox.style.display !== 'none') {
                ShopLightbox.closeLightbox();
            }
            if (lightbox && lightbox.style.display !== 'none') {
                if (e.key === 'ArrowLeft') ShopLightbox.prevImage();
                if (e.key === 'ArrowRight') ShopLightbox.nextImage();
            }
        });

        // Delegated click handlers
        document.addEventListener('click', handleDocumentClick);
    }

    /**
     * Обработчик кликов по документу (делегирование)
     * @param {Event} e - Событие клика
     */
    function handleDocumentClick(e) {
        var elements = ShopState.getElements();

        // Category chip click
        var categoryChip = e.target.closest('.category-chip');
        if (categoryChip) {
            var category = categoryChip.dataset.category;
            ShopFilters.setActiveCategory(category);
            return;
        }

        // Product card click
        var productCard = e.target.closest('.product-card');
        if (productCard && !e.target.closest('.gallery-main')) {
            var productId = productCard.dataset.id;
            window.location.hash = 'product-' + productId;
            return;
        }

        // Category tag on product page
        var categoryTag = e.target.closest('.product-category-tag');
        if (categoryTag) {
            var categorySlug = categoryTag.dataset.category;
            if (categorySlug) {
                ShopRouter.showCatalog();
                ShopFilters.setActiveCategory(categorySlug);
            }
            return;
        }

        // Lightbox close on backdrop click
        if (e.target.classList.contains('lightbox')) {
            ShopLightbox.closeLightbox();
            return;
        }

        // Mobile filter backdrop click
        if (e.target.classList.contains('filter-backdrop')) {
            ShopMobile.closeFilterSheet();
            return;
        }

        // Gallery main image click for lightbox
        var galleryMain = e.target.closest('.gallery-main');
        if (galleryMain) {
            var images = [];
            var thumbImages = document.querySelectorAll('.gallery-thumb img');
            for (var i = 0; i < thumbImages.length; i++) {
                images.push(thumbImages[i].src);
            }
            if (images.length === 0) {
                var mainImg = galleryMain.querySelector('img');
                if (mainImg) images.push(mainImg.src);
            }
            if (images.length > 0) {
                var currentSrc = galleryMain.querySelector('img').src;
                var startIndex = -1;
                for (var j = 0; j < images.length; j++) {
                    if (images[j] === currentSrc) {
                        startIndex = j;
                        break;
                    }
                }
                ShopLightbox.openLightbox(images, startIndex >= 0 ? startIndex : 0);
            }
        }
    }

    // =================================================================
    // PROGRESS BAR
    // =================================================================

    function showProgress() {
        var progressBar = ShopState.getProgressBar();
        if (progressBar) {
            progressBar.classList.add('active', 'loading');
        }
    }

    function hideProgress() {
        var progressBar = ShopState.getProgressBar();
        if (progressBar) {
            progressBar.classList.remove('loading');
            progressBar.classList.add('complete');
            setTimeout(function() {
                if (progressBar) {
                    progressBar.classList.remove('active', 'complete');
                }
            }, 300);
        }
    }

    // =================================================================
    // DATA LOADING
    // =================================================================

    function loadData() {
        var elements = ShopState.getElements();

        // Show skeleton loading and progress bar
        elements.productsGrid.innerHTML = ShopRenderer.renderSkeletons(8);
        showProgress();

        Promise.all([
            fetch(ShopState.API_BASE + '/categories').then(function(r) { return r.json(); }),
            fetch(ShopState.API_BASE + '/products').then(function(r) { return r.json(); })
        ])
        .then(function(results) {
            ShopState.setCategories(results[0].categories || []);
            ShopState.setProducts(results[1].products || []);

            ShopFilters.renderCategories();
            ShopFilters.renderProducts();
            hideProgress();
        })
        .catch(function(error) {
            console.error('Error loading shop data:', error);
            hideProgress();
            elements.productsGrid.innerHTML = ShopRenderer.renderError();
        });
    }

    // =================================================================
    // CLEANUP
    // =================================================================

    function destroy() {
        var boundHandlers = ShopState.getBoundHandlers();

        // Удаляем window listeners
        if (boundHandlers.hashchange) {
            window.removeEventListener('hashchange', boundHandlers.hashchange);
            boundHandlers.hashchange = null;
        }
        if (boundHandlers.scroll) {
            window.removeEventListener('scroll', boundHandlers.scroll);
            boundHandlers.scroll = null;
        }

        // Отменяем requestAnimationFrame
        var scrollRAF = ShopState.getScrollRAF();
        if (scrollRAF) {
            cancelAnimationFrame(scrollRAF);
            ShopState.setScrollRAF(null);
        }

        // Очищаем состояние
        ShopState.reset();
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
        // Router
        showCatalog: ShopRouter.showCatalog,

        // Filters
        setActiveCategory: ShopFilters.setActiveCategory,
        resetFilters: ShopFilters.resetFilters,

        // Lightbox
        setGalleryImage: ShopLightbox.setGalleryImage,
        openLightbox: ShopLightbox.openLightbox,
        closeLightbox: ShopLightbox.closeLightbox,
        prevImage: ShopLightbox.prevImage,
        nextImage: ShopLightbox.nextImage,

        // Mobile
        toggleMenu: ShopMobile.toggleMenu,
        closeMenu: ShopMobile.closeMenu,
        openFilterSheet: ShopMobile.openFilterSheet,
        closeFilterSheet: ShopMobile.closeFilterSheet,

        // Lifecycle
        destroy: destroy
    };
})();
