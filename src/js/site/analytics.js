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

    var API_URL = '/api/stats/visit';
    var SESSION_KEY = 'says_session_id';

    // Названия секций
    var SECTION_NAMES = {
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

    // Отслеженные секции для текущей сессии (используем объект вместо Set)
    var viewedSections = {};

    // Текущая активная секция (для обновления URL)
    var currentSection = null;

    // Ссылки для cleanup
    var sectionObserver = null;
    var hashChangeHandler = null;

    // Генерируем или получаем session ID
    function getSessionId() {
        var sessionId = sessionStorage.getItem(SESSION_KEY);
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
        if (viewedSections[sectionId]) return;
        viewedSections[sectionId] = true;

        sendData({
            type: 'section',
            section: sectionId,
            session_id: getSessionId()
        });
    }

    // Обработка хэша URL (например, #podology)
    function trackHashSection() {
        var hash = window.location.hash.slice(1); // убираем #
        if (hash && SECTION_NAMES[hash]) {
            trackSectionView(hash);
        }
    }

    // Обновление URL при скролле (без добавления в историю)
    function updateUrlHash(sectionId) {
        if (currentSection === sectionId) return;
        currentSection = sectionId;

        // Для hero убираем хэш, для остальных - добавляем
        var newHash = sectionId === 'hero' ? '' : '#' + sectionId;
        var newUrl = window.location.pathname + window.location.search + newHash;

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
        var sections = document.querySelectorAll('section[id]');
        if (sections.length === 0) return;

        // Очищаем предыдущий observer если есть
        if (sectionObserver) {
            sectionObserver.disconnect();
        }

        // Храним видимость каждой секции (используем объект вместо Map)
        var visibleSections = {};

        sectionObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                var sectionId = entry.target.id;
                if (!SECTION_NAMES[sectionId]) return;

                if (entry.isIntersecting) {
                    visibleSections[sectionId] = entry.intersectionRatio;

                    // Отслеживаем для аналитики
                    if (entry.intersectionRatio >= 0.3) {
                        trackSectionView(sectionId);
                    }
                } else {
                    delete visibleSections[sectionId];
                }
            });

            // Определяем самую видимую секцию и обновляем URL
            var maxRatio = 0;
            var topSection = null;

            for (var id in visibleSections) {
                if (visibleSections.hasOwnProperty(id)) {
                    var ratio = visibleSections[id];
                    if (ratio > maxRatio) {
                        maxRatio = ratio;
                        topSection = id;
                    }
                }
            }

            if (topSection && maxRatio >= 0.3) {
                updateUrlHash(topSection);
            }
        }, {
            // Уменьшено с 11 до 5 threshold для снижения нагрузки
            threshold: [0, 0.3, 0.5, 0.7, 1.0]
        });

        sections.forEach(function(section) {
            if (SECTION_NAMES[section.id]) {
                sectionObserver.observe(section);
            }
        });
    }

    // Функция очистки для предотвращения утечек памяти
    function cleanup() {
        if (sectionObserver) {
            sectionObserver.disconnect();
            sectionObserver = null;
        }
        if (hashChangeHandler) {
            window.removeEventListener('hashchange', hashChangeHandler);
            hashChangeHandler = null;
        }
        // Очищаем объект viewedSections
        for (var key in viewedSections) {
            if (viewedSections.hasOwnProperty(key)) {
                delete viewedSections[key];
            }
        }
        currentSection = null;
    }

    // Инициализация
    function init() {
        trackPageVisit();
        initSectionTracking();

        // Отслеживаем начальный хэш
        trackHashSection();

        // Сохраняем ссылку на handler для возможности cleanup
        hashChangeHandler = trackHashSection;
        window.addEventListener('hashchange', hashChangeHandler);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Экспортируем cleanup для возможности очистки
    window.SaysAnalytics = {
        cleanup: cleanup
    };

})();
