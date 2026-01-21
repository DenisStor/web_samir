/**
 * Admin Articles Renderer
 * Рендеринг списка статей с поддержкой drag & drop
 */

var AdminArticlesRenderer = (function() {
    'use strict';

    var container = null;
    var dragDropInitialized = false;

    /**
     * Инициализация
     */
    function init() {
        container = document.getElementById('articlesGrid');
        initDragDrop();
    }

    /**
     * Инициализация drag & drop
     */
    function initDragDrop() {
        if (dragDropInitialized || !window.AdminDragDrop) return;

        AdminDragDrop.init('articlesGrid', '.article-card', function(newOrder) {
            reorderArticles(newOrder);
        });

        dragDropInitialized = true;
    }

    /**
     * Изменение порядка статей
     */
    function reorderArticles(newOrder) {
        var articles = AdminState.articles || [];

        var reordered = newOrder.map(function(id) {
            return articles.find(function(a) { return a.id === id; });
        }).filter(Boolean);

        reordered.forEach(function(article, index) {
            article.order = index;
        });

        AdminAPI.save('articles', { articles: reordered })
            .then(function() {
                AdminState.setArticles(reordered);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
            })
            .catch(function(error) {
                if (window.showToast) {
                    showToast('Ошибка сохранения порядка', 'error');
                }
                render();
            });
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

        var html = articles.map(function(article, index) {
            var imageHtml = article.image
                ? '<img src="' + article.image + '" alt="' + escapeHtml(article.title) + '">'
                : SharedIcons.get('image');

            var searchText = [article.title, article.tag, article.excerpt].join(' ');

            return '<div class="article-card has-drag" data-id="' + article.id + '" data-index="' + index + '" data-search="' + escapeAttr(searchText) + '" draggable="true">' +
                '<div class="article-image">' +
                    imageHtml +
                '</div>' +
                '<div class="article-content">' +
                    '<div class="article-meta">' +
                        '<span class="article-tag">' + escapeHtml(article.tag || 'Статья') + '</span>' +
                        '<span class="article-date">' + SharedHelpers.formatDate(article.date) + '</span>' +
                    '</div>' +
                    '<h3 class="article-title">' + escapeHtml(article.title) + '</h3>' +
                    '<p class="article-excerpt">' + escapeHtml(article.excerpt || '') + '</p>' +
                    '<div class="article-actions">' +
                        '<button class="btn btn-secondary" data-action="edit-article" data-id="' + article.id + '">' +
                            SharedIcons.get('edit') +
                            'Редактировать' +
                        '</button>' +
                        '<button class="btn btn-icon danger" data-action="delete-article" data-id="' + article.id + '" data-name="' + escapeAttr(article.title) + '" title="Удалить">' +
                            SharedIcons.get('delete') +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="drag-handle" title="Перетащите для изменения порядка">' + SharedIcons.get('grip') + '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;

        if (window.AdminDragDrop) {
            AdminDragDrop.refresh('articlesGrid');
        }
    }

    // escapeHtml теперь используется из SharedHelpers (helpers.js)

    // Публичный API
    return {
        init: init,
        render: render,
        reorderArticles: reorderArticles
    };
})();

// Экспорт
window.AdminArticlesRenderer = AdminArticlesRenderer;
