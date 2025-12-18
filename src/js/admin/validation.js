/**
 * Admin Form Validation Module
 * Валидация форм перед отправкой
 */
var AdminValidation = (function() {
    'use strict';

    /**
     * Правила валидации
     */
    var rules = {
        required: function(value) {
            return value !== null && value !== undefined && String(value).trim() !== '';
        },
        minLength: function(value, min) {
            return String(value).trim().length >= min;
        },
        maxLength: function(value, max) {
            return String(value).trim().length <= max;
        },
        email: function(value) {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return !value || emailRegex.test(value);
        },
        url: function(value) {
            if (!value) return true;
            try {
                new URL(value);
                return true;
            } catch (e) {
                return false;
            }
        },
        number: function(value) {
            return !value || !isNaN(parseFloat(value));
        },
        positiveNumber: function(value) {
            return !value || (parseFloat(value) >= 0);
        }
    };

    /**
     * Сообщения об ошибках
     */
    var messages = {
        required: 'Это поле обязательно для заполнения',
        minLength: 'Минимальная длина: {0} символов',
        maxLength: 'Максимальная длина: {0} символов',
        email: 'Введите корректный email',
        url: 'Введите корректный URL',
        number: 'Введите число',
        positiveNumber: 'Число должно быть положительным'
    };

    /**
     * Валидация поля
     * @param {string} fieldId - ID поля
     * @param {Array} fieldRules - Массив правил [{rule: 'required'}, {rule: 'minLength', value: 3}]
     * @returns {Object} {valid: boolean, error: string|null}
     */
    function validateField(fieldId, fieldRules) {
        var field = document.getElementById(fieldId);
        if (!field) return { valid: true, error: null };

        var value = field.value;

        for (var i = 0; i < fieldRules.length; i++) {
            var ruleConfig = fieldRules[i];
            var ruleName = ruleConfig.rule;
            var ruleValue = ruleConfig.value;
            var customMessage = ruleConfig.message;

            if (rules[ruleName]) {
                var isValid = rules[ruleName](value, ruleValue);
                if (!isValid) {
                    var errorMessage = customMessage || messages[ruleName];
                    if (errorMessage && ruleValue !== undefined) {
                        errorMessage = errorMessage.replace('{0}', ruleValue);
                    }
                    return { valid: false, error: errorMessage };
                }
            }
        }

        return { valid: true, error: null };
    }

    /**
     * Валидация формы
     * @param {Object} fieldsConfig - Конфигурация полей {fieldId: [{rule: 'required'}]}
     * @returns {Object} {valid: boolean, errors: {fieldId: string}}
     */
    function validateForm(fieldsConfig) {
        var errors = {};
        var isValid = true;

        Object.keys(fieldsConfig).forEach(function(fieldId) {
            var result = validateField(fieldId, fieldsConfig[fieldId]);
            if (!result.valid) {
                errors[fieldId] = result.error;
                isValid = false;
            }
        });

        return { valid: isValid, errors: errors };
    }

    /**
     * Показать ошибку для поля
     */
    function showFieldError(fieldId, message) {
        var field = document.getElementById(fieldId);
        if (!field) return;

        // Добавляем класс ошибки
        field.classList.add('form-input-error');

        // Удаляем старое сообщение об ошибке
        var existingError = field.parentElement.querySelector('.form-error-message');
        if (existingError) {
            existingError.remove();
        }

        // Добавляем новое сообщение
        if (message) {
            var errorEl = document.createElement('div');
            errorEl.className = 'form-error-message';
            errorEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' + window.escapeHtml(message);
            field.parentElement.appendChild(errorEl);
        }
    }

    /**
     * Убрать ошибку с поля
     */
    function clearFieldError(fieldId) {
        var field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.remove('form-input-error');

        var existingError = field.parentElement.querySelector('.form-error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Показать все ошибки формы
     */
    function showFormErrors(errors) {
        Object.keys(errors).forEach(function(fieldId) {
            showFieldError(fieldId, errors[fieldId]);
        });

        // Фокус на первое поле с ошибкой
        var firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
            var field = document.getElementById(firstErrorField);
            if (field) {
                field.focus();
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    /**
     * Очистить все ошибки формы
     */
    function clearFormErrors(fieldsConfig) {
        Object.keys(fieldsConfig).forEach(function(fieldId) {
            clearFieldError(fieldId);
        });
    }

    /**
     * Валидация и показ ошибок
     * @returns {boolean} - Форма валидна?
     */
    function validate(fieldsConfig) {
        // Сначала очищаем старые ошибки
        clearFormErrors(fieldsConfig);

        // Валидируем
        var result = validateForm(fieldsConfig);

        // Показываем ошибки если есть
        if (!result.valid) {
            showFormErrors(result.errors);

            // Показываем toast с первой ошибкой
            var firstError = Object.values(result.errors)[0];
            if (firstError && window.showToast) {
                window.showToast(firstError, 'error');
            }
        }

        return result.valid;
    }

    /**
     * Добавить live валидацию к полю
     */
    function addLiveValidation(fieldId, fieldRules) {
        var field = document.getElementById(fieldId);
        if (!field) return;

        field.addEventListener('blur', function() {
            var result = validateField(fieldId, fieldRules);
            if (!result.valid) {
                showFieldError(fieldId, result.error);
            } else {
                clearFieldError(fieldId);
            }
        });

        field.addEventListener('input', function() {
            // Убираем ошибку при вводе
            clearFieldError(fieldId);
        });
    }

    // Публичный API
    return {
        validate: validate,
        validateForm: validateForm,
        validateField: validateField,
        showFieldError: showFieldError,
        clearFieldError: clearFieldError,
        showFormErrors: showFormErrors,
        clearFormErrors: clearFormErrors,
        addLiveValidation: addLiveValidation,
        rules: rules,
        messages: messages
    };
})();

// Экспорт
window.AdminValidation = AdminValidation;
