/**
 * Admin FAQ Renderer
 * Рендеринг списка FAQ с поддержкой drag & drop
 */

var AdminFaqRenderer = (function () {
    'use strict';

    var container = null;
    var dragDropInitialized = false;

    /**
     * Инициализация
     */
    function init() {
        container = document.getElementById('faqList');
        initDragDrop();
    }

    /**
     * Инициализация drag & drop
     */
    function initDragDrop() {
        if (dragDropInitialized || !window.AdminDragDrop) return;

        AdminDragDrop.init('faqList', '.faq-admin-item', function (newOrder) {
            reorderFaq(newOrder);
        });

        dragDropInitialized = true;
    }

    /**
     * Изменение порядка FAQ
     */
    function reorderFaq(newOrder) {
        var faq = AdminState.faq || [];

        var reordered = newOrder
            .map(function (id) {
                return faq.find(function (f) {
                    return f.id === id;
                });
            })
            .filter(Boolean);

        reordered.forEach(function (item, index) {
            item.order = index;
        });

        AdminAPI.save('faq', { faq: reordered })
            .then(function () {
                AdminState.setFaq(reordered);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
            })
            .catch(function (error) {
                if (window.showToast) {
                    showToast('Ошибка сохранения порядка', 'error');
                }
                render();
            });
    }

    /**
     * Рендеринг списка FAQ
     */
    function render() {
        if (!container) {
            container = document.getElementById('faqList');
            if (!container) return;
        }

        var faq = AdminState.faq || [];

        if (faq.length === 0) {
            container.innerHTML =
                '<p class="empty-message">Нет вопросов. Нажмите "Добавить" чтобы создать.</p>';
            return;
        }

        var html = faq
            .map(function (item, index) {
                var searchText = [item.question, item.answer].join(' ');

                return (
                    '<div class="faq-admin-item has-drag" data-id="' +
                    item.id +
                    '" data-index="' +
                    index +
                    '" data-search="' +
                    escapeAttr(searchText) +
                    '" draggable="true">' +
                    '<div class="drag-handle" title="Перетащите для изменения порядка">' +
                    SharedIcons.get('grip') +
                    '</div>' +
                    '<div class="faq-admin-content">' +
                    '<h3 class="faq-admin-question">' +
                    escapeHtml(item.question) +
                    '</h3>' +
                    '<p class="faq-admin-answer">' +
                    escapeHtml(item.answer) +
                    '</p>' +
                    '</div>' +
                    '<div class="faq-admin-actions">' +
                    '<button class="btn btn-secondary" data-action="edit-faq" data-id="' +
                    item.id +
                    '">' +
                    SharedIcons.get('edit') +
                    'Редактировать' +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-faq" data-id="' +
                    item.id +
                    '" data-name="' +
                    escapeAttr(item.question) +
                    '" title="Удалить">' +
                    SharedIcons.get('delete') +
                    '</button>' +
                    '</div>' +
                    '</div>'
                );
            })
            .join('');

        container.innerHTML = html;

        if (window.AdminDragDrop) {
            AdminDragDrop.refresh('faqList');
        }
    }

    // escapeHtml теперь используется из SharedHelpers (helpers.js)

    // Публичный API
    return {
        init: init,
        render: render,
        reorderFaq: reorderFaq
    };
})();

// Экспорт
window.AdminFaqRenderer = AdminFaqRenderer;
