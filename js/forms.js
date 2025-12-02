/**
 * Forms Module
 *
 * Обработка форм:
 * - Валидация и отправка
 * - Маска телефона (+7 формат)
 * - Минимальная дата
 *
 * Зависит от: utils.js
 */

(function() {
    'use strict';

    const { byId, on, ready, toggleClass, setAria } = SaysApp;

    // Конфигурация
    const CONFIG = {
        phoneLength: 11,
        resetDelay: 5000
    };

    // Кэшированные элементы
    let form = null;
    let formSuccess = null;
    let phoneInput = null;
    let dateInput = null;
    let messageEl = null;

    // =================================================================
    // СООБЩЕНИЯ ФОРМЫ
    // =================================================================

    /**
     * Показать сообщение формы
     * @param {string} text - текст сообщения
     * @param {string} type - тип ('error' | 'info')
     */
    function showMessage(text, type) {
        if (!messageEl) return;

        messageEl.textContent = text;
        messageEl.classList.remove('error', 'info');

        if (text) {
            messageEl.classList.add(type);
            setAria(messageEl, { live: 'polite' });
        }
    }

    // =================================================================
    // ВАЛИДАЦИЯ ТЕЛЕФОНА
    // =================================================================

    /**
     * Форматировать номер телефона в формат +7 (XXX) XXX-XX-XX
     * @param {string} value - сырое значение
     * @returns {string} - отформатированный номер
     */
    function formatPhone(value) {
        let digits = value.replace(/\D/g, '');

        if (digits.length > 0) {
            // Заменить 8 на 7 в начале
            if (digits[0] === '8') {
                digits = '7' + digits.slice(1);
            }
            // Добавить 7 если отсутствует
            if (digits[0] !== '7') {
                digits = '7' + digits;
            }
        }

        let formatted = '';
        if (digits.length > 0) formatted = '+7';
        if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
        if (digits.length > 4) formatted += ') ' + digits.slice(4, 7);
        if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
        if (digits.length > 9) formatted += '-' + digits.slice(9, 11);

        return formatted;
    }

    /**
     * Получить количество цифр в номере телефона
     * @param {string} value - значение поля
     * @returns {number}
     */
    function getPhoneDigits(value) {
        return value.replace(/\D/g, '').length;
    }

    // =================================================================
    // ОТПРАВКА ФОРМЫ
    // =================================================================

    /**
     * Обработчик отправки формы
     * @param {Event} e - событие submit
     */
    function handleSubmit(e) {
        e.preventDefault();

        if (!form || !formSuccess) return;

        const submitButton = form.querySelector('button[type="submit"]');
        const phoneValue = phoneInput ? phoneInput.value : '';

        // Проверка валидности формы
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Проверка длины телефона
        if (getPhoneDigits(phoneValue) !== CONFIG.phoneLength) {
            showMessage('Пожалуйста, введите полный номер телефона в формате +7 (XXX) XXX-XX-XX.', 'error');
            return;
        }

        // Показать состояние загрузки
        showMessage('Отправляем заявку...', 'info');
        if (submitButton) {
            submitButton.disabled = true;
            toggleClass(submitButton, 'loading', true);
        }

        // Имитация отправки - показать успех
        form.style.display = 'none';
        toggleClass(formSuccess, 'active', true);
        showMessage('', 'info');

        // Сброс формы через время
        setTimeout(() => {
            form.style.display = 'block';
            toggleClass(formSuccess, 'active', false);
            form.reset();
            if (submitButton) {
                submitButton.disabled = false;
                toggleClass(submitButton, 'loading', false);
            }
        }, CONFIG.resetDelay);
    }

    // =================================================================
    // ИНИЦИАЛИЗАЦИЯ
    // =================================================================

    function init() {
        form = byId('appointmentForm');
        formSuccess = byId('formSuccess');
        phoneInput = byId('phone');
        dateInput = byId('date');
        messageEl = byId('formMessage');

        // Маска телефона
        if (phoneInput) {
            on(phoneInput, 'input', (e) => {
                e.target.value = formatPhone(e.target.value);
            });
        }

        // Минимальная дата - сегодня
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }
    }

    // Запуск при готовности DOM
    ready(init);

    // Экспорт глобальной функции для onsubmit в HTML
    window.submitForm = handleSubmit;

})();
