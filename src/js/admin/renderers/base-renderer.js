/**
 * Base Renderer Module
 * Базовые функции для renderers
 */

var BaseRenderer = (function () {
    'use strict';

    /**
     * Базовая функция переупорядочивания элементов
     * @param {string} entityName - Название сущности для API (masters, articles, faq, etc.)
     * @param {Array} newOrder - Массив ID в новом порядке
     * @param {Function} getItems - Функция получения текущих элементов из state
     * @param {Function} setItems - Функция установки элементов в state
     * @param {Function} [onSuccess] - Callback при успехе (например, ре-рендер)
     * @returns {Promise<void>}
     */
    function reorderItems(entityName, newOrder, getItems, setItems, onSuccess) {
        var items = getItems() || [];

        // Создаем новый порядок элементов
        var reordered = newOrder
            .map(function (id) {
                return items.find(function (item) {
                    return String(item.id) === String(id);
                });
            })
            .filter(Boolean);

        // Обновляем поле order
        reordered.forEach(function (item, index) {
            item.order = index;
        });

        // Формируем данные для API
        var data = {};
        data[entityName] = reordered;

        return AdminAPI.save(entityName, data)
            .then(function () {
                setItems(reordered);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            })
            .catch(function (error) {
                if (window.showToast) {
                    showToast('Ошибка сохранения порядка', 'error');
                }
                console.error('Reorder error:', error);
                // Перерисовываем для восстановления предыдущего порядка
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            });
    }

    /**
     * Создать HTML для кнопок действий
     * @param {Object} options - Опции
     * @param {string} options.editAction - data-action для кнопки редактирования
     * @param {string} options.deleteAction - data-action для кнопки удаления
     * @param {string} options.id - ID элемента
     * @param {Object} [options.extraAttrs] - Дополнительные атрибуты (data-category, data-index, etc.)
     * @returns {string} HTML строка
     */
    function createActionButtons(options) {
        var editAttrs = 'data-action="' + options.editAction + '"';
        var deleteAttrs = 'data-action="' + options.deleteAction + '"';

        if (options.id) {
            editAttrs += ' data-id="' + escapeAttr(options.id) + '"';
            deleteAttrs += ' data-id="' + escapeAttr(options.id) + '"';
        }

        if (options.extraAttrs) {
            Object.keys(options.extraAttrs).forEach(function (key) {
                var value = escapeAttr(options.extraAttrs[key]);
                editAttrs += ' data-' + key + '="' + value + '"';
                deleteAttrs += ' data-' + key + '="' + value + '"';
            });
        }

        return (
            '<div class="item-actions">' +
            '<button class="btn btn-icon" ' +
            editAttrs +
            ' title="Редактировать">' +
            SharedIcons.get('edit') +
            '</button>' +
            '<button class="btn btn-icon danger" ' +
            deleteAttrs +
            ' title="Удалить">' +
            SharedIcons.get('delete') +
            '</button>' +
            '</div>'
        );
    }

    /**
     * Создать HTML для drag handle
     * @returns {string} HTML строка
     */
    function createDragHandle() {
        return (
            '<div class="drag-handle" title="Перетащите для изменения порядка">' +
            SharedIcons.get('grip') +
            '</div>'
        );
    }

    /**
     * Рендеринг пустого состояния
     * @param {string} message - Сообщение
     * @param {string} [hint] - Подсказка
     * @returns {string} HTML строка
     */
    function renderEmptyState(message, hint) {
        var html = '<div class="empty-state">' + '<p>' + escapeHtml(message) + '</p>';

        if (hint) {
            html += '<p class="empty-hint">' + escapeHtml(hint) + '</p>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Инициализация drag-drop для контейнера
     * @param {string} containerId - ID контейнера
     * @param {string} itemSelector - Селектор элементов
     * @param {Function} onReorder - Callback при изменении порядка
     */
    function initDragDrop(containerId, itemSelector, onReorder) {
        if (!window.AdminDragDrop) return;

        AdminDragDrop.init(containerId, itemSelector, onReorder);
    }

    /**
     * Обновить drag-drop для контейнера
     * @param {string} containerId - ID контейнера
     */
    function refreshDragDrop(containerId) {
        if (window.AdminDragDrop) {
            AdminDragDrop.refresh(containerId);
        }
    }

    // Публичный API
    return {
        reorderItems: reorderItems,
        createActionButtons: createActionButtons,
        createDragHandle: createDragHandle,
        renderEmptyState: renderEmptyState,
        initDragDrop: initDragDrop,
        refreshDragDrop: refreshDragDrop
    };
})();

// Экспорт
window.BaseRenderer = BaseRenderer;
