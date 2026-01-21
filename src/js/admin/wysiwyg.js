/**
 * Admin WYSIWYG Editor Module
 * Улучшенный редактор с удобным интерфейсом
 *
 * v2.0 - Рефакторинг: хранение состояния по ID, модальное окно для ссылок,
 *        undo/redo, переключатель HTML режима
 */

var AdminWYSIWYG = (function() {
    'use strict';

    // =================================================================
    // STATE MANAGEMENT - хранение по ID редактора
    // =================================================================

    var editors = {}; // { editorId: { el, toolbar, savedRange, isSourceMode } }
    var activeEditorId = null;
    var linkModal = null; // Модальное окно для ссылок (единственное на страницу)

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
    // EDITOR STATE HELPERS
    // =================================================================

    /**
     * Получить состояние редактора по ID
     */
    function getEditorState(editorId) {
        if (!editorId && activeEditorId) {
            editorId = activeEditorId;
        }
        return editors[editorId] || null;
    }

    /**
     * Установить активный редактор
     */
    function setActiveEditor(editorId) {
        activeEditorId = editorId;
    }

    // =================================================================
    // SELECTION HELPERS
    // =================================================================

    /**
     * Сохранить текущее выделение для конкретного редактора
     */
    function saveSelection(editorId) {
        var state = getEditorState(editorId);
        if (!state) return null;

        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
            state.savedRange = sel.getRangeAt(0).cloneRange();
            return state.savedRange;
        }
        return null;
    }

    /**
     * Восстановить выделение для конкретного редактора
     */
    function restoreSelection(editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.savedRange) return false;

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(state.savedRange);
        return true;
    }

    /**
     * Проверить, находится ли выделение внутри редактора
     */
    function isSelectionInEditor(editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.el) return false;

        var sel = window.getSelection();
        if (!sel.rangeCount) return false;

        var range = sel.getRangeAt(0);
        return state.el.contains(range.commonAncestorContainer);
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
     * Применить форматирование через execCommand
     */
    function execFormat(command, value) {
        document.execCommand(command, false, value || null);
    }

    /**
     * Применить цвет к тексту
     */
    function applyColor(color, editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.el) return;

        restoreSelection(editorId);

        if (!hasSelection()) {
            showToast('Сначала выделите текст', 'warning');
            return;
        }

        document.execCommand('foreColor', false, color);
        hideColorPicker();
        state.el.focus();
    }

    /**
     * Удалить цвет с выделенного текста
     */
    function removeColor(editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.el) return;

        restoreSelection(editorId);
        document.execCommand('removeFormat', false, null);
        hideColorPicker();
        state.el.focus();
    }

    /**
     * Проверить, применён ли стиль к выделению
     */
    function isFormatApplied(tagName, editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.el) return false;

        var sel = window.getSelection();
        if (!sel.rangeCount) return false;

        var container = sel.getRangeAt(0).commonAncestorContainer;
        var parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;

        while (parent && parent !== state.el) {
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
    function hasColorApplied(editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.el) return false;

        var sel = window.getSelection();
        if (!sel.rangeCount) return false;

        var container = sel.getRangeAt(0).commonAncestorContainer;
        var parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;

        while (parent && parent !== state.el) {
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
     * Конфигурация команд форматирования
     */
    var FORMAT_COMMANDS = {
        // Inline styles
        bold: { exec: 'bold' },
        italic: { exec: 'italic' },
        underline: { exec: 'underline' },
        strikeThrough: { exec: 'strikeThrough' },

        // Block formats
        h2: { exec: 'formatBlock', value: '<h2>' },
        h3: { exec: 'formatBlock', value: '<h3>' },
        p: { exec: 'formatBlock', value: '<p>' },
        quote: { exec: 'formatBlock', value: '<blockquote>' },

        // Lists
        ul: { exec: 'insertUnorderedList' },
        ol: { exec: 'insertOrderedList' },

        // Links
        link: { handler: 'insertLink' },
        unlink: { exec: 'unlink' },

        // Undo/Redo
        undo: { exec: 'undo' },
        redo: { exec: 'redo' },

        // Other
        removeFormat: { exec: 'removeFormat' },
        color: { handler: 'applyColor', defaultValue: '#00ff88' }
    };

    /**
     * Форматирование выделенного текста
     */
    function formatText(command, value, editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.el) return;

        // Не работает в режиме исходного кода
        if (state.isSourceMode) return;

        state.el.focus();
        restoreSelection(editorId);

        var config = FORMAT_COMMANDS[command];

        if (config) {
            if (config.handler === 'insertLink') {
                showLinkModal(editorId);
            } else if (config.handler === 'applyColor') {
                applyColor(value || config.defaultValue, editorId);
            } else {
                execFormat(config.exec, config.value || value || null);
            }
        } else {
            execFormat(command, value);
        }

        saveSelection(editorId);
        updateToolbarState(editorId);
    }

    // =================================================================
    // LINK MODAL
    // =================================================================

    /**
     * Создать модальное окно для ссылок (один раз)
     */
    function createLinkModal() {
        if (linkModal) return linkModal;

        var modal = document.createElement('div');
        modal.className = 'wysiwyg-link-modal';
        modal.innerHTML =
            '<div class="wysiwyg-link-modal-backdrop"></div>' +
            '<div class="wysiwyg-link-modal-content">' +
                '<div class="wysiwyg-link-modal-header">Вставить ссылку</div>' +
                '<input type="url" class="wysiwyg-link-input" placeholder="https://example.com" autocomplete="off">' +
                '<div class="wysiwyg-link-modal-actions">' +
                    '<button type="button" class="wysiwyg-link-cancel">Отмена</button>' +
                    '<button type="button" class="wysiwyg-link-confirm">Вставить</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(modal);

        // Обработчики
        var backdrop = modal.querySelector('.wysiwyg-link-modal-backdrop');
        var cancelBtn = modal.querySelector('.wysiwyg-link-cancel');
        var confirmBtn = modal.querySelector('.wysiwyg-link-confirm');
        var input = modal.querySelector('.wysiwyg-link-input');

        backdrop.addEventListener('click', hideLinkModal);
        cancelBtn.addEventListener('click', hideLinkModal);

        confirmBtn.addEventListener('click', function() {
            insertLinkFromModal();
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                insertLinkFromModal();
            }
            if (e.key === 'Escape') {
                hideLinkModal();
            }
        });

        linkModal = modal;
        return modal;
    }

    /**
     * Показать модальное окно для ссылки
     */
    function showLinkModal(editorId) {
        saveSelection(editorId);

        var modal = createLinkModal();
        var input = modal.querySelector('.wysiwyg-link-input');

        modal.dataset.editorId = editorId;
        input.value = 'https://';

        modal.classList.add('visible');

        // Фокус на input с небольшой задержкой
        setTimeout(function() {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }, 50);
    }

    /**
     * Скрыть модальное окно
     */
    function hideLinkModal() {
        if (linkModal) {
            linkModal.classList.remove('visible');
        }
    }

    /**
     * Вставить ссылку из модального окна
     */
    function insertLinkFromModal() {
        if (!linkModal) return;

        var input = linkModal.querySelector('.wysiwyg-link-input');
        var url = input.value.trim();
        var editorId = linkModal.dataset.editorId;

        if (!url || url === 'https://') {
            hideLinkModal();
            return;
        }

        var state = getEditorState(editorId);
        if (!state || !state.el) {
            hideLinkModal();
            return;
        }

        state.el.focus();
        restoreSelection(editorId);

        var sel = window.getSelection();
        var selectedText = sel.toString();

        if (selectedText) {
            execFormat('createLink', url);
        } else {
            var linkHtml = '<a href="' + SharedHelpers.escapeHtml(url) + '">' + SharedHelpers.escapeHtml(url) + '</a>';
            execFormat('insertHTML', linkHtml);
        }

        hideLinkModal();
        state.el.focus();
    }

    // =================================================================
    // SOURCE MODE (HTML TOGGLE)
    // =================================================================

    /**
     * Переключить режим исходного кода
     */
    function toggleSourceMode(editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.el) return;

        var editorEl = state.el;
        var wrapper = editorEl.parentNode;
        var textarea = wrapper.querySelector('.wysiwyg-source-textarea');

        if (state.isSourceMode) {
            // HTML → WYSIWYG
            if (textarea) {
                var html = textarea.value;
                if (typeof DOMPurify !== 'undefined') {
                    html = DOMPurify.sanitize(html, PURIFY_CONFIG);
                }
                editorEl.innerHTML = html;
                textarea.style.display = 'none';
            }
            editorEl.style.display = '';
            state.isSourceMode = false;
            updateSourceButton(editorId, false);
        } else {
            // WYSIWYG → HTML
            if (!textarea) {
                textarea = document.createElement('textarea');
                textarea.className = 'wysiwyg-source-textarea';
                wrapper.appendChild(textarea);
            }
            textarea.value = editorEl.innerHTML;
            textarea.style.display = '';
            editorEl.style.display = 'none';
            state.isSourceMode = true;
            updateSourceButton(editorId, true);
            textarea.focus();
        }
    }

    /**
     * Обновить состояние кнопки исходного кода
     */
    function updateSourceButton(editorId, isActive) {
        var state = getEditorState(editorId);
        if (!state || !state.toolbar) return;

        var btn = state.toolbar.querySelector('[data-command="toggleSource"]');
        if (btn) {
            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }

        // Отключаем другие кнопки в режиме исходного кода
        var buttons = state.toolbar.querySelectorAll('[data-command]');
        buttons.forEach(function(b) {
            var cmd = b.getAttribute('data-command');
            if (cmd !== 'toggleSource') {
                if (isActive) {
                    b.classList.add('disabled');
                    b.disabled = true;
                } else {
                    b.classList.remove('disabled');
                    b.disabled = false;
                }
            }
        });
    }

    // =================================================================
    // COLOR PICKER
    // =================================================================

    /**
     * Показать/скрыть палитру цветов
     */
    function toggleColorPicker(btn, editorId) {
        var picker = btn.querySelector('.color-picker-dropdown');

        if (picker) {
            picker.classList.toggle('visible');
        } else {
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

            picker.querySelectorAll('.color-swatch').forEach(function(swatch) {
                swatch.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                swatch.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var color = this.getAttribute('data-color');
                    applyColor(color, editorId);
                });
            });

            picker.querySelector('[data-color-remove]').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                removeColor(editorId);
            });
        }

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
    function updateToolbarState(editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.toolbar) return;

        // Не обновляем в режиме исходного кода
        if (state.isSourceMode) return;

        var buttons = state.toolbar.querySelectorAll('.toolbar-btn:not(.disabled)');
        buttons.forEach(function(btn) {
            var cmd = btn.getAttribute('data-command');
            // Не трогаем toggleSource
            if (cmd !== 'toggleSource') {
                btn.classList.remove('active');
            }
        });

        try {
            if (document.queryCommandState('bold')) {
                activateButton('bold', editorId);
            }
            if (document.queryCommandState('italic')) {
                activateButton('italic', editorId);
            }
            if (document.queryCommandState('underline')) {
                activateButton('underline', editorId);
            }
            if (document.queryCommandState('insertUnorderedList')) {
                activateButton('ul', editorId);
            }
            if (document.queryCommandState('insertOrderedList')) {
                activateButton('ol', editorId);
            }
        } catch (e) {
            // Fallback
        }

        if (isFormatApplied('h2', editorId)) {
            activateButton('h2', editorId);
        }
        if (isFormatApplied('h3', editorId)) {
            activateButton('h3', editorId);
        }
        if (isFormatApplied('blockquote', editorId)) {
            activateButton('quote', editorId);
        }
        if (isFormatApplied('a', editorId)) {
            activateButton('link', editorId);
        }

        var color = hasColorApplied(editorId);
        if (color) {
            var colorBtn = state.toolbar.querySelector('[data-command="showColorPicker"]');
            if (colorBtn) {
                colorBtn.classList.add('active');
            }
        }
    }

    /**
     * Активировать кнопку в тулбаре
     */
    function activateButton(command, editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.toolbar) return;

        var btn = state.toolbar.querySelector('[data-command="' + command + '"]');
        if (btn) btn.classList.add('active');
    }

    /**
     * Инициализация тулбара для конкретного редактора
     */
    function initToolbar(editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.toolbar) return;

        var toolbar = state.toolbar;

        if (toolbar.dataset.initialized === 'true') {
            return;
        }
        toolbar.dataset.initialized = 'true';

        var buttons = toolbar.querySelectorAll('[data-command]');
        buttons.forEach(function(btn) {
            btn.addEventListener('mousedown', function(e) {
                e.preventDefault();
            });

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                var command = this.getAttribute('data-command');
                var value = this.getAttribute('data-value');

                var currentState = getEditorState(editorId);
                if (!currentState || !currentState.el) return;

                if (command === 'showColorPicker') {
                    toggleColorPicker(this, editorId);
                    return;
                }

                if (command === 'toggleSource') {
                    toggleSourceMode(editorId);
                    return;
                }

                formatText(command, value, editorId);
                currentState.el.focus();
            });
        });

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
    function handlePaste(e, editorId) {
        var state = getEditorState(editorId);
        if (!state || state.isSourceMode) return;

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

        var id = editorEl.id || 'editor-' + SharedHelpers.generateId();
        if (!editorEl.id) {
            editorEl.id = id;
        }

        // Создаём состояние редактора
        editors[id] = {
            el: editorEl,
            toolbar: null,
            savedRange: null,
            isSourceMode: false
        };

        editorEl.setAttribute('contenteditable', 'true');

        // Находим тулбар
        var toolbarEl = editorEl.previousElementSibling;
        if (toolbarEl && toolbarEl.classList.contains('editor-toolbar')) {
            editors[id].toolbar = toolbarEl;
            initToolbar(id);
        }

        // Обёртка для textarea режима исходного кода
        var wrapper = editorEl.parentNode;
        if (!wrapper.classList.contains('wysiwyg-wrapper')) {
            var newWrapper = document.createElement('div');
            newWrapper.className = 'wysiwyg-wrapper';
            wrapper.insertBefore(newWrapper, editorEl);
            if (editors[id].toolbar) {
                newWrapper.appendChild(editors[id].toolbar);
            }
            newWrapper.appendChild(editorEl);
        }

        // События
        editorEl.addEventListener('blur', function() {
            saveSelection(id);
        });

        editorEl.addEventListener('focus', function() {
            setActiveEditor(id);
        });

        editorEl.addEventListener('keyup', function() {
            saveSelection(id);
            updateToolbarState(id);
        });

        editorEl.addEventListener('mouseup', function() {
            saveSelection(id);
            updateToolbarState(id);
        });

        // Горячие клавиши
        editorEl.addEventListener('keydown', function(e) {
            var state = getEditorState(id);
            if (state && state.isSourceMode) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        formatText('bold', null, id);
                        break;
                    case 'i':
                        e.preventDefault();
                        formatText('italic', null, id);
                        break;
                    case 'u':
                        e.preventDefault();
                        formatText('underline', null, id);
                        break;
                    case 'z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            formatText('redo', null, id);
                        }
                        // Ctrl+Z handled natively
                        break;
                    case 'y':
                        e.preventDefault();
                        formatText('redo', null, id);
                        break;
                }
            }
        });

        editorEl.addEventListener('paste', function(e) {
            handlePaste(e, id);
        });

        setActiveEditor(id);
        return id;
    }

    /**
     * Получить HTML контент редактора
     */
    function getContent(editorId) {
        var state = getEditorState(editorId);
        if (!state) return '';

        var content;

        if (state.isSourceMode) {
            var wrapper = state.el.parentNode;
            var textarea = wrapper.querySelector('.wysiwyg-source-textarea');
            content = textarea ? textarea.value : state.el.innerHTML;
        } else {
            content = state.el.innerHTML;
        }

        if (typeof DOMPurify !== 'undefined') {
            content = DOMPurify.sanitize(content, PURIFY_CONFIG);
        }

        return content;
    }

    /**
     * Установить HTML контент редактора
     */
    function setContent(html, editorId) {
        var state = getEditorState(editorId);
        if (!state || !state.el) return;

        if (typeof DOMPurify !== 'undefined') {
            html = DOMPurify.sanitize(html, PURIFY_CONFIG);
        }

        // Выходим из режима исходного кода если активен
        if (state.isSourceMode) {
            toggleSourceMode(editorId);
        }

        state.el.innerHTML = html || '';
    }

    /**
     * Очистить редактор
     */
    function clear(editorId) {
        var state = getEditorState(editorId);
        if (state && state.el) {
            if (state.isSourceMode) {
                toggleSourceMode(editorId);
            }
            state.el.innerHTML = '';
        }
    }

    /**
     * Получить элемент редактора
     */
    function getEditor(editorId) {
        var state = getEditorState(editorId);
        return state ? state.el : null;
    }

    /**
     * Уничтожить редактор
     */
    function destroy(editorId) {
        if (editors[editorId]) {
            delete editors[editorId];
        }
        if (activeEditorId === editorId) {
            activeEditorId = null;
        }
    }

    // =================================================================
    // HTML GENERATORS
    // =================================================================

    /**
     * Генерировать HTML тулбара
     */
    function getToolbarHTML() {
        return '<div class="editor-toolbar">' +
            // Undo/Redo
            '<button type="button" class="toolbar-btn" data-command="undo" title="Отменить (Ctrl+Z)">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h10a5 5 0 0 1 0 10H7"/><path d="M3 10l4-4"/><path d="M3 10l4 4"/></svg>' +
            '</button>' +
            '<button type="button" class="toolbar-btn" data-command="redo" title="Повторить (Ctrl+Y)">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H11a5 5 0 0 0 0 10h6"/><path d="M21 10l-4-4"/><path d="M21 10l-4 4"/></svg>' +
            '</button>' +
            '<span class="toolbar-divider"></span>' +
            // Bold/Italic/Underline
            '<button type="button" class="toolbar-btn" data-command="bold" title="Жирный (Ctrl+B)"><strong>B</strong></button>' +
            '<button type="button" class="toolbar-btn" data-command="italic" title="Курсив (Ctrl+I)"><em>I</em></button>' +
            '<button type="button" class="toolbar-btn" data-command="underline" title="Подчёркнутый (Ctrl+U)"><u>U</u></button>' +
            '<span class="toolbar-divider"></span>' +
            // Headers
            '<button type="button" class="toolbar-btn" data-command="h2" title="Заголовок H2">H2</button>' +
            '<button type="button" class="toolbar-btn" data-command="h3" title="Подзаголовок H3">H3</button>' +
            '<button type="button" class="toolbar-btn" data-command="p" title="Обычный текст">P</button>' +
            '<span class="toolbar-divider"></span>' +
            // Lists
            '<button type="button" class="toolbar-btn" data-command="ul" title="Маркированный список">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>' +
            '</button>' +
            '<button type="button" class="toolbar-btn" data-command="ol" title="Нумерованный список">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="4" y="8" font-size="8" fill="currentColor">1</text><text x="4" y="14" font-size="8" fill="currentColor">2</text><text x="4" y="20" font-size="8" fill="currentColor">3</text></svg>' +
            '</button>' +
            '<span class="toolbar-divider"></span>' +
            // Link/Quote
            '<button type="button" class="toolbar-btn" data-command="link" title="Вставить ссылку">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
            '</button>' +
            '<button type="button" class="toolbar-btn" data-command="quote" title="Цитата">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>' +
            '</button>' +
            '<span class="toolbar-divider"></span>' +
            // Color/Clear
            '<button type="button" class="toolbar-btn toolbar-btn-color" data-command="showColorPicker" title="Цвет текста">' +
                '<span class="color-indicator">A</span>' +
            '</button>' +
            '<button type="button" class="toolbar-btn" data-command="removeFormat" title="Очистить форматирование">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
            '<span class="toolbar-divider"></span>' +
            // Source mode
            '<button type="button" class="toolbar-btn" data-command="toggleSource" title="Исходный код HTML">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' +
            '</button>' +
        '</div>';
    }

    /**
     * Генерировать HTML редактора с тулбаром
     */
    function getEditorHTML(id, content, placeholder) {
        return '<div class="wysiwyg-wrapper">' +
            getToolbarHTML() +
            '<div class="wysiwyg-editor" id="' + id + '" contenteditable="true" data-placeholder="' + (placeholder || 'Начните писать...') + '">' +
                (content || '') +
            '</div>' +
        '</div>';
    }

    // Legacy init function for backwards compatibility
    function init(editorId, toolbarId) {
        var editorEl = typeof editorId === 'string' ? document.getElementById(editorId) : editorId;
        var toolbarEl = typeof toolbarId === 'string' ? document.getElementById(toolbarId) : toolbarId;

        if (!editorEl) return;

        var id = editorEl.id || 'editor-' + SharedHelpers.generateId();
        if (!editorEl.id) {
            editorEl.id = id;
        }

        editors[id] = {
            el: editorEl,
            toolbar: toolbarEl,
            savedRange: null,
            isSourceMode: false
        };

        editorEl.setAttribute('contenteditable', 'true');

        if (toolbarEl) {
            initToolbar(id);
        }

        editorEl.addEventListener('paste', function(e) {
            handlePaste(e, id);
        });
        editorEl.addEventListener('keyup', function() {
            saveSelection(id);
            updateToolbarState(id);
        });
        editorEl.addEventListener('mouseup', function() {
            saveSelection(id);
            updateToolbarState(id);
        });
        editorEl.addEventListener('focus', function() {
            setActiveEditor(id);
        });

        setActiveEditor(id);
    }

    // Публичный API
    return {
        init: init,
        initWithToolbar: initWithToolbar,
        formatText: formatText,
        getContent: getContent,
        setContent: setContent,
        clear: clear,
        getEditor: getEditor,
        destroy: destroy,
        updateToolbarState: updateToolbarState,
        getToolbarHTML: getToolbarHTML,
        getEditorHTML: getEditorHTML,
        isFormatApplied: isFormatApplied,
        saveSelection: saveSelection,
        restoreSelection: restoreSelection,
        toggleSourceMode: toggleSourceMode,
        showLinkModal: showLinkModal,
        hideLinkModal: hideLinkModal
    };
})();

// Экспорт
window.AdminWYSIWYG = AdminWYSIWYG;
