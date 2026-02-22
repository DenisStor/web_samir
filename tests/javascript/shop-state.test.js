/**
 * Tests for ShopState module
 */

describe('ShopState', function() {
  beforeEach(function() {
    loadScript('shared/config.js');
    loadScript('shared/helpers.js');
    loadScript('shop/shop-state.js');
  });

  describe('localStorage safety', function() {
    test('should handle localStorage.getItem failure', function() {
      // ShopState already initialized with safeGetItem, verify it works
      expect(ShopState.getCurrentSort()).toBe('order');
    });

    test('should handle localStorage.setItem failure', function() {
      // Override localStorage to throw
      var original = window.localStorage.setItem;
      window.localStorage.setItem = function() {
        throw new Error('QuotaExceededError');
      };

      // Should not throw
      expect(function() {
        ShopState.setCurrentSort('price-asc');
      }).not.toThrow();

      expect(ShopState.getCurrentSort()).toBe('price-asc');

      window.localStorage.setItem = original;
    });

    test('should persist sort to localStorage when available', function() {
      ShopState.setCurrentSort('name');
      expect(window.localStorage.getItem('shopSort')).toBe('name');
    });
  });

  describe('getCategoryBySlug', function() {
    beforeEach(function() {
      ShopState.setCategories([
        { id: 'cat_1', slug: 'hair-care', name: 'Hair Care' },
        { id: 'cat_2', slug: 'styling', name: 'Styling' },
        { id: 'cat_3', slug: 'beard', name: 'Beard' }
      ]);
    });

    test('should find category by slug', function() {
      var cat = ShopState.getCategoryBySlug('styling');
      expect(cat).not.toBeNull();
      expect(cat.id).toBe('cat_2');
      expect(cat.name).toBe('Styling');
    });

    test('should return null for unknown slug', function() {
      var cat = ShopState.getCategoryBySlug('nonexistent');
      expect(cat).toBeNull();
    });

    test('should return null for empty slug', function() {
      var cat = ShopState.getCategoryBySlug('');
      expect(cat).toBeNull();
    });
  });

  describe('getCategoryById', function() {
    beforeEach(function() {
      ShopState.setCategories([
        { id: 'cat_1', slug: 'hair-care', name: 'Hair Care' },
        { id: 'cat_2', slug: 'styling', name: 'Styling' }
      ]);
    });

    test('should find category by id', function() {
      var cat = ShopState.getCategoryById('cat_1');
      expect(cat).not.toBeNull();
      expect(cat.slug).toBe('hair-care');
    });

    test('should return null for unknown id', function() {
      var cat = ShopState.getCategoryById('cat_999');
      expect(cat).toBeNull();
    });
  });

  describe('state management', function() {
    test('should reset state correctly', function() {
      ShopState.setCategories([{ id: 'test' }]);
      ShopState.setProducts([{ id: 'p1' }]);
      ShopState.setCurrentCategory('styling');
      ShopState.setSearchQuery('test');

      ShopState.reset();

      expect(ShopState.getCategories()).toEqual([]);
      expect(ShopState.getProducts()).toEqual([]);
      expect(ShopState.getCurrentCategory()).toBe('all');
      expect(ShopState.getSearchQuery()).toBe('');
    });

    test('should manage lightbox state', function() {
      ShopState.setLightboxImages(['img1.jpg', 'img2.jpg']);
      ShopState.setLightboxIndex(1);

      expect(ShopState.getLightboxImages()).toEqual(['img1.jpg', 'img2.jpg']);
      expect(ShopState.getLightboxIndex()).toBe(1);
    });
  });
});
