/**
 * Admin Image Upload Module
 * Загрузка и обработка изображений
 */

var AdminImageUpload = (function() {
    'use strict';

    var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    /**
     * Валидация файла
     */
    function validateFile(file) {
        if (!file) {
            return { valid: false, error: 'Файл не выбран' };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return { valid: false, error: 'Недопустимый формат. Разрешены: JPG, PNG, GIF, WebP' };
        }

        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: 'Файл слишком большой. Максимум 10MB' };
        }

        return { valid: true };
    }

    /**
     * Преобразовать файл в base64
     */
    function fileToBase64(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function() {
                resolve(reader.result);
            };
            reader.onerror = function() {
                reject(new Error('Ошибка чтения файла'));
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Загрузить файл на сервер
     */
    async function uploadFile(file) {
        // Валидация
        var validation = validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Преобразование в base64
        var base64 = await fileToBase64(file);

        // Загрузка на сервер
        var result = await AdminAPI.upload(base64);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.error || 'Ошибка загрузки');
        }
    }

    /**
     * Удалить файл с сервера
     */
    async function deleteFile(url) {
        if (!url) return;

        // Извлекаем имя файла из URL
        var filename = url.split('/').pop();
        if (!filename) return;

        try {
            await AdminAPI.deleteFile(filename);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    /**
     * Инициализация поля загрузки изображения
     */
    function initUploadField(inputId, previewId, options) {
        options = options || {};
        var input = document.getElementById(inputId);
        var preview = document.getElementById(previewId);

        if (!input) return;

        input.addEventListener('change', async function(e) {
            var file = e.target.files[0];
            if (!file) return;

            // Валидация
            var validation = validateFile(file);
            if (!validation.valid) {
                if (typeof showToast === 'function') {
                    showToast(validation.error, 'error');
                }
                input.value = '';
                return;
            }

            // Показать превью локально
            if (preview) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    if (preview.tagName === 'IMG') {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    } else {
                        preview.style.backgroundImage = 'url(' + e.target.result + ')';
                    }
                };
                reader.readAsDataURL(file);
            }

            // Callback
            if (typeof options.onChange === 'function') {
                options.onChange(file);
            }
        });
    }

    /**
     * Создать кнопку удаления для изображения
     */
    function createRemoveButton(container, onRemove) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-icon danger image-remove-btn';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        btn.title = 'Удалить изображение';

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof onRemove === 'function') {
                onRemove();
            }
        });

        container.appendChild(btn);
        return btn;
    }

    // Публичный API
    return {
        validateFile: validateFile,
        fileToBase64: fileToBase64,
        uploadFile: uploadFile,
        deleteFile: deleteFile,
        initUploadField: initUploadField,
        createRemoveButton: createRemoveButton,
        MAX_FILE_SIZE: MAX_FILE_SIZE,
        ALLOWED_TYPES: ALLOWED_TYPES
    };
})();

// Экспорт
window.AdminImageUpload = AdminImageUpload;
