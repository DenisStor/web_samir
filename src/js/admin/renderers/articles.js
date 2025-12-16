/**
 * Admin Articles Renderer
 * Рендеринг списка статей
 */

var AdminArticlesRenderer = (function() {
    'use strict';

    var container = null;

    /**
     * Инициализация
     */
    function init() {
        container = document.getElementById('articlesGrid');
    }

    /**
     * Форматирование даты
     */
    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            var date = new Date(dateStr);
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    /**
     * Рендеринг списка статей
     */
    function render() {
        if (!container) {
            container = document.getElementById('articlesGrid');
            if (!container) return;
        }

        var articles = AdminState.articles || [];

        if (articles.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет статей. Нажмите "Добавить" чтобы создать.</p>';
            return;
        }

        var html = articles.map(function(article) {
            var imageHtml = article.image
                ? '<img src="' + article.image + '" alt="' + escapeHtml(article.title) + '">'
                : SharedIcons.get('image');

            return '<div class="article-card" data-id="' + article.id + '">' +
                '<div class="article-image">' +
                    imageHtml +
                '</div>' +
                '<div class="article-content">' +
                    '<div class="article-meta">' +
                        '<span class="article-tag">' + escapeHtml(article.tag || 'Статья') + '</span>' +
                        '<span class="article-date">' + formatDate(article.date) + '</span>' +
                    '</div>' +
                    '<h3 class="article-title">' + escapeHtml(article.title) + '</h3>' +
                    '<p class="article-excerpt">' + escapeHtml(article.excerpt || '') + '</p>' +
                    '<div class="article-actions">' +
                        '<button class="btn btn-secondary" data-action="edit-article" data-id="' + article.id + '">' +
                            SharedIcons.get('edit') +
                            'Редактировать' +
                        '</button>' +
                        '<button class="btn btn-icon danger" data-action="delete-article" data-id="' + article.id + '" title="Удалить">' +
                            SharedIcons.get('delete') +
                        '</button>' +
                    '</div>' +
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
        formatDate: formatDate
    };
})();

// Экспорт
window.AdminArticlesRenderer = AdminArticlesRenderer;
