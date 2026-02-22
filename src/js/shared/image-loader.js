/**
 * Image Loader
 * Плавная загрузка изображений с поддержкой prefers-reduced-motion
 */
(function () {
    'use strict';

    var prefersReducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setupImage(img) {
        if (!img || img.dataset.loadSetup) return;
        img.dataset.loadSetup = 'true';

        if (prefersReducedMotion || (img.complete && img.naturalHeight !== 0)) {
            img.classList.add('loaded');
            return;
        }

        img.addEventListener('load', function () {
            img.classList.add('loaded');
        });

        img.addEventListener('error', function () {
            img.classList.add('loaded');
        });
    }

    function initAll() {
        var images = document.querySelectorAll('img[data-smooth-load]');
        for (var i = 0; i < images.length; i++) {
            setupImage(images[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    // Экспортируем функцию для динамически добавленных изображений
    window.SharedHelpers = window.SharedHelpers || {};
    window.SharedHelpers.setupImage = setupImage;
})();
