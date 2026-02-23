/**
 * Cookie Banner
 *
 * Показывает баннер с уведомлением о cookies.
 * При принятии — сохраняет согласие в localStorage и загружает analytics.js.
 */

(function () {
    'use strict';

    var CONSENT_KEY = 'cookie_consent';
    var banner = null;
    var acceptBtn = null;

    function hideBanner() {
        if (banner) {
            banner.style.display = 'none';
        }
    }

    function acceptCookies() {
        try {
            localStorage.setItem(CONSENT_KEY, '1');
        } catch (e) {
            // localStorage может быть недоступен
        }
        hideBanner();
        loadAnalytics();
    }

    function loadAnalytics() {
        // Загружаем analytics.js динамически после согласия
        var script = document.createElement('script');
        script.src = '/src/js/site/analytics.js?v=1.0';
        document.body.appendChild(script);
    }

    function hasConsent() {
        try {
            return localStorage.getItem(CONSENT_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function init() {
        // Если согласие уже дано — просто загружаем аналитику
        if (hasConsent()) {
            loadAnalytics();
            return;
        }

        // Показываем баннер
        banner = document.getElementById('cookieBanner');
        acceptBtn = document.getElementById('cookieAcceptBtn');

        if (banner) {
            banner.style.display = '';
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', acceptCookies);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
