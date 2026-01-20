/**
 * Tests for AdminValidation Module
 * @module tests/validation.test
 */

describe('AdminValidation', function() {
  beforeEach(function() {
    // Load helpers first (for escapeHtml)
    loadScript('shared/helpers.js');
    // Then load validation module
    loadScript('admin/validation.js');
  });

  // =========================================================================
  // Validation Rules Tests
  // =========================================================================

  describe('rules', function() {
    describe('required', function() {
      test('should return false for empty string', function() {
        expect(AdminValidation.rules.required('')).toBe(false);
      });

      test('should return false for whitespace only', function() {
        expect(AdminValidation.rules.required('   ')).toBe(false);
      });

      test('should return false for null', function() {
        expect(AdminValidation.rules.required(null)).toBe(false);
      });

      test('should return false for undefined', function() {
        expect(AdminValidation.rules.required(undefined)).toBe(false);
      });

      test('should return true for non-empty string', function() {
        expect(AdminValidation.rules.required('test')).toBe(true);
      });

      test('should return true for number', function() {
        expect(AdminValidation.rules.required(0)).toBe(true);
        expect(AdminValidation.rules.required(123)).toBe(true);
      });

      test('should return true for string with whitespace around text', function() {
        expect(AdminValidation.rules.required('  test  ')).toBe(true);
      });
    });

    describe('minLength', function() {
      test('should return false when under minimum', function() {
        expect(AdminValidation.rules.minLength('ab', 3)).toBe(false);
      });

      test('should return true when at minimum', function() {
        expect(AdminValidation.rules.minLength('abc', 3)).toBe(true);
      });

      test('should return true when over minimum', function() {
        expect(AdminValidation.rules.minLength('abcd', 3)).toBe(true);
      });

      test('should trim whitespace before checking', function() {
        expect(AdminValidation.rules.minLength('  a  ', 3)).toBe(false);
      });

      test('should handle empty string', function() {
        expect(AdminValidation.rules.minLength('', 1)).toBe(false);
      });

      test('should handle zero minimum', function() {
        expect(AdminValidation.rules.minLength('', 0)).toBe(true);
      });
    });

    describe('maxLength', function() {
      test('should return true when under maximum', function() {
        expect(AdminValidation.rules.maxLength('ab', 3)).toBe(true);
      });

      test('should return true when at maximum', function() {
        expect(AdminValidation.rules.maxLength('abc', 3)).toBe(true);
      });

      test('should return false when over maximum', function() {
        expect(AdminValidation.rules.maxLength('abcd', 3)).toBe(false);
      });

      test('should trim whitespace before checking', function() {
        expect(AdminValidation.rules.maxLength('  a  ', 3)).toBe(true);
      });

      test('should handle empty string', function() {
        expect(AdminValidation.rules.maxLength('', 10)).toBe(true);
      });
    });

    describe('email', function() {
      test('should return true for valid email', function() {
        expect(AdminValidation.rules.email('test@example.com')).toBe(true);
      });

      test('should return true for email with subdomain', function() {
        expect(AdminValidation.rules.email('test@mail.example.com')).toBe(true);
      });

      test('should return false for email without @', function() {
        expect(AdminValidation.rules.email('testexample.com')).toBe(false);
      });

      test('should return false for email without domain', function() {
        expect(AdminValidation.rules.email('test@')).toBe(false);
      });

      test('should return false for email without local part', function() {
        expect(AdminValidation.rules.email('@example.com')).toBe(false);
      });

      test('should return true for empty value (optional)', function() {
        expect(AdminValidation.rules.email('')).toBe(true);
      });

      test('should return false for email with spaces', function() {
        expect(AdminValidation.rules.email('test @example.com')).toBe(false);
      });
    });

    describe('url', function() {
      test('should return true for valid http URL', function() {
        expect(AdminValidation.rules.url('http://example.com')).toBe(true);
      });

      test('should return true for valid https URL', function() {
        expect(AdminValidation.rules.url('https://example.com')).toBe(true);
      });

      test('should return true for URL with path', function() {
        expect(AdminValidation.rules.url('https://example.com/path/to/page')).toBe(true);
      });

      test('should return true for URL with query string', function() {
        expect(AdminValidation.rules.url('https://example.com?q=test')).toBe(true);
      });

      test('should return false for invalid URL', function() {
        expect(AdminValidation.rules.url('not-a-url')).toBe(false);
      });

      test('should return true for empty value (optional)', function() {
        expect(AdminValidation.rules.url('')).toBe(true);
      });

      test('should return false for partial URL', function() {
        expect(AdminValidation.rules.url('example.com')).toBe(false);
      });
    });

    describe('number', function() {
      test('should return true for integer', function() {
        expect(AdminValidation.rules.number('123')).toBe(true);
      });

      test('should return true for float', function() {
        expect(AdminValidation.rules.number('123.45')).toBe(true);
      });

      test('should return true for negative number', function() {
        expect(AdminValidation.rules.number('-123')).toBe(true);
      });

      test('should return false for non-numeric string', function() {
        expect(AdminValidation.rules.number('abc')).toBe(false);
      });

      test('should return true for empty value (optional)', function() {
        expect(AdminValidation.rules.number('')).toBe(true);
      });

      test('should return true for zero', function() {
        expect(AdminValidation.rules.number('0')).toBe(true);
      });

      test('should handle mixed string (parseFloat behavior)', function() {
        // parseFloat('123abc') returns 123, so this is considered valid
        // This is the expected JavaScript behavior
        expect(AdminValidation.rules.number('123abc')).toBe(true);
      });
    });

    describe('positiveNumber', function() {
      test('should return true for positive number', function() {
        expect(AdminValidation.rules.positiveNumber('123')).toBe(true);
      });

      test('should return true for zero', function() {
        expect(AdminValidation.rules.positiveNumber('0')).toBe(true);
      });

      test('should return false for negative number', function() {
        expect(AdminValidation.rules.positiveNumber('-123')).toBe(false);
      });

      test('should return true for empty value (optional)', function() {
        expect(AdminValidation.rules.positiveNumber('')).toBe(true);
      });

      test('should return true for float', function() {
        expect(AdminValidation.rules.positiveNumber('12.34')).toBe(true);
      });
    });
  });

  // =========================================================================
  // validateField Tests
  // =========================================================================

  describe('validateField', function() {
    beforeEach(function() {
      // Create a test input field
      var input = document.createElement('input');
      input.id = 'testField';
      input.value = '';
      document.body.appendChild(input);
    });

    test('should return valid for non-existent field', function() {
      var result = AdminValidation.validateField('nonexistent', [
        { rule: 'required' }
      ]);
      expect(result.valid).toBe(true);
    });

    test('should validate required field - empty', function() {
      var result = AdminValidation.validateField('testField', [
        { rule: 'required' }
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should validate required field - filled', function() {
      document.getElementById('testField').value = 'test value';
      var result = AdminValidation.validateField('testField', [
        { rule: 'required' }
      ]);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should validate multiple rules', function() {
      document.getElementById('testField').value = 'ab';
      var result = AdminValidation.validateField('testField', [
        { rule: 'required' },
        { rule: 'minLength', value: 3 }
      ]);
      expect(result.valid).toBe(false);
    });

    test('should use custom error message', function() {
      var result = AdminValidation.validateField('testField', [
        { rule: 'required', message: 'Custom error message' }
      ]);
      expect(result.error).toBe('Custom error message');
    });

    test('should replace placeholder in error message', function() {
      document.getElementById('testField').value = 'ab';
      var result = AdminValidation.validateField('testField', [
        { rule: 'minLength', value: 5 }
      ]);
      expect(result.error).toContain('5');
    });
  });

  // =========================================================================
  // validateForm Tests
  // =========================================================================

  describe('validateForm', function() {
    beforeEach(function() {
      // Create test form fields
      var field1 = document.createElement('input');
      field1.id = 'field1';
      field1.value = 'valid';
      document.body.appendChild(field1);

      var field2 = document.createElement('input');
      field2.id = 'field2';
      field2.value = '';
      document.body.appendChild(field2);
    });

    test('should return valid when all fields pass', function() {
      document.getElementById('field2').value = 'valid';
      var result = AdminValidation.validateForm({
        field1: [{ rule: 'required' }],
        field2: [{ rule: 'required' }]
      });
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    test('should return invalid when any field fails', function() {
      var result = AdminValidation.validateForm({
        field1: [{ rule: 'required' }],
        field2: [{ rule: 'required' }]
      });
      expect(result.valid).toBe(false);
      expect(result.errors.field2).toBeDefined();
    });

    test('should collect all errors', function() {
      document.getElementById('field1').value = '';
      var result = AdminValidation.validateForm({
        field1: [{ rule: 'required' }],
        field2: [{ rule: 'required' }]
      });
      expect(Object.keys(result.errors).length).toBe(2);
    });
  });

  // =========================================================================
  // UI Functions Tests
  // =========================================================================

  describe('showFieldError', function() {
    beforeEach(function() {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = '<input id="errorField" />';
      document.body.appendChild(wrapper);
    });

    test('should add error class to field', function() {
      AdminValidation.showFieldError('errorField', 'Error message');
      var field = document.getElementById('errorField');
      expect(field.classList.contains('form-input-error')).toBe(true);
    });

    test('should add error message element', function() {
      AdminValidation.showFieldError('errorField', 'Error message');
      var errorEl = document.querySelector('.form-error-message');
      expect(errorEl).toBeTruthy();
    });

    test('should handle missing field gracefully', function() {
      // Should not throw
      expect(function() {
        AdminValidation.showFieldError('nonexistent', 'Error');
      }).not.toThrow();
    });
  });

  describe('clearFieldError', function() {
    beforeEach(function() {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = '<input id="clearField" class="form-input-error" />';
      var errorMsg = document.createElement('div');
      errorMsg.className = 'form-error-message';
      errorMsg.textContent = 'Error';
      wrapper.appendChild(errorMsg);
      document.body.appendChild(wrapper);
    });

    test('should remove error class from field', function() {
      AdminValidation.clearFieldError('clearField');
      var field = document.getElementById('clearField');
      expect(field.classList.contains('form-input-error')).toBe(false);
    });

    test('should remove error message element', function() {
      AdminValidation.clearFieldError('clearField');
      var errorEl = document.querySelector('.form-error-message');
      expect(errorEl).toBeNull();
    });

    test('should handle missing field gracefully', function() {
      expect(function() {
        AdminValidation.clearFieldError('nonexistent');
      }).not.toThrow();
    });
  });

  // =========================================================================
  // Messages Tests
  // =========================================================================

  describe('messages', function() {
    test('should have all required messages', function() {
      expect(AdminValidation.messages.required).toBeDefined();
      expect(AdminValidation.messages.minLength).toBeDefined();
      expect(AdminValidation.messages.maxLength).toBeDefined();
      expect(AdminValidation.messages.email).toBeDefined();
      expect(AdminValidation.messages.url).toBeDefined();
      expect(AdminValidation.messages.number).toBeDefined();
      expect(AdminValidation.messages.positiveNumber).toBeDefined();
    });

    test('messages should be non-empty strings', function() {
      Object.keys(AdminValidation.messages).forEach(function(key) {
        expect(typeof AdminValidation.messages[key]).toBe('string');
        expect(AdminValidation.messages[key].length).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // Public API Tests
  // =========================================================================

  describe('Public API', function() {
    test('should expose all public methods', function() {
      expect(typeof AdminValidation.validate).toBe('function');
      expect(typeof AdminValidation.validateForm).toBe('function');
      expect(typeof AdminValidation.validateField).toBe('function');
      expect(typeof AdminValidation.showFieldError).toBe('function');
      expect(typeof AdminValidation.clearFieldError).toBe('function');
      expect(typeof AdminValidation.showFormErrors).toBe('function');
      expect(typeof AdminValidation.clearFormErrors).toBe('function');
      expect(typeof AdminValidation.addLiveValidation).toBe('function');
    });

    test('should expose rules object', function() {
      expect(AdminValidation.rules).toBeDefined();
      expect(typeof AdminValidation.rules.required).toBe('function');
    });

    test('should expose messages object', function() {
      expect(AdminValidation.messages).toBeDefined();
    });

    test('should be available on window', function() {
      expect(window.AdminValidation).toBeDefined();
      expect(window.AdminValidation).toBe(AdminValidation);
    });
  });
});
