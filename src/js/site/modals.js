/**
 * Modals Module
 *
 * Управление модальными окнами:
 * - Блог модальное окно
 * - FAQ аккордеон
 *
 * Зависит от: utils.js
 */

(function () {
    'use strict';

    var $ = SaysApp.$;
    var $$ = SaysApp.$$;
    var byId = SaysApp.byId;
    var lockScroll = SaysApp.lockScroll;
    var toggleClass = SaysApp.toggleClass;
    var hasClass = SaysApp.hasClass;
    var on = SaysApp.on;
    var ready = SaysApp.ready;
    var onEscape = SaysApp.onEscape;

    // Кэшированные элементы
    var blogModal = null;

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
        $$('.blog-modal-article').forEach(function (article) {
            article.style.display = 'none';
        });

        // Показать выбранную статью
        var selectedArticle = byId(articleId);
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
        var faqItem = element.closest('.faq-item');
        if (!faqItem) return;

        // Просто переключаем текущий элемент
        toggleClass(faqItem, 'active');
    }

    // =================================================================
    // ИНИЦИАЛИЗАЦИЯ
    // =================================================================

    function init() {
        blogModal = byId('blogModal');

        if (blogModal) {
            // Закрытие по клику на backdrop
            on(blogModal, 'click', function (e) {
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

    /**
     * Обработчик клавиатуры для элементов с role="button"
     * Активирует onclick при нажатии Enter или Space для accessibility
     * @param {KeyboardEvent} event - Событие клавиатуры
     * @param {Element} element - DOM элемент
     */
    function handleButtonKeydown(event, element) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            element.click();
        }
    }

    // Экспорт глобальных функций для onclick в HTML
    window.openBlogModal = openBlogModal;
    window.closeBlogModal = closeBlogModal;
    window.toggleFaq = toggleFaq;
    window.handleButtonKeydown = handleButtonKeydown;
})();
