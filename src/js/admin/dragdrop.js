/**
 * Admin Drag & Drop Module
 * Универсальный модуль для сортировки элементов перетаскиванием
 */
var AdminDragDrop = (function () {
    'use strict';

    var draggedItem = null;
    var draggedIndex = -1;
    var containers = {};
    var currentDragOver = null; // Кэш текущего drag-over элемента для производительности

    /**
     * Инициализация drag & drop для контейнера
     * @param {string} containerId - ID контейнера
     * @param {string} itemSelector - CSS селектор элементов
     * @param {function} onReorder - Callback при изменении порядка (newOrder: string[])
     */
    function init(containerId, itemSelector, onReorder) {
        var container = document.getElementById(containerId);
        if (!container) return;

        // Сохраняем конфигурацию
        containers[containerId] = {
            selector: itemSelector,
            onReorder: onReorder
        };

        // Добавляем обработчики событий через делегирование
        container.addEventListener('dragstart', handleDragStart);
        container.addEventListener('dragend', handleDragEnd);
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    }

    /**
     * Обновить draggable атрибуты после рендера
     */
    function refresh(containerId) {
        var config = containers[containerId];
        if (!config) return;

        var container = document.getElementById(containerId);
        if (!container) return;

        var items = container.querySelectorAll(config.selector);
        items.forEach(function (item, index) {
            item.setAttribute('draggable', 'true');
            item.dataset.index = index;
        });
    }

    /**
     * Добавить drag handle к элементу
     */
    function addDragHandle(element) {
        if (element.querySelector('.drag-handle')) return;

        var handle = document.createElement('div');
        handle.className = 'drag-handle';
        handle.innerHTML = window.SharedIcons
            ? window.SharedIcons.get('grip')
            : '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';
        handle.title = 'Перетащите для изменения порядка';

        // Вставляем в начало элемента
        element.insertBefore(handle, element.firstChild);
    }

    function handleDragStart(e) {
        var item = e.target.closest('[draggable="true"]');
        if (!item) return;

        draggedItem = item;
        draggedIndex = parseInt(item.dataset.index, 10);

        // Добавляем класс с небольшой задержкой для анимации
        setTimeout(function () {
            if (draggedItem) {
                draggedItem.classList.add('dragging');
            }
        }, 0);

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedIndex.toString());
    }

    function handleDragEnd(e) {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
        }

        // Очищаем кэшированный drag-over элемент (без querySelectorAll)
        if (currentDragOver) {
            currentDragOver.classList.remove('drag-over');
            currentDragOver = null;
        }

        draggedItem = null;
        draggedIndex = -1;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        var item = e.target.closest('[draggable="true"]');
        if (!item || item === draggedItem) return;

        // Используем кэш вместо querySelectorAll для производительности
        if (currentDragOver && currentDragOver !== item) {
            currentDragOver.classList.remove('drag-over');
        }

        if (item !== currentDragOver) {
            item.classList.add('drag-over');
            currentDragOver = item;
        }
    }

    function handleDragLeave(e) {
        var item = e.target.closest('[draggable="true"]');
        if (item && !item.contains(e.relatedTarget)) {
            item.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();

        var targetItem = e.target.closest('[draggable="true"]');
        if (!targetItem || targetItem === draggedItem || !draggedItem) return;

        var container = targetItem.parentElement;
        var containerId = container.id;
        var config = containers[containerId];

        if (!config) return;

        var targetIndex = parseInt(targetItem.dataset.index, 10);

        // Перемещаем элемент в DOM
        if (draggedIndex < targetIndex) {
            container.insertBefore(draggedItem, targetItem.nextSibling);
        } else {
            container.insertBefore(draggedItem, targetItem);
        }

        // Обновляем индексы
        var items = container.querySelectorAll(config.selector);
        items.forEach(function (item, index) {
            item.dataset.index = index;
        });

        // Собираем новый порядок ID
        var newOrder = [];
        items.forEach(function (item) {
            var id = item.dataset.id;
            if (id) {
                newOrder.push(id);
            }
        });

        // Убираем класс drag-over и очищаем кэш
        targetItem.classList.remove('drag-over');
        currentDragOver = null;

        // Вызываем callback
        if (config.onReorder && newOrder.length > 0) {
            config.onReorder(newOrder);
        }
    }

    /**
     * Удалить обработчики для контейнера
     */
    function destroy(containerId) {
        var container = document.getElementById(containerId);
        if (container) {
            container.removeEventListener('dragstart', handleDragStart);
            container.removeEventListener('dragend', handleDragEnd);
            container.removeEventListener('dragover', handleDragOver);
            container.removeEventListener('dragleave', handleDragLeave);
            container.removeEventListener('drop', handleDrop);
        }
        delete containers[containerId];

        // Обнулить состояние drag если удалён последний контейнер
        if (Object.keys(containers).length === 0) {
            draggedItem = null;
            draggedIndex = -1;
            currentDragOver = null;
        }
    }

    // Публичный API
    return {
        init: init,
        refresh: refresh,
        addDragHandle: addDragHandle,
        destroy: destroy
    };
})();

// Экспорт
window.AdminDragDrop = AdminDragDrop;
