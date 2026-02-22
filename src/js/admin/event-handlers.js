/**
 * Admin Event Handlers Module
 * Обработчики событий админ-панели
 */

var AdminEventHandlers = (function () {
    'use strict';

    // Кэшированные элементы
    var elements = null;

    // Ссылки на handlers для cleanup
    var boundHandlers = {
        documentClick: null,
        documentChange: null
    };

    /**
     * Инициализация с элементами
     * @param {Object} els - Объект с DOM элементами
     */
    function init(els) {
        elements = els;
    }

    // =================================================================
    // ACTION HANDLERS
    // =================================================================

    /**
     * Обработка действий с мастерами
     */
    function handleMasterAction(action, id) {
        switch (action) {
            case 'edit-master':
                var master = AdminState.findMaster(id);
                if (master) {
                    AdminMasterForm.show(master);
                }
                break;
            case 'delete-master':
                AdminMasterForm.remove(id);
                break;
        }
    }

    /**
     * Обработка действий с услугами
     */
    function handleServiceAction(action, category, index) {
        switch (action) {
            case 'edit-service':
                AdminServiceForm.show(category, parseInt(index, 10));
                break;
            case 'delete-service':
                AdminServiceForm.remove(category, parseInt(index, 10));
                break;
            case 'edit-podology':
                AdminServiceForm.showPodology(category, parseInt(index, 10));
                break;
            case 'delete-podology':
                AdminServiceForm.removePodology(category, parseInt(index, 10));
                break;
        }
    }

    /**
     * Обработка действий с категориями подологии
     */
    function handlePodologyCategoryAction(action, id) {
        switch (action) {
            case 'add-podology-category':
                AdminPodologyCategoryForm.show();
                break;
            case 'edit-podology-category':
                AdminPodologyCategoryForm.show(id);
                break;
            case 'delete-podology-category':
                AdminPodologyCategoryForm.remove(id);
                break;
        }
    }

    /**
     * Обработка действий со статьями
     */
    function handleArticleAction(action, id) {
        switch (action) {
            case 'edit-article':
                var article = AdminState.findArticle(id);
                if (article) {
                    AdminArticleForm.show(article);
                }
                break;
            case 'delete-article':
                AdminArticleForm.remove(id);
                break;
        }
    }

    /**
     * Обработка действий с FAQ
     */
    function handleFaqAction(action, id) {
        switch (action) {
            case 'edit-faq':
                var faqItem = AdminState.findFaq(id);
                if (faqItem) {
                    AdminFaqForm.show(faqItem);
                }
                break;
            case 'delete-faq':
                AdminFaqForm.remove(id);
                break;
        }
    }

    /**
     * Обработка действий с категориями магазина
     */
    function handleShopCategoryAction(action, id) {
        switch (action) {
            case 'edit-shop-category':
                var category = AdminState.findShopCategory(id);
                if (category) {
                    AdminCategoryForm.show(category);
                }
                break;
            case 'delete-shop-category':
                AdminCategoryForm.remove(id);
                break;
        }
    }

    /**
     * Обработка действий с товарами
     */
    function handleProductAction(action, id) {
        switch (action) {
            case 'edit-product':
                var product = AdminState.findProduct(id);
                if (product) {
                    AdminProductForm.show(product);
                }
                break;
            case 'delete-product':
                AdminProductForm.remove(id);
                break;
        }
    }

    /**
     * Обработка действий с юридическими документами
     */
    function handleLegalAction(action, id) {
        switch (action) {
            case 'edit-legal':
                var doc = AdminState.findLegalDocument(id);
                if (doc) {
                    AdminLegalForm.show(doc);
                }
                break;
            case 'delete-legal':
                AdminLegalForm.remove(id);
                break;
            case 'toggle-legal':
                if (window.AdminLegalRenderer) {
                    AdminLegalRenderer.toggleActive(id);
                }
                break;
        }
    }

    /**
     * Обработка нажатия кнопки добавления
     */
    function handleAddNew() {
        var section = AdminState.currentSection;

        switch (section) {
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
    }

    /**
     * Обработка сохранения в модальном окне
     */
    function handleModalSave() {
        var section = AdminState.currentSection;
        var editing = AdminState.editingItem || {};

        // Проверяем тип редактируемого элемента
        if (editing.type === 'podology-category') {
            AdminPodologyCategoryForm.save();
            return;
        }

        switch (section) {
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
    }

    // =================================================================
    // ACTION ROUTING
    // =================================================================

    /**
     * Карта обработчиков действий
     */
    var ACTION_ROUTES = {
        'edit-master': function (t) {
            handleMasterAction('edit-master', t.getAttribute('data-id'));
        },
        'delete-master': function (t) {
            handleMasterAction('delete-master', t.getAttribute('data-id'));
        },
        'edit-service': function (t) {
            handleServiceAction(
                'edit-service',
                t.getAttribute('data-category'),
                t.getAttribute('data-index')
            );
        },
        'delete-service': function (t) {
            handleServiceAction(
                'delete-service',
                t.getAttribute('data-category'),
                t.getAttribute('data-index')
            );
        },
        'edit-podology': function (t) {
            handleServiceAction(
                'edit-podology',
                t.getAttribute('data-category'),
                t.getAttribute('data-index')
            );
        },
        'delete-podology': function (t) {
            handleServiceAction(
                'delete-podology',
                t.getAttribute('data-category'),
                t.getAttribute('data-index')
            );
        },
        'add-podology-category': function () {
            handlePodologyCategoryAction('add-podology-category');
        },
        'edit-podology-category': function (t) {
            handlePodologyCategoryAction('edit-podology-category', t.getAttribute('data-id'));
        },
        'delete-podology-category': function (t) {
            handlePodologyCategoryAction('delete-podology-category', t.getAttribute('data-id'));
        },
        'edit-article': function (t) {
            handleArticleAction('edit-article', t.getAttribute('data-id'));
        },
        'delete-article': function (t) {
            handleArticleAction('delete-article', t.getAttribute('data-id'));
        },
        'edit-faq': function (t) {
            handleFaqAction('edit-faq', t.getAttribute('data-id'));
        },
        'delete-faq': function (t) {
            handleFaqAction('delete-faq', t.getAttribute('data-id'));
        },
        'toggle-social': function (t) {
            if (window.AdminSocialRenderer)
                AdminSocialRenderer.toggleActive(t.getAttribute('data-social-id'));
        },
        'remove-image': function (t) {
            if (window.AdminImageHandler)
                AdminImageHandler.removeImage(t.getAttribute('data-target'));
        },
        'edit-shop-category': function (t) {
            handleShopCategoryAction('edit-shop-category', t.getAttribute('data-id'));
        },
        'delete-shop-category': function (t) {
            handleShopCategoryAction('delete-shop-category', t.getAttribute('data-id'));
        },
        'edit-product': function (t) {
            handleProductAction('edit-product', t.getAttribute('data-id'));
        },
        'delete-product': function (t) {
            handleProductAction('delete-product', t.getAttribute('data-id'));
        },
        'edit-legal': function (t) {
            handleLegalAction('edit-legal', t.getAttribute('data-id'));
        },
        'delete-legal': function (t) {
            handleLegalAction('delete-legal', t.getAttribute('data-id'));
        },
        'toggle-legal': function (t) {
            handleLegalAction('toggle-legal', t.getAttribute('data-id'));
        }
    };

    /**
     * Обработка клика по элементу с data-action
     * @param {Element} target - Элемент с data-action
     */
    function routeAction(target) {
        var action = target.getAttribute('data-action');
        var handler = ACTION_ROUTES[action];
        if (handler) handler(target);
    }

    // =================================================================
    // EVENT DELEGATION
    // =================================================================

    /**
     * Инициализация делегирования событий
     */
    function initEventDelegation() {
        boundHandlers.documentClick = function (e) {
            // Обработка табов подологии
            var podologyTab = e.target.closest('[data-podology-category]');
            if (podologyTab) {
                var category = podologyTab.getAttribute('data-podology-category');
                AdminRouter.switchPodologyCategory(category);
                return;
            }

            var target = e.target.closest('[data-action]');
            if (target) routeAction(target);
        };
        document.addEventListener('click', boundHandlers.documentClick);

        // Обработчик загрузки изображений
        boundHandlers.documentChange = function (e) {
            var target = e.target;
            if (target.matches('[data-upload-target]')) {
                var inputId = target.getAttribute('data-upload-target');
                if (window.AdminImageHandler) {
                    AdminImageHandler.handleUpload(e, inputId);
                }
            }
        };
        document.addEventListener('change', boundHandlers.documentChange);
    }

    // =================================================================
    // EVENT LISTENERS
    // =================================================================

    /**
     * Добавить обработчик клика, если элемент существует
     */
    function bindClick(el, handler) {
        if (el) el.addEventListener('click', handler);
    }

    /**
     * Инициализация слушателей событий
     */
    function initEventListeners() {
        if (!elements) return;

        // Navigation items
        (elements.navItems || []).forEach(function (item) {
            item.addEventListener('click', function () {
                AdminRouter.switchSection(item.dataset.section);
            });
        });

        // Service tabs
        (elements.serviceTabs || []).forEach(function (tab) {
            tab.addEventListener('click', function () {
                AdminRouter.switchServiceCategory(tab.dataset.category);
            });
        });

        // Buttons
        bindClick(elements.addNewBtn, handleAddNew);
        bindClick(elements.modalClose, function () {
            AdminModals.close('modal');
        });
        bindClick(elements.modalCancel, function () {
            AdminModals.close('modal');
        });
        bindClick(elements.modalSave, handleModalSave);
        bindClick(elements.saveSocialBtn, function () {
            if (window.AdminSocialRenderer) AdminSocialRenderer.save();
        });

        // Podology categories button
        var managePodologyCategoriesBtn = document.getElementById('managePodologyCategoriesBtn');
        bindClick(managePodologyCategoriesBtn, function () {
            if (window.AdminPodologyCategoryForm) {
                AdminPodologyCategoryForm.showList();
            }
        });

        // Modal overlay click
        bindClick(elements.modalOverlay, function (e) {
            if (e.target === elements.modalOverlay) AdminModals.close('modal');
        });
    }

    /**
     * Очистка обработчиков событий
     */
    function destroy() {
        if (boundHandlers.documentClick) {
            document.removeEventListener('click', boundHandlers.documentClick);
            boundHandlers.documentClick = null;
        }
        if (boundHandlers.documentChange) {
            document.removeEventListener('change', boundHandlers.documentChange);
            boundHandlers.documentChange = null;
        }

        elements = null;
    }

    // Публичный API
    return {
        init: init,
        initEventDelegation: initEventDelegation,
        initEventListeners: initEventListeners,
        handleAddNew: handleAddNew,
        handleModalSave: handleModalSave,
        destroy: destroy
    };
})();

// Экспорт
window.AdminEventHandlers = AdminEventHandlers;
