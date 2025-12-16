/**
 * Admin WYSIWYG Editor Module
 * Современный редактор для статей с использованием Selection API
 * Заменяет deprecated document.execCommand на Selection/Range API
 */

var AdminWYSIWYG = (function() {
    'use strict';

    var editor = null;
    var toolbar = null;

    // =================================================================
    // SELECTION HELPERS
    // =================================================================

    /**
     * Получить текущее выделение
     */
    function getSelection() {
        return window.getSelection();
    }

    /**
     * Сохранить текущее выделение
     */
    function saveSelection() {
        var sel = getSelection();
        if (sel.rangeCount > 0) {
            return sel.getRangeAt(0).cloneRange();
        }
        return null;
    }

    /**
     * Восстановить выделение
     */
    function restoreSelection(range) {
        if (range) {
            var sel = getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    /**
     * Проверить, находится ли выделение внутри редактора
     */
    function isSelectionInEditor() {
        if (!editor) return false;
        var sel = getSelection();
        if (!sel.rangeCount) return false;

        var range = sel.getRangeAt(0);
        return editor.contains(range.commonAncestorContainer);
    }

    // =================================================================
    // FORMATTING WITH SELECTION API
    // =================================================================

    /**
     * Обернуть выделенный текст в тег
     */
    function wrapSelection(tagName, attributes) {
        var sel = getSelection();
        if (!sel.rangeCount || !isSelectionInEditor()) return false;

        var range = sel.getRangeAt(0);

        // Если ничего не выделено, не делаем ничего
        if (range.collapsed) return false;

        // Создаём элемент-обёртку
        var wrapper = document.createElement(tagName);
        if (attributes) {
            for (var attr in attributes) {
                if (attributes.hasOwnProperty(attr)) {
                    wrapper.setAttribute(attr, attributes[attr]);
                }
            }
        }

        try {
            // Извлекаем содержимое и оборачиваем
            var content = range.extractContents();
            wrapper.appendChild(content);
            range.insertNode(wrapper);

            // Выделяем вставленный элемент
            range.selectNodeContents(wrapper);
            sel.removeAllRanges();
            sel.addRange(range);

            return true;
        } catch (e) {
            console.warn('wrapSelection failed:', e);
            return false;
        }
    }

    /**
     * Удалить форматирование с тегом
     */
    function unwrapSelection(tagName) {
        var sel = getSelection();
        if (!sel.rangeCount || !isSelectionInEditor()) return false;

        var range = sel.getRangeAt(0);
        var container = range.commonAncestorContainer;

        // Находим родительский элемент с нужным тегом
        var parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;

        while (parent && parent !== editor) {
            if (parent.tagName && parent.tagName.toLowerCase() === tagName.toLowerCase()) {
                // Разворачиваем элемент
                var fragment = document.createDocumentFragment();
                while (parent.firstChild) {
                    fragment.appendChild(parent.firstChild);
                }
                parent.parentNode.replaceChild(fragment, parent);
                return true;
            }
            parent = parent.parentNode;
        }

        return false;
    }

    /**
     * Проверить, применён ли стиль к выделению
     */
    function isFormatApplied(tagName) {
        var sel = getSelection();
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
     * Переключить форматирование (toggle)
     */
    function toggleFormat(tagName, attributes) {
        if (isFormatApplied(tagName)) {
            unwrapSelection(tagName);
        } else {
            wrapSelection(tagName, attributes);
        }
    }

    // =================================================================
    // BLOCK FORMATTING
    // =================================================================

    /**
     * Применить блочное форматирование
     */
    function formatBlock(tagName) {
        var sel = getSelection();
        if (!sel.rangeCount || !isSelectionInEditor()) return;

        var range = sel.getRangeAt(0);
        var container = range.commonAncestorContainer;

        // Находим блочный родительский элемент
        var blockParent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;

        while (blockParent && blockParent !== editor) {
            var display = window.getComputedStyle(blockParent).display;
            if (display === 'block' || display === 'list-item') {
                break;
            }
            blockParent = blockParent.parentNode;
        }

        if (blockParent && blockParent !== editor) {
            // Создаём новый блочный элемент
            var newBlock = document.createElement(tagName);
            newBlock.innerHTML = blockParent.innerHTML;
            blockParent.parentNode.replaceChild(newBlock, blockParent);

            // Восстанавливаем курсор
            range.selectNodeContents(newBlock);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    // =================================================================
    // LIST FORMATTING
    // =================================================================

    /**
     * Создать или удалить список
     */
    function toggleList(listType) {
        var sel = getSelection();
        if (!sel.rangeCount || !isSelectionInEditor()) return;

        var range = sel.getRangeAt(0);
        var container = range.commonAncestorContainer;

        // Проверяем, находимся ли уже в списке
        var listParent = container;
        while (listParent && listParent !== editor) {
            if (listParent.tagName === 'UL' || listParent.tagName === 'OL') {
                // Удаляем список
                unwrapList(listParent);
                return;
            }
            listParent = listParent.parentNode;
        }

        // Создаём новый список
        createList(listType);
    }

    /**
     * Создать список из выделенного текста
     */
    function createList(listType) {
        var sel = getSelection();
        if (!sel.rangeCount) return;

        var range = sel.getRangeAt(0);
        var content = range.extractContents();

        // Создаём список
        var list = document.createElement(listType);
        var li = document.createElement('li');

        // Если есть текст, добавляем его
        if (content.textContent.trim()) {
            // Разбиваем по строкам
            var text = content.textContent;
            var lines = text.split('\n').filter(function(line) {
                return line.trim();
            });

            if (lines.length > 1) {
                lines.forEach(function(line) {
                    var item = document.createElement('li');
                    item.textContent = line.trim();
                    list.appendChild(item);
                });
            } else {
                li.appendChild(content);
                list.appendChild(li);
            }
        } else {
            li.innerHTML = '<br>';
            list.appendChild(li);
        }

        range.insertNode(list);

        // Ставим курсор в первый элемент
        var firstLi = list.querySelector('li');
        if (firstLi) {
            range.selectNodeContents(firstLi);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    /**
     * Удалить список
     */
    function unwrapList(listElement) {
        var fragment = document.createDocumentFragment();
        var items = listElement.querySelectorAll('li');

        items.forEach(function(li, index) {
            var p = document.createElement('p');
            p.innerHTML = li.innerHTML;
            fragment.appendChild(p);
        });

        listElement.parentNode.replaceChild(fragment, listElement);
    }

    // =================================================================
    // LINK HANDLING
    // =================================================================

    /**
     * Вставить ссылку
     */
    function insertLink() {
        var url = prompt('Введите URL ссылки:', 'https://');
        if (!url) return;

        var sel = getSelection();
        if (!sel.rangeCount || !isSelectionInEditor()) return;

        var range = sel.getRangeAt(0);

        if (range.collapsed) {
            // Нет выделения - создаём ссылку с URL как текстом
            var link = document.createElement('a');
            link.href = url;
            link.textContent = url;
            range.insertNode(link);
        } else {
            // Оборачиваем выделенный текст
            wrapSelection('a', { href: url });
        }
    }

    /**
     * Удалить ссылку
     */
    function removeLink() {
        unwrapSelection('a');
    }

    // =================================================================
    // MAIN FORMAT FUNCTION
    // =================================================================

    /**
     * Форматирование выделенного текста
     * Заменяет deprecated document.execCommand
     */
    function formatText(command, value) {
        if (!editor) return;

        // Фокусируем редактор
        editor.focus();

        switch (command) {
            // Инлайн форматирование
            case 'bold':
                toggleFormat('strong');
                break;
            case 'italic':
                toggleFormat('em');
                break;
            case 'underline':
                toggleFormat('u');
                break;
            case 'strikeThrough':
                toggleFormat('s');
                break;

            // Блочное форматирование
            case 'h2':
            case 'formatBlock':
                formatBlock(value || 'h2');
                break;
            case 'h3':
                formatBlock('h3');
                break;
            case 'quote':
                formatBlock('blockquote');
                break;

            // Списки
            case 'ul':
            case 'insertUnorderedList':
                toggleList('ul');
                break;
            case 'ol':
            case 'insertOrderedList':
                toggleList('ol');
                break;

            // Ссылки
            case 'link':
            case 'createLink':
                insertLink();
                break;
            case 'unlink':
                removeLink();
                break;

            // Очистка форматирования
            case 'removeFormat':
                removeAllFormatting();
                break;

            // Fallback на execCommand для неподдерживаемых команд
            default:
                try {
                    document.execCommand(command, false, value || null);
                } catch (e) {
                    console.warn('Unsupported command:', command);
                }
        }

        // Обновляем состояние тулбара
        updateToolbarState();
    }

    /**
     * Удалить всё форматирование
     */
    function removeAllFormatting() {
        var sel = getSelection();
        if (!sel.rangeCount || !isSelectionInEditor()) return;

        var range = sel.getRangeAt(0);
        var text = range.toString();

        if (text) {
            range.deleteContents();
            var textNode = document.createTextNode(text);
            range.insertNode(textNode);

            range.selectNodeContents(textNode);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

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
        if (isFormatApplied('strong') || isFormatApplied('b')) {
            var boldBtn = toolbar.querySelector('[data-command="bold"]');
            if (boldBtn) boldBtn.classList.add('active');
        }
        if (isFormatApplied('em') || isFormatApplied('i')) {
            var italicBtn = toolbar.querySelector('[data-command="italic"]');
            if (italicBtn) italicBtn.classList.add('active');
        }
        if (isFormatApplied('u')) {
            var underlineBtn = toolbar.querySelector('[data-command="underline"]');
            if (underlineBtn) underlineBtn.classList.add('active');
        }
    }

    // =================================================================
    // INITIALIZATION
    // =================================================================

    /**
     * Инициализация редактора
     */
    function init(editorId, toolbarId) {
        editor = typeof editorId === 'string' ? document.getElementById(editorId) : editorId;
        toolbar = typeof toolbarId === 'string' ? document.getElementById(toolbarId) : toolbarId;

        if (!editor) {
            console.error('WYSIWYG editor not found:', editorId);
            return;
        }

        // Делаем редактор редактируемым
        editor.setAttribute('contenteditable', 'true');

        // Инициализация кнопок тулбара
        if (toolbar) {
            initToolbar();
        }

        // Обработчики событий
        editor.addEventListener('paste', handlePaste);
        editor.addEventListener('keyup', updateToolbarState);
        editor.addEventListener('mouseup', updateToolbarState);
    }

    /**
     * Инициализация тулбара
     */
    function initToolbar() {
        var buttons = toolbar.querySelectorAll('[data-command]');
        buttons.forEach(function(btn) {
            btn.addEventListener('mousedown', function(e) {
                e.preventDefault(); // Предотвращаем потерю фокуса
            });

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var command = this.getAttribute('data-command');
                var value = this.getAttribute('data-value');

                formatText(command, value);

                // Фокус обратно на редактор
                editor.focus();
            });
        });
    }

    /**
     * Обработка вставки - очистка форматирования
     */
    function handlePaste(e) {
        e.preventDefault();

        var text = '';
        if (e.clipboardData || window.clipboardData) {
            // Пытаемся получить HTML
            var html = (e.clipboardData || window.clipboardData).getData('text/html');
            if (html && typeof DOMPurify !== 'undefined') {
                // Очищаем HTML через DOMPurify
                text = DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote'],
                    ALLOWED_ATTR: ['href']
                });
            } else {
                // Fallback - только текст
                text = (e.clipboardData || window.clipboardData).getData('text/plain');
                // Заменяем переносы строк на <br>
                text = text.replace(/\n/g, '<br>');
            }
        }

        // Вставляем очищенный контент
        var sel = getSelection();
        if (sel.rangeCount) {
            var range = sel.getRangeAt(0);
            range.deleteContents();

            var fragment = document.createRange().createContextualFragment(text);
            range.insertNode(fragment);

            // Перемещаем курсор в конец
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    /**
     * Получить HTML контент редактора
     */
    function getContent() {
        if (!editor) return '';

        var content = editor.innerHTML;

        // Очищаем через DOMPurify если доступен
        if (typeof DOMPurify !== 'undefined') {
            content = DOMPurify.sanitize(content);
        }

        return content;
    }

    /**
     * Установить HTML контент редактора
     */
    function setContent(html) {
        if (!editor) return;

        // Очищаем через DOMPurify если доступен
        if (typeof DOMPurify !== 'undefined') {
            html = DOMPurify.sanitize(html);
        }

        editor.innerHTML = html || '';
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

    // Публичный API
    return {
        init: init,
        formatText: formatText,
        insertLink: insertLink,
        removeLink: removeLink,
        getContent: getContent,
        setContent: setContent,
        clear: clear,
        getEditor: getEditor,
        updateToolbarState: updateToolbarState,
        // Для тестирования
        isFormatApplied: isFormatApplied,
        saveSelection: saveSelection,
        restoreSelection: restoreSelection
    };
})();

// Экспорт
window.AdminWYSIWYG = AdminWYSIWYG;
