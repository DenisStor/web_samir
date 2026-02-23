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
    var joinModal = null;

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
    // JOIN MODAL
    // =================================================================

    // =================================================================
    // PHONE MASK
    // =================================================================

    function formatPhone(digits) {
        // digits — только цифры после 7 (макс 10)
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
        // Убрать ведущие 7 или 8
        if (raw.charAt(0) === '7' || raw.charAt(0) === '8') {
            raw = raw.substring(1);
        }
        return raw.substring(0, 10);
    }

    function initPhoneMask(input) {
        var prevDigits = '';

        on(input, 'focus', function () {
            if (!input.value) {
                input.value = '+7 (';
                prevDigits = '';
            }
        });

        on(input, 'keydown', function (e) {
            if (e.key === 'Backspace') {
                var digits = getPhoneDigits(input.value);
                if (digits.length <= 1) {
                    e.preventDefault();
                    input.value = '';
                    prevDigits = '';
                    return;
                }
                // Удалить последнюю цифру вручную
                e.preventDefault();
                var trimmed = digits.substring(0, digits.length - 1);
                input.value = formatPhone(trimmed);
                prevDigits = trimmed;
                input.selectionStart = input.selectionEnd = input.value.length;
            }
        });

        on(input, 'input', function () {
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

        on(input, 'blur', function () {
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
    // JOIN MODAL
    // =================================================================

    function clearInputError(input) {
        toggleClass(input, 'invalid', false);
    }

    function openJoinModal() {
        if (!joinModal) return;

        var form = byId('joinForm');
        var success = byId('joinFormSuccess');
        var error = byId('joinFormError');
        if (form) {
            form.reset();
            form.style.display = '';
            // Убрать классы ошибок
            var inputs = form.querySelectorAll('input');
            for (var i = 0; i < inputs.length; i++) {
                toggleClass(inputs[i], 'invalid', false);
            }
        }
        if (success) success.style.display = 'none';
        if (error) error.style.display = 'none';

        toggleClass(joinModal, 'active', true);
        joinModal.setAttribute('aria-hidden', 'false');
        lockScroll(true);

        // Фокус на первое поле
        var nameInput = byId('joinName');
        if (nameInput) {
            setTimeout(function () { nameInput.focus(); }, 100);
        }
    }

    function closeJoinModal() {
        if (!joinModal) return;

        toggleClass(joinModal, 'active', false);
        joinModal.setAttribute('aria-hidden', 'true');
        lockScroll(false);
    }

    function handleJoinSubmit(e) {
        e.preventDefault();

        var form = e.target;
        var nameInput = form.elements.name;
        var phoneInput = form.elements.phone;
        var consentInput = form.elements.consent;
        var name = nameInput.value.trim();
        var phone = phoneInput.value.trim();
        var errorEl = byId('joinFormError');
        var successEl = byId('joinFormSuccess');
        var submitBtn = form.querySelector('button[type="submit"]');
        var hasError = false;

        // Валидация с подсветкой полей
        toggleClass(nameInput, 'invalid', false);
        toggleClass(phoneInput, 'invalid', false);
        if (errorEl) errorEl.style.display = 'none';

        if (!name) {
            toggleClass(nameInput, 'invalid', true);
            hasError = true;
        }

        if (!phone || !isPhoneComplete(phone)) {
            toggleClass(phoneInput, 'invalid', true);
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
                        : !name ? 'Введите имя' : 'Введите полный номер телефона';
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
            body: JSON.stringify({ name: name, phone: phone })
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
        joinModal = byId('joinModal');

        if (blogModal) {
            on(blogModal, 'click', function (e) {
                if (e.target === blogModal) {
                    closeBlogModal();
                }
            });
        }

        if (joinModal) {
            on(joinModal, 'click', function (e) {
                if (e.target === joinModal) {
                    closeJoinModal();
                }
            });

            var joinForm = byId('joinForm');
            if (joinForm) {
                on(joinForm, 'submit', handleJoinSubmit);
            }

            // Маска телефона
            var phoneInput = byId('joinPhone');
            if (phoneInput) {
                initPhoneMask(phoneInput);
            }

            // Снимать ошибку при вводе
            var joinInputs = joinModal.querySelectorAll('.join-form input');
            for (var i = 0; i < joinInputs.length; i++) {
                on(joinInputs[i], 'input', function () {
                    clearInputError(this);
                });
            }
        }

        onEscape(function () {
            if (blogModal && hasClass(blogModal, 'active')) {
                closeBlogModal();
            }
            if (joinModal && hasClass(joinModal, 'active')) {
                closeJoinModal();
            }
        });
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
    window.openJoinModal = openJoinModal;
    window.closeJoinModal = closeJoinModal;
    window.toggleFaq = toggleFaq;
    window.handleButtonKeydown = handleButtonKeydown;
})();
