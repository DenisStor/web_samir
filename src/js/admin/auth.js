/**
 * Admin Authentication Module
 * Управление входом и выходом из админ-панели
 */

var AdminAuth = (function () {
    'use strict';

    /**
     * Показать админ-панель
     */
    function showAdminPanel() {
        document.body.classList.add('authenticated');
    }

    /**
     * Скрыть админ-панель
     */
    function hideAdminPanel() {
        document.body.classList.remove('authenticated');
    }

    /**
     * Инициализация формы входа
     */
    function initLoginForm(onSuccess) {
        var loginForm = document.getElementById('loginForm');
        var loginError = document.getElementById('loginError');
        var passwordInput = document.getElementById('password');
        var togglePassword = document.getElementById('togglePassword');

        if (!loginForm) return;

        // Toggle password visibility
        if (togglePassword) {
            togglePassword.addEventListener('click', function () {
                var type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;

                var eyeIcon = togglePassword.querySelector('.eye-icon');
                var eyeOffIcon = togglePassword.querySelector('.eye-off-icon');

                if (type === 'text') {
                    eyeIcon.style.display = 'none';
                    eyeOffIcon.style.display = 'block';
                } else {
                    eyeIcon.style.display = 'block';
                    eyeOffIcon.style.display = 'none';
                }
            });
        }

        // Handle login form submit
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            var password = passwordInput.value;
            var submitBtn = loginForm.querySelector('button[type="submit"]');

            // Disable button during request
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Вход...';
            }

            try {
                var result = await AdminAPI.login(password);

                if (result.success && result.token) {
                    AdminAPI.setToken(result.token);
                    showAdminPanel();
                    loginError.classList.remove('visible');
                    loginError.textContent = '';

                    // Callback for successful login
                    if (typeof onSuccess === 'function') {
                        onSuccess();
                    }
                }
            } catch (error) {
                loginError.textContent = error.message || 'Неверный пароль';
                loginError.classList.add('visible');
                passwordInput.value = '';
                passwordInput.focus();

                // Shake animation
                var loginCard = loginForm.closest('.login-card');
                if (loginCard) {
                    loginCard.style.animation = 'none';
                    loginCard.offsetHeight; // Trigger reflow
                    loginCard.style.animation = 'shake 0.5s ease';
                }
            } finally {
                // Re-enable button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Войти';
                }
            }
        });

        // Enter key handler
        passwordInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    /**
     * Инициализация кнопки выхода
     */
    function initLogoutButton() {
        var logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function () {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    await AdminAPI.logout();
                    hideAdminPanel();
                    location.reload();
                }
            });
        }
    }

    /**
     * Проверка авторизации и инициализация
     */
    async function init(onAuthenticated, onNotAuthenticated) {
        var isAuthenticated = await AdminAPI.checkAuth();

        if (isAuthenticated) {
            showAdminPanel();
            if (typeof onAuthenticated === 'function') {
                onAuthenticated();
            }
        } else {
            AdminAPI.setToken(null);
            if (typeof onNotAuthenticated === 'function') {
                onNotAuthenticated();
            }
        }
    }

    // Публичный API
    return {
        init: init,
        showAdminPanel: showAdminPanel,
        hideAdminPanel: hideAdminPanel,
        initLoginForm: initLoginForm,
        initLogoutButton: initLogoutButton
    };
})();

// Экспорт
window.AdminAuth = AdminAuth;
