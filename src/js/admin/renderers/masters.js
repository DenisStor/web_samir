/**
 * Admin Masters Renderer
 * Рендеринг списка мастеров с поддержкой drag & drop
 */

var AdminMastersRenderer = (function() {
    'use strict';

    var container = null;
    var dragDropInitialized = false;

    /**
     * Инициализация
     */
    function init() {
        container = document.getElementById('mastersGrid');
        initDragDrop();
    }

    /**
     * Инициализация drag & drop
     */
    function initDragDrop() {
        if (dragDropInitialized || !window.AdminDragDrop) return;

        AdminDragDrop.init('mastersGrid', '.master-card', function(newOrder) {
            reorderMasters(newOrder);
        });

        dragDropInitialized = true;
    }

    /**
     * Изменение порядка мастеров
     */
    function reorderMasters(newOrder) {
        var masters = AdminState.masters || [];

        // Создаём новый порядок
        var reordered = newOrder.map(function(id) {
            return masters.find(function(m) { return m.id === id; });
        }).filter(Boolean);

        // Добавляем поле order
        reordered.forEach(function(master, index) {
            master.order = index;
        });

        // Сохраняем
        AdminAPI.save('masters', { masters: reordered })
            .then(function() {
                AdminState.setMasters(reordered);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
            })
            .catch(function(error) {
                if (window.showToast) {
                    showToast('Ошибка сохранения порядка', 'error');
                }
                render(); // Откат
            });
    }

    /**
     * Получить название уровня мастера
     */
    function getBadgeLabel(badge) {
        var labels = {
            'green': 'Green',
            'pink': 'Pink',
            'blue': 'Dark Blue'
        };
        return labels[badge] || 'Green';
    }

    /**
     * Рендеринг списка мастеров
     */
    function render() {
        if (!container) {
            container = document.getElementById('mastersGrid');
            if (!container) return;
        }

        var masters = AdminState.masters || [];

        if (masters.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет мастеров. Нажмите "Добавить" чтобы создать.</p>';
            return;
        }

        var html = masters.map(function(master, index) {
            var photoHtml = master.photo
                ? '<img src="' + master.photo + '" alt="' + window.escapeHtml(master.name) + '">'
                : (master.initial || master.name.charAt(0));

            var searchText = [master.name, master.role, master.specialization].join(' ');

            return '<div class="master-card has-drag" data-id="' + master.id + '" data-index="' + index + '" data-search="' + window.escapeHtml(searchText) + '" draggable="true">' +
                '<div class="master-card-header">' +
                    '<div class="master-avatar ' + (master.photo ? 'has-photo' : '') + '">' +
                        photoHtml +
                    '</div>' +
                    '<div class="master-info">' +
                        '<h3 class="master-name">' + window.escapeHtml(master.name) + '</h3>' +
                        '<div class="master-role">' + window.escapeHtml(master.role || 'Мастер') + '</div>' +
                        '<span class="master-badge badge-' + (master.badge || 'green') + '">' + getBadgeLabel(master.badge) + '</span>' +
                    '</div>' +
                '</div>' +
                '<p class="master-specialization">' + window.escapeHtml(master.specialization || '') + '</p>' +
                '<div class="master-card-actions">' +
                    '<button class="btn btn-secondary" data-action="edit-master" data-id="' + master.id + '">' +
                        SharedIcons.get('edit') +
                        'Редактировать' +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-master" data-id="' + master.id + '" data-name="' + window.escapeHtml(master.name) + '" title="Удалить">' +
                        SharedIcons.get('delete') +
                    '</button>' +
                '</div>' +
                '<div class="drag-handle" title="Перетащите для изменения порядка">' + SharedIcons.get('grip') + '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;

        // Обновляем drag & drop после рендера
        if (window.AdminDragDrop) {
            AdminDragDrop.refresh('mastersGrid');
        }
    }

    // Публичный API
    return {
        init: init,
        render: render,
        getBadgeLabel: getBadgeLabel,
        reorderMasters: reorderMasters
    };
})();

// Экспорт
window.AdminMastersRenderer = AdminMastersRenderer;
