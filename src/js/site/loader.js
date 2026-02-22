/**
 * Page Loader
 * Прелоадер с минимальным временем показа и fallback-таймаутом
 */
(function () {
    'use strict';

    var MINIMUM_SHOW_TIME = 300;
    var startTime = Date.now();
    var loader = null;

    function hideLoader() {
        loader = loader || document.getElementById('pageLoader');
        if (!loader) return;

        var elapsed = Date.now() - startTime;
        if (elapsed < MINIMUM_SHOW_TIME) {
            loader.classList.add('instant-hide');
        } else {
            loader.classList.add('hidden');
        }

        setTimeout(function () {
            if (loader && loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 500);
    }

    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
    }

    // Fallback: скрыть лоадер через 3 секунды в любом случае
    setTimeout(hideLoader, 3000);
})();
