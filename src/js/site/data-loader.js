/**
 * Say's Barbers - Data Loader
 * Загружает данные из API и обновляет контент на главной странице
 */

(function() {
    'use strict';

    // Проверяем, что мы на главной странице, а не в админке
    if (window.location.pathname.includes('admin')) {
        return;
    }

    var API_BASE = '/api';

    // =================================================================
    // SANITIZATION
    // =================================================================

    /**
     * Санитизация HTML для защиты от XSS
     * Использует DOMPurify если доступен, иначе экранирует опасные символы
     */
    function sanitizeHTML(html) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div'],
                ALLOWED_ATTR: ['href', 'target', 'class', 'style'],
                ALLOW_DATA_ATTR: false
            });
        }
        // Fallback: удаляем опасные теги, но сохраняем безопасные
        var safe = html;
        // Удаляем script, style, iframe, object, embed
        safe = safe.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        safe = safe.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        safe = safe.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
        safe = safe.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
        safe = safe.replace(/<embed[^>]*\/?>/gi, '');
        // Удаляем on* атрибуты (onclick, onerror, etc.)
        safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
        safe = safe.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
        // Удаляем javascript: в href/src
        safe = safe.replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, '$1=""');
        return safe;
    }

    // Используем глобальные функции из SharedHelpers (helpers.js)
    // escapeHtml, escapeAttr, debounce - доступны глобально

    // Алиас для совместимости с текущим кодом
    var escapeHTML = window.escapeHtml;

    // =================================================================
    // ICONS
    // =================================================================

    var icons = {
        check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        arrow: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
        scissors: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>',
        image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
    };

    // =================================================================
    // TEMPLATES
    // =================================================================

    function createMasterCard(master) {
        var badgeClassMap = {
            green: 'badge-green',
            pink: 'badge-pink',
            blue: 'badge-blue'
        };
        var badgeClass = badgeClassMap[master.badge] || 'badge-green';

        var badgeLabelMap = {
            green: 'Green',
            pink: 'Pink',
            blue: 'Dark Blue'
        };
        var badgeLabel = badgeLabelMap[master.badge] || 'Green';

        // First 2 principles shown, rest in expandable section
        var firstPrinciples = (master.principles || []).slice(0, 2);
        var extraPrinciples = (master.principles || []).slice(2);

        // Sanitize user data
        var safeName = escapeHTML(master.name);
        var safeRole = escapeHTML(master.role || 'Мастер');
        var safeSpec = escapeHTML(master.specialization || '');
        var safePhoto = escapeAttr(master.photo);
        var safeInitial = escapeHTML(master.initial || master.name.charAt(0));

        var imageHtml = master.photo
            ? '<img src="' + safePhoto + '" alt="' + escapeAttr(master.name) + '" class="master-photo" loading="lazy" decoding="async">'
            : '<div class="master-avatar">' + safeInitial + '</div>';

        var principlesHtml = firstPrinciples.map(function(p) {
            return '<div class="master-principle">' + icons.check + '<span>' + escapeHTML(p) + '</span></div>';
        }).join('');

        var extraHtml = '';
        if (extraPrinciples.length > 0) {
            extraHtml = '<div class="master-extra">' +
                extraPrinciples.map(function(p) {
                    return '<div class="master-principle">' + icons.check + '<span>' + escapeHTML(p) + '</span></div>';
                }).join('') +
            '</div>';
        }

        return '<div class="master-card fade-in visible">' +
            '<div class="master-image">' + imageHtml +
                '<span class="master-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
            '</div>' +
            '<div class="master-content">' +
                '<h3 class="master-name">' + safeName + '</h3>' +
                '<div class="master-role">' + safeRole + '</div>' +
                '<p class="master-specialization">' + safeSpec + '</p>' +
                '<div class="master-principles">' + principlesHtml + extraHtml + '</div>' +
            '</div>' +
        '</div>';
    }

    function createServiceItem(service) {
        var safeName = escapeHTML(service.name);
        var priceGreen = parseInt(service.priceGreen, 10) || 0;
        var pricePink = parseInt(service.pricePink, 10) || 0;
        var priceBlue = parseInt(service.priceBlue, 10) || 0;

        return '<div class="service-item">' +
            '<div><div class="service-name">' + safeName + '</div></div>' +
            '<div class="service-prices">' +
                '<span class="price-tag price-green">' + priceGreen + ' ₽</span>' +
                '<span class="price-tag price-pink">' + pricePink + ' ₽</span>' +
                '<span class="price-tag price-blue">' + priceBlue + ' ₽</span>' +
            '</div>' +
        '</div>';
    }

    function createPodologyServiceItem(service) {
        var safeName = escapeHTML(service.name);
        var safePrice = escapeHTML(service.price);

        return '<div class="podology-service-item">' +
            '<div class="podology-service-info">' +
                '<div class="podology-service-name">' + safeName + '</div>' +
            '</div>' +
            '<div class="podology-service-price">' + safePrice + '</div>' +
        '</div>';
    }

    function createBlogCard(article) {
        var formattedDate = formatDate(article.date);
        var safeId = escapeAttr(article.id);
        var safeTitle = escapeHTML(article.title);
        var safeTag = escapeHTML(article.tag || 'Статья');
        var safeExcerpt = escapeHTML(article.excerpt || '');
        var safeImage = escapeAttr(article.image);

        var imageHtml = article.image
            ? '<img src="' + safeImage + '" alt="' + escapeAttr(article.title) + '" loading="lazy" decoding="async">'
            : icons.scissors;

        return '<article class="blog-card fade-in visible" onclick="openBlogModal(\'' + safeId + '\')">' +
            '<div class="blog-image">' + imageHtml + '</div>' +
            '<div class="blog-content">' +
                '<div class="blog-meta">' +
                    '<span class="blog-tag">' + safeTag + '</span>' +
                    '<div class="blog-date">' + icons.calendar + formattedDate + '</div>' +
                '</div>' +
                '<h3 class="blog-title">' + safeTitle + '</h3>' +
                '<p class="blog-excerpt">' + safeExcerpt + '</p>' +
                '<div class="blog-read-more">' +
                    '<span>Читать далее</span>' + icons.arrow +
                '</div>' +
            '</div>' +
        '</article>';
    }

    // formatDate определён в utils.js и доступен глобально

    // =================================================================
    // DATA LOADING
    // =================================================================

    async function loadMasters() {
        try {
            var response = await fetch(API_BASE + '/masters');
            if (!response.ok) return;

            var data = await response.json();

            // Если есть данные из API (даже пустой массив), используем их
            if (data.masters !== undefined) {
                var mastersGrid = document.querySelector('.masters-grid');
                if (mastersGrid) {
                    var activeMasters = (data.masters || []).filter(function(m) { return m.active !== false; });
                    if (activeMasters.length > 0) {
                        mastersGrid.innerHTML = activeMasters.map(createMasterCard).join('');
                    } else {
                        // Пустой массив - скрываем секцию или показываем заглушку
                        mastersGrid.innerHTML = '<p class="empty-message" style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">Информация о мастерах скоро появится</p>';
                    }
                }
            }
        } catch (error) {
            // Fallback to static data
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('[DataLoader] Ошибка загрузки данных:', error.message || error);
            }
        }
    }

    async function loadServices() {
        try {
            var response = await fetch(API_BASE + '/services');
            if (!response.ok) return;

            var data = await response.json();

            // Загружаем услуги барбершопа по категориям
            if (data.categories !== undefined) {
                (data.categories || []).forEach(function(category) {
                    var container = document.querySelector('[data-tab="' + category.id + '"] .service-list');
                    if (container) {
                        var services = category.services || [];
                        if (services.length > 0) {
                            container.innerHTML = services.map(createServiceItem).join('');
                        } else {
                            container.innerHTML = '<p class="empty-message" style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">Услуги скоро появятся</p>';
                        }
                    }
                });
            }

            // Загружаем услуги подологии (если есть контейнер на странице)
            if (data.podology !== undefined) {
                var podologyContainer = document.querySelector('.podology-services .podology-list');
                if (podologyContainer) {
                    var services = (data.podology && data.podology.services) || [];
                    if (services.length > 0) {
                        podologyContainer.innerHTML = services.map(createPodologyServiceItem).join('');
                    } else {
                        podologyContainer.innerHTML = '<p class="empty-message">Услуги подологии скоро появятся</p>';
                    }
                }
            }
        } catch (error) {
            // Fallback to static data
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('[DataLoader] Ошибка загрузки данных:', error.message || error);
            }
        }
    }

    var ARTICLES_PER_PAGE = 3;
    // Оптимизировано: убрано дублирование, используем только window.dynamicArticlesData
    var articlesShown = 0;
    var initTimeoutId = null;

    async function loadArticles() {
        try {
            var response = await fetch(API_BASE + '/articles');
            if (!response.ok) return;

            var data = await response.json();

            // Если есть данные из API (даже пустой массив), используем их
            if (data.articles !== undefined) {
                var blogGrid = document.querySelector('.blog-grid');
                var blogSection = document.querySelector('.blog .container');
                if (blogGrid) {
                    // Оптимизировано: используем только window.dynamicArticlesData
                    window.dynamicArticlesData = (data.articles || []).filter(function(a) { return a.active !== false; });
                    // Сортируем по дате (новые первые)
                    window.dynamicArticlesData.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

                    if (window.dynamicArticlesData.length > 0) {
                        // Показываем только первые 3 статьи
                        var articlesToShow = window.dynamicArticlesData.slice(0, ARTICLES_PER_PAGE);
                        blogGrid.innerHTML = articlesToShow.map(createBlogCard).join('');
                        articlesShown = articlesToShow.length;

                        // Добавляем кнопку "Показать ещё" если статей больше 3
                        updateShowMoreButton(blogSection, blogGrid);
                    } else {
                        // Пустой массив - показываем заглушку
                        blogGrid.innerHTML = '<p class="empty-message" style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">Статьи скоро появятся</p>';
                        window.dynamicArticlesData = [];
                        removeShowMoreButton();
                    }
                }
            }
        } catch (error) {
            // Fallback to static data
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('[DataLoader] Ошибка загрузки данных:', error.message || error);
            }
        }
    }

    function createFaqItem(item) {
        var safeQuestion = escapeHTML(item.question);
        var safeAnswer = escapeHTML(item.answer);

        return '<div class="faq-item fade-in visible">' +
            '<div class="faq-question" onclick="toggleFaq(this)" onkeydown="handleButtonKeydown(event, this)" role="button" tabindex="0" aria-expanded="false">' +
                '<h3>' + safeQuestion + '</h3>' +
                '<svg class="faq-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
            '</div>' +
            '<div class="faq-answer"><p>' + safeAnswer + '</p></div>' +
        '</div>';
    }

    async function loadFaq() {
        try {
            var response = await fetch(API_BASE + '/faq');
            if (!response.ok) return;

            var data = await response.json();

            if (data.faq !== undefined) {
                var faqContainer = document.getElementById('faqContainer');
                if (faqContainer) {
                    var faqItems = data.faq || [];
                    if (faqItems.length > 0) {
                        faqContainer.innerHTML = faqItems.map(createFaqItem).join('');
                    } else {
                        faqContainer.innerHTML = '<p class="empty-message" style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">FAQ скоро появятся</p>';
                    }
                }
            }
        } catch (error) {
            // Fallback to static data
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('[DataLoader] Ошибка загрузки данных:', error.message || error);
            }
        }
    }

    // Social icons SVG
    var socialIconsSvg = {
        vk: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.97 4 8.463c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.455 2.27 4.607 2.862 4.607.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.15-3.574 2.15-3.574.119-.254.305-.491.745-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>',
        telegram: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
        whatsapp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
        youtube: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
        instagram: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>',
        tiktok: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>'
    };

    function createSocialLink(socialItem) {
        var iconSvg = socialIconsSvg[socialItem.icon] || socialIconsSvg.vk;
        var safeUrl = escapeAttr(socialItem.url);
        var safeName = escapeAttr(socialItem.name);

        return '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" class="social-link" title="' + safeName + '">' +
            iconSvg +
        '</a>';
    }

    async function loadSocial() {
        try {
            var response = await fetch(API_BASE + '/social');
            if (!response.ok) return;

            var data = await response.json();

            if (data.social !== undefined) {
                var socialLinksContainer = document.querySelector('.social-links');
                if (socialLinksContainer) {
                    var activeSocialLinks = (data.social || []).filter(function(s) { return s.active && s.url; });
                    if (activeSocialLinks.length > 0) {
                        socialLinksContainer.innerHTML = activeSocialLinks.map(createSocialLink).join('');
                    }
                }
            }

            // Update phone if exists
            if (data.phone) {
                var phoneClean = data.phone.replace(/[^\d+]/g, '');

                // Update main phone link by ID
                var sitePhone = document.getElementById('sitePhone');
                if (sitePhone) {
                    sitePhone.href = 'tel:' + phoneClean;
                    sitePhone.textContent = data.phone;
                }

                // Update all other phone links
                var phoneLinks = document.querySelectorAll('a[href^="tel:"]:not(#sitePhone)');
                phoneLinks.forEach(function(link) {
                    link.href = 'tel:' + phoneClean;
                    link.textContent = data.phone;
                });
            }

            // Update address if exists
            if (data.address) {
                var siteAddress = document.getElementById('siteAddress');
                if (siteAddress) {
                    siteAddress.innerHTML = escapeHTML(data.address).replace(/\n/g, '<br>');
                }
            }

            // Update email links if exists
            if (data.email) {
                var emailLinks = document.querySelectorAll('a[href^="mailto:"]');
                emailLinks.forEach(function(link) {
                    link.href = 'mailto:' + data.email;
                    link.textContent = data.email;
                });
            }
        } catch (error) {
            // Fallback to static data
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('[DataLoader] Ошибка загрузки данных:', error.message || error);
            }
        }
    }

    function updateShowMoreButton(container, blogGrid) {
        // Удаляем существующую кнопку
        removeShowMoreButton();

        var articles = window.dynamicArticlesData || [];
        if (articles.length > articlesShown) {
            var remaining = articles.length - articlesShown;
            var showMoreDiv = document.createElement('div');
            showMoreDiv.className = 'blog-show-more';
            showMoreDiv.id = 'blogShowMore';
            showMoreDiv.innerHTML = '<button class="btn btn-secondary" onclick="window.showMoreArticles()">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
                'Показать ещё ' + remaining + ' ' + getArticleWord(remaining) +
            '</button>';
            container.appendChild(showMoreDiv);
        }
    }

    function removeShowMoreButton() {
        var existingBtn = document.getElementById('blogShowMore');
        if (existingBtn) existingBtn.remove();
    }

    function getArticleWord(count) {
        var lastDigit = count % 10;
        var lastTwoDigits = count % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'статей';
        if (lastDigit === 1) return 'статью';
        if (lastDigit >= 2 && lastDigit <= 4) return 'статьи';
        return 'статей';
    }

    window.showMoreArticles = function() {
        var blogGrid = document.querySelector('.blog-grid');
        var blogSection = document.querySelector('.blog .container');
        if (!blogGrid) return;

        // Показываем следующие 3 статьи
        var articles = window.dynamicArticlesData || [];
        var nextArticles = articles.slice(articlesShown, articlesShown + ARTICLES_PER_PAGE);
        nextArticles.forEach(function(article) {
            blogGrid.insertAdjacentHTML('beforeend', createBlogCard(article));
        });
        articlesShown += nextArticles.length;

        // Обновляем кнопку
        updateShowMoreButton(blogSection, blogGrid);
    };

    // =================================================================
    // BLOG MODAL OVERRIDE
    // =================================================================

    // Store original function if exists
    var originalOpenBlogModal = window.openBlogModal;

    window.openBlogModal = function(articleId) {
        // Try dynamic data first
        if (window.dynamicArticlesData) {
            var article = window.dynamicArticlesData.find(function(a) { return a.id === articleId; });
            if (article) {
                showDynamicArticleModal(article);
                return;
            }
        }

        // Fallback to original function
        if (typeof originalOpenBlogModal === 'function') {
            originalOpenBlogModal(articleId);
        }
    };

    // Store escape handler reference for cleanup
    var currentEscapeHandler = null;

    function showDynamicArticleModal(article) {
        var modal = document.getElementById('blogModal');
        if (!modal) return;

        // Update modal content
        var modalImage = modal.querySelector('.blog-modal-image');
        var modalTag = modal.querySelector('.blog-modal-tag');
        var modalDate = modal.querySelector('.blog-modal-date span, .blog-modal-date');
        var modalTitle = modal.querySelector('.blog-modal-title');
        var modalContent = modal.querySelector('.blog-modal-text, .blog-modal-body');

        // Sanitize data
        var safeImage = escapeAttr(article.image);
        var safeTitle = escapeAttr(article.title);

        if (modalImage) {
            if (article.image) {
                modalImage.innerHTML = '<img src="' + safeImage + '" alt="' + safeTitle + '" style="width:100%; height:100%; object-fit:cover;">';
            } else {
                modalImage.innerHTML = icons.scissors;
            }
        }

        if (modalTag) {
            modalTag.textContent = article.tag || 'Статья';
        }

        if (modalDate) {
            var dateText = formatDate(article.date);
            if (modalDate.querySelector('span')) {
                modalDate.querySelector('span').textContent = dateText;
            } else {
                var svg = modalDate.querySelector('svg');
                modalDate.innerHTML = (svg ? svg.outerHTML : icons.calendar) + ' ' + dateText;
            }
        }

        if (modalTitle) {
            modalTitle.textContent = article.title;
        }

        if (modalContent) {
            var content = article.content || article.excerpt || '';
            // Если контент уже содержит HTML-теги, санитизируем напрямую
            // Иначе оборачиваем в параграфы
            if (/<[a-z][\s\S]*>/i.test(content)) {
                // Контент с HTML - только санитизация
                modalContent.innerHTML = sanitizeHTML(content);
            } else {
                // Плоский текст - разбиваем на параграфы
                var paragraphs = content.split('\n\n')
                    .filter(function(p) { return p.trim(); })
                    .map(function(p) { return '<p>' + escapeHTML(p).replace(/\n/g, '<br>') + '</p>'; })
                    .join('');
                modalContent.innerHTML = sanitizeHTML(paragraphs || '<p>' + escapeHTML(article.excerpt || '') + '</p>');
            }
        }

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Remove previous escape handler if exists
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
        }

        // Handle escape key
        currentEscapeHandler = function(e) {
            if (e.key === 'Escape') {
                closeBlogModal();
            }
        };
        document.addEventListener('keydown', currentEscapeHandler);
    }

    // Override closeBlogModal to clean up escape handler
    var originalCloseBlogModal = window.closeBlogModal;
    window.closeBlogModal = function() {
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
            currentEscapeHandler = null;
        }
        if (typeof originalCloseBlogModal === 'function') {
            originalCloseBlogModal();
        } else {
            var modal = document.getElementById('blogModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    };

    // =================================================================
    // INITIALIZATION
    // =================================================================

    async function init() {
        // Load all data in parallel
        await Promise.all([
            loadMasters(),
            loadServices(),
            loadArticles(),
            loadFaq(),
            loadSocial()
        ]);

        // Re-initialize animations for dynamically loaded elements
        if (SaysApp.animations && SaysApp.animations.reinit) {
            SaysApp.animations.reinit();
        }
    }

    // Функция очистки для предотвращения утечек памяти
    function cleanup() {
        if (initTimeoutId) {
            clearTimeout(initTimeoutId);
            initTimeoutId = null;
        }
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
            currentEscapeHandler = null;
        }
        articlesShown = 0;
        window.dynamicArticlesData = null;
    }

    // Экспортируем cleanup для внешнего использования
    window.SaysDataLoader = { cleanup: cleanup };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to ensure other scripts have loaded
        initTimeoutId = setTimeout(init, 100);
    }

})();
