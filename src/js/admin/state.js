/**
 * Admin Panel State Module
 * Централизованное хранилище состояния приложения
 */

var AdminState = {
    // Данные
    masters: [],
    services: { categories: [], podology: { categories: [], consultation: null } },
    articles: [],
    faq: [],
    social: { social: [], phone: '', email: '', address: '' },
    // Shop данные
    shopCategories: [],
    products: [],
    // Legal данные
    legalDocuments: [],

    // UI состояние
    currentSection: 'stats',
    currentCategory: 'main',
    currentPodologyCategory: 'complex',
    isLoading: false,
    editingItem: null,

    // Методы для работы с состоянием

    /**
     * Сброс состояния к начальным значениям
     */
    reset: function() {
        this.masters = [];
        this.services = { categories: [], podology: { categories: [], consultation: null } };
        this.articles = [];
        this.faq = [];
        this.social = { social: [], phone: '', email: '', address: '' };
        this.shopCategories = [];
        this.products = [];
        this.legalDocuments = [];
        this.editingItem = null;
        this.currentPodologyCategory = 'complex';
    },

    /**
     * Вспомогательная функция сортировки по полю order
     * @param {Array} items - Массив элементов для сортировки
     * @returns {Array} Отсортированный массив
     * @private
     */
    _sortByOrder: function(items) {
        if (!items || !Array.isArray(items)) return items;
        return items.slice().sort(function(a, b) {
            var orderA = typeof a.order === 'number' ? a.order : Infinity;
            var orderB = typeof b.order === 'number' ? b.order : Infinity;
            return orderA - orderB;
        });
    },

    setMasters: function(data) {
        this.masters = this._sortByOrder(data || []);
    },

    setServices: function(data) {
        this.services = data || { categories: [], podology: { services: [] } };
    },

    setArticles: function(data) {
        this.articles = this._sortByOrder(data || []);
    },

    setFaq: function(data) {
        this.faq = this._sortByOrder(data || []);
    },

    setSocial: function(data) {
        this.social = data || { social: [], phone: '', email: '', address: '' };
    },

    /**
     * Найти мастера по ID
     * @param {string} id - ID мастера
     * @returns {Object|undefined} Найденный мастер или undefined
     */
    findMaster: function(id) {
        return this.masters.find(function(m) { return m.id === id; });
    },

    findArticle: function(id) {
        return this.articles.find(function(a) { return a.id === id; });
    },

    findFaq: function(id) {
        return this.faq.find(function(f) { return f.id === id; });
    },

    findSocialLink: function(id) {
        var links = this.social.social || [];
        return links.find(function(s) { return s.id === id; });
    },

    // Shop методы
    setShopCategories: function(data) {
        this.shopCategories = this._sortByOrder(data || []);
    },

    setProducts: function(data) {
        this.products = this._sortByOrder(data || []);
    },

    findShopCategory: function(id) {
        return this.shopCategories.find(function(c) { return c.id === id; });
    },

    findProduct: function(id) {
        return this.products.find(function(p) { return p.id === id; });
    },

    // Legal методы
    setLegalDocuments: function(data) {
        this.legalDocuments = data || [];
    },

    findLegalDocument: function(id) {
        return this.legalDocuments.find(function(d) { return d.id === id; });
    }
};

// Экспорт
window.AdminState = AdminState;
