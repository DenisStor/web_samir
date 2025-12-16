/**
 * Admin Masters Renderer
 * Рендеринг списка мастеров
 */

var AdminMastersRenderer = (function() {
    'use strict';

    var container = null;

    /**
     * Инициализация
     */
    function init() {
        container = document.getElementById('mastersGrid');
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

        var html = masters.map(function(master) {
            var photoHtml = master.photo
                ? '<img src="' + master.photo + '" alt="' + escapeHtml(master.name) + '">'
                : (master.initial || master.name.charAt(0));

            return '<div class="master-card" data-id="' + master.id + '">' +
                '<div class="master-card-header">' +
                    '<div class="master-avatar ' + (master.photo ? 'has-photo' : '') + '">' +
                        photoHtml +
                    '</div>' +
                    '<div class="master-info">' +
                        '<h3 class="master-name">' + escapeHtml(master.name) + '</h3>' +
                        '<div class="master-role">' + escapeHtml(master.role || 'Мастер') + '</div>' +
                        '<span class="master-badge badge-' + (master.badge || 'green') + '">' + getBadgeLabel(master.badge) + '</span>' +
                    '</div>' +
                '</div>' +
                '<p class="master-specialization">' + escapeHtml(master.specialization || '') + '</p>' +
                '<div class="master-card-actions">' +
                    '<button class="btn btn-secondary" data-action="edit-master" data-id="' + master.id + '">' +
                        SharedIcons.get('edit') +
                        'Редактировать' +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-master" data-id="' + master.id + '" title="Удалить">' +
                        SharedIcons.get('delete') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
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
        init: init,
        render: render,
        getBadgeLabel: getBadgeLabel
    };
})();

// Экспорт
window.AdminMastersRenderer = AdminMastersRenderer;
