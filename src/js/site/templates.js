/**
 * Site Templates Module
 * HTML шаблоны для динамически загружаемого контента
 */

var SiteTemplates = (function () {
    'use strict';

    // Используем глобальные функции из SharedHelpers
    var escapeHTML = window.escapeHtml;
    var escapeAttr = window.SharedHelpers ? SharedHelpers.escapeAttr : window.escapeAttr;
    var formatDate = window.SharedHelpers ? SharedHelpers.formatDate : window.formatDate;

    // =================================================================
    // ICONS
    // =================================================================

    var icons = {
        check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        calendar:
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        arrow: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
        scissors:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>',
        chevronDown:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>'
    };

    // =================================================================
    // TEMPLATES
    // =================================================================

    /**
     * Создать карточку мастера
     * @param {Object} master - Данные мастера
     * @returns {string} HTML карточки
     */
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
            ? '<img src="' +
              safePhoto +
              '" alt="' +
              escapeAttr(master.name) +
              '" class="master-photo" width="400" height="400" loading="lazy" decoding="async" data-smooth-load>'
            : '<div class="master-avatar">' + safeInitial + '</div>';

        var principlesHtml = firstPrinciples
            .map(function (p) {
                return (
                    '<div class="master-principle">' +
                    icons.check +
                    '<span>' +
                    escapeHTML(p) +
                    '</span></div>'
                );
            })
            .join('');

        var extraHtml = '';
        if (extraPrinciples.length > 0) {
            extraHtml =
                '<div class="master-extra"><div class="master-extra-inner">' +
                extraPrinciples
                    .map(function (p) {
                        return (
                            '<div class="master-principle">' +
                            icons.check +
                            '<span>' +
                            escapeHTML(p) +
                            '</span></div>'
                        );
                    })
                    .join('') +
                '</div></div>';
        }

        return (
            '<div class="master-card fade-in stagger-item">' +
            '<div class="master-image image-wrapper">' +
            imageHtml +
            '<span class="master-badge ' +
            badgeClass +
            '">' +
            badgeLabel +
            '</span>' +
            '</div>' +
            '<div class="master-content">' +
            '<h3 class="master-name">' +
            safeName +
            '</h3>' +
            '<div class="master-role">' +
            safeRole +
            '</div>' +
            '<p class="master-specialization">' +
            safeSpec +
            '</p>' +
            '<div class="master-principles">' +
            principlesHtml +
            extraHtml +
            '</div>' +
            '</div>' +
            '</div>'
        );
    }

    /**
     * Создать элемент услуги
     * @param {Object} service - Данные услуги
     * @returns {string} HTML элемента
     */
    function createServiceItem(service) {
        var safeName = escapeHTML(service.name);
        var priceGreen = parseInt(service.priceGreen, 10) || 0;
        var pricePink = parseInt(service.pricePink, 10) || 0;
        var priceBlue = parseInt(service.priceBlue, 10) || 0;

        return (
            '<div class="service-item">' +
            '<div><div class="service-name">' +
            safeName +
            '</div></div>' +
            '<div class="service-prices">' +
            '<span class="price-tag price-green">' +
            priceGreen +
            ' ₽</span>' +
            '<span class="price-tag price-pink">' +
            pricePink +
            ' ₽</span>' +
            '<span class="price-tag price-blue">' +
            priceBlue +
            ' ₽</span>' +
            '</div>' +
            '</div>'
        );
    }

    // =================================================================
    // PODOLOGY ICONS
    // =================================================================

    var podologyIcons = {
        layers: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
        heart: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        'plus-circle':
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>'
    };

    /**
     * Создать кнопку таба подологии
     * @param {Object} category - Категория
     * @param {boolean} isActive - Активный ли таб
     * @returns {string} HTML кнопки
     */
    function createPodologyTab(category, isActive) {
        var safeName = escapeHTML(category.name);
        var iconSvg = podologyIcons[category.icon] || podologyIcons.heart;
        var activeClass = isActive ? ' active' : '';

        return (
            '<button class="podology-tab' +
            activeClass +
            '" data-podology-target="' +
            category.id +
            '">' +
            iconSvg +
            '<span>' +
            safeName +
            '</span>' +
            '</button>'
        );
    }

    /**
     * Создать элемент услуги подологии
     * @param {Object} service - Данные услуги
     * @returns {string} HTML элемента
     */
    function createPodologyServiceItem(service) {
        var safeName = escapeHTML(service.name);
        var safePrice = escapeHTML(service.price);
        var safeDuration = escapeHTML(service.duration || '');
        var featuredClass = service.featured ? ' podology-service-featured' : '';

        return (
            '<div class="podology-service-item' +
            featuredClass +
            '">' +
            '<div class="podology-service-info">' +
            '<h4>' +
            safeName +
            '</h4>' +
            (safeDuration ? '<span>' + safeDuration + '</span>' : '') +
            '</div>' +
            '<div class="podology-service-price">' +
            safePrice +
            '</div>' +
            '</div>'
        );
    }

    /**
     * Создать контент таба подологии
     * @param {Object} category - Категория с услугами
     * @param {boolean} isActive - Активный ли таб
     * @returns {string} HTML контента
     */
    function createPodologyTabContent(category, isActive) {
        var safeName = escapeHTML(category.name);
        var safeDesc = escapeHTML(category.description || '');
        var activeClass = isActive ? ' active' : '';

        var badgeHtml = category.badge
            ? '<span class="podology-tab-badge">' + escapeHTML(category.badge) + '</span>'
            : '';

        var servicesHtml = (category.services || [])
            .map(function (service) {
                return createPodologyServiceItem(service);
            })
            .join('');

        return (
            '<div class="podology-tab-content' +
            activeClass +
            '" data-podology="' +
            category.id +
            '">' +
            '<div class="podology-tab-header">' +
            '<h3>' +
            safeName +
            '</h3>' +
            badgeHtml +
            '</div>' +
            '<p class="podology-tab-desc">' +
            safeDesc +
            '</p>' +
            '<div class="podology-services-list">' +
            servicesHtml +
            '</div>' +
            '</div>'
        );
    }

    /**
     * Создать карточку консультации
     * @param {Object} consultation - Данные консультации
     * @returns {string} HTML карточки
     */
    function createPodologyConsultation(consultation) {
        var safeName = escapeHTML(consultation.name);
        var safeDesc = escapeHTML(consultation.description || '');
        var safePrice = escapeHTML(consultation.price);

        return (
            '<div class="podology-service-item podology-service-featured">' +
            '<div class="podology-service-info">' +
            '<h4>' +
            safeName +
            '</h4>' +
            '<span>' +
            safeDesc +
            '</span>' +
            '</div>' +
            '<div class="podology-service-price">' +
            safePrice +
            '</div>' +
            '</div>'
        );
    }

    /**
     * Создать карточку блога
     * @param {Object} article - Данные статьи
     * @returns {string} HTML карточки
     */
    function createBlogCard(article) {
        var formattedDate = formatDate(article.date);
        var safeId = escapeAttr(article.id);
        var safeTitle = escapeHTML(article.title);
        var safeTag = escapeHTML(article.tag || 'Статья');
        var safeExcerpt = escapeHTML(article.excerpt || '');
        var safeImage = escapeAttr(article.image);

        var imageHtml = article.image
            ? '<img src="' +
              safeImage +
              '" alt="' +
              escapeAttr(article.title) +
              '" width="400" height="240" loading="lazy" decoding="async" data-smooth-load>'
            : icons.scissors;

        return (
            '<article class="blog-card fade-in stagger-item" onclick="openBlogModal(\'' +
            safeId +
            '\')">' +
            '<div class="blog-image image-wrapper">' +
            imageHtml +
            '</div>' +
            '<div class="blog-content">' +
            '<div class="blog-meta">' +
            '<span class="blog-tag">' +
            safeTag +
            '</span>' +
            '<div class="blog-date">' +
            icons.calendar +
            formattedDate +
            '</div>' +
            '</div>' +
            '<h3 class="blog-title">' +
            safeTitle +
            '</h3>' +
            '<p class="blog-excerpt">' +
            safeExcerpt +
            '</p>' +
            '<div class="blog-read-more">' +
            '<span>Читать далее</span>' +
            icons.arrow +
            '</div>' +
            '</div>' +
            '</article>'
        );
    }

    /**
     * Создать элемент FAQ
     * @param {Object} item - Данные FAQ
     * @returns {string} HTML элемента
     */
    function createFaqItem(item) {
        var safeQuestion = escapeHTML(item.question);
        var safeAnswer = escapeHTML(item.answer);

        return (
            '<div class="faq-item fade-in visible">' +
            '<div class="faq-question" onclick="toggleFaq(this)" onkeydown="handleButtonKeydown(event, this)" role="button" tabindex="0" aria-expanded="false">' +
            '<h3>' +
            safeQuestion +
            '</h3>' +
            '<svg class="faq-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
            '</div>' +
            '<div class="faq-answer"><p>' +
            safeAnswer +
            '</p></div>' +
            '</div>'
        );
    }

    // Публичный API
    return {
        icons: icons,
        createMasterCard: createMasterCard,
        createServiceItem: createServiceItem,
        createPodologyTab: createPodologyTab,
        createPodologyServiceItem: createPodologyServiceItem,
        createPodologyTabContent: createPodologyTabContent,
        createPodologyConsultation: createPodologyConsultation,
        createBlogCard: createBlogCard,
        createFaqItem: createFaqItem
    };
})();

// Экспорт
window.SiteTemplates = SiteTemplates;
