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

    // Имитация отправки формы
    form.style.display = 'none';
    success.classList.add('active');

    // Сброс формы через 5 секунд
    setTimeout(() => {
        form.style.display = 'block';
        success.classList.remove('active');
        form.reset();
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
