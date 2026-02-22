/**
 * legal-app.js - Логика страницы юридических документов
 */
(function () {
    'use strict';

    /**
     * Парсинг query параметров (полифилл для IE11)
     * @param {string} search - строка поиска (location.search)
     * @returns {Object} объект с методом get
     */
    function parseQueryParams(search) {
        var params = {};
        var query = search.replace(/^\?/, '');
        if (query) {
            query.split('&').forEach(function (part) {
                var pair = part.split('=');
                var key = decodeURIComponent(pair[0]);
                var value = pair.length > 1 ? decodeURIComponent(pair[1]) : '';
                params[key] = value;
            });
        }
        return {
            get: function (key) {
                return params[key] || null;
            }
        };
    }

    function init() {
        loadDocument();
    }

    async function loadDocument() {
        var container = document.getElementById('legalContainer');
        if (!container) {
            console.error('Legal container element not found');
            return;
        }

        // URL формат: /legal.html?page=privacy
        // Используем полифилл для совместимости со старыми браузерами
        var params = parseQueryParams(window.location.search);
        var slug = params.get('page');

        // If no slug, show list of all documents
        if (!slug) {
            await loadDocumentsList();
            return;
        }

        try {
            var response = await fetch('/api/legal/' + encodeURIComponent(slug));

            if (!response.ok) {
                throw new Error('Document not found');
            }

            var doc = await response.json();
            renderDocument(doc);
            document.title = doc.title + " | Say's Barbers";
        } catch (error) {
            console.error('Error loading document:', error);
            renderError();
        }
    }

    async function loadDocumentsList() {
        var container = document.getElementById('legalContainer');
        if (!container) {
            console.error('Legal container element not found');
            return;
        }

        try {
            var response = await fetch('/api/legal');
            var data = await response.json();
            var documents = (data.documents || []).filter(function (d) {
                return d.active !== false;
            });

            var html =
                '<h1 class="legal-title">Юридическая информация</h1>' +
                '<p class="legal-meta">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
                'Правовые документы и политики' +
                '</p>' +
                '<div class="legal-documents-list">';

            documents.forEach(function (doc) {
                html +=
                    '<a href="/legal.html?page=' +
                    encodeURIComponent(doc.slug) +
                    '" class="legal-doc-card">' +
                    '<svg class="doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                    '<polyline points="14 2 14 8 20 8"/>' +
                    '<line x1="16" y1="13" x2="8" y2="13"/>' +
                    '<line x1="16" y1="17" x2="8" y2="17"/>' +
                    '</svg>' +
                    '<span class="doc-title">' +
                    escapeHtml(doc.title) +
                    '</span>' +
                    '<svg class="doc-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<line x1="5" y1="12" x2="19" y2="12"/>' +
                    '<polyline points="12 5 19 12 12 19"/>' +
                    '</svg>' +
                    '</a>';
            });

            html += '</div>';
            container.innerHTML = html;
            document.title = "Юридическая информация | Say's Barbers";
        } catch (error) {
            console.error('Error loading documents list:', error);
            renderError();
        }
    }

    function renderDocument(doc) {
        var container = document.getElementById('legalContainer');
        if (!container) {
            console.error('Legal container element not found');
            return;
        }
        var updatedAt = doc.updatedAt
            ? new Date(doc.updatedAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
              })
            : '';

        var html =
            '<h1 class="legal-title">' +
            escapeHtml(doc.title) +
            '</h1>' +
            (updatedAt
                ? '<p class="legal-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Обновлено: ' +
                  updatedAt +
                  '</p>'
                : '') +
            '<div class="legal-content">' +
            sanitizeHtml(doc.content) +
            '</div>';

        container.innerHTML = html;
    }

    function renderError() {
        var container = document.getElementById('legalContainer');
        if (!container) {
            console.error('Legal container element not found');
            return;
        }
        container.innerHTML =
            '<div class="legal-error">' +
            '<svg class="legal-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<line x1="12" y1="8" x2="12" y2="12"/>' +
            '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
            '</svg>' +
            '<h2 class="legal-error-title">Документ не найден</h2>' +
            '<p class="legal-error-text">Запрашиваемый документ не существует или был удалён.</p>' +
            '<a href="/legal.html" class="btn-primary">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
            'Все документы' +
            '</a>' +
            '</div>';
    }

    // escapeHtml теперь используется из SharedHelpers (helpers.js)

    function sanitizeHtml(html) {
        if (!html) return '';
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'p',
                    'ul',
                    'ol',
                    'li',
                    'strong',
                    'em',
                    'b',
                    'i',
                    'u',
                    'a',
                    'br',
                    'div',
                    'span',
                    'font',
                    'blockquote'
                ],
                ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'color']
            });
        }
        // Fallback: расширенная санитизация для контента из нашего API
        // Удаляем опасные теги
        var clean = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
            .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
            .replace(/<embed[^>]*\/?>/gi, '')
            .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
            .replace(/<math[^>]*>[\s\S]*?<\/math>/gi, '')
            .replace(/<base[^>]*\/?>/gi, '');
        // Удаляем опасные атрибуты (on* события)
        clean = clean
            .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
        // Удаляем javascript:, data:, vbscript: в href/src
        clean = clean
            .replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, '$1=""')
            .replace(/(href|src)\s*=\s*["']?\s*data:[^"'>\s]*/gi, '$1=""')
            .replace(/(href|src)\s*=\s*["']?\s*vbscript:[^"'>\s]*/gi, '$1=""');
        return clean;
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
