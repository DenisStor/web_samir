/**
 * Admin Legal Form
 * Форма редактирования юридических документов
 */

var AdminLegalForm = (function () {
    'use strict';

    var currentDocumentId = null;

    /**
     * Показать форму редактирования
     */
    function show(legalDoc) {
        currentDocumentId = legalDoc ? legalDoc.id : null;

        var title = legalDoc ? 'Редактирование документа' : 'Новый документ';

        var formHtml =
            '<form id="legalForm" class="modal-form">' +
            '<div class="form-group">' +
            '<label class="form-label">Название документа *</label>' +
            '<input type="text" class="form-input" id="legalTitle" value="' +
            window.escapeHtml(legalDoc ? legalDoc.title : '') +
            '" required placeholder="Политика конфиденциальности">' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label">URL-идентификатор (slug) *</label>' +
            '<input type="text" class="form-input" id="legalSlug" value="' +
            window.escapeHtml(legalDoc ? legalDoc.slug : '') +
            '" required placeholder="privacy" pattern="[a-z0-9-]+">' +
            '<small class="form-hint">Только латинские буквы, цифры и дефис. Будет доступен по адресу /legal/slug</small>' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label">Содержимое документа *</label>' +
            AdminWYSIWYG.getEditorHTML(
                'legalContent',
                legalDoc ? legalDoc.content : '',
                'Введите текст документа...'
            ) +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-checkbox">' +
            '<input type="checkbox" id="legalActive" ' +
            (legalDoc && legalDoc.active !== false ? 'checked' : '') +
            '>' +
            '<span>Документ активен (отображается на сайте)</span>' +
            '</label>' +
            '</div>' +
            '</form>';

        AdminModals.setTitle('modal', title);
        var modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = formHtml;
        }
        AdminModals.open('modal');

        // Инициализация WYSIWYG редактора с тулбаром
        // Используем requestAnimationFrame для гарантии что DOM обновился
        requestAnimationFrame(function () {
            AdminWYSIWYG.initWithToolbar('legalContent');
        });
    }

    /**
     * Сохранить документ
     */
    async function save() {
        var title = document.getElementById('legalTitle').value.trim();
        var slug = document.getElementById('legalSlug').value.trim().toLowerCase();
        var content = AdminWYSIWYG.getContent('legalContent');
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
        var existingDoc = documents.find(function (d) {
            return d.slug === slug && d.id !== currentDocumentId;
        });

        if (existingDoc) {
            showToast('Документ с таким slug уже существует', 'error');
            return;
        }

        if (currentDocumentId) {
            // Редактирование существующего
            var index = documents.findIndex(function (d) {
                return d.id === currentDocumentId;
            });
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
                id: SharedHelpers.generateId('legal'),
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
        var legalDoc = AdminState.findLegalDocument(id);
        if (!legalDoc) return;

        AdminModals.confirmDelete(legalDoc.title, async function () {
            var documents = AdminState.legalDocuments.filter(function (d) {
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
        });
    }

    // generateId теперь используется из SharedHelpers (helpers.js)

    // Публичный API
    return {
        show: show,
        save: save,
        remove: remove
    };
})();

// Экспорт
window.AdminLegalForm = AdminLegalForm;
