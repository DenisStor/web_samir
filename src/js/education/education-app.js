/**
 * Education App
 *
 * FAQ-аккордеон + форма заявки + маска телефона
 * Страница курса «БАРБЕР С 0»
 */

(function () {
    'use strict';

    // =================================================================
    // PHONE MASK (копия из modals.js)
    // =================================================================

    function formatPhone(digits) {
        var val = '+7';
        if (digits.length > 0) val += ' (' + digits.substring(0, 3);
        if (digits.length >= 3) val += ') ';
        if (digits.length > 3) val += digits.substring(3, 6);
        if (digits.length > 6) val += '-' + digits.substring(6, 8);
        if (digits.length > 8) val += '-' + digits.substring(8, 10);
        return val;
    }

    function getPhoneDigits(value) {
        var raw = value.replace(/\D/g, '');
        if (raw.charAt(0) === '7' || raw.charAt(0) === '8') {
            raw = raw.substring(1);
        }
        return raw.substring(0, 10);
    }

    function initPhoneMask(input) {
        var prevDigits = '';

        input.addEventListener('focus', function () {
            if (!input.value) {
                input.value = '+7 (';
                prevDigits = '';
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace') {
                var digits = getPhoneDigits(input.value);
                if (digits.length <= 1) {
                    e.preventDefault();
                    input.value = '';
                    prevDigits = '';
                    return;
                }
                e.preventDefault();
                var trimmed = digits.substring(0, digits.length - 1);
                input.value = formatPhone(trimmed);
                prevDigits = trimmed;
                input.selectionStart = input.selectionEnd = input.value.length;
            }
        });

        input.addEventListener('input', function () {
            var digits = getPhoneDigits(input.value);
            if (digits.length === 0) {
                input.value = '';
                prevDigits = '';
                return;
            }
            input.value = formatPhone(digits);
            prevDigits = digits;
            input.selectionStart = input.selectionEnd = input.value.length;
        });

        input.addEventListener('blur', function () {
            if (getPhoneDigits(input.value).length === 0) {
                input.value = '';
                prevDigits = '';
            }
        });
    }

    function isPhoneComplete(value) {
        return getPhoneDigits(value).length === 10;
    }

    // =================================================================
    // FAQ ACCORDION
    // =================================================================

    function toggleEducationFaq(element) {
        var faqItem = element.closest('.faq-item');
        if (!faqItem) return;

        var isActive = faqItem.classList.contains('active');
        faqItem.classList.toggle('active');

        var expanded = !isActive;
        element.setAttribute('aria-expanded', String(expanded));
    }

    function handleEduKeydown(event, element) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            element.click();
        }
    }

    // =================================================================
    // FORM
    // =================================================================

    function clearInputError(input) {
        input.classList.remove('invalid');
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        var form = e.target;
        var nameInput = form.elements.name;
        var phoneInput = form.elements.phone;
        var consentInput = form.elements.consent;
        var name = nameInput.value.trim();
        var phone = phoneInput.value.trim();
        var errorEl = document.getElementById('eduFormError');
        var successEl = document.getElementById('eduFormSuccess');
        var submitBtn = form.querySelector('button[type="submit"]');
        var hasError = false;

        nameInput.classList.remove('invalid');
        phoneInput.classList.remove('invalid');
        if (errorEl) errorEl.style.display = 'none';

        if (!name) {
            nameInput.classList.add('invalid');
            hasError = true;
        }

        if (!phone || !isPhoneComplete(phone)) {
            phoneInput.classList.add('invalid');
            hasError = true;
        }

        if (consentInput && !consentInput.checked) {
            hasError = true;
        }

        if (hasError) {
            if (errorEl) {
                var msg = consentInput && !consentInput.checked
                    ? 'Необходимо согласие на обработку персональных данных'
                    : !name && !isPhoneComplete(phone)
                        ? 'Заполните все поля'
                        : !name
                          ? 'Введите имя'
                          : 'Введите полный номер телефона';
                errorEl.textContent = msg;
                errorEl.style.display = '';
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
        }

        fetch('/api/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, phone: phone, source: 'education' })
        })
            .then(function (response) {
                return response.json().then(function (data) {
                    return { ok: response.ok, data: data };
                });
            })
            .then(function (result) {
                if (result.ok && result.data.success) {
                    form.style.display = 'none';
                    if (successEl) successEl.style.display = '';
                } else {
                    var msg = result.data.error || 'Произошла ошибка. Попробуйте позже.';
                    if (errorEl) {
                        errorEl.textContent = msg;
                        errorEl.style.display = '';
                    }
                }
            })
            .catch(function () {
                if (errorEl) {
                    errorEl.textContent = 'Ошибка сети. Проверьте подключение.';
                    errorEl.style.display = '';
                }
            })
            .finally(function () {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Отправить заявку';
                }
            });
    }

    // =================================================================
    // INIT
    // =================================================================

    function init() {
        var form = document.getElementById('eduForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        var phoneInput = document.getElementById('eduPhone');
        if (phoneInput) {
            initPhoneMask(phoneInput);
        }

        // Снимать ошибку при вводе
        var inputs = document.querySelectorAll('.edu-form input');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('input', function () {
                clearInputError(this);
            });
        }
    }

    // Глобальные функции для onclick в HTML
    window.toggleEducationFaq = toggleEducationFaq;
    window.handleEduKeydown = handleEduKeydown;

    document.addEventListener('DOMContentLoaded', init);
})();
