/**
 * Forms Module
 *
 * Модуль для работы с формами:
 * - Обработка отправки формы с имитацией подтверждения
 * - Установка минимальной даты для date input
 * - Форматирование номера телефона с маской
 */

// Обработка отправки формы
function submitForm(e) {
    e.preventDefault();
    const form = document.getElementById('appointmentForm');
    const success = document.getElementById('formSuccess');
    const submitButton = form.querySelector('button[type="submit"]');
    const phoneValue = document.getElementById('phone').value.replace(/\D/g, '');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (phoneValue.length !== 11) {
        showFormMessage('Пожалуйста, введите полный номер телефона в формате +7 (XXX) XXX-XX-XX.', 'error');
        return;
    }

    showFormMessage('Отправляем заявку...', 'info');
    submitButton.disabled = true;
    submitButton.classList.add('loading');

    // Имитация отправки формы
    form.style.display = 'none';
    success.classList.add('active');
    showFormMessage('', 'info');

    // Сброс формы через 5 секунд
    setTimeout(() => {
        form.style.display = 'block';
        success.classList.remove('active');
        form.reset();
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
    }, 5000);
}

// Установка минимальной даты для date input (сегодняшний день)
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Маска и форматирование номера телефона
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value[0] === '8') {
                value = '7' + value.slice(1);
            }
            if (value[0] !== '7') {
                value = '7' + value;
            }
        }

        let formatted = '';
        if (value.length > 0) {
            formatted = '+7';
        }
        if (value.length > 1) {
            formatted += ' (' + value.slice(1, 4);
        }
        if (value.length > 4) {
            formatted += ') ' + value.slice(4, 7);
        }
        if (value.length > 7) {
            formatted += '-' + value.slice(7, 9);
        }
        if (value.length > 9) {
            formatted += '-' + value.slice(9, 11);
        }

        e.target.value = formatted;
    });
}

function showFormMessage(text, type) {
    const message = document.getElementById('formMessage');
    if (!message) return;

    message.textContent = text;
    message.classList.remove('error', 'info');

    if (text) {
        message.classList.add(type);
        message.setAttribute('aria-live', 'polite');
    }
}
