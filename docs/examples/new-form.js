/**
 * Admin Example Form
 * Форма добавления/редактирования сущности
 *
 * Файл: src/js/admin/forms/example-form.js
 * Не забудьте добавить в scripts/build.py в список файлов бандла
 */

var AdminExampleForm = (function() {
    'use strict';

    // Приватные переменные
    var modal = null;
    var form = null;
    var currentItem = null;
    var isEditMode = false;

    /**
     * Инициализация формы
     */
    function init() {
        modal = document.getElementById('exampleModal');
        form = document.getElementById('exampleForm');

        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
    }

    /**
     * Открыть форму для создания
     */
    function openCreate() {
        currentItem = null;
        isEditMode = false;
        resetForm();
        updateModalTitle('Добавить элемент');
        AdminModals.open('exampleModal');
    }

    /**
     * Открыть форму для редактирования
     * @param {string} id - ID элемента
     */
    function openEdit(id) {
        var items = AdminState.examples || [];
        currentItem = items.find(function(item) { return item.id === id; });

        if (!currentItem) {
            showToast('Элемент не найден', 'error');
            return;
        }

        isEditMode = true;
        fillForm(currentItem);
        updateModalTitle('Редактировать элемент');
        AdminModals.open('exampleModal');
    }

    /**
     * Обновить заголовок модалки
     * @param {string} title - Новый заголовок
     */
    function updateModalTitle(title) {
        var titleEl = modal && modal.querySelector('.modal-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * Сбросить форму
     */
    function resetForm() {
        if (!form) return;

        form.reset();

        // Сбросить кастомные поля
        var imagePreview = form.querySelector('.image-preview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
    }

    /**
     * Заполнить форму данными
     * @param {Object} item - Данные элемента
     */
    function fillForm(item) {
        if (!form) return;

        // Заполнение текстовых полей
        var nameInput = form.querySelector('[name="name"]');
        var descInput = form.querySelector('[name="description"]');
        var statusSelect = form.querySelector('[name="status"]');

        if (nameInput) nameInput.value = item.name || '';
        if (descInput) descInput.value = item.description || '';
        if (statusSelect) statusSelect.value = item.status || 'draft';

        // Заполнение изображения (если есть)
        if (item.image) {
            var imagePreview = form.querySelector('.image-preview');
            if (imagePreview) {
                imagePreview.innerHTML = '<img src="' + item.image + '" alt="">';
            }
        }
    }

    /**
     * Собрать данные формы
     * @returns {Object} Данные формы
     */
    function collectFormData() {
        if (!form) return null;

        var formData = new FormData(form);

        return {
            id: isEditMode ? currentItem.id : SharedHelpers.generateId('example'),
            name: formData.get('name'),
            description: formData.get('description'),
            status: formData.get('status') || 'draft',
            image: formData.get('image') || (currentItem && currentItem.image) || null,
            order: isEditMode ? currentItem.order : (AdminState.examples || []).length
        };
    }

    /**
     * Валидация формы
     * @param {Object} data - Данные формы
     * @returns {Array} Массив ошибок
     */
    function validateForm(data) {
        var errors = [];

        if (!data.name || !data.name.trim()) {
            errors.push('Название обязательно');
        }

        if (data.name && data.name.length > 100) {
            errors.push('Название слишком длинное (макс. 100 символов)');
        }

        return errors;
    }

    /**
     * Обработчик отправки формы
     * @param {Event} event - Событие submit
     */
    function handleSubmit(event) {
        event.preventDefault();

        var data = collectFormData();
        var errors = validateForm(data);

        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }

        saveItem(data);
    }

    /**
     * Сохранить элемент
     * @param {Object} data - Данные элемента
     */
    function saveItem(data) {
        var items = AdminState.examples || [];

        if (isEditMode) {
            // Обновление существующего
            items = items.map(function(item) {
                return item.id === data.id ? data : item;
            });
        } else {
            // Добавление нового
            items.push(data);
        }

        // Сохранение на сервер
        AdminAPI.save('examples', { items: items })
            .then(function() {
                AdminState.setExamples(items);
                AdminModals.close('exampleModal');
                AdminExampleRenderer.render();
                showToast(isEditMode ? 'Изменения сохранены' : 'Элемент добавлен', 'success');
            })
            .catch(function(error) {
                showToast('Ошибка сохранения: ' + error.message, 'error');
            });
    }

    /**
     * Удалить элемент
     * @param {string} id - ID элемента
     * @param {string} name - Название (для подтверждения)
     */
    function deleteItem(id, name) {
        if (!confirm('Удалить "' + name + '"?')) {
            return;
        }

        var items = AdminState.examples || [];
        items = items.filter(function(item) { return item.id !== id; });

        AdminAPI.save('examples', { items: items })
            .then(function() {
                AdminState.setExamples(items);
                AdminExampleRenderer.render();
                showToast('Элемент удалён', 'success');
            })
            .catch(function(error) {
                showToast('Ошибка удаления: ' + error.message, 'error');
            });
    }

    // Публичный API
    return {
        init: init,
        openCreate: openCreate,
        openEdit: openEdit,
        deleteItem: deleteItem
    };
})();

// Экспорт в глобальную область
window.AdminExampleForm = AdminExampleForm;
