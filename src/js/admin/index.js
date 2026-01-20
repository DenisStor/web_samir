/**
 * Admin Panel Main Entry Point
 * Инициализация и координация всех модулей
 */

var AdminPanel = (function() {
    'use strict';

    // DOM элементы
    var elements = {};

    // Ссылки на document handlers для cleanup
    var boundDocumentHandlers = {
        click: null,
        change: null,
        keydown: null
    };

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
        console.log('Loading data...');

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
            renderCurrentSection();

            // Статистика
            if (data.stats) {
                AdminStatsRenderer.render(data.stats);
            }

            showToast('Данные загружены', 'success');
            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Ошибка загрузки данных', 'error');
        }
    }

    /**
     * Рендеринг текущей секции
     */
    function renderCurrentSection() {
        var section = AdminState.currentSection;

        switch (section) {
            case 'stats':
                loadStats();
                break;
            case 'masters':
                AdminMastersRenderer.render();
                break;
            case 'services':
                AdminServicesRenderer.render();
                break;
            case 'podology':
                AdminServicesRenderer.renderPodology();
                break;
            case 'articles':
                AdminArticlesRenderer.render();
                break;
            case 'faq':
                AdminFaqRenderer.render();
                break;
            case 'social':
                AdminSocialRenderer.render();
                break;
            case 'shop-categories':
                AdminShopCategoriesRenderer.render();
                break;
            case 'shop-products':
                AdminShopProductsRenderer.render();
                break;
            case 'legal':
                AdminLegalRenderer.render();
                break;
        }
    }

    /**
     * Загрузка статистики
     */
    async function loadStats() {
        try {
            var stats = await AdminAPI.get('stats');
            AdminStatsRenderer.render(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // =================================================================
    // NAVIGATION
    // =================================================================

    /**
     * Переключение секции
     */
    function switchSection(section) {
        AdminState.currentSection = section;

        // Обновляем навигацию
        elements.navItems.forEach(function(item) {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Скрываем все секции
        elements.sections.forEach(function(sec) {
            sec.classList.remove('active');
        });

        // Конфигурация секций
        var sectionConfig = {
            stats: {
                element: '#statsSection',
                title: 'Статистика',
                description: 'Аналитика посещений сайта',
                hideAddBtn: true
            },
            masters: {
                element: '#mastersSection',
                title: 'Мастера',
                description: 'Управление командой барберов',
                addText: 'Добавить мастера'
            },
            services: {
                element: '#servicesSection',
                title: 'Услуги',
                description: 'Прайс-лист барбершопа',
                addText: 'Добавить услугу'
            },
            podology: {
                element: '#podologySection',
                title: 'Подология',
                description: 'Услуги подологического кабинета',
                addText: 'Добавить услугу'
            },
            articles: {
                element: '#articlesSection',
                title: 'Статьи',
                description: 'Блог и полезные материалы',
                addText: 'Добавить статью'
            },
            faq: {
                element: '#faqSection',
                title: 'FAQ',
                description: 'Часто задаваемые вопросы',
                addText: 'Добавить вопрос'
            },
            social: {
                element: '#socialSection',
                title: 'Соцсети и контакты',
                description: 'Настройка социальных сетей и контактной информации',
                hideAddBtn: true
            },
            'shop-categories': {
                element: '#shopCategoriesSection',
                title: 'Категории товаров',
                description: 'Управление категориями интернет-магазина',
                addText: 'Добавить категорию'
            },
            'shop-products': {
                element: '#shopProductsSection',
                title: 'Товары',
                description: 'Управление товарами интернет-магазина',
                addText: 'Добавить товар'
            },
            legal: {
                element: '#legalSection',
                title: 'Юридические документы',
                description: 'Политики, соглашения и правовая информация',
                addText: 'Добавить документ'
            }
        };

        var config = sectionConfig[section];
        if (config) {
            var sectionEl = document.querySelector(config.element);
            if (sectionEl) {
                sectionEl.classList.add('active');
            }

            if (elements.pageTitle) {
                elements.pageTitle.textContent = config.title;
            }
            if (elements.pageDescription) {
                elements.pageDescription.textContent = config.description;
            }

            // Кнопка добавления
            if (elements.addNewBtn) {
                elements.addNewBtn.style.display = config.hideAddBtn ? 'none' : 'flex';
                var addBtnText = elements.addNewBtn.querySelector('span');
                if (addBtnText && config.addText) {
                    addBtnText.textContent = config.addText;
                }
            }
        }

        renderCurrentSection();
    }

    /**
     * Переключение категории услуг
     */
    function switchServiceCategory(category) {
        AdminState.currentCategory = category;

        elements.serviceTabs.forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        AdminServicesRenderer.render();
    }

    // =================================================================
    // EVENT DELEGATION
    // =================================================================

    /**
     * Инициализация делегирования событий
     */
    function initEventDelegation() {
        // Глобальный обработчик кликов (сохраняем ссылку для cleanup)
        boundDocumentHandlers.click = function(e) {
            var target = e.target.closest('[data-action]');
            if (!target) return;

            var action = target.getAttribute('data-action');
            var id = target.getAttribute('data-id');
            var category = target.getAttribute('data-category');
            var index = target.getAttribute('data-index');

            switch (action) {
                // Masters
                case 'edit-master':
                    editMaster(id);
                    break;
                case 'delete-master':
                    AdminMasterForm.remove(id);
                    break;

                // Services
                case 'edit-service':
                    AdminServiceForm.show(category, parseInt(index, 10));
                    break;
                case 'delete-service':
                    AdminServiceForm.remove(category, parseInt(index, 10));
                    break;

                // Podology
                case 'edit-podology':
                    AdminServiceForm.showPodology(parseInt(index, 10));
                    break;
                case 'delete-podology':
                    AdminServiceForm.removePodology(parseInt(index, 10));
                    break;

                // Articles
                case 'edit-article':
                    editArticle(id);
                    break;
                case 'delete-article':
                    AdminArticleForm.remove(id);
                    break;

                // FAQ
                case 'edit-faq':
                    editFaq(id);
                    break;
                case 'delete-faq':
                    AdminFaqForm.remove(id);
                    break;

                // Social
                case 'toggle-social':
                    var socialId = target.getAttribute('data-social-id');
                    AdminSocialRenderer.toggleActive(socialId);
                    break;

                // Image upload
                case 'remove-image':
                    var imageTarget = target.getAttribute('data-target');
                    removeImage(imageTarget);
                    break;

                // Master principles
                case 'add-principle':
                    AdminMasterForm.addPrinciple();
                    break;
                case 'remove-principle':
                    AdminMasterForm.removePrinciple(target);
                    break;

                // Shop categories
                case 'edit-shop-category':
                    editShopCategory(id);
                    break;
                case 'delete-shop-category':
                    AdminCategoryForm.remove(id);
                    break;

                // Shop products
                case 'edit-product':
                    editProduct(id);
                    break;
                case 'delete-product':
                    AdminProductForm.remove(id);
                    break;

                // Legal documents
                case 'edit-legal':
                    editLegalDocument(id);
                    break;
                case 'delete-legal':
                    AdminLegalForm.remove(id);
                    break;
                case 'toggle-legal':
                    AdminLegalRenderer.toggleActive(id);
                    break;
            }
        };
        document.addEventListener('click', boundDocumentHandlers.click);

        // Обработчик загрузки изображений (сохраняем ссылку для cleanup)
        boundDocumentHandlers.change = function(e) {
            var target = e.target;
            if (target.matches('[data-upload-target]')) {
                var inputId = target.getAttribute('data-upload-target');
                handleImageUpload(e, inputId);
            }
        };
        document.addEventListener('change', boundDocumentHandlers.change);
    }

    // =================================================================
    // CRUD HELPERS
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
        var document = AdminState.findLegalDocument(id);
        if (document) {
            AdminLegalForm.show(document);
        }
    }

    // =================================================================
    // IMAGE HANDLING
    // =================================================================

    async function handleImageUpload(event, inputId) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Пожалуйста, выберите изображение', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Файл слишком большой (максимум 5 МБ)', 'error');
            return;
        }

        showToast('Загрузка изображения...', 'success');

        try {
            var result = await AdminImageUpload.uploadFile(file);

            if (result.success) {
                var input = document.getElementById(inputId);
                if (input) {
                    input.value = result.url;
                }

                var uploadDiv = event.target.closest('.image-upload');
                if (uploadDiv) {
                    uploadDiv.classList.add('has-image');

                    var img = uploadDiv.querySelector('img');
                    if (!img) {
                        img = document.createElement('img');
                        uploadDiv.appendChild(img);
                    }
                    img.src = result.url;
                    img.alt = 'Загруженное изображение';

                    if (!uploadDiv.querySelector('.remove-image')) {
                        var removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'remove-image';
                        removeBtn.setAttribute('data-action', 'remove-image');
                        removeBtn.setAttribute('data-target', inputId);
                        removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                        uploadDiv.appendChild(removeBtn);
                    }
                }

                showToast('Изображение загружено', 'success');
            } else {
                showToast('Ошибка загрузки: ' + (result.error || 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Ошибка загрузки изображения', 'error');
        }
    }

    function removeImage(inputId) {
        var input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }

        var uploadDiv = document.getElementById(inputId + 'Upload');
        if (!uploadDiv && input) {
            uploadDiv = input.closest('.form-group').querySelector('.image-upload');
        }

        if (uploadDiv) {
            uploadDiv.classList.remove('has-image');
            var img = uploadDiv.querySelector('img');
            if (img) img.remove();
            var removeBtn = uploadDiv.querySelector('.remove-image');
            if (removeBtn) removeBtn.remove();
        }
    }

    // =================================================================
    // EVENT LISTENERS
    // =================================================================

    function initEventListeners() {
        // Navigation
        elements.navItems.forEach(function(item) {
            item.addEventListener('click', function() {
                switchSection(item.dataset.section);
            });
        });

        // Service tabs
        elements.serviceTabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                switchServiceCategory(tab.dataset.category);
            });
        });

        // Add new button
        if (elements.addNewBtn) {
            elements.addNewBtn.addEventListener('click', function() {
                switch (AdminState.currentSection) {
                    case 'masters':
                        AdminMasterForm.show();
                        break;
                    case 'services':
                        AdminServiceForm.show(AdminState.currentCategory);
                        break;
                    case 'podology':
                        AdminServiceForm.showPodology();
                        break;
                    case 'articles':
                        AdminArticleForm.show();
                        break;
                    case 'faq':
                        AdminFaqForm.show();
                        break;
                    case 'shop-categories':
                        AdminCategoryForm.show();
                        break;
                    case 'shop-products':
                        AdminProductForm.show();
                        break;
                    case 'legal':
                        AdminLegalForm.show();
                        break;
                }
            });
        }

        // Modal controls
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', function() {
                AdminModals.close('modal');
            });
        }
        if (elements.modalCancel) {
            elements.modalCancel.addEventListener('click', function() {
                AdminModals.close('modal');
            });
        }
        if (elements.modalOverlay) {
            elements.modalOverlay.addEventListener('click', function(e) {
                if (e.target === elements.modalOverlay) {
                    AdminModals.close('modal');
                }
            });
        }

        // Modal save
        if (elements.modalSave) {
            elements.modalSave.addEventListener('click', function() {
                switch (AdminState.currentSection) {
                    case 'masters':
                        AdminMasterForm.save();
                        break;
                    case 'services':
                        AdminServiceForm.save();
                        break;
                    case 'podology':
                        AdminServiceForm.savePodology();
                        break;
                    case 'articles':
                        AdminArticleForm.save();
                        break;
                    case 'faq':
                        AdminFaqForm.save();
                        break;
                    case 'shop-categories':
                        AdminCategoryForm.save();
                        break;
                    case 'shop-products':
                        AdminProductForm.save();
                        break;
                    case 'legal':
                        AdminLegalForm.save();
                        break;
                }
            });
        }

        // Escape key (сохраняем ссылку для cleanup)
        boundDocumentHandlers.keydown = function(e) {
            if (e.key === 'Escape') {
                AdminModals.closeCurrent();
            }
        };
        document.addEventListener('keydown', boundDocumentHandlers.keydown);

        // Save social button
        if (elements.saveSocialBtn) {
            elements.saveSocialBtn.addEventListener('click', function() {
                AdminSocialRenderer.save();
            });
        }
    }

    // =================================================================
    // INITIALIZATION
    // =================================================================

    /**
     * Инициализация админ-панели после логина
     */
    function initAdminPanel() {
        console.log('Admin Panel initializing...');

        initElements();

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
        initEventListeners();
        initEventDelegation();

        // Загрузка данных и переход на статистику
        loadData();
        switchSection('stats');

        console.log('Admin Panel initialized');
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
        // Удаляем document listeners
        if (boundDocumentHandlers.click) {
            document.removeEventListener('click', boundDocumentHandlers.click);
            boundDocumentHandlers.click = null;
        }
        if (boundDocumentHandlers.change) {
            document.removeEventListener('change', boundDocumentHandlers.change);
            boundDocumentHandlers.change = null;
        }
        if (boundDocumentHandlers.keydown) {
            document.removeEventListener('keydown', boundDocumentHandlers.keydown);
            boundDocumentHandlers.keydown = null;
        }

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

        console.log('Admin Panel destroyed');
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
        switchSection: switchSection,
        switchServiceCategory: switchServiceCategory,

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
        handleImageUpload: handleImageUpload,
        removeImage: removeImage,

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
