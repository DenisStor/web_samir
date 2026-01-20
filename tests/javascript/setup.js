/**
 * Jest Setup for JSDOM Environment
 * Initializes global objects and mocks for browser APIs
 */

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = String(value);
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
});

// Mock requestAnimationFrame
window.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 16);
};

window.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Mock fetch for API tests
global.fetch = jest.fn(function(url) {
  return Promise.resolve({
    ok: true,
    json: function() {
      return Promise.resolve({});
    }
  });
});

// Mock console.warn to prevent noise in tests
global.console.warn = jest.fn();

// Helper to load script content into JSDOM
global.loadScript = function(scriptPath) {
  var fs = require('fs');
  var path = require('path');
  var scriptContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/js', scriptPath),
    'utf-8'
  );

  // Execute the script in the global context
  var script = document.createElement('script');
  script.textContent = scriptContent;
  document.head.appendChild(script);
};

// Reset DOM before each test
beforeEach(function() {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  localStorageMock.clear();

  // Reset any global objects that tests might have modified
  delete window.SharedHelpers;
  delete window.AppConfig;
  delete window.AdminValidation;
  delete window.escapeHtml;
  delete window.escapeAttr;
  delete window.generateId;
  delete window.generateSlug;
  delete window.debounce;
});

// Custom matchers
expect.extend({
  toBeValidId: function(received, prefix) {
    var pass = typeof received === 'string' &&
               received.startsWith(prefix + '_') &&
               received.split('_').length >= 3;

    return {
      pass: pass,
      message: function() {
        return pass
          ? 'Expected ' + received + ' not to be a valid ID with prefix ' + prefix
          : 'Expected ' + received + ' to be a valid ID with prefix ' + prefix;
      }
    };
  },

  toBeValidSlug: function(received) {
    var pass = typeof received === 'string' &&
               /^[a-z0-9]+(-[a-z0-9]+)*$/.test(received);

    return {
      pass: pass,
      message: function() {
        return pass
          ? 'Expected ' + received + ' not to be a valid slug'
          : 'Expected ' + received + ' to be a valid slug';
      }
    };
  }
});
