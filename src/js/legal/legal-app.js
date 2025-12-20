/**
 * legal-app.js - Логика страницы юридических документов
 */
(function() {
    'use strict';

    function init() {
        loadDocument();
    }

    async function loadDocument() {
        var container = document.getElementById('legalContainer');
        var path = window.location.pathname;
        var slug = path.replace('/legal/', '').replace('/legal', '');

        // If no slug, show list of all documents
        if (!slug || slug === '/') {
            await loadDocumentsList();
            return;
        }

        try {
            var response = await fetch('/api/legal/' + slug);

            if (!response.ok) {
                throw new Error('Document not found');
            }

            var doc = await response.json();
            renderDocument(doc);
            document.title = doc.title + ' | Say\'s Barbers';

        } catch (error) {
            console.error('Error loading document:', error);
            renderError();
        }
    }

    async function loadDocumentsList() {
        var container = document.getElementById('legalContainer');

        try {
            var response = await fetch('/api/legal');
            var data = await response.json();
            var documents = (data.documents || []).filter(function(d) {
                return d.active !== false;
            });

            var html = '<h1 class="legal-title">Юридическая информация</h1>' +
                '<p class="legal-meta">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
                'Правовые документы и политики' +
                '</p>' +
                '<div class="legal-documents-list">';

            documents.forEach(function(doc) {
                html += '<a href="/legal/' + doc.slug + '" class="legal-doc-card">' +
                    '<svg class="doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                    '<polyline points="14 2 14 8 20 8"/>' +
                    '<line x1="16" y1="13" x2="8" y2="13"/>' +
                    '<line x1="16" y1="17" x2="8" y2="17"/>' +
                    '</svg>' +
                    '<span class="doc-title">' + escapeHtml(doc.title) + '</span>' +
                    '<svg class="doc-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<line x1="5" y1="12" x2="19" y2="12"/>' +
                    '<polyline points="12 5 19 12 12 19"/>' +
                    '</svg>' +
                    '</a>';
            });

            html += '</div>';
            container.innerHTML = html;
            document.title = 'Юридическая информация | Say\'s Barbers';

        } catch (error) {
            console.error('Error loading documents list:', error);
            renderError();
        }
    }

    function renderDocument(doc) {
        var container = document.getElementById('legalContainer');
        var updatedAt = doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '';

        var html = '<h1 class="legal-title">' + escapeHtml(doc.title) + '</h1>' +
            (updatedAt ? '<p class="legal-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Обновлено: ' + updatedAt + '</p>' : '') +
            '<div class="legal-content">' + sanitizeHtml(doc.content) + '</div>';

        container.innerHTML = html;
    }

    function renderError() {
        var container = document.getElementById('legalContainer');
        container.innerHTML = '<div class="legal-error">' +
            '<svg class="legal-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<line x1="12" y1="8" x2="12" y2="12"/>' +
            '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
            '</svg>' +
            '<h2 class="legal-error-title">Документ не найден</h2>' +
            '<p class="legal-error-text">Запрашиваемый документ не существует или был удалён.</p>' +
            '<a href="/legal" class="btn-primary">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
            'Все документы' +
            '</a>' +
        '</div>';
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function sanitizeHtml(html) {
        if (!html) return '';
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
                ALLOWED_ATTR: ['href', 'target', 'rel']
            });
        }
        return html;
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
