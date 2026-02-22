/**
 * Blog Modal Module
 * Логика модального окна блога для динамически загруженных статей
 */

var BlogModal = (function () {
    'use strict';

    var escapeHtml = window.escapeHtml;
    var escapeAttr = window.SharedHelpers ? SharedHelpers.escapeAttr : window.escapeAttr;
    var formatDate = window.SharedHelpers ? SharedHelpers.formatDate : window.formatDate;

    // Store escape handler reference for cleanup
    var currentEscapeHandler = null;

    // Store original function if exists
    var originalOpenBlogModal = null;
    var originalCloseBlogModal = null;

    /**
     * Санитизация HTML для защиты от XSS
     * @param {string} html - HTML для санитизации
     * @returns {string} Санитизированный HTML
     */
    function sanitizeHTML(html) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'p',
                    'br',
                    'strong',
                    'b',
                    'em',
                    'i',
                    'u',
                    'a',
                    'ul',
                    'ol',
                    'li',
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'h5',
                    'h6',
                    'blockquote',
                    'span',
                    'div'
                ],
                ALLOWED_ATTR: ['href', 'target', 'class', 'style'],
                ALLOW_DATA_ATTR: false
            });
        }
        // Fallback: удаляем опасные теги
        var safe = html;
        safe = safe.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        safe = safe.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        safe = safe.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
        safe = safe.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
        safe = safe.replace(/<embed[^>]*\/?>/gi, '');
        safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
        safe = safe.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
        safe = safe.replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, '$1=""');
        return safe;
    }

    /**
     * Показать модальное окно статьи
     * @param {Object} article - Данные статьи
     */
    function showDynamicArticleModal(article) {
        var modal = document.getElementById('blogModal');
        var container = document.getElementById('blogModalContent');
        var topMeta = document.getElementById('blogModalTopMeta');
        if (!modal || !container) return;

        var icons = window.SiteTemplates ? SiteTemplates.icons : {};
        var safeImage = escapeAttr(article.image || '');
        var safeTitle = escapeAttr(article.title || '');
        var dateText = formatDate(article.date);

        // Заполняем шапку (категория + дата)
        if (topMeta) {
            topMeta.innerHTML =
                '<span class="blog-modal-tag">' +
                escapeHtml(article.tag || 'Статья') +
                '</span>' +
                '<span class="blog-modal-date">' +
                (icons.calendar || '') +
                ' ' +
                dateText +
                '</span>';
        }

        // Генерируем HTML для изображения
        var imageHtml = article.image
            ? '<div class="blog-modal-image"><img src="' +
              safeImage +
              '" alt="' +
              safeTitle +
              '" style="width:100%; height:100%; object-fit:cover;"></div>'
            : '';

        // Обработка контента
        var content = article.content || article.excerpt || '';
        var contentHtml = '';
        if (/<[a-z][\s\S]*>/i.test(content)) {
            contentHtml = sanitizeHTML(content);
        } else {
            contentHtml = content
                .split('\n\n')
                .filter(function (p) {
                    return p.trim();
                })
                .map(function (p) {
                    return '<p>' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>';
                })
                .join('');
            if (!contentHtml) {
                contentHtml = '<p>' + escapeHtml(article.excerpt || '') + '</p>';
            }
        }

        // Генерируем полный HTML и вставляем в контейнер
        container.innerHTML =
            imageHtml +
            '<h2 class="blog-modal-title">' +
            escapeHtml(article.title || '') +
            '</h2>' +
            '<div class="blog-modal-body">' +
            contentHtml +
            '</div>';

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Remove previous escape handler if exists
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
        }

        // Handle escape key
        currentEscapeHandler = function (e) {
            if (e.key === 'Escape') {
                close();
            }
        };
        document.addEventListener('keydown', currentEscapeHandler);
    }

    /**
     * Открыть модальное окно блога
     * @param {string} articleId - ID статьи
     */
    function open(articleId) {
        // Try dynamic data first
        if (window.dynamicArticlesData) {
            var article = window.dynamicArticlesData.find(function (a) {
                return a.id === articleId;
            });
            if (article) {
                showDynamicArticleModal(article);
                return;
            }
        }

        // Fallback to original function
        if (typeof originalOpenBlogModal === 'function') {
            originalOpenBlogModal(articleId);
        }
    }

    /**
     * Закрыть модальное окно блога
     */
    function close() {
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
            currentEscapeHandler = null;
        }

        if (typeof originalCloseBlogModal === 'function') {
            originalCloseBlogModal();
        } else {
            var modal = document.getElementById('blogModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }

    /**
     * Инициализация модуля
     */
    function init() {
        // Сохраняем оригинальные функции
        originalOpenBlogModal = window.openBlogModal;
        originalCloseBlogModal = window.closeBlogModal;

        // Переопределяем глобальные функции
        window.openBlogModal = open;
        window.closeBlogModal = close;
    }

    /**
     * Очистка
     */
    function cleanup() {
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
            currentEscapeHandler = null;
        }
    }

    // Публичный API
    return {
        init: init,
        open: open,
        close: close,
        showDynamicArticleModal: showDynamicArticleModal,
        cleanup: cleanup
    };
})();

// Экспорт
window.BlogModal = BlogModal;
