/**
 * Sanitizer module - XSS protection wrapper for DOMPurify
 *
 * Provides safe HTML sanitization for user-generated content.
 * Falls back to text escaping if DOMPurify is not loaded.
 */
(function() {
    'use strict';

    // DOMPurify configuration for allowed tags
    var PURIFY_CONFIG = {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'blockquote', 'pre', 'code',
            'a', 'img',
            'div', 'span',
            'table', 'thead', 'tbody', 'tr', 'th', 'td'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'target', 'rel',
            'class', 'id', 'style',
            'width', 'height'
        ],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'],
        FORCE_BODY: true,
        // Forbid dangerous protocols
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    };

    // Strict config for plain text areas (like names, titles)
    var STRICT_CONFIG = {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    };

    /**
     * Escape HTML entities (fallback when DOMPurify not available)
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        var str = String(text);
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Sanitize HTML content
     * @param {string} html - HTML to sanitize
     * @param {boolean} strict - If true, strips all HTML (for plain text)
     * @returns {string} Sanitized HTML
     */
    function sanitize(html, strict) {
        if (html === null || html === undefined) return '';
        var str = String(html);

        // Use DOMPurify if available
        if (typeof DOMPurify !== 'undefined') {
            var config = strict ? STRICT_CONFIG : PURIFY_CONFIG;
            return DOMPurify.sanitize(str, config);
        }

        // Fallback: escape all HTML
        return escapeHtml(str);
    }

    /**
     * Sanitize text (strip all HTML)
     * @param {string} text - Text to sanitize
     * @returns {string} Plain text without HTML
     */
    function sanitizeText(text) {
        return sanitize(text, true);
    }

    /**
     * Sanitize URL
     * @param {string} url - URL to sanitize
     * @returns {string} Sanitized URL or empty string if dangerous
     */
    function sanitizeUrl(url) {
        if (!url) return '';
        var str = String(url).trim();

        // Allow only safe protocols
        var safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', '/'];
        var isRelative = str.startsWith('/') || str.startsWith('./') || str.startsWith('../');

        if (isRelative) return str;

        try {
            var parsed = new URL(str, window.location.origin);
            if (safeProtocols.includes(parsed.protocol)) {
                return str;
            }
        } catch (e) {
            // Invalid URL
        }

        return '';
    }

    // Export to SaysApp namespace
    if (typeof window.SaysApp === 'undefined') {
        window.SaysApp = {};
    }

    window.SaysApp.escapeHtml = escapeHtml;
    window.SaysApp.sanitize = sanitize;
    window.SaysApp.sanitizeText = sanitizeText;
    window.SaysApp.sanitizeUrl = sanitizeUrl;

    // Also export globally for backward compatibility
    window.escapeHtml = escapeHtml;
    window.sanitize = sanitize;
    window.sanitizeText = sanitizeText;
    window.sanitizeUrl = sanitizeUrl;

})();
