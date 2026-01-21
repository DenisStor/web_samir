/**
 * Admin Panel Main Entry Point
 * Инициализация и координация всех модулей
 */

var AdminPanel = (function() {
    'use strict';

    // DOM элементы
    var elements = {};

    /**
     * Инициализация DOM элементов
     */
    function initElements() {
        elements = {
            // Navigation
            navItems: document.querySelectorAll('.nav-item'),
            sections: document.querySelectorAll('.section'),
            pageTitle: document.getElementById('pageTitle'),
            pageDescription: document.getElementById('pageDescription'),
            addNewBtn: document.getElementById('addNewBtn'),

            // Service tabs
            serviceTabs: document.querySelectorAll('.tab'),

            // Modals
            modalOverlay: document.getElementById('modalOverlay'),
            modal: document.getElementById('modal'),
            modalTitle: document.getElementById('modalTitle'),
            modalBody: document.getElementById('modalBody'),
            modalClose: document.getElementById('modalClose'),
            modalCancel: document.getElementById('modalCancel'),
            modalSave: document.getElementById('modalSave'),

            // Delete modal
            deleteModalOverlay: document.getElementById('deleteModalOverlay'),
            deleteMessage: document.getElementById('deleteMessage'),
            deleteModalClose: document.getElementById('deleteModalClose'),
            deleteCancel: document.getElementById('deleteCancel'),
            deleteConfirm: document.getElementById('deleteConfirm'),

            // Social
            saveSocialBtn: document.getElementById('saveSocialBtn'),

            // Toast
            toastContainer: document.getElementById('toastContainer')
        };
    }

    /**
     * Загрузка всех данных
     */
    async function loadData() {
        try {
            var data = await AdminAPI.loadAllData();

            // Обновляем состояние (с проверкой на null от API)
            AdminState.setMasters((data.masters && data.masters.masters) || []);
            AdminState.setServices(data.services || {});
            AdminState.setArticles((data.articles && data.articles.articles) || []);
            AdminState.setFaq((data.faq && data.faq.faq) || []);
            AdminState.setSocial(data.social || {});
            AdminState.setShopCategories((data.shopCategories && data.shopCategories.categories) || []);
            AdminState.setProducts((data.products && data.products.products) || []);
            AdminState.setLegalDocuments((data.legal && data.legal.documents) || []);

            // Рендеринг
            AdminRouter.renderCurrentSection();

            // Статистика
            if (data.stats) {
                AdminStatsRenderer.render(data.stats);
            }

            showToast('Данные загружены', 'success');
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Ошибка загрузки данных', 'error');
        }
    }

    // =================================================================
    // CRUD HELPERS (для совместимости с публичным API)
    // =================================================================

    function editMaster(id) {
        var master = AdminState.findMaster(id);
        if (master) {
            AdminMasterForm.show(master);
        }
    }

    function editArticle(id) {
        var article = AdminState.findArticle(id);
        if (article) {
            AdminArticleForm.show(article);
        }
    }

    function editFaq(id) {
        var faqItem = AdminState.findFaq(id);
        if (faqItem) {
            AdminFaqForm.show(faqItem);
        }
    }

    function editShopCategory(id) {
        var category = AdminState.findShopCategory(id);
        if (category) {
            AdminCategoryForm.show(category);
        }
    }

    function editProduct(id) {
        var product = AdminState.findProduct(id);
        if (product) {
            AdminProductForm.show(product);
        }
    }

    function editLegalDocument(id) {
        var doc = AdminState.findLegalDocument(id);
        if (doc) {
            AdminLegalForm.show(doc);
        }
    }

    // =================================================================
    // INITIALIZATION
    // =================================================================

    /**
     * Инициализация админ-панели после логина
     */
    function initAdminPanel() {
        initElements();

        // Инициализация роутера и обработчиков событий
        AdminRouter.init(elements);
        AdminEventHandlers.init(elements);

        // Инициализация модулей
        AdminModals.init();
        AdminStatsRenderer.init();
        AdminMastersRenderer.init();
        AdminServicesRenderer.init();
        AdminArticlesRenderer.init();
        AdminFaqRenderer.init();
        AdminSocialRenderer.init();
        AdminShopCategoriesRenderer.init();
        AdminShopProductsRenderer.init();
        AdminLegalRenderer.init();

        // Инициализация поиска
        if (window.AdminSearch) {
            AdminSearch.init('mastersSearch', 'mastersGrid');
            AdminSearch.init('articlesSearch', 'articlesGrid');
            AdminSearch.init('faqSearch', 'faqList');
        }

        // Инициализация логаута
        AdminAuth.initLogoutButton();

        // Event listeners
        AdminEventHandlers.initEventListeners();
        AdminEventHandlers.initEventDelegation();

        // Загрузка данных и переход на статистику
        loadData();
        AdminRouter.switchSection('stats');
    }

    /**
     * Главная точка входа
     */
    async function init() {
        await AdminAuth.init(
            // onAuthenticated
            function() {
                initAdminPanel();
            },
            // onNotAuthenticated
            function() {
                AdminAuth.initLoginForm(function() {
                    initAdminPanel();
                });
            }
        );
    }

    /**
     * Очистка ресурсов и event listeners
     */
    function destroy() {
        // Очищаем обработчики событий
        AdminEventHandlers.destroy();

        // Уничтожаем drag-drop если доступен
        if (window.AdminDragDrop && AdminDragDrop.destroy) {
            AdminDragDrop.destroy('mastersGrid');
            AdminDragDrop.destroy('faqList');
            AdminDragDrop.destroy('shopCategoriesGrid');
            AdminDragDrop.destroy('shopProductsGrid');
        }

        // Сбрасываем состояние
        if (window.AdminState && AdminState.reset) {
            AdminState.reset();
        }

        // Очищаем кэш элементов
        elements = {};
    }

    // Запуск при готовности DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Публичный API (для совместимости с onclick в HTML)
    return {
        // Navigation
        switchSection: function(section) { AdminRouter.switchSection(section); },
        switchServiceCategory: function(category) { AdminRouter.switchServiceCategory(category); },

        // Masters
        editMaster: editMaster,
        deleteMaster: function(id) { AdminMasterForm.remove(id); },
        showMasterForm: function(id) {
            var master = id ? AdminState.findMaster(id) : null;
            AdminMasterForm.show(master);
        },

        // Services
        editService: function(categoryId, index) {
            AdminServiceForm.show(categoryId, index);
        },
        deleteService: function(categoryId, index) {
            AdminServiceForm.remove(categoryId, index);
        },
        editPodologyService: function(index) {
            AdminServiceForm.showPodology(index);
        },
        deletePodologyService: function(index) {
            AdminServiceForm.removePodology(index);
        },

        // Articles
        editArticle: editArticle,
        deleteArticle: function(id) { AdminArticleForm.remove(id); },
        showArticleForm: function(id) {
            var article = id ? AdminState.findArticle(id) : null;
            AdminArticleForm.show(article);
        },

        // FAQ
        editFaq: editFaq,
        deleteFaq: function(id) { AdminFaqForm.remove(id); },
        showFaqForm: function(id) {
            var faqItem = id ? AdminState.findFaq(id) : null;
            AdminFaqForm.show(faqItem);
        },

        // Social
        toggleSocialActive: function(id) {
            AdminSocialRenderer.toggleActive(id);
        },
        saveSocial: function() {
            AdminSocialRenderer.save();
        },

        // Image handling
        handleImageUpload: function(event, inputId) {
            AdminImageHandler.handleUpload(event, inputId);
        },
        removeImage: function(inputId) {
            AdminImageHandler.removeImage(inputId);
        },

        // Master principles
        addPrinciple: function() { AdminMasterForm.addPrinciple(); },
        removePrinciple: function(btn) { AdminMasterForm.removePrinciple(btn); },

        // Shop categories
        editShopCategory: editShopCategory,
        deleteShopCategory: function(id) { AdminCategoryForm.remove(id); },
        showCategoryForm: function(id) {
            var category = id ? AdminState.findShopCategory(id) : null;
            AdminCategoryForm.show(category);
        },

        // Shop products
        editProduct: editProduct,
        deleteProduct: function(id) { AdminProductForm.remove(id); },
        showProductForm: function(id) {
            var product = id ? AdminState.findProduct(id) : null;
            AdminProductForm.show(product);
        },

        // WYSIWYG
        formatText: function(command) {
            AdminWYSIWYG.formatText(command);
        },

        // Reload
        loadData: loadData,

        // Cleanup
        destroy: destroy
    };
})();

// Экспорт
window.AdminPanel = AdminPanel;
