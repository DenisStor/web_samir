/**
 * Admin Legal Renderer
 * Рендеринг юридических документов (политики, соглашения)
 */

var AdminLegalRenderer = (function () {
    'use strict';

    var elements = {};

    /**
     * Инициализация
     */
    function init() {
        elements = {
            legalDocumentsList: document.getElementById('legalDocumentsList')
        };
    }

    /**
     * Рендеринг списка документов
     */
    function render() {
        if (!elements.legalDocumentsList) {
            elements.legalDocumentsList = document.getElementById('legalDocumentsList');
            if (!elements.legalDocumentsList) return;
        }

        var documents = AdminState.legalDocuments || [];

        if (documents.length === 0) {
            elements.legalDocumentsList.innerHTML =
                '<p class="empty-message">Нет юридических документов</p>';
            return;
        }

        var html = documents
            .map(function (doc) {
                var statusClass = doc.active ? 'active' : 'inactive';
                var statusText = doc.active ? 'Активен' : 'Скрыт';
                var updatedAt = doc.updatedAt
                    ? new Date(doc.updatedAt).toLocaleDateString('ru-RU')
                    : '';

                return (
                    '<div class="legal-document-card ' +
                    statusClass +
                    '" data-id="' +
                    doc.id +
                    '">' +
                    '<div class="legal-document-header">' +
                    '<div class="legal-document-info">' +
                    '<h3 class="legal-document-title">' +
                    window.escapeHtml(doc.title) +
                    '</h3>' +
                    '<div class="legal-document-meta">' +
                    '<span class="legal-document-slug">/legal/' +
                    window.escapeHtml(doc.slug) +
                    '</span>' +
                    (updatedAt
                        ? '<span class="legal-document-date">Обновлён: ' + updatedAt + '</span>'
                        : '') +
                    '</div>' +
                    '</div>' +
                    '<div class="legal-document-status">' +
                    '<span class="status-badge ' +
                    statusClass +
                    '">' +
                    statusText +
                    '</span>' +
                    '</div>' +
                    '</div>' +
                    '<div class="legal-document-preview">' +
                    getPreviewText(doc.content) +
                    '</div>' +
                    '<div class="legal-document-actions">' +
                    '<button class="btn btn-secondary btn-sm" data-action="edit-legal" data-id="' +
                    doc.id +
                    '">' +
                    SharedIcons.get('edit') +
                    '<span>Редактировать</span>' +
                    '</button>' +
                    '<button class="btn btn-outline btn-sm" data-action="toggle-legal" data-id="' +
                    doc.id +
                    '">' +
                    (doc.active ? SharedIcons.get('eyeOff') : SharedIcons.get('eye')) +
                    '<span>' +
                    (doc.active ? 'Скрыть' : 'Показать') +
                    '</span>' +
                    '</button>' +
                    '</div>' +
                    '</div>'
                );
            })
            .join('');

        elements.legalDocumentsList.innerHTML = html;
    }

    /**
     * Получение превью текста (без HTML тегов)
     */
    function getPreviewText(html) {
        if (!html) return '';
        var div = document.createElement('div');
        div.innerHTML = html;
        var text = div.textContent || div.innerText || '';
        return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }

    /**
     * Переключение активности документа
     */
    async function toggleActive(id) {
        var documents = AdminState.legalDocuments || [];
        var doc = documents.find(function (d) {
            return d.id === id;
        });

        if (doc) {
            doc.active = !doc.active;
            doc.updatedAt = new Date().toISOString();

            try {
                await AdminAPI.save('legal', { documents: documents });
                render();
                showToast('Статус документа изменён', 'success');
            } catch (error) {
                console.error('Error toggling legal document:', error);
                showToast('Ошибка сохранения', 'error');
            }
        }
    }

    // Публичный API
    return {
        init: init,
        render: render,
        toggleActive: toggleActive
    };
})();

// Экспорт
window.AdminLegalRenderer = AdminLegalRenderer;
