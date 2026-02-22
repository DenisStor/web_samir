/**
 * Tests for Sanitizer module
 */

describe('Sanitizer', function() {
  beforeEach(function() {
    loadScript('shared/helpers.js');
    loadScript('site/sanitizer.js');
  });

  describe('sanitize', function() {
    test('should return empty string for null', function() {
      expect(window.sanitize(null)).toBe('');
    });

    test('should return empty string for undefined', function() {
      expect(window.sanitize(undefined)).toBe('');
    });

    test('should escape HTML when DOMPurify is not available', function() {
      var result = window.sanitize('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });

    test('should handle plain text', function() {
      var result = window.sanitize('Hello World');
      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeText', function() {
    test('should strip all HTML', function() {
      var result = window.sanitizeText('<b>bold</b> text');
      // Without DOMPurify, falls back to escapeHtml
      expect(result).not.toContain('<b>');
    });

    test('should handle null', function() {
      expect(window.sanitizeText(null)).toBe('');
    });
  });

  describe('sanitizeUrl', function() {
    test('should allow http URLs', function() {
      expect(window.sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    test('should allow https URLs', function() {
      expect(window.sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    test('should allow relative URLs', function() {
      expect(window.sanitizeUrl('/images/photo.jpg')).toBe('/images/photo.jpg');
      expect(window.sanitizeUrl('./photo.jpg')).toBe('./photo.jpg');
      expect(window.sanitizeUrl('../photo.jpg')).toBe('../photo.jpg');
    });

    test('should allow mailto URLs', function() {
      expect(window.sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    test('should allow tel URLs', function() {
      expect(window.sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
    });

    test('should block javascript URLs', function() {
      expect(window.sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    test('should return empty for null/undefined', function() {
      expect(window.sanitizeUrl(null)).toBe('');
      expect(window.sanitizeUrl(undefined)).toBe('');
      expect(window.sanitizeUrl('')).toBe('');
    });
  });

  describe('SaysApp integration', function() {
    test('should export sanitize to SaysApp', function() {
      expect(window.SaysApp.sanitize).toBeDefined();
      expect(typeof window.SaysApp.sanitize).toBe('function');
    });

    test('should export sanitizeText to SaysApp', function() {
      expect(window.SaysApp.sanitizeText).toBeDefined();
    });

    test('should export sanitizeUrl to SaysApp', function() {
      expect(window.SaysApp.sanitizeUrl).toBeDefined();
    });

    test('should not overwrite escapeHtml from helpers', function() {
      // escapeHtml should still be the one from helpers.js
      expect(window.escapeHtml).toBeDefined();
      expect(window.escapeHtml('<b>')).toContain('&lt;');
    });
  });
});
