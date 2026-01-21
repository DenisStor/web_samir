/**
 * Admin Image Handler Module
 * Обработка загрузки и удаления изображений
 */

var AdminImageHandler = (function() {
    'use strict';

    /**
     * Обработка загрузки изображения
     * @param {Event} event - Событие change от input[type="file"]
     * @param {string} inputId - ID hidden input для сохранения URL
     */
    async function handleUpload(event, inputId) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        // Валидация типа файла
        if (!file.type.startsWith('image/')) {
            showToast('Пожалуйста, выберите изображение', 'error');
            return;
        }

        // Валидация размера (5 МБ)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Файл слишком большой (максимум 5 МБ)', 'error');
            return;
        }

        showToast('Загрузка изображения...', 'success');

        try {
            var result = await AdminImageUpload.uploadFile(file);

            if (result.success) {
                updateImagePreview(event.target, inputId, result.url);
                showToast('Изображение загружено', 'success');
            } else {
                showToast('Ошибка загрузки: ' + (result.error || 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Ошибка загрузки изображения', 'error');
        }
    }

    /**
     * Обновление превью изображения после загрузки
     * @param {HTMLElement} fileInput - Input элемент файла
     * @param {string} inputId - ID hidden input
     * @param {string} url - URL загруженного изображения
     */
    function updateImagePreview(fileInput, inputId, url) {
        var input = document.getElementById(inputId);
        if (input) {
            input.value = url;
        }

        var uploadDiv = fileInput.closest('.image-upload');
        if (uploadDiv) {
            uploadDiv.classList.add('has-image');

            // Создаем или обновляем img
            var img = uploadDiv.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                uploadDiv.appendChild(img);
            }
            img.src = url;
            img.alt = 'Загруженное изображение';

            // Создаем кнопку удаления если нет
            if (!uploadDiv.querySelector('.remove-image')) {
                var removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'remove-image';
                removeBtn.setAttribute('data-action', 'remove-image');
                removeBtn.setAttribute('data-target', inputId);
                removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                uploadDiv.appendChild(removeBtn);
            }
        }
    }

    /**
     * Удаление изображения
     * @param {string} inputId - ID hidden input
     */
    function removeImage(inputId) {
        var input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }

        // Находим контейнер загрузки
        var uploadDiv = document.getElementById(inputId + 'Upload');
        if (!uploadDiv && input) {
            uploadDiv = input.closest('.form-group').querySelector('.image-upload');
        }

        if (uploadDiv) {
            uploadDiv.classList.remove('has-image');
            var img = uploadDiv.querySelector('img');
            if (img) img.remove();
            var removeBtn = uploadDiv.querySelector('.remove-image');
            if (removeBtn) removeBtn.remove();
        }
    }

    // Публичный API
    return {
        handleUpload: handleUpload,
        removeImage: removeImage
    };
})();

// Экспорт
window.AdminImageHandler = AdminImageHandler;
