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

    // Текущая активная секция (для обновления URL)
    let currentSection = null;

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

    // Обработка хэша URL (например, #podology)
    function trackHashSection() {
        const hash = window.location.hash.slice(1); // убираем #
        if (hash && SECTION_NAMES[hash]) {
            trackSectionView(hash);
        }
    }

    // Обновление URL при скролле (без добавления в историю)
    function updateUrlHash(sectionId) {
        if (currentSection === sectionId) return;
        currentSection = sectionId;

        // Для hero убираем хэш, для остальных - добавляем
        const newHash = sectionId === 'hero' ? '' : '#' + sectionId;
        const newUrl = window.location.pathname + window.location.search + newHash;

        // replaceState не добавляет запись в историю
        history.replaceState(null, '', newUrl);
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

        // Храним видимость каждой секции
        const visibleSections = new Map();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionId = entry.target.id;
                if (!SECTION_NAMES[sectionId]) return;

                if (entry.isIntersecting) {
                    visibleSections.set(sectionId, entry.intersectionRatio);

                    // Отслеживаем для аналитики
                    if (entry.intersectionRatio >= 0.3) {
                        trackSectionView(sectionId);
                    }
                } else {
                    visibleSections.delete(sectionId);
                }
            });

            // Определяем самую видимую секцию и обновляем URL
            let maxRatio = 0;
            let topSection = null;

            visibleSections.forEach((ratio, id) => {
                if (ratio > maxRatio) {
                    maxRatio = ratio;
                    topSection = id;
                }
            });

            if (topSection && maxRatio >= 0.3) {
                updateUrlHash(topSection);
            }
        }, {
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
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

        // Отслеживаем начальный хэш
        trackHashSection();

        // Слушаем изменения хэша (навигация по якорям)
        window.addEventListener('hashchange', trackHashSection);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
