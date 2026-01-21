"""
Tests for authentication functionality in server.py
Тестирование аутентификации, токенов и rate limiting
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import patch

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from server import (
        hash_password,
        verify_password,
        generate_token,
        validate_token,
        check_rate_limit,
        record_login_attempt,
        sessions,
        login_attempts,
        CONFIG,
    )
    SERVER_IMPORTS_OK = True
except ImportError as e:
    print(f"Warning: Could not import from server: {e}")
    SERVER_IMPORTS_OK = False


class TestHashPassword:
    """Tests for hash_password function"""

    def test_hash_format(self):
        """Hash should have salt:hash format"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        result = hash_password('test_password')
        assert ':' in result
        parts = result.split(':')
        assert len(parts) == 2
        # Salt is 16 bytes = 32 hex chars, hash is 32 bytes = 64 hex chars
        assert len(parts[0]) == 32  # salt in hex
        assert len(parts[1]) == 64  # hash in hex

    def test_hash_uniqueness(self):
        """Same password should generate different hashes (different salts)"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        hash1 = hash_password('same_password')
        hash2 = hash_password('same_password')
        assert hash1 != hash2  # Different salts mean different results

    def test_hash_with_explicit_salt(self):
        """Hashing with same salt should produce same result"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        result1 = hash_password('test', 'a' * 32)
        result2 = hash_password('test', 'a' * 32)
        assert result1 == result2

    def test_hash_hex_format(self):
        """Hash parts should be valid hex strings"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        result = hash_password('password123')
        salt_hex, hash_hex = result.split(':')

        # Should be valid hex
        int(salt_hex, 16)  # Will raise if not hex
        int(hash_hex, 16)

    def test_hash_different_passwords(self):
        """Different passwords with same salt should produce different hashes"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        salt = 'a' * 32
        hash1 = hash_password('password1', salt)
        hash2 = hash_password('password2', salt)
        assert hash1 != hash2


class TestVerifyPassword:
    """Tests for verify_password function"""

    def test_verify_hashed_password(self):
        """Should verify correctly hashed password"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        password = 'secure_password_123'
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        """Should reject wrong password"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        hashed = hash_password('correct_password')
        assert verify_password('wrong_password', hashed) is False

    def test_verify_plaintext_compatibility(self):
        """Should verify plaintext passwords (backward compatibility)"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        plaintext_stored = 'simple_password'
        assert verify_password('simple_password', plaintext_stored) is True
        assert verify_password('wrong', plaintext_stored) is False

    def test_verify_empty_password(self):
        """Should handle empty passwords"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        hashed = hash_password('')
        assert verify_password('', hashed) is True
        assert verify_password('not_empty', hashed) is False

    def test_verify_invalid_hash_format(self):
        """Should handle invalid hash format gracefully"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Invalid format - too short
        assert verify_password('test', 'a:b') is False


class TestGenerateToken:
    """Tests for generate_token function"""

    def test_token_length(self):
        """Token should be 64 characters (32 bytes hex)"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        assert len(token) == 64

    def test_token_hex_format(self):
        """Token should be valid hex string"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        int(token, 16)  # Will raise if not valid hex

    def test_token_uniqueness(self):
        """Tokens should be unique"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        tokens = [generate_token() for _ in range(100)]
        assert len(tokens) == len(set(tokens))

    def test_token_is_string(self):
        """Token should be a string"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        assert isinstance(token, str)


class TestValidateToken:
    """Tests for validate_token function"""

    def test_validate_valid_token(self, clean_sessions):
        """Should validate a valid, non-expired token"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        assert validate_token(token) is True

    def test_validate_expired_token(self, clean_sessions):
        """Should reject an expired token"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        token = generate_token()
        sessions[token] = {
            'created': datetime.now() - timedelta(hours=48),
            'expires': datetime.now() - timedelta(hours=24)
        }

        assert validate_token(token) is False
        # Expired token should be removed
        assert token not in sessions

    def test_validate_nonexistent_token(self, clean_sessions):
        """Should reject a token that doesn't exist"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        assert validate_token('nonexistent_token_12345') is False

    def test_validate_empty_token(self, clean_sessions):
        """Should reject empty/None tokens"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        assert validate_token(None) is False
        assert validate_token('') is False

    def test_token_cleanup_on_validation(self, clean_sessions):
        """Should cleanup expired tokens when validating"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        # Add expired token
        expired_token = generate_token()
        sessions[expired_token] = {
            'created': datetime.now() - timedelta(hours=48),
            'expires': datetime.now() - timedelta(hours=1)
        }

        # Add valid token
        valid_token = generate_token()
        sessions[valid_token] = {
            'created': datetime.now(),
            'expires': datetime.now() + timedelta(hours=24)
        }

        # Validate the valid token (triggers cleanup)
        assert validate_token(valid_token) is True
        # Expired token should be cleaned up
        assert expired_token not in sessions


class TestCheckRateLimit:
    """Tests for check_rate_limit function"""

    def test_new_ip_allowed(self, clean_login_attempts):
        """New IP should be allowed"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        assert check_rate_limit('192.168.1.100') is True

    def test_ip_under_limit(self, clean_login_attempts):
        """IP with attempts under limit should be allowed"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        login_attempts['192.168.1.101'] = {'count': 2}
        assert check_rate_limit('192.168.1.101') is True

    def test_ip_locked_out(self, clean_login_attempts):
        """IP that is locked out should be blocked"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        login_attempts['192.168.1.102'] = {
            'count': 10,
            'lockout_until': datetime.now() + timedelta(minutes=15)
        }
        assert check_rate_limit('192.168.1.102') is False

    def test_ip_lockout_expired(self, clean_login_attempts):
        """IP with expired lockout should be allowed"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        login_attempts['192.168.1.103'] = {
            'count': 10,
            'lockout_until': datetime.now() - timedelta(minutes=1)  # Expired
        }
        assert check_rate_limit('192.168.1.103') is True


class TestRecordLoginAttempt:
    """Tests for record_login_attempt function"""

    def test_record_successful_login(self, clean_login_attempts):
        """Successful login should reset attempt count"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        ip = '192.168.1.200'
        login_attempts[ip] = {'count': 3}

        record_login_attempt(ip, success=True)

        assert login_attempts[ip]['count'] == 0

    def test_record_failed_login(self, clean_login_attempts):
        """Failed login should increment attempt count"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        ip = '192.168.1.201'
        record_login_attempt(ip, success=False)

        assert login_attempts[ip]['count'] == 1

    def test_record_multiple_failures(self, clean_login_attempts):
        """Multiple failures should accumulate"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        ip = '192.168.1.202'
        for _ in range(3):
            record_login_attempt(ip, success=False)

        assert login_attempts[ip]['count'] == 3

    def test_lockout_after_max_attempts(self, clean_login_attempts):
        """Should lock out after max attempts"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        ip = '192.168.1.203'
        max_attempts = CONFIG.get('max_login_attempts', 5)

        for _ in range(max_attempts):
            record_login_attempt(ip, success=False)

        assert 'lockout_until' in login_attempts[ip]
        assert login_attempts[ip]['lockout_until'] > datetime.now()

    def test_new_ip_initialization(self, clean_login_attempts):
        """Should initialize new IP on first attempt"""
        if not SERVER_IMPORTS_OK:
            pytest.skip("Server imports failed")

        ip = '192.168.1.204'
        assert ip not in login_attempts

        record_login_attempt(ip, success=False)

        assert ip in login_attempts
        assert login_attempts[ip]['count'] == 1


# Run tests with pytest
if __name__ == '__main__':
    pytest.main([__file__, '-v'])
