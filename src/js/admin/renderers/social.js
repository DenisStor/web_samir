/**
 * Admin Social Renderer
 * Рендеринг соцсетей и контактов
 */

var AdminSocialRenderer = (function () {
    'use strict';

    var elements = {};

    /**
     * Инициализация
     */
    function init() {
        elements = {
            socialLinksList: document.getElementById('socialLinksList'),
            contactPhone: document.getElementById('contactPhone'),
            contactEmail: document.getElementById('contactEmail'),
            contactAddress: document.getElementById('contactAddress')
        };
    }

    /**
     * Рендеринг соцсетей и контактов
     */
    function render() {
        var social = AdminState.social || {};

        // Заполняем контактную информацию
        if (elements.contactPhone) {
            elements.contactPhone.value = social.phone || '';
        }
        if (elements.contactEmail) {
            elements.contactEmail.value = social.email || '';
        }
        if (elements.contactAddress) {
            elements.contactAddress.value = social.address || '';
        }

        // Рендерим список соцсетей
        if (!elements.socialLinksList) {
            elements.socialLinksList = document.getElementById('socialLinksList');
            if (!elements.socialLinksList) return;
        }

        var socialLinks = social.social || [];

        if (socialLinks.length === 0) {
            elements.socialLinksList.innerHTML =
                '<p class="empty-message">Нет настроенных соцсетей</p>';
            return;
        }

        var html = socialLinks
            .map(function (link) {
                var inactiveClass = link.active ? '' : 'inactive';
                var toggleClass = link.active ? 'active' : '';
                var toggleText = link.active ? 'Вкл' : 'Выкл';

                return (
                    '<div class="social-link-item ' +
                    inactiveClass +
                    '" data-id="' +
                    link.id +
                    '">' +
                    '<div class="social-link-icon ' +
                    link.icon +
                    '">' +
                    SharedIcons.getSocial(link.icon) +
                    '</div>' +
                    '<div class="social-link-info">' +
                    '<div class="social-link-name">' +
                    window.escapeHtml(link.name) +
                    '</div>' +
                    '<input type="text" ' +
                    'class="social-link-url-input" ' +
                    'data-social-id="' +
                    link.id +
                    '" ' +
                    'value="' +
                    window.escapeHtml(link.url || '') +
                    '" ' +
                    'placeholder="Введите URL для ' +
                    window.escapeHtml(link.name) +
                    '">' +
                    '</div>' +
                    '<div class="social-link-toggle">' +
                    '<div class="toggle ' +
                    toggleClass +
                    '" data-social-id="' +
                    link.id +
                    '" data-action="toggle-social"></div>' +
                    '<span>' +
                    toggleText +
                    '</span>' +
                    '</div>' +
                    '</div>'
                );
            })
            .join('');

        elements.socialLinksList.innerHTML = html;
    }

    /**
     * Переключение активности соцсети
     */
    function toggleActive(id) {
        var social = AdminState.social;
        if (!social || !social.social) return;

        var link = social.social.find(function (s) {
            return s.id === id;
        });

        if (link) {
            link.active = !link.active;
            render();
        }
    }

    /**
     * Сохранение соцсетей
     */
    async function save() {
        var social = AdminState.social;

        // Собираем данные из формы
        if (elements.contactPhone) {
            social.phone = elements.contactPhone.value.trim();
        }
        if (elements.contactEmail) {
            social.email = elements.contactEmail.value.trim();
        }
        if (elements.contactAddress) {
            social.address = elements.contactAddress.value.trim();
        }

        // Собираем URL соцсетей из инпутов
        var urlInputs = document.querySelectorAll('.social-link-url-input');
        urlInputs.forEach(function (input) {
            var socialId = input.dataset.socialId;
            if (social.social) {
                var link = social.social.find(function (s) {
                    return s.id === socialId;
                });
                if (link) {
                    link.url = input.value.trim();
                }
            }
        });

        try {
            await AdminAPI.save('social', social);
            showToast('Настройки сохранены', 'success');
        } catch (error) {
            console.error('Error saving social:', error);
            showToast('Ошибка сохранения', 'error');
        }
    }

    // Публичный API
    return {
        init: init,
        render: render,
        toggleActive: toggleActive,
        save: save
    };
})();

// Экспорт
window.AdminSocialRenderer = AdminSocialRenderer;
