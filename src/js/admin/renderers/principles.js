/**
 * Admin Principles Renderer
 * Рендеринг списка принципов работы
 */

var AdminPrinciplesRenderer = (function() {
    'use strict';

    var container = null;

    /**
     * Инициализация
     */
    function init() {
        container = document.getElementById('principlesGrid');
    }

    /**
     * Рендеринг списка принципов
     */
    function render() {
        if (!container) {
            container = document.getElementById('principlesGrid');
            if (!container) return;
        }

        var principles = AdminState.principles || [];

        if (principles.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет принципов. Нажмите "Добавить" чтобы создать.</p>';
            return;
        }

        var html = principles.map(function(principle) {
            var iconHtml = principle.image
                ? '<img src="' + principle.image + '" alt="' + escapeHtml(principle.title) + '">'
                : SharedIcons.getPrinciple(principle.icon || 'check');

            return '<div class="principle-card" data-id="' + principle.id + '">' +
                '<div class="principle-icon">' +
                    iconHtml +
                '</div>' +
                '<div class="principle-content">' +
                    '<h3 class="principle-title">' + escapeHtml(principle.title) + '</h3>' +
                    '<p class="principle-description">' + escapeHtml(principle.description || '') + '</p>' +
                '</div>' +
                '<div class="principle-actions">' +
                    '<button class="btn btn-secondary" data-action="edit-principle" data-id="' + principle.id + '">' +
                        SharedIcons.get('edit') +
                        'Редактировать' +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-principle" data-id="' + principle.id + '" title="Удалить">' +
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
        render: render
    };
})();

// Экспорт
window.AdminPrinciplesRenderer = AdminPrinciplesRenderer;
