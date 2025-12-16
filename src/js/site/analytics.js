/**
 * Say's Barbers - Analytics
 * Счётчик посещений и просмотров секций
 */

(function() {
    'use strict';

    // Не отслеживаем админку
    if (window.location.pathname.includes('admin')) {
        return;
    }

    const API_URL = '/api/stats/visit';
    const SESSION_KEY = 'says_session_id';

    // Названия секций
    const SECTION_NAMES = {
        'hero': 'Главный экран',
        'services': 'Услуги',
        'podology': 'Подология',
        'masters': 'Мастера',
        'quality': 'О нас',
        'location': 'Локация',
        'social': 'Соцсети',
        'blog': 'Блог',
        'faq': 'FAQ',
        'booking': 'Запись'
    };

    // Отслеженные секции для текущей сессии
    const viewedSections = new Set();

    // Генерируем или получаем session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            sessionStorage.setItem(SESSION_KEY, sessionId);
        }
        return sessionId;
    }

    // Записываем посещение страницы
    function trackPageVisit() {
        sendData({
            type: 'pageview',
            page: window.location.pathname,
            session_id: getSessionId()
        });
    }

    // Записываем просмотр секции
    function trackSectionView(sectionId) {
        if (viewedSections.has(sectionId)) return;
        viewedSections.add(sectionId);

        sendData({
            type: 'section',
            section: sectionId,
            session_id: getSessionId()
        });
    }

    // Отправка данных
    function sendData(data) {
        data.timestamp = new Date().toISOString();

        if (navigator.sendBeacon) {
            navigator.sendBeacon(API_URL, JSON.stringify(data));
        } else {
            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(() => {});
        }
    }

    // Инициализация отслеживания секций
    function initSectionTracking() {
        const sections = document.querySelectorAll('section[id]');
        if (sections.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                    const sectionId = entry.target.id;
                    if (SECTION_NAMES[sectionId]) {
                        trackSectionView(sectionId);
                    }
                }
            });
        }, {
            threshold: 0.3
        });

        sections.forEach(section => {
            if (SECTION_NAMES[section.id]) {
                observer.observe(section);
            }
        });
    }

    // Инициализация
    function init() {
        trackPageVisit();
        initSectionTracking();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
