/**
 * Admin Panel State Module
 * Централизованное хранилище состояния приложения
 */

var AdminState = {
    // Данные
    masters: [],
    services: { categories: [], podology: { services: [] } },
    articles: [],
    principles: [],
    faq: [],
    social: { social: [], phone: '', email: '', address: '' },

    // UI состояние
    currentSection: 'stats',
    isLoading: false,
    editingItem: null,

    // Методы для работы с состоянием
    reset: function() {
        this.masters = [];
        this.services = { categories: [], podology: { services: [] } };
        this.articles = [];
        this.principles = [];
        this.faq = [];
        this.social = { social: [], phone: '', email: '', address: '' };
        this.editingItem = null;
    },

    setMasters: function(data) {
        this.masters = data || [];
    },

    setServices: function(data) {
        this.services = data || { categories: [], podology: { services: [] } };
    },

    setArticles: function(data) {
        this.articles = data || [];
    },

    setPrinciples: function(data) {
        this.principles = data || [];
    },

    setFaq: function(data) {
        this.faq = data || [];
    },

    setSocial: function(data) {
        this.social = data || { social: [], phone: '', email: '', address: '' };
    },

    // Найти элемент по ID
    findMaster: function(id) {
        return this.masters.find(function(m) { return m.id === id; });
    },

    findArticle: function(id) {
        return this.articles.find(function(a) { return a.id === id; });
    },

    findPrinciple: function(id) {
        return this.principles.find(function(p) { return p.id === id; });
    },

    findFaq: function(id) {
        return this.faq.find(function(f) { return f.id === id; });
    },

    findSocialLink: function(id) {
        var links = this.social.social || [];
        return links.find(function(s) { return s.id === id; });
    }
};

// Экспорт
window.AdminState = AdminState;
