/**
 * Admin Modals Module
 * Управление модальными окнами
 */

var AdminModals = (function () {
    'use strict';

    var currentModal = null;
    var escapeHandlerBound = false;
    var overlayClickHandlerBound = false;
    var boundCloseHandlers = []; // Хранение ссылок на обработчики для cleanup
    var boundOpenHandlers = []; // Хранение ссылок на обработчики для cleanup

    /**
     * Открыть модальное окно
     */
    function open(modalId) {
        // Для modal и deleteModal - активируем overlay
        var overlayId =
            modalId === 'modal'
                ? 'modalOverlay'
                : modalId === 'deleteModal'
                  ? 'deleteModalOverlay'
                  : modalId;
        var overlay = document.getElementById(overlayId);
        if (!overlay) {
            console.error('Modal overlay not found:', overlayId);
            return;
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentModal = overlay;

        // Обработчик закрытия по Escape (только если ещё не добавлен)
        if (!escapeHandlerBound) {
            document.addEventListener('keydown', handleEscape);
            escapeHandlerBound = true;
        }

        // Обработчик закрытия по клику на оверлей (только если ещё не добавлен)
        if (!overlayClickHandlerBound) {
            overlay.addEventListener('click', handleOverlayClick);
            overlayClickHandlerBound = true;
        }
    }

    /**
     * Закрыть модальное окно
     */
    function close(modalId) {
        var overlay;
        if (modalId) {
            var overlayId =
                modalId === 'modal'
                    ? 'modalOverlay'
                    : modalId === 'deleteModal'
                      ? 'deleteModalOverlay'
                      : modalId;
            overlay = document.getElementById(overlayId);
        } else {
            overlay = currentModal;
        }
        if (!overlay) return;

        overlay.classList.remove('active');
        document.body.style.overflow = '';

        // Удаляем обработчики
        if (escapeHandlerBound) {
            document.removeEventListener('keydown', handleEscape);
            escapeHandlerBound = false;
        }
        if (overlayClickHandlerBound) {
            overlay.removeEventListener('click', handleOverlayClick);
            overlayClickHandlerBound = false;
        }

        currentModal = null;

        // Сброс формы если есть
        var form = overlay.querySelector('form');
        if (form) {
            form.reset();
        }
    }

    /**
     * Закрыть текущее модальное окно
     */
    function closeCurrent() {
        if (currentModal) {
            close();
        }
    }

    /**
     * Обработчик нажатия Escape
     */
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeCurrent();
        }
    }

    /**
     * Обработчик клика по оверлею
     */
    function handleOverlayClick(e) {
        if (e.target.classList.contains('modal') || e.target.classList.contains('modal-overlay')) {
            closeCurrent();
        }
    }

    /**
     * Установить заголовок модального окна
     */
    function setTitle(modalId, title) {
        var modal = document.getElementById(modalId);
        if (!modal) return;

        var titleEl = modal.querySelector('.modal-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * Установить состояние загрузки на кнопке
     */
    function setButtonLoading(btn, loading, loadingText) {
        if (!btn) return;

        if (loading) {
            // Сохраняем оригинальный текст
            if (!btn.dataset.originalText) {
                btn.dataset.originalText = btn.innerHTML;
            }
            btn.classList.add('btn-loading');
            btn.disabled = true;

            // Добавляем спиннер и текст
            var spinner = '<span class="btn-spinner"></span>';
            var text = loadingText || 'Загрузка...';
            btn.innerHTML = spinner + '<span class="btn-loading-text">' + text + '</span>';
        } else {
            btn.classList.remove('btn-loading');
            btn.disabled = false;

            // Восстанавливаем оригинальный текст
            if (btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
        }
    }

    /**
     * Показать диалог подтверждения удаления
     */
    function confirmDelete(itemName, onConfirm) {
        var overlay = document.getElementById('deleteModalOverlay');
        var modal = document.getElementById('deleteModal');

        if (!overlay || !modal) {
            // Fallback на стандартный confirm
            if (confirm('Удалить "' + itemName + '"?')) {
                onConfirm();
            }
            return;
        }

        // Устанавливаем название элемента
        var nameEl = modal.querySelector('.delete-item-name');
        if (nameEl) {
            nameEl.textContent = itemName || 'этот элемент';
        }

        // Устанавливаем обработчик подтверждения
        var confirmBtn = modal.querySelector('.btn-danger, [data-action="confirm-delete"]');
        var cancelBtn = modal.querySelector('.btn-secondary, [data-action="cancel-delete"]');

        function cleanup() {
            if (confirmBtn) {
                confirmBtn.removeEventListener('click', handleConfirm);
            }
            if (cancelBtn) {
                cancelBtn.removeEventListener('click', handleCancel);
            }
            close('deleteModal');
        }

        function handleConfirm() {
            cleanup();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        }

        function handleCancel() {
            cleanup();
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', handleConfirm);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', handleCancel);
        }

        // Открываем модалку
        open('deleteModal');
    }

    /**
     * Инициализация кнопок закрытия
     */
    function init() {
        // Сначала очищаем предыдущие обработчики (если init вызван повторно)
        destroy();

        // Инициализация кнопок закрытия
        var closeButtons = document.querySelectorAll('.modal-close, [data-modal-close]');
        closeButtons.forEach(function (btn) {
            var handler = function (e) {
                e.preventDefault();
                closeCurrent();
            };
            btn.addEventListener('click', handler);
            boundCloseHandlers.push({ element: btn, handler: handler });
        });

        // Инициализация кнопок открытия
        var openButtons = document.querySelectorAll('[data-modal-open]');
        openButtons.forEach(function (btn) {
            var handler = function (e) {
                e.preventDefault();
                var modalId = btn.getAttribute('data-modal-open');
                if (modalId) {
                    open(modalId);
                }
            };
            btn.addEventListener('click', handler);
            boundOpenHandlers.push({ element: btn, handler: handler });
        });
    }

    /**
     * Очистка всех обработчиков событий (предотвращение утечек памяти)
     */
    function destroy() {
        // Закрываем текущий модал если открыт
        if (currentModal) {
            close();
        }

        // Удаляем обработчики кнопок закрытия
        boundCloseHandlers.forEach(function (item) {
            item.element.removeEventListener('click', item.handler);
        });
        boundCloseHandlers = [];

        // Удаляем обработчики кнопок открытия
        boundOpenHandlers.forEach(function (item) {
            item.element.removeEventListener('click', item.handler);
        });
        boundOpenHandlers = [];

        // Удаляем глобальные обработчики
        if (escapeHandlerBound) {
            document.removeEventListener('keydown', handleEscape);
            escapeHandlerBound = false;
        }
    }

    // Публичный API
    return {
        init: init,
        destroy: destroy,
        open: open,
        close: close,
        closeCurrent: closeCurrent,
        setTitle: setTitle,
        setButtonLoading: setButtonLoading,
        confirmDelete: confirmDelete
    };
})();

// Глобальные функции для совместимости
function openModal(modalId) {
    AdminModals.open(modalId);
}

function closeModal(modalId) {
    AdminModals.close(modalId);
}

// Экспорт
window.AdminModals = AdminModals;
window.openModal = openModal;
window.closeModal = closeModal;
