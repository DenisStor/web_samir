/**
 * Tests for SharedHelpers Module
 * @module tests/helpers.test
 */

describe('SharedHelpers', function() {
  beforeEach(function() {
    // Load the helpers module
    loadScript('shared/helpers.js');
  });

  // =========================================================================
  // escapeHtml Tests
  // =========================================================================

  describe('escapeHtml', function() {
    test('should escape basic HTML entities', function() {
      var result = SharedHelpers.escapeHtml('<script>alert("xss")</script>');
      expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    test('should escape angle brackets', function() {
      var result = SharedHelpers.escapeHtml('<div>test</div>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    test('should escape ampersand', function() {
      var result = SharedHelpers.escapeHtml('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    test('should handle null input', function() {
      var result = SharedHelpers.escapeHtml(null);
      expect(result).toBe('');
    });

    test('should handle undefined input', function() {
      var result = SharedHelpers.escapeHtml(undefined);
      expect(result).toBe('');
    });

    test('should handle empty string', function() {
      var result = SharedHelpers.escapeHtml('');
      expect(result).toBe('');
    });

    test('should convert numbers to string', function() {
      var result = SharedHelpers.escapeHtml(123);
      expect(result).toBe('123');
    });

    test('should handle string with no special chars', function() {
      var result = SharedHelpers.escapeHtml('Hello World');
      expect(result).toBe('Hello World');
    });

    test('should be available as global alias', function() {
      expect(window.escapeHtml).toBeDefined();
      expect(window.escapeHtml('<b>')).toBe('&lt;b&gt;');
    });
  });

  // =========================================================================
  // escapeAttr Tests
  // =========================================================================

  describe('escapeAttr', function() {
    test('should escape single quotes', function() {
      var result = SharedHelpers.escapeAttr("test'value");
      expect(result).toBe('test&#39;value');
    });

    test('should escape double quotes', function() {
      var result = SharedHelpers.escapeAttr('test"value');
      expect(result).toBe('test&quot;value');
    });

    test('should escape angle brackets', function() {
      var result = SharedHelpers.escapeAttr('<test>');
      expect(result).toBe('&lt;test&gt;');
    });

    test('should escape ampersand', function() {
      var result = SharedHelpers.escapeAttr('a&b');
      expect(result).toBe('a&amp;b');
    });

    test('should handle null input', function() {
      var result = SharedHelpers.escapeAttr(null);
      expect(result).toBe('');
    });

    test('should handle undefined input', function() {
      var result = SharedHelpers.escapeAttr(undefined);
      expect(result).toBe('');
    });

    test('should be available as global alias', function() {
      expect(window.escapeAttr).toBeDefined();
    });
  });

  // =========================================================================
  // generateId Tests
  // =========================================================================

  describe('generateId', function() {
    test('should generate ID with given prefix', function() {
      var result = SharedHelpers.generateId('master');
      expect(result.startsWith('master_')).toBe(true);
    });

    test('should use default prefix when none provided', function() {
      var result = SharedHelpers.generateId();
      expect(result.startsWith('item_')).toBe(true);
    });

    test('should include timestamp', function() {
      var before = Date.now();
      var result = SharedHelpers.generateId('test');
      var after = Date.now();

      var parts = result.split('_');
      var timestamp = parseInt(parts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    test('should include random suffix', function() {
      var result = SharedHelpers.generateId('test');
      var parts = result.split('_');
      expect(parts.length).toBe(3);
      expect(parts[2].length).toBe(9);
    });

    test('should generate unique IDs', function() {
      var ids = [];
      for (var i = 0; i < 100; i++) {
        ids.push(SharedHelpers.generateId('test'));
      }
      var uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });

    test('should be available as global alias', function() {
      expect(window.generateId).toBeDefined();
      expect(window.generateId('product').startsWith('product_')).toBe(true);
    });

    test('should pass custom matcher', function() {
      var result = SharedHelpers.generateId('article');
      expect(result).toBeValidId('article');
    });
  });

  // =========================================================================
  // generateSlug Tests
  // =========================================================================

  describe('generateSlug', function() {
    test('should convert cyrillic to latin', function() {
      var result = SharedHelpers.generateSlug('Привет Мир');
      expect(result).toBe('privet-mir');
    });

    test('should handle special characters', function() {
      var result = SharedHelpers.generateSlug('Hello, World! Test.');
      expect(result).toBe('hello-world-test');
    });

    test('should convert to lowercase', function() {
      var result = SharedHelpers.generateSlug('HELLO WORLD');
      expect(result).toBe('hello-world');
    });

    test('should remove leading/trailing hyphens', function() {
      var result = SharedHelpers.generateSlug('---test---');
      expect(result).toBe('test');
    });

    test('should handle empty string', function() {
      var result = SharedHelpers.generateSlug('');
      expect(result).toBe('');
    });

    test('should handle null', function() {
      var result = SharedHelpers.generateSlug(null);
      expect(result).toBe('');
    });

    test('should handle mixed latin and cyrillic', function() {
      var result = SharedHelpers.generateSlug('Test Тест');
      expect(result).toBe('test-test');
    });

    test('should replace multiple spaces with single hyphen', function() {
      var result = SharedHelpers.generateSlug('hello    world');
      expect(result).toBe('hello-world');
    });

    test('should be available as global alias', function() {
      expect(window.generateSlug).toBeDefined();
    });

    test('should pass custom slug matcher', function() {
      var result = SharedHelpers.generateSlug('Test Slug');
      expect(result).toBeValidSlug();
    });
  });

  // =========================================================================
  // debounce Tests
  // =========================================================================

  describe('debounce', function() {
    jest.useFakeTimers();

    test('should delay function execution', function() {
      var callback = jest.fn();
      var debounced = SharedHelpers.debounce(callback, 100);

      debounced();
      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should cancel previous calls', function() {
      var callback = jest.fn();
      var debounced = SharedHelpers.debounce(callback, 100);

      debounced();
      debounced();
      debounced();

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments to callback', function() {
      var callback = jest.fn();
      var debounced = SharedHelpers.debounce(callback, 100);

      debounced('arg1', 'arg2');

      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should preserve context', function() {
      var obj = {
        value: 42,
        method: function() {
          return this.value;
        }
      };

      var callback = jest.fn(function() {
        return this.value;
      });
      obj.debounced = SharedHelpers.debounce(callback, 100);

      obj.debounced();

      jest.advanceTimersByTime(100);
      expect(callback.mock.instances[0]).toBe(obj);
    });

    test('should be available as global alias', function() {
      expect(window.debounce).toBeDefined();
    });
  });

  // =========================================================================
  // throttleRAF Tests
  // =========================================================================

  describe('throttleRAF', function() {
    test('should throttle using requestAnimationFrame', function() {
      var callback = jest.fn();
      var throttled = SharedHelpers.throttleRAF(callback);

      throttled();
      throttled();
      throttled();

      // requestAnimationFrame is mocked in setup.js
      jest.runAllTimers();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should allow new call after RAF completes', function() {
      var callback = jest.fn();
      var throttled = SharedHelpers.throttleRAF(callback);

      throttled();
      jest.runAllTimers();

      throttled();
      jest.runAllTimers();

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // reorderItems Tests
  // =========================================================================

  describe('reorderItems', function() {
    test('should reorder items by ID order', function() {
      var items = [
        { id: 'a', order: 0 },
        { id: 'b', order: 1 },
        { id: 'c', order: 2 }
      ];

      var result = SharedHelpers.reorderItems(items, ['c', 'a', 'b']);

      expect(result[0].id).toBe('c');
      expect(result[1].id).toBe('a');
      expect(result[2].id).toBe('b');
    });

    test('should update order field', function() {
      var items = [
        { id: 'a', order: 0 },
        { id: 'b', order: 1 }
      ];

      var result = SharedHelpers.reorderItems(items, ['b', 'a']);

      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
    });

    test('should filter out missing items', function() {
      var items = [
        { id: 'a', order: 0 },
        { id: 'b', order: 1 }
      ];

      var result = SharedHelpers.reorderItems(items, ['a', 'nonexistent', 'b']);

      expect(result.length).toBe(2);
    });

    test('should handle empty order array', function() {
      var items = [{ id: 'a', order: 0 }];

      var result = SharedHelpers.reorderItems(items, []);

      expect(result.length).toBe(0);
    });
  });

  // =========================================================================
  // formatPrice Tests
  // =========================================================================

  describe('formatPrice', function() {
    test('should format number with ruble symbol', function() {
      var result = SharedHelpers.formatPrice(1500);
      expect(result).toContain('1');
      expect(result).toContain('500');
      expect(result).toContain('₽');
    });

    test('should add thousand separators', function() {
      var result = SharedHelpers.formatPrice(1000000);
      expect(result).toMatch(/1.*000.*000/);
    });

    test('should handle string input', function() {
      var result = SharedHelpers.formatPrice('1500');
      expect(result).toContain('₽');
    });

    test('should handle invalid input', function() {
      var result = SharedHelpers.formatPrice('not a number');
      expect(result).toBe('0 ₽');
    });

    test('should handle zero', function() {
      var result = SharedHelpers.formatPrice(0);
      expect(result).toBe('0 ₽');
    });

    test('should handle negative numbers', function() {
      var result = SharedHelpers.formatPrice(-100);
      expect(result).toContain('-');
    });
  });

  // =========================================================================
  // formatDate Tests
  // =========================================================================

  describe('formatDate', function() {
    test('should format ISO date string', function() {
      var result = SharedHelpers.formatDate('2024-01-15');
      expect(result).toContain('2024');
    });

    test('should format Date object', function() {
      var date = new Date(2024, 0, 15); // January 15, 2024
      var result = SharedHelpers.formatDate(date);
      expect(result).toContain('2024');
    });

    test('should handle invalid date', function() {
      var result = SharedHelpers.formatDate('not a date');
      expect(result).toBe('');
    });

    test('should handle null', function() {
      var result = SharedHelpers.formatDate(null);
      expect(result).toBe('');
    });

    test('should handle empty string', function() {
      var result = SharedHelpers.formatDate('');
      expect(result).toBe('');
    });

    test('should accept custom options', function() {
      var result = SharedHelpers.formatDate('2024-01-15', {
        year: 'numeric',
        month: 'short'
      });
      expect(result).toContain('2024');
    });
  });
});
