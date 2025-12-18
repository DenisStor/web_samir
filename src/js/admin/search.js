/**
 * Admin Search Module
 * Поиск и фильтрация элементов в списках
 */
var AdminSearch = (function() {
    'use strict';

    var searchConfigs = {};
    var debounceTimers = {};

    /**
     * Инициализация поиска
     * @param {string} inputId - ID поля ввода
     * @param {string} containerId - ID контейнера с элементами
     * @param {Object} options - Настройки
     * @param {string} options.itemSelector - CSS селектор элементов
     * @param {string} options.searchAttribute - Атрибут для поиска (по умолчанию data-search)
     * @param {function} options.onFilter - Callback при фильтрации
     * @param {number} options.debounce - Задержка в мс (по умолчанию 200)
     */
    function init(inputId, containerId, options) {
        var input = document.getElementById(inputId);
        if (!input) return;

        options = options || {};

        var config = {
            containerId: containerId,
            itemSelector: options.itemSelector || '[data-id]',
            searchAttribute: options.searchAttribute || 'data-search',
            onFilter: options.onFilter,
            debounce: options.debounce || 200
        };

        searchConfigs[inputId] = config;

        // Обработчик ввода
        input.addEventListener('input', function() {
            handleInput(inputId, input.value);
        });

        // Кнопка очистки
        var searchBox = input.closest('.search-box');
        if (searchBox) {
            var clearBtn = searchBox.querySelector('.search-clear');
            if (clearBtn) {
                clearBtn.addEventListener('click', function() {
                    input.value = '';
                    handleInput(inputId, '');
                    input.focus();
                });
            }

            // Обновляем состояние кнопки очистки
            updateClearButton(searchBox, input.value);
        }
    }

    /**
     * Обработка ввода с debounce
     */
    function handleInput(inputId, value) {
        var config = searchConfigs[inputId];
        if (!config) return;

        // Обновляем кнопку очистки
        var input = document.getElementById(inputId);
        var searchBox = input ? input.closest('.search-box') : null;
        if (searchBox) {
            updateClearButton(searchBox, value);
        }

        // Debounce
        if (debounceTimers[inputId]) {
            clearTimeout(debounceTimers[inputId]);
        }

        debounceTimers[inputId] = setTimeout(function() {
            filterItems(config, value);
        }, config.debounce);
    }

    /**
     * Обновить состояние кнопки очистки
     */
    function updateClearButton(searchBox, value) {
        if (value && value.trim()) {
            searchBox.classList.add('has-value');
        } else {
            searchBox.classList.remove('has-value');
        }
    }

    /**
     * Фильтрация элементов
     */
    function filterItems(config, query) {
        var container = document.getElementById(config.containerId);
        if (!container) return;

        query = query.toLowerCase().trim();
        var items = container.querySelectorAll(config.itemSelector);
        var visibleCount = 0;
        var totalCount = items.length;

        items.forEach(function(item) {
            // Пропускаем сообщения о пустом списке
            if (item.classList.contains('empty-message') || item.classList.contains('empty-state')) {
                return;
            }

            var searchText = '';

            // Получаем текст для поиска
            if (item.hasAttribute(config.searchAttribute)) {
                searchText = item.getAttribute(config.searchAttribute);
            } else {
                searchText = item.textContent;
            }

            searchText = searchText.toLowerCase();

            var matches = !query || searchText.includes(query);

            if (matches) {
                item.style.display = '';
                item.classList.remove('search-hidden');
                visibleCount++;
            } else {
                item.style.display = 'none';
                item.classList.add('search-hidden');
            }
        });

        // Показываем сообщение если ничего не найдено
        updateEmptyMessage(container, visibleCount, query);

        // Вызываем callback
        if (config.onFilter) {
            config.onFilter({
                query: query,
                visible: visibleCount,
                total: totalCount
            });
        }
    }

    /**
     * Показать/скрыть сообщение о пустом результате
     */
    function updateEmptyMessage(container, visibleCount, query) {
        var emptyMessage = container.querySelector('.search-empty-message');

        if (visibleCount === 0 && query) {
            if (!emptyMessage) {
                emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-message search-empty-message';
                container.appendChild(emptyMessage);
            }
            emptyMessage.textContent = 'По запросу "' + query + '" ничего не найдено';
            emptyMessage.style.display = '';
        } else if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
    }

    /**
     * Очистить поиск
     */
    function clear(inputId) {
        var input = document.getElementById(inputId);
        if (input) {
            input.value = '';
            handleInput(inputId, '');
        }
    }

    /**
     * Обновить поиск (после изменения данных)
     */
    function refresh(inputId) {
        var input = document.getElementById(inputId);
        if (input && searchConfigs[inputId]) {
            filterItems(searchConfigs[inputId], input.value);
        }
    }

    /**
     * Уничтожить поиск
     */
    function destroy(inputId) {
        if (debounceTimers[inputId]) {
            clearTimeout(debounceTimers[inputId]);
        }
        delete searchConfigs[inputId];
        delete debounceTimers[inputId];
    }

    // Публичный API
    return {
        init: init,
        clear: clear,
        refresh: refresh,
        destroy: destroy
    };
})();

// Экспорт
window.AdminSearch = AdminSearch;
