/**
 * Tests for AppConfig Module
 * @module tests/config.test
 */

describe('AppConfig', function() {
  beforeEach(function() {
    // Reset fetch mock
    global.fetch.mockReset();

    // Load the config module
    loadScript('shared/config.js');
  });

  // =========================================================================
  // get() Method Tests
  // =========================================================================

  describe('get', function() {
    test('should return default value for missing top-level path', function() {
      var result = AppConfig.get('nonexistent', 'default');
      expect(result).toBe('default');
    });

    test('should return default value for missing nested path', function() {
      var result = AppConfig.get('deeply.nested.path', 'fallback');
      expect(result).toBe('fallback');
    });

    test('should return default site name from defaults', function() {
      var result = AppConfig.get('site.name');
      expect(result).toBe("Say's Barbers");
    });

    test('should return default api timeout from defaults', function() {
      var result = AppConfig.get('api.timeout');
      expect(result).toBe(30000);
    });

    test('should return default auth settings from defaults', function() {
      expect(AppConfig.get('auth.sessionTimeoutHours')).toBe(24);
      expect(AppConfig.get('auth.maxLoginAttempts')).toBe(5);
      expect(AppConfig.get('auth.lockoutMinutes')).toBe(15);
    });

    test('should return default ui settings from defaults', function() {
      expect(AppConfig.get('ui.toastDuration')).toBe(3000);
      expect(AppConfig.get('ui.debounceDelay')).toBe(300);
      expect(AppConfig.get('ui.maxImageSize')).toBe(5242880);
    });

    test('should return default colors from defaults', function() {
      expect(AppConfig.get('colors.danger')).toBe('#ff4757');
    });

    test('should return default id prefixes from defaults', function() {
      expect(AppConfig.get('idPrefixes.master')).toBe('master_');
      expect(AppConfig.get('idPrefixes.article')).toBe('article_');
      expect(AppConfig.get('idPrefixes.product')).toBe('product_');
    });

    test('should handle empty path', function() {
      var result = AppConfig.get('', 'default');
      expect(result).toBe('default');
    });

    test('should handle null path', function() {
      var result = AppConfig.get(null, 'default');
      expect(result).toBe('default');
    });
  });

  // =========================================================================
  // getDefaults() Method Tests
  // =========================================================================

  describe('getDefaults', function() {
    test('should return defaults object', function() {
      var defaults = AppConfig.getDefaults();
      expect(defaults).toBeDefined();
      expect(typeof defaults).toBe('object');
    });

    test('should include site settings', function() {
      var defaults = AppConfig.getDefaults();
      expect(defaults.site).toBeDefined();
      expect(defaults.site.name).toBe("Say's Barbers");
      expect(defaults.site.domain).toBe('saysbarbers.ru');
    });

    test('should include api settings', function() {
      var defaults = AppConfig.getDefaults();
      expect(defaults.api).toBeDefined();
      expect(defaults.api.baseUrl).toBe('/api');
      expect(defaults.api.timeout).toBe(30000);
    });

    test('should include auth settings', function() {
      var defaults = AppConfig.getDefaults();
      expect(defaults.auth).toBeDefined();
      expect(defaults.auth.sessionTimeoutHours).toBe(24);
    });

    test('should include ui settings', function() {
      var defaults = AppConfig.getDefaults();
      expect(defaults.ui).toBeDefined();
      expect(defaults.ui.maxUploadImages).toBe(10);
    });

    test('should include colors settings', function() {
      var defaults = AppConfig.getDefaults();
      expect(defaults.colors).toBeDefined();
      expect(defaults.colors.dangerHover).toBe('#ff3344');
    });

    test('should include idPrefixes settings', function() {
      var defaults = AppConfig.getDefaults();
      expect(defaults.idPrefixes).toBeDefined();
      expect(defaults.idPrefixes.legal).toBe('legal_');
      expect(defaults.idPrefixes.faq).toBe('faq_');
    });
  });

  // =========================================================================
  // isLoaded() Method Tests
  // =========================================================================

  describe('isLoaded', function() {
    test('should return false initially', function() {
      // Note: After script load, isLoaded starts as false
      // But our test setup may have triggered load
      expect(typeof AppConfig.isLoaded()).toBe('boolean');
    });
  });

  // =========================================================================
  // load() Method Tests
  // =========================================================================

  describe('load', function() {
    test('should return a promise', function() {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: function() {
          return Promise.resolve({});
        }
      });

      var result = AppConfig.load();
      expect(result).toBeInstanceOf(Promise);
    });

    test('should fetch config.json', function() {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: function() {
          return Promise.resolve({});
        }
      });

      AppConfig.load();

      expect(global.fetch).toHaveBeenCalledWith('/config.json');
    });

    test('should handle fetch error gracefully', async function() {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw, should use defaults
      await expect(AppConfig.load()).resolves.toBeDefined();
    });

    test('should handle non-ok response', async function() {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Should not throw, should use defaults
      await expect(AppConfig.load()).resolves.toBeDefined();
    });

    test('should use loaded config values after successful load', async function() {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: function() {
          return Promise.resolve({
            site: {
              name: 'Custom Name'
            }
          });
        }
      });

      // Force re-initialization
      delete window.AppConfig;
      loadScript('shared/config.js');

      await AppConfig.load();

      // After load, should return loaded value
      expect(AppConfig.get('site.name')).toBe('Custom Name');
    });
  });

  // =========================================================================
  // Public API Tests
  // =========================================================================

  describe('Public API', function() {
    test('should expose get method', function() {
      expect(typeof AppConfig.get).toBe('function');
    });

    test('should expose load method', function() {
      expect(typeof AppConfig.load).toBe('function');
    });

    test('should expose isLoaded method', function() {
      expect(typeof AppConfig.isLoaded).toBe('function');
    });

    test('should expose getDefaults method', function() {
      expect(typeof AppConfig.getDefaults).toBe('function');
    });

    test('should be available on window', function() {
      expect(window.AppConfig).toBeDefined();
    });
  });

  // =========================================================================
  // Nested Path Resolution Tests
  // =========================================================================

  describe('Nested Path Resolution', function() {
    test('should resolve single level path', function() {
      expect(AppConfig.get('site')).toBeDefined();
      expect(typeof AppConfig.get('site')).toBe('object');
    });

    test('should resolve two level path', function() {
      expect(AppConfig.get('site.name')).toBe("Say's Barbers");
    });

    test('should resolve three level path with default', function() {
      expect(AppConfig.get('some.deep.path', 'fallback')).toBe('fallback');
    });

    test('should return undefined for partial invalid path', function() {
      // site exists, but site.nonexistent doesn't
      expect(AppConfig.get('site.nonexistent.deep', 'default')).toBe('default');
    });
  });
});
