/**
 * Tests for ShopFilters.sortProducts
 * @module tests/shop-filters.test
 */

describe('ShopFilters', function() {
  beforeEach(function() {
    // Load helpers for escapeHtml
    loadScript('shared/helpers.js');

    // Mock ShopState and ShopRenderer (required by IIFE but not used in sortProducts)
    window.ShopState = {
      getElements: function() { return {}; },
      getCategories: function() { return []; },
      getProducts: function() { return []; },
      getCurrentCategory: function() { return 'all'; },
      getSearchQuery: function() { return ''; },
      getCurrentSort: function() { return 'order'; },
      getCategoryBySlug: function() { return null; },
      setCurrentCategory: function() {},
      setSearchQuery: function() {}
    };
    window.ShopRenderer = {
      getCategoryIcon: function() { return ''; },
      renderEmptyState: function() { return ''; },
      createProductCard: function() { return ''; }
    };

    loadScript('shop/shop-filters.js');
  });

  afterEach(function() {
    delete window.ShopState;
    delete window.ShopRenderer;
    delete window.ShopFilters;
  });

  // =========================================================================
  // sortProducts
  // =========================================================================

  describe('sortProducts', function() {
    var products = [
      {id: '1', name: 'Воск', price: 500, order: 2},
      {id: '2', name: 'Шампунь', price: 300, order: 0},
      {id: '3', name: 'Гель', price: 700, order: 1}
    ];

    test('should sort by price ascending', function() {
      var result = ShopFilters.sortProducts(products, 'price-asc');
      expect(result[0].price).toBe(300);
      expect(result[1].price).toBe(500);
      expect(result[2].price).toBe(700);
    });

    test('should sort by price descending', function() {
      var result = ShopFilters.sortProducts(products, 'price-desc');
      expect(result[0].price).toBe(700);
      expect(result[1].price).toBe(500);
      expect(result[2].price).toBe(300);
    });

    test('should sort by name locale', function() {
      var result = ShopFilters.sortProducts(products, 'name');
      expect(result[0].name).toBe('Воск');
      expect(result[1].name).toBe('Гель');
      expect(result[2].name).toBe('Шампунь');
    });

    test('should sort by order as default', function() {
      var result = ShopFilters.sortProducts(products, 'order');
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[2].order).toBe(2);
    });

    test('should not mutate original array', function() {
      var original = products.slice();
      ShopFilters.sortProducts(products, 'price-asc');
      expect(products[0].id).toBe(original[0].id);
    });

    test('should handle empty array', function() {
      var result = ShopFilters.sortProducts([], 'price-asc');
      expect(result).toEqual([]);
    });

    test('should handle single item', function() {
      var result = ShopFilters.sortProducts([{id: '1', price: 100}], 'price-asc');
      expect(result).toHaveLength(1);
    });

    test('should use order for unknown sort key', function() {
      var result = ShopFilters.sortProducts(products, 'unknown');
      expect(result[0].order).toBe(0);
    });
  });
});
