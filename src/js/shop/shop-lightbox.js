/**
 * Shop Lightbox Module
 * Галерея изображений
 * @module ShopLightbox
 */
var ShopLightbox = (function() {
    'use strict';

    /**
     * Открыть лайтбокс
     * @param {Array} images - Массив URL изображений
     * @param {number} startIndex - Начальный индекс
     */
    function openLightbox(images, startIndex) {
        var elements = ShopState.getElements();

        ShopState.setLightboxImages(images);
        ShopState.setLightboxIndex(startIndex || 0);
        updateLightboxImage();

        if (elements.lightbox) {
            elements.lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Закрыть лайтбокс
     */
    function closeLightbox() {
        var elements = ShopState.getElements();

        if (elements.lightbox) {
            elements.lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Предыдущее изображение
     */
    function prevImage() {
        var images = ShopState.getLightboxImages();
        if (images.length === 0) return;

        var currentIndex = ShopState.getLightboxIndex();
        var newIndex = (currentIndex - 1 + images.length) % images.length;
        ShopState.setLightboxIndex(newIndex);
        updateLightboxImage();
    }

    /**
     * Следующее изображение
     */
    function nextImage() {
        var images = ShopState.getLightboxImages();
        if (images.length === 0) return;

        var currentIndex = ShopState.getLightboxIndex();
        var newIndex = (currentIndex + 1) % images.length;
        ShopState.setLightboxIndex(newIndex);
        updateLightboxImage();
    }

    /**
     * Обновить изображение в лайтбоксе
     */
    function updateLightboxImage() {
        var elements = ShopState.getElements();
        var images = ShopState.getLightboxImages();
        var index = ShopState.getLightboxIndex();

        if (elements.lightboxImage && images[index]) {
            elements.lightboxImage.src = images[index];
        }
    }

    /**
     * Установить изображение в галерее
     * @param {string} url - URL изображения
     * @param {HTMLElement} thumb - Элемент превью
     */
    function setGalleryImage(url, thumb) {
        var mainImg = document.getElementById('galleryMainImage');
        if (mainImg) mainImg.src = url;

        var thumbs = document.querySelectorAll('.gallery-thumb');
        for (var i = 0; i < thumbs.length; i++) {
            thumbs[i].classList.remove('active');
        }
        if (thumb) thumb.classList.add('active');
    }

    return {
        openLightbox: openLightbox,
        closeLightbox: closeLightbox,
        prevImage: prevImage,
        nextImage: nextImage,
        updateLightboxImage: updateLightboxImage,
        setGalleryImage: setGalleryImage
    };
})();
