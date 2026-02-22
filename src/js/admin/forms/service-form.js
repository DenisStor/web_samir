/**
 * Admin Service Form
 * Форма добавления/редактирования услуги
 */

var AdminServiceForm = (function () {
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
            category = services.categories.find(function (c) {
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

        var html =
            '<form id="serviceForm" class="admin-form">' +
            '<div class="form-group">' +
            '<label class="form-label">Название услуги *</label>' +
            '<input type="text" class="form-input" id="serviceName" value="' +
            window.escapeHtml((service && service.name) || '') +
            '" placeholder="Введите название услуги" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label">Цены по уровням мастеров</label>' +
            '<div class="form-row">' +
            '<div class="form-group">' +
            '<label class="form-label price-label-green">Green</label>' +
            '<input type="number" class="form-input" id="priceGreen" value="' +
            ((service && service.priceGreen) || '') +
            '" placeholder="1000">' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label price-label-pink">Pink</label>' +
            '<input type="number" class="form-input" id="pricePink" value="' +
            ((service && service.pricePink) || '') +
            '" placeholder="1300">' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label price-label-blue">Dark Blue</label>' +
            '<input type="number" class="form-input" id="priceBlue" value="' +
            ((service && service.priceBlue) || '') +
            '" placeholder="1500">' +
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
    function showPodology(categoryId, index) {
        categoryId = categoryId || AdminState.currentPodologyCategory || 'complex';

        var services = AdminState.services || {};
        var podology = services.podology || {};
        var categories = podology.categories || [];
        var category = categories.find(function (c) {
            return c.id === categoryId;
        });
        var service = null;

        if (category && index !== null && index !== undefined) {
            service = category.services[index];
        }

        AdminState.editingItem = {
            type: 'podology',
            categoryId: categoryId,
            index: index,
            service: service
        };

        var title = service ? 'Редактировать услугу' : 'Добавить услугу подологии';

        var html =
            '<form id="podologyForm" class="admin-form">' +
            '<div class="form-group">' +
            '<label class="form-label">Название услуги *</label>' +
            '<input type="text" class="form-input" id="podologyName" value="' +
            window.escapeHtml((service && service.name) || '') +
            '" placeholder="Введите название услуги" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label">Длительность</label>' +
            '<input type="text" class="form-input" id="podologyDuration" value="' +
            window.escapeHtml((service && service.duration) || '') +
            '" placeholder="1 час 30 минут">' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label">Цена</label>' +
            '<input type="text" class="form-input" id="podologyPrice" value="' +
            window.escapeHtml((service && service.price) || '') +
            '" placeholder="2500 ₽">' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-checkbox">' +
            '<input type="checkbox" id="podologyFeatured"' +
            (service && service.featured ? ' checked' : '') +
            '>' +
            '<span>Выделить услугу</span>' +
            '</label>' +
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

        var priceGreen = parseInt(greenEl ? greenEl.value : 0, 10) || 0;
        var pricePink = parseInt(pinkEl ? pinkEl.value : 0, 10) || 0;
        var priceBlue = parseInt(blueEl ? blueEl.value : 0, 10) || 0;

        var serviceData = {
            id: editing.service ? editing.service.id : SharedHelpers.generateId('service'),
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

        var category = services.categories.find(function (c) {
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
        var categoryId = editing.categoryId;
        var index = editing.index;

        var nameEl = document.getElementById('podologyName');
        var name = nameEl ? nameEl.value.trim() : '';

        if (!name) {
            showToast('Введите название услуги', 'error');
            return;
        }

        var durationEl = document.getElementById('podologyDuration');
        var priceEl = document.getElementById('podologyPrice');
        var featuredEl = document.getElementById('podologyFeatured');

        var serviceData = {
            id: editing.service ? editing.service.id : SharedHelpers.generateId('pod'),
            name: name,
            duration: durationEl ? durationEl.value.trim() : '',
            price: priceEl ? priceEl.value.trim() : 'Уточняйте',
            featured: featuredEl ? featuredEl.checked : false
        };

        var services = AdminState.services || {};

        if (!services.podology) {
            services.podology = { categories: [], consultation: null };
        }
        if (!services.podology.categories) {
            services.podology.categories = [];
        }

        var category = services.podology.categories.find(function (c) {
            return c.id === categoryId;
        });

        if (!category) {
            showToast('Категория не найдена', 'error');
            return;
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
        var category =
            services.categories &&
            services.categories.find(function (c) {
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
    async function removePodology(categoryId, index) {
        if (!confirm('Вы уверены, что хотите удалить эту услугу?')) {
            return;
        }

        var services = AdminState.services || {};

        if (services.podology && services.podology.categories) {
            var category = services.podology.categories.find(function (c) {
                return c.id === categoryId;
            });
            if (category && category.services) {
                category.services.splice(index, 1);
            }
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
