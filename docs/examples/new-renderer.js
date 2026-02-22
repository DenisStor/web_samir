/**
 * Admin Example Renderer
 * Рендеринг списка сущностей с поддержкой drag & drop
 *
 * Файл: src/js/admin/renderers/example.js
 * Не забудьте добавить в scripts/build.py в список файлов бандла
 */

var AdminExampleRenderer = (function() {
    'use strict';

    // Приватные переменные
    var container = null;
    var dragDropInitialized = false;

    /**
     * Инициализация рендерера
     * Вызывается при загрузке админки
     */
    function init() {
        container = document.getElementById('exampleGrid');
        initDragDrop();
    }

    /**
     * Инициализация drag & drop
     */
    function initDragDrop() {
        if (dragDropInitialized || !window.AdminDragDrop) return;

        AdminDragDrop.init('exampleGrid', '.example-card', function(newOrder) {
            reorderItems(newOrder);
        });

        dragDropInitialized = true;
    }

    /**
     * Изменение порядка элементов
     * @param {Array} newOrder - Массив ID в новом порядке
     */
    function reorderItems(newOrder) {
        var items = AdminState.examples || [];

        // Создаём новый порядок
        var reordered = newOrder.map(function(id) {
            return items.find(function(item) { return item.id === id; });
        }).filter(Boolean);

        // Добавляем поле order
        reordered.forEach(function(item, index) {
            item.order = index;
        });

        // Сохраняем на сервер
        AdminAPI.save('examples', { items: reordered })
            .then(function() {
                AdminState.setExamples(reordered);
                if (window.showToast) {
                    showToast('Порядок сохранён', 'success');
                }
            })
            .catch(function(error) {
                if (window.showToast) {
                    showToast('Ошибка сохранения порядка', 'error');
                }
                render(); // Откат к предыдущему состоянию
            });
    }

    /**
     * Получить метку статуса
     * @param {string} status - Статус элемента
     * @returns {string} Человекочитаемая метка
     */
    function getStatusLabel(status) {
        var labels = {
            'active': 'Активный',
            'draft': 'Черновик',
            'archived': 'Архив'
        };
        return labels[status] || 'Неизвестно';
    }

    /**
     * Рендеринг списка
     * Вызывается при изменении данных
     */
    function render() {
        if (!container) {
            container = document.getElementById('exampleGrid');
            if (!container) return;
        }

        var items = AdminState.examples || [];

        // Пустое состояние
        if (items.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет данных. Нажмите "Добавить" чтобы создать.</p>';
            return;
        }

        // Генерация HTML
        var html = items.map(function(item, index) {
            // Подготовка данных для поиска
            var searchText = [item.name, item.description].join(' ');

            return '<div class="example-card has-drag" data-id="' + item.id + '" data-index="' + index + '" data-search="' + window.escapeHtml(searchText) + '" draggable="true">' +
                '<div class="example-card-header">' +
                    '<h3 class="example-name">' + window.escapeHtml(item.name) + '</h3>' +
                    '<span class="example-status status-' + (item.status || 'draft') + '">' +
                        getStatusLabel(item.status) +
                    '</span>' +
                '</div>' +
                '<p class="example-description">' + window.escapeHtml(item.description || '') + '</p>' +
                '<div class="example-card-actions">' +
                    '<button class="btn btn-secondary" data-action="edit-example" data-id="' + item.id + '">' +
                        SharedIcons.get('edit') +
                        'Редактировать' +
                    '</button>' +
                    '<button class="btn btn-icon danger" data-action="delete-example" data-id="' + item.id + '" data-name="' + window.escapeHtml(item.name) + '" title="Удалить">' +
                        SharedIcons.get('delete') +
                    '</button>' +
                '</div>' +
                '<div class="drag-handle" title="Перетащите для изменения порядка">' +
                    SharedIcons.get('grip') +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;

        // Обновляем drag & drop после рендера
        if (window.AdminDragDrop) {
            AdminDragDrop.refresh('exampleGrid');
        }
    }

    // Публичный API
    return {
        init: init,
        render: render,
        getStatusLabel: getStatusLabel,
        reorderItems: reorderItems
    };
})();

// Экспорт в глобальную область
window.AdminExampleRenderer = AdminExampleRenderer;
