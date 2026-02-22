/**
 * Admin FAQ Form
 * Форма добавления/редактирования FAQ
 */

var AdminFaqForm = (function () {
    'use strict';

    /**
     * Показать форму FAQ
     */
    function show(faqItem) {
        AdminState.editingItem = faqItem || null;

        var title = faqItem ? 'Редактировать вопрос' : 'Добавить вопрос';

        var html =
            '<form id="faqForm" class="admin-form">' +
            '<div class="form-group">' +
            '<label class="form-label">Вопрос *</label>' +
            '<input type="text" class="form-input" id="faqQuestion" value="' +
            window.escapeHtml((faqItem && faqItem.question) || '') +
            '" placeholder="Введите вопрос" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label">Ответ *</label>' +
            '<textarea class="form-textarea" id="faqAnswer" placeholder="Введите ответ на вопрос..." rows="5">' +
            window.escapeHtml((faqItem && faqItem.answer) || '') +
            '</textarea>' +
            '</div>' +
            '</form>';

        AdminModals.setTitle('modal', title);
        var modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = html;
        }
        AdminModals.open('modal');
    }

    /**
     * Сохранить FAQ
     */
    async function save() {
        var questionEl = document.getElementById('faqQuestion');
        var question = questionEl ? questionEl.value.trim() : '';

        if (!question) {
            showToast('Введите вопрос', 'error');
            return;
        }

        var answerEl = document.getElementById('faqAnswer');
        var answer = answerEl ? answerEl.value.trim() : '';

        if (!answer) {
            showToast('Введите ответ', 'error');
            return;
        }

        var faqData = {
            id: AdminState.editingItem
                ? AdminState.editingItem.id
                : SharedHelpers.generateId('faq'),
            question: question,
            answer: answer
        };

        var faq = AdminState.faq || [];

        if (AdminState.editingItem) {
            var index = faq.findIndex(function (f) {
                return f.id === AdminState.editingItem.id;
            });
            if (index !== -1) {
                faq[index] = faqData;
            }
        } else {
            faq.push(faqData);
        }

        try {
            await AdminAPI.save('faq', { faq: faq });
            AdminState.setFaq(faq);
            showToast('Вопрос сохранён', 'success');
            AdminModals.close('modal');
            AdminFaqRenderer.render();
        } catch (error) {
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    /**
     * Удалить FAQ
     */
    async function remove(id) {
        if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
            return;
        }

        var faq = AdminState.faq.filter(function (f) {
            return f.id !== id;
        });

        try {
            await AdminAPI.save('faq', { faq: faq });
            AdminState.setFaq(faq);
            showToast('Вопрос удалён', 'success');
            AdminFaqRenderer.render();
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
window.AdminFaqForm = AdminFaqForm;
