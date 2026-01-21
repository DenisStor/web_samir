/**
 * Blog Modal Module
 * Логика модального окна блога для динамически загруженных статей
 */

var BlogModal = (function() {
    'use strict';

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
                ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div'],
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
        if (!modal) return;

        var icons = window.SiteTemplates ? SiteTemplates.icons : {};

        // Update modal content
        var modalImage = modal.querySelector('.blog-modal-image');
        var modalTag = modal.querySelector('.blog-modal-tag');
        var modalDate = modal.querySelector('.blog-modal-date span, .blog-modal-date');
        var modalTitle = modal.querySelector('.blog-modal-title');
        var modalContent = modal.querySelector('.blog-modal-text, .blog-modal-body');

        // Sanitize data
        var safeImage = escapeAttr(article.image);
        var safeTitle = escapeAttr(article.title);

        if (modalImage) {
            if (article.image) {
                modalImage.innerHTML = '<img src="' + safeImage + '" alt="' + safeTitle + '" style="width:100%; height:100%; object-fit:cover;">';
            } else {
                modalImage.innerHTML = icons.scissors || '';
            }
        }

        if (modalTag) {
            modalTag.textContent = article.tag || 'Статья';
        }

        if (modalDate) {
            var dateText = formatDate(article.date);
            if (modalDate.querySelector('span')) {
                modalDate.querySelector('span').textContent = dateText;
            } else {
                var svg = modalDate.querySelector('svg');
                var calendarIcon = icons.calendar || '';
                modalDate.innerHTML = (svg ? svg.outerHTML : calendarIcon) + ' ' + dateText;
            }
        }

        if (modalTitle) {
            modalTitle.textContent = article.title;
        }

        if (modalContent) {
            var content = article.content || article.excerpt || '';
            // Если контент содержит HTML-теги, санитизируем
            if (/<[a-z][\s\S]*>/i.test(content)) {
                modalContent.innerHTML = sanitizeHTML(content);
            } else {
                // Плоский текст - разбиваем на параграфы
                var paragraphs = content.split('\n\n')
                    .filter(function(p) { return p.trim(); })
                    .map(function(p) { return '<p>' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>'; })
                    .join('');
                modalContent.innerHTML = sanitizeHTML(paragraphs || '<p>' + escapeHtml(article.excerpt || '') + '</p>');
            }
        }

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Remove previous escape handler if exists
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
        }

        // Handle escape key
        currentEscapeHandler = function(e) {
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
            var article = window.dynamicArticlesData.find(function(a) { return a.id === articleId; });
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
