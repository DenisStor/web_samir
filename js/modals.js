/**
 * Modals Module
 *
 * Управление модальными окнами:
 * - Блог модальное окно
 * - FAQ аккордеон
 *
 * Зависит от: utils.js
 */

(function() {
    'use strict';

    const { $, $$, byId, lockScroll, toggleClass, hasClass, on, ready, onEscape } = SaysApp;

    // Кэшированные элементы
    let blogModal = null;

    // =================================================================
    // BLOG MODAL
    // =================================================================

    /**
     * Открыть модальное окно блога
     * @param {string} articleId - ID статьи для отображения
     */
    function openBlogModal(articleId) {
        if (!blogModal) return;

        toggleClass(blogModal, 'active', true);
        lockScroll(true);

        // Скрыть все статьи
        $$('.blog-modal-article').forEach(article => {
            article.style.display = 'none';
        });

        // Показать выбранную статью
        const selectedArticle = byId(articleId);
        if (selectedArticle) {
            selectedArticle.style.display = 'block';
        }
    }

    /**
     * Закрыть модальное окно блога
     */
    function closeBlogModal() {
        if (!blogModal) return;

        toggleClass(blogModal, 'active', false);
        lockScroll(false);
    }

    // =================================================================
    // FAQ ACCORDION
    // =================================================================

    /**
     * Переключить FAQ элемент
     * @param {Element} element - кликнутый элемент (вопрос)
     */
    function toggleFaq(element) {
        const faqItem = element.closest('.faq-item');
        if (!faqItem) return;

        const isActive = hasClass(faqItem, 'active');

        // Закрыть все FAQ элементы
        $$('.faq-item').forEach(item => {
            toggleClass(item, 'active', false);
        });

        // Открыть кликнутый, если он не был открыт
        if (!isActive) {
            toggleClass(faqItem, 'active', true);
        }
    }

    // =================================================================
    // ИНИЦИАЛИЗАЦИЯ
    // =================================================================

    function init() {
        blogModal = byId('blogModal');

        if (blogModal) {
            // Закрытие по клику на backdrop
            on(blogModal, 'click', (e) => {
                if (e.target === blogModal) {
                    closeBlogModal();
                }
            });

            // Закрытие по Escape
            onEscape(() => {
                if (hasClass(blogModal, 'active')) {
                    closeBlogModal();
                }
            });
        }
    }

    // Запуск при готовности DOM
    ready(init);

    // Экспорт глобальных функций для onclick в HTML
    window.openBlogModal = openBlogModal;
    window.closeBlogModal = closeBlogModal;
    window.toggleFaq = toggleFaq;

})();
