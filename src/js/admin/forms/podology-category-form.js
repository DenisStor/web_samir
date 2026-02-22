/**
 * Admin Podology Category Form
 * Форма добавления/редактирования категорий подологии
 */

var AdminPodologyCategoryForm = (function () {
    'use strict';

    var availableIcons = [
        { id: 'layers', name: 'Слои' },
        { id: 'heart', name: 'Сердце' },
        { id: 'plus-circle', name: 'Плюс' }
    ];

    /**
     * Показать список категорий для управления
     */
    function showList() {
        var services = AdminState.services || {};
        var podology = services.podology || {};
        var categories = podology.categories || [];

        var listHtml =
            categories.length > 0
                ? categories
                      .map(function (cat, index) {
                          return (
                              '<div class="category-item" data-id="' +
                              cat.id +
                              '">' +
                              '<div class="category-info">' +
                              '<strong>' +
                              escapeHtml(cat.name) +
                              '</strong>' +
                              '<span>' +
                              (cat.services ? cat.services.length : 0) +
                              ' услуг</span>' +
                              '</div>' +
                              '<div class="category-actions">' +
                              '<button class="btn btn-icon" data-action="edit-podology-category" data-id="' +
                              cat.id +
                              '" title="Редактировать">' +
                              SharedIcons.get('edit') +
                              '</button>' +
                              '<button class="btn btn-icon danger" data-action="delete-podology-category" data-id="' +
                              cat.id +
                              '" title="Удалить">' +
                              SharedIcons.get('delete') +
                              '</button>' +
                              '</div>' +
                              '</div>'
                          );
                      })
                      .join('')
                : '<p class="empty-message">Нет категорий</p>';

        var html =
            '<div class="categories-manager">' +
            '<div class="categories-list">' +
            listHtml +
            '</div>' +
            '<button class="btn btn-primary" data-action="add-podology-category" style="margin-top: 16px;">' +
            SharedIcons.get('plus') +
            ' Добавить категорию' +
            '</button>' +
            '</div>';

        AdminModals.setTitle('modal', 'Управление категориями');
        var modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = html;
        }

        // Скрываем стандартную кнопку сохранения
        var modalSave = document.getElementById('modalSave');
        if (modalSave) {
            modalSave.style.display = 'none';
        }

        AdminModals.open('modal');
    }

    /**
     * Показать форму категории
     */
    function show(categoryId) {
        var services = AdminState.services || {};
        var podology = services.podology || {};
        var categories = podology.categories || [];
        var category = null;

        if (categoryId) {
            category = categories.find(function (c) {
                return c.id === categoryId;
            });
        }

        AdminState.editingItem = {
            type: 'podology-category',
            categoryId: categoryId,
            category: category
        };

        var title = category ? 'Редактировать категорию' : 'Добавить категорию';

        var iconsHtml = availableIcons
            .map(function (icon) {
                var selected = category && category.icon === icon.id ? ' selected' : '';
                return '<option value="' + icon.id + '"' + selected + '>' + icon.name + '</option>';
            })
            .join('');

        var html =
            '<form id="podologyCategoryForm" class="admin-form">' +
            '<div class="form-group">' +
            '<label class="form-label">Название категории *</label>' +
            '<input type="text" class="form-input" id="podCategoryName" value="' +
            escapeHtml((category && category.name) || '') +
            '" placeholder="Комплексные программы" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label">Описание</label>' +
            '<input type="text" class="form-input" id="podCategoryDescription" value="' +
            escapeHtml((category && category.description) || '') +
            '" placeholder="Выгодные пакеты услуг">' +
            '</div>' +
            '<div class="form-row">' +
            '<div class="form-group">' +
            '<label class="form-label">Иконка</label>' +
            '<select class="form-select" id="podCategoryIcon">' +
            iconsHtml +
            '</select>' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label">Бейдж</label>' +
            '<input type="text" class="form-input" id="podCategoryBadge" value="' +
            escapeHtml((category && category.badge) || '') +
            '" placeholder="Выгодно">' +
            '</div>' +
            '</div>' +
            '</form>';

        AdminModals.setTitle('modal', title);
        var modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = html;
        }

        // Показываем кнопку сохранения
        var modalSave = document.getElementById('modalSave');
        if (modalSave) {
            modalSave.style.display = '';
        }

        AdminModals.open('modal');
    }

    /**
     * Сохранить категорию
     */
    async function save() {
        var editing = AdminState.editingItem || {};
        if (editing.type !== 'podology-category') return;

        var nameEl = document.getElementById('podCategoryName');
        var name = nameEl ? nameEl.value.trim() : '';

        if (!name) {
            showToast('Введите название категории', 'error');
            return;
        }

        var descEl = document.getElementById('podCategoryDescription');
        var iconEl = document.getElementById('podCategoryIcon');
        var badgeEl = document.getElementById('podCategoryBadge');

        var categoryData = {
            id: editing.category
                ? editing.category.id
                : name
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, ''),
            name: name,
            description: descEl ? descEl.value.trim() : '',
            icon: iconEl ? iconEl.value : 'heart',
            badge: badgeEl ? badgeEl.value.trim() : '',
            services: editing.category ? editing.category.services : []
        };

        var services = AdminState.services || {};
        if (!services.podology) {
            services.podology = { categories: [], consultation: null };
        }
        if (!services.podology.categories) {
            services.podology.categories = [];
        }

        if (editing.categoryId) {
            var index = services.podology.categories.findIndex(function (c) {
                return c.id === editing.categoryId;
            });
            if (index !== -1) {
                services.podology.categories[index] = categoryData;
            }
        } else {
            services.podology.categories.push(categoryData);
        }

        try {
            await AdminAPI.save('services', services);
            AdminState.setServices(services);
            showToast('Категория сохранена', 'success');
            AdminModals.close('modal');
            AdminServicesRenderer.renderPodology();
        } catch (error) {
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    /**
     * Удалить категорию
     */
    async function remove(categoryId) {
        if (!confirm('Удалить категорию и все её услуги?')) {
            return;
        }

        var services = AdminState.services || {};
        if (!services.podology || !services.podology.categories) return;

        services.podology.categories = services.podology.categories.filter(function (c) {
            return c.id !== categoryId;
        });

        // Если удалили текущую категорию, переключаемся на первую
        if (AdminState.currentPodologyCategory === categoryId) {
            AdminState.currentPodologyCategory =
                services.podology.categories.length > 0 ? services.podology.categories[0].id : '';
        }

        try {
            await AdminAPI.save('services', services);
            AdminState.setServices(services);
            showToast('Категория удалена', 'success');
            AdminModals.close('modal');
            AdminServicesRenderer.renderPodology();
        } catch (error) {
            showToast('Ошибка удаления: ' + error.message, 'error');
        }
    }

    // Публичный API
    return {
        showList: showList,
        show: show,
        save: save,
        remove: remove
    };
})();

// Экспорт
window.AdminPodologyCategoryForm = AdminPodologyCategoryForm;
