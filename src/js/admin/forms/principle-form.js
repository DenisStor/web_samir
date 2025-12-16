/**
 * Admin Principle Form
 * Форма добавления/редактирования принципа работы
 */

var AdminPrincipleForm = (function() {
    'use strict';

    /**
     * Показать форму принципа
     */
    function show(principle) {
        AdminState.editingItem = principle || null;

        var title = principle ? 'Редактировать принцип' : 'Добавить принцип';

        var iconOptions = SharedIcons.getPrincipleKeys().map(function(icon) {
            var selected = principle && principle.icon === icon ? 'selected' : '';
            return '<option value="' + icon + '" ' + selected + '>' + icon + '</option>';
        }).join('');

        var currentIcon = (principle && principle.icon) || 'check';

        var html = '<form id="principleForm" class="admin-form">' +
            '<div class="form-group">' +
                '<label class="form-label">Изображение (необязательно)</label>' +
                '<div class="image-upload ' + (principle && principle.image ? 'has-image' : '') + '" id="principleImageUpload">' +
                    (principle && principle.image ? '<img src="' + principle.image + '" alt="Изображение">' : '') +
                    '<input type="file" accept="image/*" data-upload-target="principleImage">' +
                    SharedIcons.get('upload') +
                    '<span>Нажмите для загрузки изображения</span>' +
                    (principle && principle.image ? '<button type="button" class="remove-image" data-action="remove-image" data-target="principleImage">' + SharedIcons.get('close') + '</button>' : '') +
                '</div>' +
                '<input type="hidden" id="principleImage" value="' + (principle && principle.image ? principle.image : '') + '">' +
                '<p class="form-hint">Если изображение не загружено, будет показана иконка</p>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Иконка (если нет изображения)</label>' +
                '<select class="form-input" id="principleIcon">' +
                    iconOptions +
                '</select>' +
                '<div class="icon-preview" id="iconPreview">' +
                    SharedIcons.getPrinciple(currentIcon) +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Заголовок *</label>' +
                '<input type="text" class="form-input" id="principleTitle" value="' + escapeHtml(principle && principle.title || '') + '" placeholder="Название принципа" required>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Описание *</label>' +
                '<textarea class="form-textarea" id="principleDescription" placeholder="Описание принципа работы...">' + escapeHtml(principle && principle.description || '') + '</textarea>' +
            '</div>' +
        '</form>';

        AdminModals.setTitle('modal', title);
        var modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = html;
        }
        AdminModals.open('modal');

        // Обновление превью иконки при выборе
        var iconSelect = document.getElementById('principleIcon');
        var iconPreview = document.getElementById('iconPreview');

        if (iconSelect && iconPreview) {
            iconSelect.addEventListener('change', function() {
                iconPreview.innerHTML = SharedIcons.getPrinciple(iconSelect.value);
            });
        }
    }

    /**
     * Сохранить принцип
     */
    async function save() {
        var titleEl = document.getElementById('principleTitle');
        var title = titleEl ? titleEl.value.trim() : '';

        if (!title) {
            showToast('Введите заголовок принципа', 'error');
            return;
        }

        var descEl = document.getElementById('principleDescription');
        var iconEl = document.getElementById('principleIcon');
        var imageEl = document.getElementById('principleImage');

        var description = descEl ? descEl.value.trim() : '';
        var icon = iconEl ? iconEl.value : 'check';
        var image = imageEl ? imageEl.value : null;

        var principleData = {
            id: AdminState.editingItem ? AdminState.editingItem.id : 'principle_' + Date.now(),
            title: title,
            description: description,
            icon: icon,
            image: image
        };

        var principles = AdminState.principles || [];

        if (AdminState.editingItem) {
            var index = principles.findIndex(function(p) {
                return p.id === AdminState.editingItem.id;
            });
            if (index !== -1) {
                principles[index] = principleData;
            }
        } else {
            principles.push(principleData);
        }

        try {
            await AdminAPI.save('principles', { principles: principles });
            AdminState.setPrinciples(principles);
            showToast('Принцип сохранён', 'success');
            AdminModals.close('modal');
            AdminPrinciplesRenderer.render();
        } catch (error) {
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    /**
     * Удалить принцип
     */
    async function remove(id) {
        if (!confirm('Вы уверены, что хотите удалить этот принцип?')) {
            return;
        }

        var principles = AdminState.principles.filter(function(p) {
            return p.id !== id;
        });

        try {
            await AdminAPI.save('principles', { principles: principles });
            AdminState.setPrinciples(principles);
            showToast('Принцип удалён', 'success');
            AdminPrinciplesRenderer.render();
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
        save: save,
        remove: remove
    };
})();

// Экспорт
window.AdminPrincipleForm = AdminPrincipleForm;
