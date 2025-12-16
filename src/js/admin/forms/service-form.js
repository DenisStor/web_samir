/**
 * Admin Service Form
 * Форма добавления/редактирования услуги
 */

var AdminServiceForm = (function() {
    'use strict';

    /**
     * Показать форму услуги
     */
    function show(categoryId, index) {
        categoryId = categoryId || AdminState.currentCategory || 'main';

        var services = AdminState.services || {};
        var category = null;
        var service = null;

        if (services.categories) {
            category = services.categories.find(function(c) {
                return c.id === categoryId;
            });
        }

        if (category && index !== null && index !== undefined) {
            service = category.services[index];
        }

        AdminState.editingItem = {
            categoryId: categoryId,
            index: index,
            service: service
        };

        var title = service ? 'Редактировать услугу' : 'Добавить услугу';

        var html = '<form id="serviceForm" class="admin-form">' +
            '<div class="form-group">' +
                '<label class="form-label">Название услуги *</label>' +
                '<input type="text" class="form-input" id="serviceName" value="' + escapeHtml(service && service.name || '') + '" placeholder="Введите название услуги" required>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Цены по уровням мастеров</label>' +
                '<div class="form-row">' +
                    '<div class="form-group">' +
                        '<label class="form-label price-label-green">Green</label>' +
                        '<input type="number" class="form-input" id="priceGreen" value="' + (service && service.priceGreen || '') + '" placeholder="1000">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label price-label-pink">Pink</label>' +
                        '<input type="number" class="form-input" id="pricePink" value="' + (service && service.pricePink || '') + '" placeholder="1300">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label price-label-blue">Dark Blue</label>' +
                        '<input type="number" class="form-input" id="priceBlue" value="' + (service && service.priceBlue || '') + '" placeholder="1500">' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</form>';

        AdminModals.setTitle('modal', title);
        var modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = html;
        }
        AdminModals.open('modal');
    }

    /**
     * Показать форму услуги подологии
     */
    function showPodology(index) {
        var services = AdminState.services || {};
        var podologyServices = (services.podology && services.podology.services) || [];
        var service = null;

        if (index !== null && index !== undefined) {
            service = podologyServices[index];
        }

        AdminState.editingItem = {
            type: 'podology',
            index: index,
            service: service
        };

        var title = service ? 'Редактировать услугу' : 'Добавить услугу подологии';

        var html = '<form id="podologyForm" class="admin-form">' +
            '<div class="form-group">' +
                '<label class="form-label">Название услуги *</label>' +
                '<input type="text" class="form-input" id="podologyName" value="' + escapeHtml(service && service.name || '') + '" placeholder="Введите название услуги" required>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Цена</label>' +
                '<input type="text" class="form-input" id="podologyPrice" value="' + escapeHtml(service && service.price || '') + '" placeholder="от 2000 ₽">' +
            '</div>' +
        '</form>';

        AdminModals.setTitle('modal', title);
        var modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = html;
        }
        AdminModals.open('modal');
    }

    /**
     * Получить название категории
     */
    function getCategoryName(id) {
        var names = {
            main: 'Основные услуги',
            complex: 'Комплексные услуги',
            additional: 'Дополнительные услуги'
        };
        return names[id] || id;
    }

    /**
     * Сохранить услугу
     */
    async function save() {
        var editing = AdminState.editingItem || {};
        var categoryId = editing.categoryId;
        var index = editing.index;

        var nameEl = document.getElementById('serviceName');
        var name = nameEl ? nameEl.value.trim() : '';

        if (!name) {
            showToast('Введите название услуги', 'error');
            return;
        }

        var greenEl = document.getElementById('priceGreen');
        var pinkEl = document.getElementById('pricePink');
        var blueEl = document.getElementById('priceBlue');

        var priceGreen = parseInt(greenEl ? greenEl.value : 0) || 0;
        var pricePink = parseInt(pinkEl ? pinkEl.value : 0) || 0;
        var priceBlue = parseInt(blueEl ? blueEl.value : 0) || 0;

        var serviceData = {
            id: editing.service ? editing.service.id : Date.now(),
            name: name,
            priceGreen: priceGreen,
            pricePink: pricePink,
            priceBlue: priceBlue
        };

        var services = AdminState.services || {};

        // Ensure categories exist
        if (!services.categories) {
            services.categories = [];
        }

        var category = services.categories.find(function(c) {
            return c.id === categoryId;
        });

        if (!category) {
            category = {
                id: categoryId,
                name: getCategoryName(categoryId),
                services: []
            };
            services.categories.push(category);
        }

        if (!category.services) {
            category.services = [];
        }

        if (index !== null && index !== undefined) {
            category.services[index] = serviceData;
        } else {
            category.services.push(serviceData);
        }

        try {
            await AdminAPI.save('services', services);
            AdminState.setServices(services);
            showToast('Услуга сохранена', 'success');
            AdminModals.close('modal');
            AdminServicesRenderer.render();
        } catch (error) {
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    /**
     * Сохранить услугу подологии
     */
    async function savePodology() {
        var editing = AdminState.editingItem || {};
        var index = editing.index;

        var nameEl = document.getElementById('podologyName');
        var name = nameEl ? nameEl.value.trim() : '';

        if (!name) {
            showToast('Введите название услуги', 'error');
            return;
        }

        var priceEl = document.getElementById('podologyPrice');
        var price = priceEl ? priceEl.value.trim() : 'Уточняйте';

        var serviceData = {
            id: editing.service ? editing.service.id : Date.now(),
            name: name,
            price: price || 'Уточняйте'
        };

        var services = AdminState.services || {};

        if (!services.podology) {
            services.podology = { services: [] };
        }
        if (!services.podology.services) {
            services.podology.services = [];
        }

        if (index !== null && index !== undefined) {
            services.podology.services[index] = serviceData;
        } else {
            services.podology.services.push(serviceData);
        }

        try {
            await AdminAPI.save('services', services);
            AdminState.setServices(services);
            showToast('Услуга сохранена', 'success');
            AdminModals.close('modal');
            AdminServicesRenderer.renderPodology();
        } catch (error) {
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    /**
     * Удалить услугу
     */
    async function remove(categoryId, index) {
        if (!confirm('Вы уверены, что хотите удалить эту услугу?')) {
            return;
        }

        var services = AdminState.services || {};
        var category = services.categories && services.categories.find(function(c) {
            return c.id === categoryId;
        });

        if (category && category.services) {
            category.services.splice(index, 1);
        }

        try {
            await AdminAPI.save('services', services);
            AdminState.setServices(services);
            showToast('Услуга удалена', 'success');
            AdminServicesRenderer.render();
        } catch (error) {
            showToast('Ошибка удаления: ' + error.message, 'error');
        }
    }

    /**
     * Удалить услугу подологии
     */
    async function removePodology(index) {
        if (!confirm('Вы уверены, что хотите удалить эту услугу?')) {
            return;
        }

        var services = AdminState.services || {};

        if (services.podology && services.podology.services) {
            services.podology.services.splice(index, 1);
        }

        try {
            await AdminAPI.save('services', services);
            AdminState.setServices(services);
            showToast('Услуга удалена', 'success');
            AdminServicesRenderer.renderPodology();
        } catch (error) {
            showToast('Ошибка удаления: ' + error.message, 'error');
        }
    }

    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        if (!text) return '';
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(text);
        }
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Публичный API
    return {
        show: show,
        showPodology: showPodology,
        save: save,
        savePodology: savePodology,
        remove: remove,
        removePodology: removePodology
    };
})();

// Экспорт
window.AdminServiceForm = AdminServiceForm;
