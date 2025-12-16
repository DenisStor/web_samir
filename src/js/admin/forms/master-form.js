/**
 * Admin Master Form
 * Форма добавления/редактирования мастера
 */

var AdminMasterForm = (function() {
    'use strict';

    /**
     * Показать форму мастера
     */
    function show(master) {
        AdminState.editingItem = master || null;

        var title = master ? 'Редактировать мастера' : 'Добавить мастера';
        var principles = (master && master.principles) || ['', '', '', ''];

        var principlesHtml = principles.map(function(p, i) {
            return '<div class="principle-item">' +
                '<input type="text" class="form-input principle-input" value="' + escapeHtml(p) + '" placeholder="Принцип ' + (i + 1) + '">' +
                '<button type="button" class="btn btn-icon danger" data-action="remove-principle">' +
                    SharedIcons.get('close') +
                '</button>' +
            '</div>';
        }).join('');

        var html = '<form id="masterForm" class="admin-form">' +
            '<div class="form-group">' +
                '<label class="form-label">Фото</label>' +
                '<div class="image-upload ' + (master && master.photo ? 'has-image' : '') + '" id="masterPhotoUpload">' +
                    (master && master.photo ? '<img src="' + master.photo + '" alt="Фото">' : '') +
                    '<input type="file" accept="image/*" data-upload-target="masterPhoto">' +
                    SharedIcons.get('upload') +
                    '<span>Нажмите для загрузки фото</span>' +
                    (master && master.photo ? '<button type="button" class="remove-image" data-action="remove-image" data-target="masterPhoto">' + SharedIcons.get('close') + '</button>' : '') +
                '</div>' +
                '<input type="hidden" id="masterPhoto" value="' + (master && master.photo ? master.photo : '') + '">' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Имя *</label>' +
                '<input type="text" class="form-input" id="masterName" value="' + escapeHtml(master && master.name || '') + '" placeholder="Введите имя мастера" required>' +
            '</div>' +
            '<div class="form-row form-row-2">' +
                '<div class="form-group">' +
                    '<label class="form-label">Инициал</label>' +
                    '<input type="text" class="form-input" id="masterInitial" value="' + escapeHtml(master && master.initial || '') + '" placeholder="С" maxlength="1">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Уровень</label>' +
                    '<select class="form-select" id="masterBadge">' +
                        '<option value="green" ' + (master && master.badge === 'green' ? 'selected' : '') + '>Green (начальный)</option>' +
                        '<option value="pink" ' + (master && master.badge === 'pink' ? 'selected' : '') + '>Pink (средний)</option>' +
                        '<option value="blue" ' + (master && master.badge === 'blue' ? 'selected' : '') + '>Dark Blue (высший)</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Должность</label>' +
                '<input type="text" class="form-input" id="masterRole" value="' + escapeHtml(master && master.role || '') + '" placeholder="Мастер">' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Специализация</label>' +
                '<textarea class="form-textarea" id="masterSpecialization" placeholder="Описание специализации мастера...">' + escapeHtml(master && master.specialization || '') + '</textarea>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Принципы работы</label>' +
                '<div class="principles-list" id="principlesList">' +
                    principlesHtml +
                '</div>' +
                '<button type="button" class="btn btn-secondary add-principle" data-action="add-principle">' +
                    SharedIcons.get('plus') +
                    'Добавить принцип' +
                '</button>' +
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
     * Сохранить мастера
     */
    async function save() {
        var nameEl = document.getElementById('masterName');
        var name = nameEl ? nameEl.value.trim() : '';

        if (!name) {
            showToast('Введите имя мастера', 'error');
            return;
        }

        var initialEl = document.getElementById('masterInitial');
        var badgeEl = document.getElementById('masterBadge');
        var roleEl = document.getElementById('masterRole');
        var specEl = document.getElementById('masterSpecialization');
        var photoEl = document.getElementById('masterPhoto');

        var initial = initialEl ? initialEl.value.trim() : '';
        var badge = badgeEl ? badgeEl.value : 'green';
        var role = roleEl ? roleEl.value.trim() : 'Мастер';
        var specialization = specEl ? specEl.value.trim() : '';
        var photo = photoEl ? photoEl.value : null;

        var principles = [];
        var principleInputs = document.querySelectorAll('.principle-input');
        principleInputs.forEach(function(input) {
            var val = input.value.trim();
            if (val) {
                principles.push(val);
            }
        });

        var masterData = {
            id: AdminState.editingItem ? AdminState.editingItem.id : 'master_' + Date.now(),
            name: name,
            initial: initial || name.charAt(0),
            badge: badge,
            role: role || 'Мастер',
            specialization: specialization,
            principles: principles,
            photo: photo,
            active: true
        };

        var masters = AdminState.masters || [];

        if (AdminState.editingItem) {
            var index = masters.findIndex(function(m) {
                return m.id === AdminState.editingItem.id;
            });
            if (index !== -1) {
                masters[index] = masterData;
            }
        } else {
            masters.push(masterData);
        }

        try {
            await AdminAPI.save('masters', { masters: masters });
            AdminState.setMasters(masters);
            showToast('Мастер сохранён', 'success');
            AdminModals.close('modal');
            AdminMastersRenderer.render();
        } catch (error) {
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    /**
     * Удалить мастера
     */
    async function remove(id) {
        if (!confirm('Вы уверены, что хотите удалить этого мастера?')) {
            return;
        }

        var masters = AdminState.masters.filter(function(m) {
            return m.id !== id;
        });

        try {
            await AdminAPI.save('masters', { masters: masters });
            AdminState.setMasters(masters);
            showToast('Мастер удалён', 'success');
            AdminMastersRenderer.render();
        } catch (error) {
            showToast('Ошибка удаления: ' + error.message, 'error');
        }
    }

    /**
     * Добавить поле принципа
     */
    function addPrinciple() {
        var list = document.getElementById('principlesList');
        if (!list) return;

        var count = list.querySelectorAll('.principle-item').length;

        var div = document.createElement('div');
        div.className = 'principle-item';
        div.innerHTML = '<input type="text" class="form-input principle-input" value="" placeholder="Принцип ' + (count + 1) + '">' +
            '<button type="button" class="btn btn-icon danger" data-action="remove-principle">' +
                SharedIcons.get('close') +
            '</button>';

        list.appendChild(div);
    }

    /**
     * Удалить поле принципа
     */
    function removePrinciple(button) {
        var item = button.closest('.principle-item');
        if (item) {
            item.remove();
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
        remove: remove,
        addPrinciple: addPrinciple,
        removePrinciple: removePrinciple
    };
})();

// Экспорт
window.AdminMasterForm = AdminMasterForm;
