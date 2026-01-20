/**
 * Admin Article Form
 * Форма добавления/редактирования статьи
 */

var AdminArticleForm = (function() {
    'use strict';

    /**
     * Показать форму статьи
     */
    function show(article) {
        AdminState.editingItem = article || null;

        var title = article ? 'Редактировать статью' : 'Добавить статью';
        var today = new Date().toISOString().split('T')[0];

        var html = '<form id="articleForm" class="admin-form">' +
            '<div class="form-group">' +
                '<label class="form-label">Изображение</label>' +
                '<div class="image-upload ' + (article && article.image ? 'has-image' : '') + '" id="articleImageUpload">' +
                    (article && article.image ? '<img src="' + article.image + '" alt="Изображение">' : '') +
                    '<input type="file" accept="image/*" data-upload-target="articleImage">' +
                    SharedIcons.get('upload') +
                    '<span>Нажмите для загрузки изображения</span>' +
                    (article && article.image ? '<button type="button" class="remove-image" data-action="remove-image" data-target="articleImage">' + SharedIcons.get('close') + '</button>' : '') +
                '</div>' +
                '<input type="hidden" id="articleImage" value="' + (article && article.image ? article.image : '') + '">' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Заголовок *</label>' +
                '<input type="text" class="form-input" id="articleTitle" value="' + window.escapeHtml(article && article.title || '') + '" placeholder="Введите заголовок статьи" required>' +
            '</div>' +
            '<div class="form-row form-row-2">' +
                '<div class="form-group">' +
                    '<label class="form-label">Тег/Категория</label>' +
                    '<input type="text" class="form-input" id="articleTag" value="' + window.escapeHtml(article && article.tag || '') + '" placeholder="Уход за волосами">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Дата публикации</label>' +
                    '<input type="date" class="form-input" id="articleDate" value="' + (article && article.date || today) + '">' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Краткое описание</label>' +
                '<textarea class="form-textarea" id="articleExcerpt" placeholder="Краткое описание для превью статьи...">' + window.escapeHtml(article && article.excerpt || '') + '</textarea>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Полный текст статьи</label>' +
                AdminWYSIWYG.getEditorHTML('articleContent', article && article.content || '', 'Начните писать текст статьи...') +
            '</div>' +
        '</form>';

        AdminModals.setTitle('modal', title);
        var modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = html;
        }
        AdminModals.open('modal');

        // Инициализация редактора после рендеринга DOM
        requestAnimationFrame(function() {
            AdminWYSIWYG.initWithToolbar('articleContent');
        });
    }

    /**
     * Сохранить статью
     */
    async function save() {
        var titleEl = document.getElementById('articleTitle');
        var title = titleEl ? titleEl.value.trim() : '';

        if (!title) {
            showToast('Введите заголовок статьи', 'error');
            return;
        }

        var tagEl = document.getElementById('articleTag');
        var dateEl = document.getElementById('articleDate');
        var excerptEl = document.getElementById('articleExcerpt');
        var imageEl = document.getElementById('articleImage');

        var tag = tagEl ? tagEl.value.trim() : 'Статья';
        var date = dateEl ? dateEl.value : new Date().toISOString().split('T')[0];
        var excerpt = excerptEl ? excerptEl.value.trim() : '';
        var content = AdminWYSIWYG.getContent('articleContent');
        var image = imageEl ? imageEl.value : null;

        var articleData = {
            id: AdminState.editingItem ? AdminState.editingItem.id : 'article_' + Date.now(),
            title: title,
            tag: tag || 'Статья',
            date: date,
            excerpt: excerpt,
            content: content,
            image: image,
            active: true
        };

        var articles = AdminState.articles || [];

        if (AdminState.editingItem) {
            var index = articles.findIndex(function(a) {
                return a.id === AdminState.editingItem.id;
            });
            if (index !== -1) {
                articles[index] = articleData;
            }
        } else {
            articles.push(articleData);
        }

        try {
            await AdminAPI.save('articles', { articles: articles });
            AdminState.setArticles(articles);
            showToast('Статья сохранена', 'success');
            AdminModals.close('modal');
            AdminArticlesRenderer.render();
        } catch (error) {
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    /**
     * Удалить статью
     */
    async function remove(id) {
        if (!confirm('Вы уверены, что хотите удалить эту статью?')) {
            return;
        }

        var articles = AdminState.articles.filter(function(a) {
            return a.id !== id;
        });

        try {
            await AdminAPI.save('articles', { articles: articles });
            AdminState.setArticles(articles);
            showToast('Статья удалена', 'success');
            AdminArticlesRenderer.render();
        } catch (error) {
            showToast('Ошибка удаления: ' + error.message, 'error');
        }
    }

    // Публичный API
    return {
        show: show,
        save: save,
        remove: remove
    };
})();

// Экспорт
window.AdminArticleForm = AdminArticleForm;
