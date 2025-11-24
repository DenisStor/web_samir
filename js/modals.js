/**
 * Modals Module
 *
 * Модуль для работы с модальными окнами:
 * - Открытие и закрытие модального окна блога
 * - Переключение содержимого статей в модальном окне
 * - Закрытие при клике вне окна и при нажатии Escape
 * - Переключение FAQ элементов
 */

// Открытие модального окна блога с определенной статьей
function openBlogModal(articleId) {
    const modal = document.getElementById('blogModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Скрытие всех статей
    document.querySelectorAll('.blog-modal-article').forEach(article => {
        article.style.display = 'none';
    });
    // Показ выбранной статьи
    const selectedArticle = document.getElementById(articleId);
    if (selectedArticle) {
        selectedArticle.style.display = 'block';
    }
}

// Закрытие модального окна блога
function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Переключение FAQ элементов (аккордеон)
function toggleFaq(element) {
    const faqItem = element.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');

    // Закрытие всех FAQ элементов
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Открытие кликнутого элемента, если он не был открыт
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Инициализация событий для модального окна при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('blogModal');
    if (modal) {
        // Закрытие модального окна при клике вне содержимого
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeBlogModal();
            }
        });
    }

    // Закрытие модального окна при нажатии клавиши Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeBlogModal();
        }
    });
});
