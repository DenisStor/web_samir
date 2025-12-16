/**
 * Admin FAQ Renderer
 * Рендеринг списка FAQ
 */

var AdminFaqRenderer = (function() {
    'use strict';

    var container = null;

    /**
     * Инициализация
     */
    function init() {
        container = document.getElementById('faqList');
    }

    /**
     * Рендеринг списка FAQ
     */
    function render() {
        if (!container) {
            container = document.getElementById('faqList');
            if (!container) return;
        }

        var faq = AdminState.faq || [];

        if (faq.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет вопросов. Нажмите "Добавить" чтобы создать.</p>';
            return;
        }

        var html = faq.map(function(item) {
            return '<div class="faq-admin-item" data-id="' + item.id + '">' +
                '<div class="faq-admin-content">' +
                    '<h3 class="faq-admin-question">' + escapeHtml(item.question) + '</h3>' +
                    '<p class="faq-admin-answer">' + escapeHtml(item.answer) + '</p>' +
                '</div>' +
                '<div class="faq-admin-actions">' +
                    '<button class="btn btn-secondary" data-action="edit-faq" data-id="' + item.id + '">' +
                        SharedIcons.get('edit') +
                        'Редактировать' +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-faq" data-id="' + item.id + '" title="Удалить">' +
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
window.AdminFaqRenderer = AdminFaqRenderer;
