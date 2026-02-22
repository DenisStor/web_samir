/**
 * Tests for AdminAPI Module
 * @module tests/api.test
 */

describe('AdminAPI', function() {
  beforeEach(function() {
    // Reset fetch mock
    global.fetch = jest.fn();
    // Reset sessionStorage
    sessionStorage.clear();
    // Mock showToast and AdminAuth
    window.showToast = jest.fn();
    window.AdminAuth = { showLoginForm: jest.fn() };
    // Load the module
    loadScript('admin/api.js');
  });

  afterEach(function() {
    delete window.showToast;
    delete window.AdminAuth;
    delete window.AdminAPI;
  });

  // =========================================================================
  // Token Management
  // =========================================================================

  describe('Token Management', function() {
    test('should get token from sessionStorage', function() {
      sessionStorage.setItem('says_admin_token', 'test_token_123');
      expect(AdminAPI.getToken()).toBe('test_token_123');
    });

    test('should return null when no token', function() {
      expect(AdminAPI.getToken()).toBeNull();
    });

    test('should store token', function() {
      AdminAPI.setToken('new_token_456');
      expect(sessionStorage.getItem('says_admin_token')).toBe('new_token_456');
    });

    test('should remove token when null', function() {
      AdminAPI.setToken('token');
      AdminAPI.setToken(null);
      expect(sessionStorage.getItem('says_admin_token')).toBeNull();
    });
  });

  // =========================================================================
  // GET
  // =========================================================================

  describe('get', function() {
    test('should fetch and return data', function() {
      var responseData = {masters: [{id: 'master_1'}]};
      fetch.mockResolvedValue({
        ok: true,
        json: function() { return Promise.resolve(responseData); }
      });

      return AdminAPI.get('masters').then(function(result) {
        expect(fetch).toHaveBeenCalledWith('/api/masters');
        expect(result).toEqual(responseData);
      });
    });

    test('should return null on HTTP error', function() {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: function() { return Promise.resolve({}); }
      });

      return AdminAPI.get('masters').then(function(result) {
        expect(result).toBeNull();
      });
    });

    test('should return null on network error', function() {
      fetch.mockRejectedValue(new Error('Network error'));

      return AdminAPI.get('masters').then(function(result) {
        expect(result).toBeNull();
      });
    });
  });

  // =========================================================================
  // save
  // =========================================================================

  describe('save', function() {
    test('should send POST with auth headers', function() {
      AdminAPI.setToken('my_token');
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: function() { return Promise.resolve({success: true}); }
      });

      return AdminAPI.save('masters', {masters: []}).then(function(result) {
        var callArgs = fetch.mock.calls[0];
        expect(callArgs[0]).toBe('/api/masters');
        expect(callArgs[1].method).toBe('POST');
        expect(callArgs[1].headers['Authorization']).toBe('Bearer my_token');
        expect(result).toEqual({success: true});
      });
    });

    test('should throw on 401', function() {
      AdminAPI.setToken('expired_token');
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: function() { return Promise.resolve({error: 'Unauthorized'}); }
      });

      return AdminAPI.save('masters', {}).catch(function(error) {
        expect(error.message).toBe('Unauthorized');
      });
    });
  });

  // =========================================================================
  // upload
  // =========================================================================

  describe('upload', function() {
    test('should send image data', function() {
      AdminAPI.setToken('my_token');
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: function() {
          return Promise.resolve({success: true, url: '/uploads/test.png'});
        }
      });

      return AdminAPI.upload('data:image/png;base64,abc123').then(function(result) {
        var callArgs = fetch.mock.calls[0];
        expect(callArgs[0]).toBe('/api/upload');
        expect(callArgs[1].method).toBe('POST');
        var body = JSON.parse(callArgs[1].body);
        expect(body.image).toBe('data:image/png;base64,abc123');
      });
    });

    test('should return result with url', function() {
      AdminAPI.setToken('my_token');
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: function() {
          return Promise.resolve({success: true, url: '/uploads/file.png'});
        }
      });

      return AdminAPI.upload('base64data').then(function(result) {
        expect(result.url).toBe('/uploads/file.png');
      });
    });
  });

  // =========================================================================
  // login
  // =========================================================================

  describe('login', function() {
    test('should return token on success', function() {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: function() {
          return Promise.resolve({success: true, token: 'new_token'});
        }
      });

      return AdminAPI.login('correct_password').then(function(result) {
        expect(result.token).toBe('new_token');
        var callArgs = fetch.mock.calls[0];
        var body = JSON.parse(callArgs[1].body);
        expect(body.password).toBe('correct_password');
      });
    });

    test('should throw on wrong password', function() {
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: function() {
          return Promise.resolve({error: 'Invalid password'});
        }
      });

      return AdminAPI.login('wrong').catch(function(error) {
        expect(error.message).toBe('Invalid password');
      });
    });

    test('should throw on rate limit 429', function() {
      fetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: function() {
          return Promise.resolve({error: 'Too many attempts'});
        }
      });

      return AdminAPI.login('any').catch(function(error) {
        expect(error.message).toContain('Слишком много попыток');
      });
    });
  });

  // =========================================================================
  // logout
  // =========================================================================

  describe('logout', function() {
    test('should clear token', function() {
      AdminAPI.setToken('my_token');
      fetch.mockResolvedValue({ok: true, json: function() { return Promise.resolve({}); }});

      return AdminAPI.logout().then(function() {
        expect(AdminAPI.getToken()).toBeNull();
      });
    });

    test('should call API', function() {
      AdminAPI.setToken('my_token');
      fetch.mockResolvedValue({ok: true, json: function() { return Promise.resolve({}); }});

      return AdminAPI.logout().then(function() {
        expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
          method: 'POST'
        }));
      });
    });
  });

  // =========================================================================
  // checkAuth
  // =========================================================================

  describe('checkAuth', function() {
    test('should return true for valid token', function() {
      AdminAPI.setToken('valid_token');
      fetch.mockResolvedValue({
        ok: true,
        json: function() { return Promise.resolve({valid: true}); }
      });

      return AdminAPI.checkAuth().then(function(result) {
        expect(result).toBe(true);
      });
    });

    test('should return false when no token', function() {
      return AdminAPI.checkAuth().then(function(result) {
        expect(result).toBe(false);
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    test('should return false on expired token', function() {
      AdminAPI.setToken('expired_token');
      fetch.mockResolvedValue({
        ok: true,
        json: function() { return Promise.resolve({valid: false}); }
      });

      return AdminAPI.checkAuth().then(function(result) {
        expect(result).toBe(false);
      });
    });

    test('should return false on network error', function() {
      AdminAPI.setToken('token');
      fetch.mockRejectedValue(new Error('Network error'));

      return AdminAPI.checkAuth().then(function(result) {
        expect(result).toBe(false);
      });
    });
  });

  // =========================================================================
  // loadAllData
  // =========================================================================

  describe('loadAllData', function() {
    test('should fetch all endpoints', function() {
      fetch.mockResolvedValue({
        ok: true,
        json: function() { return Promise.resolve({}); }
      });

      return AdminAPI.loadAllData().then(function(result) {
        expect(fetch).toHaveBeenCalledTimes(9);
        expect(result).toHaveProperty('masters');
        expect(result).toHaveProperty('services');
        expect(result).toHaveProperty('articles');
        expect(result).toHaveProperty('stats');
        expect(result).toHaveProperty('shopCategories');
        expect(result).toHaveProperty('products');
        expect(result).toHaveProperty('legal');
      });
    });
  });

  // =========================================================================
  // Global export
  // =========================================================================

  describe('export', function() {
    test('should be available on window', function() {
      expect(window.AdminAPI).toBeDefined();
      expect(window.AdminAPI.get).toBeDefined();
      expect(window.AdminAPI.save).toBeDefined();
    });
  });
});
