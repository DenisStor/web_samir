/**
 * Admin Legal Form
 * Форма редактирования юридических документов
 */

var AdminLegalForm = (function() {
    'use strict';

    var currentDocumentId = null;

    /**
     * Показать форму редактирования
     */
    function show(document) {
        currentDocumentId = document ? document.id : null;

        var title = document ? 'Редактирование документа' : 'Новый документ';

        var formHtml = '<form id="legalForm" class="modal-form">' +
            '<div class="form-group">' +
                '<label class="form-label">Название документа *</label>' +
                '<input type="text" class="form-input" id="legalTitle" value="' + window.escapeHtml(document ? document.title : '') + '" required placeholder="Политика конфиденциальности">' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">URL-идентификатор (slug) *</label>' +
                '<input type="text" class="form-input" id="legalSlug" value="' + window.escapeHtml(document ? document.slug : '') + '" required placeholder="privacy" pattern="[a-z0-9-]+">' +
                '<small class="form-hint">Только латинские буквы, цифры и дефис. Будет доступен по адресу /legal/slug</small>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Содержимое документа *</label>' +
                '<div class="wysiwyg-toolbar">' +
                    '<button type="button" class="wysiwyg-btn" onclick="AdminWYSIWYG.formatText(\'bold\')" title="Жирный">' +
                        '<strong>B</strong>' +
                    '</button>' +
                    '<button type="button" class="wysiwyg-btn" onclick="AdminWYSIWYG.formatText(\'italic\')" title="Курсив">' +
                        '<em>I</em>' +
                    '</button>' +
                    '<button type="button" class="wysiwyg-btn" onclick="AdminWYSIWYG.formatText(\'insertUnorderedList\')" title="Маркированный список">' +
                        SharedIcons.get('list') +
                    '</button>' +
                    '<button type="button" class="wysiwyg-btn" onclick="AdminWYSIWYG.formatText(\'insertOrderedList\')" title="Нумерованный список">' +
                        SharedIcons.get('listOrdered') +
                    '</button>' +
                    '<span class="wysiwyg-separator"></span>' +
                    '<button type="button" class="wysiwyg-btn" onclick="AdminWYSIWYG.insertHeading(2)" title="Заголовок H2">' +
                        'H2' +
                    '</button>' +
                    '<button type="button" class="wysiwyg-btn" onclick="AdminWYSIWYG.insertHeading(3)" title="Заголовок H3">' +
                        'H3' +
                    '</button>' +
                '</div>' +
                '<div class="wysiwyg-editor" id="legalContent" contenteditable="true">' +
                    (document ? document.content : '') +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-checkbox">' +
                    '<input type="checkbox" id="legalActive" ' + (document && document.active !== false ? 'checked' : '') + '>' +
                    '<span>Документ активен (отображается на сайте)</span>' +
                '</label>' +
            '</div>' +
        '</form>';

        AdminModals.open('modal', title, formHtml);
    }

    /**
     * Сохранить документ
     */
    async function save() {
        var title = document.getElementById('legalTitle').value.trim();
        var slug = document.getElementById('legalSlug').value.trim().toLowerCase();
        var content = document.getElementById('legalContent').innerHTML;
        var active = document.getElementById('legalActive').checked;

        // Валидация
        if (!title) {
            showToast('Введите название документа', 'error');
            return;
        }

        if (!slug) {
            showToast('Введите URL-идентификатор', 'error');
            return;
        }

        if (!/^[a-z0-9-]+$/.test(slug)) {
            showToast('Slug может содержать только латинские буквы, цифры и дефис', 'error');
            return;
        }

        if (!content || content === '<br>') {
            showToast('Введите содержимое документа', 'error');
            return;
        }

        var documents = AdminState.legalDocuments || [];

        // Проверка уникальности slug
        var existingDoc = documents.find(function(d) {
            return d.slug === slug && d.id !== currentDocumentId;
        });

        if (existingDoc) {
            showToast('Документ с таким slug уже существует', 'error');
            return;
        }

        if (currentDocumentId) {
            // Редактирование существующего
            var index = documents.findIndex(function(d) { return d.id === currentDocumentId; });
            if (index !== -1) {
                documents[index].title = title;
                documents[index].slug = slug;
                documents[index].content = content;
                documents[index].active = active;
                documents[index].updatedAt = new Date().toISOString();
            }
        } else {
            // Создание нового
            var newDocument = {
                id: generateId(),
                slug: slug,
                title: title,
                content: content,
                active: active,
                updatedAt: new Date().toISOString()
            };
            documents.push(newDocument);
        }

        try {
            await AdminAPI.save('legal', { documents: documents });
            AdminState.setLegalDocuments(documents);
            AdminModals.close('modal');
            AdminLegalRenderer.render();
            showToast('Документ сохранён', 'success');
        } catch (error) {
            console.error('Error saving legal document:', error);
            showToast('Ошибка сохранения', 'error');
        }
    }

    /**
     * Удалить документ
     */
    function remove(id) {
        var document = AdminState.findLegalDocument(id);
        if (!document) return;

        AdminModals.openDeleteConfirm(
            document.title,
            async function() {
                var documents = AdminState.legalDocuments.filter(function(d) {
                    return d.id !== id;
                });

                try {
                    await AdminAPI.save('legal', { documents: documents });
                    AdminState.setLegalDocuments(documents);
                    AdminLegalRenderer.render();
                    showToast('Документ удалён', 'success');
                } catch (error) {
                    console.error('Error deleting legal document:', error);
                    showToast('Ошибка удаления', 'error');
                }
            }
        );
    }

    /**
     * Генерация ID
     */
    function generateId() {
        return 'legal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Публичный API
    return {
        show: show,
        save: save,
        remove: remove
    };
})();

// Экспорт
window.AdminLegalForm = AdminLegalForm;
