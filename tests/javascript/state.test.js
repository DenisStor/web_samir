/**
 * Tests for AdminState Module
 * @module tests/state.test
 */

describe('AdminState', function() {
  beforeEach(function() {
    loadScript('admin/state.js');
  });

  // =========================================================================
  // reset
  // =========================================================================

  describe('reset', function() {
    test('should clear all arrays', function() {
      AdminState.masters = [{id: 'master_1'}];
      AdminState.articles = [{id: 'article_1'}];
      AdminState.faq = [{id: 'faq_1'}];
      AdminState.shopCategories = [{id: 'cat_1'}];
      AdminState.products = [{id: 'prod_1'}];
      AdminState.legalDocuments = [{id: 'legal_1'}];

      AdminState.reset();

      expect(AdminState.masters).toEqual([]);
      expect(AdminState.articles).toEqual([]);
      expect(AdminState.faq).toEqual([]);
      expect(AdminState.shopCategories).toEqual([]);
      expect(AdminState.products).toEqual([]);
      expect(AdminState.legalDocuments).toEqual([]);
    });

    test('should clear editing item', function() {
      AdminState.editingItem = {id: 'master_1'};
      AdminState.reset();
      expect(AdminState.editingItem).toBeNull();
    });

    test('should reset services to default structure', function() {
      AdminState.services = {categories: [{id: 'cat'}]};
      AdminState.reset();
      expect(AdminState.services.categories).toEqual([]);
      expect(AdminState.services.podology).toBeDefined();
    });

    test('should reset social to default structure', function() {
      AdminState.social = {social: [{id: 'social_1'}]};
      AdminState.reset();
      expect(AdminState.social.social).toEqual([]);
      expect(AdminState.social.phone).toBe('');
      expect(AdminState.social.email).toBe('');
    });
  });

  // =========================================================================
  // _sortByOrder
  // =========================================================================

  describe('_sortByOrder', function() {
    test('should sort ascending by order', function() {
      var items = [{id: 'c', order: 2}, {id: 'a', order: 0}, {id: 'b', order: 1}];
      var result = AdminState._sortByOrder(items);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
      expect(result[2].id).toBe('c');
    });

    test('should put items without order at end', function() {
      var items = [{id: 'b', order: 1}, {id: 'c'}, {id: 'a', order: 0}];
      var result = AdminState._sortByOrder(items);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
      expect(result[2].id).toBe('c');
    });

    test('should return null/undefined as is', function() {
      expect(AdminState._sortByOrder(null)).toBeNull();
      expect(AdminState._sortByOrder(undefined)).toBeUndefined();
    });

    test('should return non-array as is', function() {
      expect(AdminState._sortByOrder('string')).toBe('string');
    });

    test('should not mutate original array', function() {
      var items = [{id: 'b', order: 1}, {id: 'a', order: 0}];
      var result = AdminState._sortByOrder(items);
      expect(items[0].id).toBe('b'); // original unchanged
      expect(result[0].id).toBe('a');
    });
  });

  // =========================================================================
  // Setters
  // =========================================================================

  describe('setMasters', function() {
    test('should sort by order', function() {
      AdminState.setMasters([{id: 'b', order: 1}, {id: 'a', order: 0}]);
      expect(AdminState.masters[0].id).toBe('a');
    });

    test('should handle null with empty array', function() {
      AdminState.setMasters(null);
      expect(AdminState.masters).toEqual([]);
    });
  });

  describe('setServices', function() {
    test('should preserve structure', function() {
      var data = {categories: [{name: 'Main'}], podology: {services: []}};
      AdminState.setServices(data);
      expect(AdminState.services.categories).toHaveLength(1);
    });

    test('should handle null with default', function() {
      AdminState.setServices(null);
      expect(AdminState.services.categories).toEqual([]);
    });
  });

  describe('setArticles', function() {
    test('should sort by order', function() {
      AdminState.setArticles([{id: 'b', order: 1}, {id: 'a', order: 0}]);
      expect(AdminState.articles[0].id).toBe('a');
    });
  });

  describe('setFaq', function() {
    test('should sort by order', function() {
      AdminState.setFaq([{id: 'b', order: 1}, {id: 'a', order: 0}]);
      expect(AdminState.faq[0].id).toBe('a');
    });
  });

  describe('setProducts', function() {
    test('should sort by order', function() {
      AdminState.setProducts([{id: 'b', order: 1}, {id: 'a', order: 0}]);
      expect(AdminState.products[0].id).toBe('a');
    });
  });

  describe('setShopCategories', function() {
    test('should sort by order', function() {
      AdminState.setShopCategories([{id: 'b', order: 1}, {id: 'a', order: 0}]);
      expect(AdminState.shopCategories[0].id).toBe('a');
    });
  });

  describe('setLegalDocuments', function() {
    test('should set documents array', function() {
      AdminState.setLegalDocuments([{id: 'legal_1'}]);
      expect(AdminState.legalDocuments).toHaveLength(1);
    });

    test('should handle null with empty array', function() {
      AdminState.setLegalDocuments(null);
      expect(AdminState.legalDocuments).toEqual([]);
    });
  });

  describe('setSocial', function() {
    test('should set data', function() {
      var data = {social: [{id: 's1'}], phone: '123'};
      AdminState.setSocial(data);
      expect(AdminState.social.phone).toBe('123');
    });

    test('should handle null with default structure', function() {
      AdminState.setSocial(null);
      expect(AdminState.social.social).toEqual([]);
    });
  });

  // =========================================================================
  // Finders
  // =========================================================================

  describe('findMaster', function() {
    test('should find by id', function() {
      AdminState.masters = [{id: 'master_1', name: 'A'}, {id: 'master_2', name: 'B'}];
      var result = AdminState.findMaster('master_2');
      expect(result.name).toBe('B');
    });

    test('should return undefined if not found', function() {
      AdminState.masters = [{id: 'master_1'}];
      expect(AdminState.findMaster('nonexistent')).toBeUndefined();
    });
  });

  describe('findArticle', function() {
    test('should find by id', function() {
      AdminState.articles = [{id: 'article_1', title: 'Test'}];
      expect(AdminState.findArticle('article_1').title).toBe('Test');
    });
  });

  describe('findFaq', function() {
    test('should find by id', function() {
      AdminState.faq = [{id: 'faq_1', question: 'Why?'}];
      expect(AdminState.findFaq('faq_1').question).toBe('Why?');
    });
  });

  describe('findSocialLink', function() {
    test('should find in social array', function() {
      AdminState.social = {social: [{id: 's1', type: 'vk'}, {id: 's2', type: 'tg'}]};
      expect(AdminState.findSocialLink('s2').type).toBe('tg');
    });

    test('should handle empty social', function() {
      AdminState.social = {};
      expect(AdminState.findSocialLink('s1')).toBeUndefined();
    });
  });

  describe('findShopCategory', function() {
    test('should find by id', function() {
      AdminState.shopCategories = [{id: 'cat_1', name: 'Hair'}];
      expect(AdminState.findShopCategory('cat_1').name).toBe('Hair');
    });
  });

  describe('findProduct', function() {
    test('should find by id', function() {
      AdminState.products = [{id: 'prod_1', name: 'Wax'}];
      expect(AdminState.findProduct('prod_1').name).toBe('Wax');
    });
  });

  describe('findLegalDocument', function() {
    test('should find by id', function() {
      AdminState.legalDocuments = [{id: 'legal_1', title: 'Privacy'}];
      expect(AdminState.findLegalDocument('legal_1').title).toBe('Privacy');
    });

    test('should return undefined if not found', function() {
      AdminState.legalDocuments = [];
      expect(AdminState.findLegalDocument('nonexistent')).toBeUndefined();
    });
  });

  // =========================================================================
  // Global export
  // =========================================================================

  describe('export', function() {
    test('should be available on window', function() {
      expect(window.AdminState).toBeDefined();
      expect(window.AdminState.reset).toBeDefined();
    });
  });
});
