/**
 * Shop State Module
 * Централизованное состояние магазина
 * @module ShopState
 */
var ShopState = (function() {
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

    // Progress bar element
    var progressBar = null;

    // Для cleanup и throttle
    var scrollRAF = null;
    var boundHandlers = {
        hashchange: null,
        scroll: null,
        keydown: null,
        click: null
    };

    /**
     * Инициализация DOM элементов
     */
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
        progressBar = document.getElementById('progressBar');
    }

    /**
     * Сброс состояния
     */
    function reset() {
        categories = [];
        products = [];
        currentCategory = 'all';
        searchQuery = '';
        lightboxImages = [];
        lightboxIndex = 0;
        elements = {};
    }

    return {
        // API
        API_BASE: API_BASE,

        // Getters/Setters для состояния
        getCategories: function() { return categories; },
        setCategories: function(val) { categories = val; },

        getProducts: function() { return products; },
        setProducts: function(val) { products = val; },

        getCurrentCategory: function() { return currentCategory; },
        setCurrentCategory: function(val) { currentCategory = val; },

        getSearchQuery: function() { return searchQuery; },
        setSearchQuery: function(val) { searchQuery = val; },

        getCurrentSort: function() { return currentSort; },
        setCurrentSort: function(val) {
            currentSort = val;
            localStorage.setItem('shopSort', val);
        },

        getLightboxImages: function() { return lightboxImages; },
        setLightboxImages: function(val) { lightboxImages = val; },

        getLightboxIndex: function() { return lightboxIndex; },
        setLightboxIndex: function(val) { lightboxIndex = val; },

        // DOM Elements
        getElements: function() { return elements; },
        getProgressBar: function() { return progressBar; },

        // Scroll RAF
        getScrollRAF: function() { return scrollRAF; },
        setScrollRAF: function(val) { scrollRAF = val; },

        // Handlers
        getBoundHandlers: function() { return boundHandlers; },

        // Init & Reset
        initElements: initElements,
        reset: reset
    };
})();
