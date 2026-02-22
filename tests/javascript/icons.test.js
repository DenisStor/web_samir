/**
 * Tests for SharedIcons Module
 * @module tests/icons.test
 */

describe('SharedIcons', function() {
  beforeEach(function() {
    loadScript('shared/icons.js');
  });

  // =========================================================================
  // get (single arg — UI icon)
  // =========================================================================

  describe('get', function() {
    test('should get UI icon by name', function() {
      var result = SharedIcons.get('edit');
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });

    test('should get category icon by name', function() {
      var result = SharedIcons.get('scissors');
      expect(result).toContain('<svg');
    });

    test('should return empty string for unknown', function() {
      expect(SharedIcons.get('nonexistent_icon_xyz')).toBe('');
    });

    test('should get icon by type and name (two args)', function() {
      var result = SharedIcons.get('social', 'telegram');
      expect(result).toContain('<svg');
    });

    test('should return empty for unknown type', function() {
      expect(SharedIcons.get('unknown_type', 'name')).toBe('');
    });
  });

  // =========================================================================
  // getSocial
  // =========================================================================

  describe('getSocial', function() {
    test('should get social icon', function() {
      var result = SharedIcons.getSocial('telegram');
      expect(result).toContain('<svg');
    });

    test('should return vk as fallback for unknown', function() {
      var fallback = SharedIcons.getSocial('nonexistent');
      var vk = SharedIcons.getSocial('vk');
      expect(fallback).toBe(vk);
    });
  });

  // =========================================================================
  // getUI
  // =========================================================================

  describe('getUI', function() {
    test('should get UI icon', function() {
      var result = SharedIcons.getUI('search');
      expect(result).toContain('<svg');
    });

    test('should return empty for unknown', function() {
      expect(SharedIcons.getUI('nonexistent')).toBe('');
    });
  });

  // =========================================================================
  // getSocialNames
  // =========================================================================

  describe('getSocialNames', function() {
    test('should return array of names', function() {
      var names = SharedIcons.getSocialNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });

    test('should include all known social networks', function() {
      var names = SharedIcons.getSocialNames();
      var expected = ['vk', 'telegram', 'whatsapp', 'youtube', 'instagram', 'tiktok'];
      for (var i = 0; i < expected.length; i++) {
        expect(names).toContain(expected[i]);
      }
    });
  });

  // =========================================================================
  // Backward compatibility exports
  // =========================================================================

  describe('backward compatibility', function() {
    test('should export socialIcons on window', function() {
      expect(window.socialIcons).toBeDefined();
      expect(window.socialIcons.vk).toContain('<svg');
    });

    test('should export socialIconsSvg alias', function() {
      expect(window.socialIconsSvg).toBeDefined();
      expect(window.socialIconsSvg).toBe(window.socialIcons);
    });

    test('should export SharedIcons on window', function() {
      expect(window.SharedIcons).toBeDefined();
      expect(window.SharedIcons.social).toBeDefined();
      expect(window.SharedIcons.ui).toBeDefined();
      expect(window.SharedIcons.category).toBeDefined();
    });
  });
});
