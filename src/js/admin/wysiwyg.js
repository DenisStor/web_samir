/**
 * Admin WYSIWYG Editor Module
 * Улучшенный редактор с удобным интерфейсом
 */

var AdminWYSIWYG = (function() {
    'use strict';

    var editor = null;
    var toolbar = null;
    var savedRange = null;

    // Конфигурация DOMPurify для всех операций
    var PURIFY_CONFIG = {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div', 'font'],
        ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'color']
    };

    // Доступные цвета
    var COLORS = [
        { name: 'Зелёный', value: '#00ff88' },
        { name: 'Красный', value: '#ff4757' },
        { name: 'Синий', value: '#4d7cff' },
        { name: 'Жёлтый', value: '#ffd93d' },
        { name: 'Розовый', value: '#ff6b9d' },
        { name: 'Оранжевый', value: '#ff9f43' },
        { name: 'Белый', value: '#ffffff' }
    ];

    // =================================================================
    // SELECTION HELPERS
    // =================================================================

    /**
     * Сохранить текущее выделение
     */
    function saveSelection() {
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
            savedRange = sel.getRangeAt(0).cloneRange();
            return savedRange;
        }
        return null;
    }

    /**
     * Восстановить выделение
     */
    function restoreSelection() {
        if (savedRange) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
            return true;
        }
        return false;
    }

    /**
     * Проверить, находится ли выделение внутри редактора
     */
    function isSelectionInEditor(editorEl) {
        editorEl = editorEl || editor;
        if (!editorEl) return false;

        var sel = window.getSelection();
        if (!sel.rangeCount) return false;

        var range = sel.getRangeAt(0);
        return editorEl.contains(range.commonAncestorContainer);
    }

    /**
     * Проверить, есть ли выделенный текст
     */
    function hasSelection() {
        var sel = window.getSelection();
        return sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
    }

    // =================================================================
    // FORMATTING
    // =================================================================

    /**
     * Применить форматирование через execCommand (работает надёжнее)
     */
    function execFormat(command, value) {
        document.execCommand(command, false, value || null);
    }

    /**
     * Применить цвет к тексту
     */
    function applyColor(color) {
        if (!editor) return;

        restoreSelection();

        if (!hasSelection()) {
            showToast('Сначала выделите текст', 'warning');
            return;
        }

        // Используем execCommand для foreColor - самый надёжный способ
        document.execCommand('foreColor', false, color);

        // Скрываем палитру
        hideColorPicker();

        editor.focus();
    }

    /**
     * Удалить цвет с выделенного текста
     */
    function removeColor() {
        if (!editor) return;

        restoreSelection();

        // Удаляем цвет через removeFormat
        document.execCommand('removeFormat', false, null);

        hideColorPicker();
        editor.focus();
    }

    /**
     * Проверить, применён ли стиль к выделению
     */
    function isFormatApplied(tagName) {
        var sel = window.getSelection();
        if (!sel.rangeCount) return false;

        var container = sel.getRangeAt(0).commonAncestorContainer;
        var parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;

        while (parent && parent !== editor) {
            if (parent.tagName && parent.tagName.toLowerCase() === tagName.toLowerCase()) {
                return true;
            }
            parent = parent.parentNode;
        }

        return false;
    }

    /**
     * Проверить, есть ли цвет на выделении
     */
    function hasColorApplied() {
        var sel = window.getSelection();
        if (!sel.rangeCount) return false;

        var container = sel.getRangeAt(0).commonAncestorContainer;
        var parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;

        while (parent && parent !== editor) {
            if (parent.style && parent.style.color) {
                return parent.style.color;
            }
            if (parent.tagName === 'FONT' && parent.getAttribute('color')) {
                return parent.getAttribute('color');
            }
            parent = parent.parentNode;
        }

        return false;
    }

    // =================================================================
    // MAIN FORMAT FUNCTION
    // =================================================================

    /**
     * Форматирование выделенного текста
     */
    function formatText(command, value) {
        if (!editor) return;

        // Фокусируем редактор и восстанавливаем выделение
        editor.focus();
        restoreSelection();

        switch (command) {
            case 'bold':
                execFormat('bold');
                break;
            case 'italic':
                execFormat('italic');
                break;
            case 'underline':
                execFormat('underline');
                break;
            case 'strikeThrough':
                execFormat('strikeThrough');
                break;

            case 'h2':
                execFormat('formatBlock', '<h2>');
                break;
            case 'h3':
                execFormat('formatBlock', '<h3>');
                break;
            case 'p':
                execFormat('formatBlock', '<p>');
                break;
            case 'quote':
                execFormat('formatBlock', '<blockquote>');
                break;

            case 'ul':
                execFormat('insertUnorderedList');
                break;
            case 'ol':
                execFormat('insertOrderedList');
                break;

            case 'link':
                insertLink();
                break;
            case 'unlink':
                execFormat('unlink');
                break;

            case 'removeFormat':
                execFormat('removeFormat');
                break;

            case 'color':
                applyColor(value || '#00ff88');
                break;

            default:
                execFormat(command, value);
        }

        // Сохраняем новое выделение и обновляем тулбар
        saveSelection();
        updateToolbarState();
    }

    /**
     * Вставить ссылку
     */
    function insertLink() {
        var sel = window.getSelection();
        var selectedText = sel.toString();

        var url = prompt('Введите URL ссылки:', 'https://');
        if (!url || url === 'https://') return;

        restoreSelection();

        if (selectedText) {
            execFormat('createLink', url);
        } else {
            // Нет выделения - вставляем ссылку с URL как текстом
            var linkHtml = '<a href="' + url + '">' + url + '</a>';
            execFormat('insertHTML', linkHtml);
        }
    }

    // =================================================================
    // COLOR PICKER
    // =================================================================

    /**
     * Показать/скрыть палитру цветов
     */
    function toggleColorPicker(btn) {
        var picker = btn.querySelector('.color-picker-dropdown');

        if (picker) {
            // Уже есть - переключаем видимость
            picker.classList.toggle('visible');
        } else {
            // Создаём палитру
            picker = document.createElement('div');
            picker.className = 'color-picker-dropdown visible';

            var html = '<div class="color-picker-colors">';
            COLORS.forEach(function(c) {
                html += '<button type="button" class="color-swatch" data-color="' + c.value + '" title="' + c.name + '" style="background-color: ' + c.value + '"></button>';
            });
            html += '</div>';
            html += '<button type="button" class="color-remove-btn" data-color-remove>Убрать цвет</button>';

            picker.innerHTML = html;
            btn.appendChild(picker);

            // Обработчики клика на цвет
            picker.querySelectorAll('.color-swatch').forEach(function(swatch) {
                swatch.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                swatch.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var color = this.getAttribute('data-color');
                    applyColor(color);
                });
            });

            // Убрать цвет
            picker.querySelector('[data-color-remove]').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                removeColor();
            });
        }

        // Закрываем другие палитры
        document.querySelectorAll('.color-picker-dropdown.visible').forEach(function(p) {
            if (p !== picker) p.classList.remove('visible');
        });
    }

    /**
     * Скрыть все палитры цветов
     */
    function hideColorPicker() {
        document.querySelectorAll('.color-picker-dropdown').forEach(function(p) {
            p.classList.remove('visible');
        });
    }

    // =================================================================
    // TOOLBAR
    // =================================================================

    /**
     * Обновить состояние кнопок тулбара
     */
    function updateToolbarState() {
        if (!toolbar) return;

        var buttons = toolbar.querySelectorAll('.toolbar-btn');
        buttons.forEach(function(btn) {
            btn.classList.remove('active');
        });

        // Проверяем активные стили
        try {
            if (document.queryCommandState('bold')) {
                activateButton('bold');
            }
            if (document.queryCommandState('italic')) {
                activateButton('italic');
            }
            if (document.queryCommandState('underline')) {
                activateButton('underline');
            }
            if (document.queryCommandState('insertUnorderedList')) {
                activateButton('ul');
            }
            if (document.queryCommandState('insertOrderedList')) {
                activateButton('ol');
            }
        } catch (e) {
            // Fallback для браузеров без поддержки queryCommandState
        }

        // Проверяем блочное форматирование
        if (isFormatApplied('h2')) {
            activateButton('h2');
        }
        if (isFormatApplied('h3')) {
            activateButton('h3');
        }
        if (isFormatApplied('blockquote')) {
            activateButton('quote');
        }
        if (isFormatApplied('a')) {
            activateButton('link');
        }

        // Проверяем цвет
        var color = hasColorApplied();
        if (color) {
            var colorBtn = toolbar.querySelector('[data-command="showColorPicker"]');
            if (colorBtn) {
                colorBtn.classList.add('active');
            }
        }
    }

    /**
     * Активировать кнопку в тулбаре
     */
    function activateButton(command) {
        if (!toolbar) return;
        var btn = toolbar.querySelector('[data-command="' + command + '"]');
        if (btn) btn.classList.add('active');
    }

    /**
     * Инициализация тулбара
     */
    function initToolbar() {
        if (!toolbar) return;

        // Предотвращаем повторную инициализацию
        if (toolbar.dataset.initialized === 'true') {
            return;
        }
        toolbar.dataset.initialized = 'true';

        var buttons = toolbar.querySelectorAll('[data-command]');
        buttons.forEach(function(btn) {
            // Предотвращаем потерю фокуса при нажатии
            btn.addEventListener('mousedown', function(e) {
                e.preventDefault();
            });

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                var command = this.getAttribute('data-command');
                var value = this.getAttribute('data-value');

                if (!editor) return;

                // Спецобработка для палитры цветов
                if (command === 'showColorPicker') {
                    toggleColorPicker(this);
                    return;
                }

                formatText(command, value);
                editor.focus();
            });
        });

        // Закрытие палитры при клике вне
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.toolbar-btn-color')) {
                hideColorPicker();
            }
        });
    }

    // =================================================================
    // INITIALIZATION
    // =================================================================

    /**
     * Обработка вставки - очистка форматирования
     */
    function handlePaste(e) {
        e.preventDefault();

        var text = '';
        if (e.clipboardData || window.clipboardData) {
            var html = (e.clipboardData || window.clipboardData).getData('text/html');
            if (html && typeof DOMPurify !== 'undefined') {
                text = DOMPurify.sanitize(html, PURIFY_CONFIG);
            } else {
                text = (e.clipboardData || window.clipboardData).getData('text/plain');
                text = text.replace(/\n/g, '<br>');
            }
        }

        document.execCommand('insertHTML', false, text);
    }

    /**
     * Инициализация редактора с тулбаром
     */
    function initWithToolbar(editorId) {
        var editorEl = typeof editorId === 'string' ? document.getElementById(editorId) : editorId;
        if (!editorEl) return;

        editor = editorEl;
        editorEl.setAttribute('contenteditable', 'true');

        // Находим тулбар
        var toolbarEl = editorEl.previousElementSibling;
        if (toolbarEl && toolbarEl.classList.contains('editor-toolbar')) {
            toolbar = toolbarEl;
            initToolbar();
        }

        // Сохраняем выделение при потере фокуса
        editorEl.addEventListener('blur', function() {
            saveSelection();
        });

        // При фокусе обновляем активный редактор
        editorEl.addEventListener('focus', function() {
            editor = editorEl;
            var nearToolbar = editorEl.previousElementSibling;
            if (nearToolbar && nearToolbar.classList.contains('editor-toolbar')) {
                toolbar = nearToolbar;
            }
        });

        // Обновляем состояние при изменениях
        editorEl.addEventListener('keyup', function() {
            saveSelection();
            updateToolbarState();
        });

        editorEl.addEventListener('mouseup', function() {
            saveSelection();
            updateToolbarState();
        });

        // Горячие клавиши
        editorEl.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        formatText('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        formatText('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        formatText('underline');
                        break;
                }
            }
        });

        // Обработка вставки
        editorEl.addEventListener('paste', handlePaste);
    }

    /**
     * Получить HTML контент редактора
     */
    function getContent(editorId) {
        var editorEl;

        if (editorId) {
            editorEl = typeof editorId === 'string' ? document.getElementById(editorId) : editorId;
        } else {
            editorEl = editor;
        }

        if (!editorEl) return '';

        var content = editorEl.innerHTML;

        // Очищаем через DOMPurify если доступен
        if (typeof DOMPurify !== 'undefined') {
            content = DOMPurify.sanitize(content, PURIFY_CONFIG);
        }

        return content;
    }

    /**
     * Установить HTML контент редактора
     */
    function setContent(html, editorId) {
        var editorEl;

        if (editorId) {
            editorEl = typeof editorId === 'string' ? document.getElementById(editorId) : editorId;
        } else {
            editorEl = editor;
        }

        if (!editorEl) return;

        // Очищаем через DOMPurify если доступен
        if (typeof DOMPurify !== 'undefined') {
            html = DOMPurify.sanitize(html, PURIFY_CONFIG);
        }

        editorEl.innerHTML = html || '';
    }

    /**
     * Очистить редактор
     */
    function clear() {
        if (editor) {
            editor.innerHTML = '';
        }
    }

    /**
     * Получить текущий редактор
     */
    function getEditor() {
        return editor;
    }

    // =================================================================
    // HTML GENERATORS
    // =================================================================

    /**
     * Генерировать HTML тулбара
     */
    function getToolbarHTML() {
        return '<div class="editor-toolbar">' +
            '<button type="button" class="toolbar-btn" data-command="bold" title="Жирный (Ctrl+B)"><strong>B</strong></button>' +
            '<button type="button" class="toolbar-btn" data-command="italic" title="Курсив (Ctrl+I)"><em>I</em></button>' +
            '<button type="button" class="toolbar-btn" data-command="underline" title="Подчёркнутый (Ctrl+U)"><u>U</u></button>' +
            '<span class="toolbar-divider"></span>' +
            '<button type="button" class="toolbar-btn" data-command="h2" title="Заголовок H2">H2</button>' +
            '<button type="button" class="toolbar-btn" data-command="h3" title="Подзаголовок H3">H3</button>' +
            '<button type="button" class="toolbar-btn" data-command="p" title="Обычный текст">P</button>' +
            '<span class="toolbar-divider"></span>' +
            '<button type="button" class="toolbar-btn" data-command="ul" title="Маркированный список">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>' +
            '</button>' +
            '<button type="button" class="toolbar-btn" data-command="ol" title="Нумерованный список">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="4" y="8" font-size="8" fill="currentColor">1</text><text x="4" y="14" font-size="8" fill="currentColor">2</text><text x="4" y="20" font-size="8" fill="currentColor">3</text></svg>' +
            '</button>' +
            '<span class="toolbar-divider"></span>' +
            '<button type="button" class="toolbar-btn" data-command="link" title="Вставить ссылку">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
            '</button>' +
            '<button type="button" class="toolbar-btn" data-command="quote" title="Цитата">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>' +
            '</button>' +
            '<span class="toolbar-divider"></span>' +
            '<button type="button" class="toolbar-btn toolbar-btn-color" data-command="showColorPicker" title="Цвет текста">' +
                '<span class="color-indicator">A</span>' +
            '</button>' +
            '<button type="button" class="toolbar-btn" data-command="removeFormat" title="Очистить форматирование">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
        '</div>';
    }

    /**
     * Генерировать HTML редактора с тулбаром
     */
    function getEditorHTML(id, content, placeholder) {
        return getToolbarHTML() +
            '<div class="wysiwyg-editor" id="' + id + '" contenteditable="true" data-placeholder="' + (placeholder || 'Начните писать...') + '">' +
                (content || '') +
            '</div>';
    }

    // Legacy init function
    function init(editorId, toolbarId) {
        editor = typeof editorId === 'string' ? document.getElementById(editorId) : editorId;
        toolbar = typeof toolbarId === 'string' ? document.getElementById(toolbarId) : toolbarId;

        if (!editor) {
            return;
        }

        editor.setAttribute('contenteditable', 'true');

        if (toolbar) {
            initToolbar();
        }

        editor.addEventListener('paste', handlePaste);
        editor.addEventListener('keyup', function() {
            saveSelection();
            updateToolbarState();
        });
        editor.addEventListener('mouseup', function() {
            saveSelection();
            updateToolbarState();
        });
    }

    // Публичный API
    return {
        init: init,
        initWithToolbar: initWithToolbar,
        formatText: formatText,
        insertLink: insertLink,
        getContent: getContent,
        setContent: setContent,
        clear: clear,
        getEditor: getEditor,
        updateToolbarState: updateToolbarState,
        getToolbarHTML: getToolbarHTML,
        getEditorHTML: getEditorHTML,
        isFormatApplied: isFormatApplied,
        saveSelection: saveSelection,
        restoreSelection: restoreSelection
    };
})();

// Экспорт
window.AdminWYSIWYG = AdminWYSIWYG;
