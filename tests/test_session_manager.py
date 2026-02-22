"""
Tests for server/auth.py — SessionManager
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.auth import SessionManager, generate_token, hash_password, verify_password


# =============================================================================
# generate_token / hash_password / verify_password
# =============================================================================

class TestGenerateToken:

    def test_returns_string(self):
        token = generate_token()
        assert isinstance(token, str)

    def test_token_is_64_hex(self):
        token = generate_token()
        assert len(token) == 64
        int(token, 16)  # should not raise

    def test_unique_tokens(self):
        tokens = {generate_token() for _ in range(100)}
        assert len(tokens) == 100


class TestHashPassword:

    def test_returns_salt_colon_hash(self):
        result = hash_password('test')
        assert ':' in result
        salt, key = result.split(':', 1)
        assert len(salt) == 32  # 16 bytes hex
        assert len(key) == 64   # 32 bytes hex

    def test_same_salt_same_hash(self):
        result1 = hash_password('password', 'aa' * 16)
        result2 = hash_password('password', 'aa' * 16)
        assert result1 == result2

    def test_different_salt_different_hash(self):
        result1 = hash_password('password', 'aa' * 16)
        result2 = hash_password('password', 'bb' * 16)
        assert result1 != result2


class TestVerifyPassword:

    def test_verify_hashed(self):
        hashed = hash_password('secret')
        assert verify_password('secret', hashed) is True

    def test_verify_hashed_wrong(self):
        hashed = hash_password('secret')
        assert verify_password('wrong', hashed) is False

    def test_verify_plaintext_compat(self):
        assert verify_password('test123', 'test123') is True

    def test_verify_plaintext_wrong(self):
        assert verify_password('wrong', 'correct') is False


# =============================================================================
# SessionManager — create
# =============================================================================

class TestSessionManagerCreate:

    def test_returns_token(self):
        sm = SessionManager(timeout_hours=1)
        token = sm.create()
        assert isinstance(token, str)
        assert len(token) == 64

    def test_sets_expiry(self):
        sm = SessionManager(timeout_hours=2)
        token = sm.create()
        session = sm.get(token)
        assert session is not None
        assert 'expires' in session
        assert 'created' in session
        # Expiry should be ~2 hours from now
        diff = (session['expires'] - session['created']).total_seconds()
        assert 7100 < diff < 7300  # ~7200 seconds = 2 hours


# =============================================================================
# SessionManager — validate
# =============================================================================

class TestSessionManagerValidate:

    def test_valid_token(self):
        sm = SessionManager(timeout_hours=1)
        token = sm.create()
        assert sm.validate(token) is True

    def test_expired_removed(self):
        sm = SessionManager(timeout_hours=1)
        token = generate_token()
        sm._sessions[token] = {
            'created': datetime.now() - timedelta(hours=2),
            'expires': datetime.now() - timedelta(hours=1)
        }
        assert sm.validate(token) is False
        assert token not in sm._sessions

    def test_none_token(self):
        sm = SessionManager(timeout_hours=1)
        assert sm.validate(None) is False

    def test_empty_string(self):
        sm = SessionManager(timeout_hours=1)
        assert sm.validate('') is False

    def test_nonexistent_token(self):
        sm = SessionManager(timeout_hours=1)
        assert sm.validate('nonexistent_token_12345') is False

    def test_cleans_other_expired(self):
        sm = SessionManager(timeout_hours=1)
        valid_token = sm.create()
        # Add an expired token
        expired_token = generate_token()
        sm._sessions[expired_token] = {
            'created': datetime.now() - timedelta(hours=2),
            'expires': datetime.now() - timedelta(hours=1)
        }
        sm.validate(valid_token)
        assert expired_token not in sm._sessions


# =============================================================================
# SessionManager — get
# =============================================================================

class TestSessionManagerGet:

    def test_existing_session(self):
        sm = SessionManager(timeout_hours=1)
        token = sm.create()
        session = sm.get(token)
        assert session is not None
        assert 'created' in session
        assert 'expires' in session

    def test_nonexistent(self):
        sm = SessionManager(timeout_hours=1)
        assert sm.get('nonexistent') is None


# =============================================================================
# SessionManager — delete
# =============================================================================

class TestSessionManagerDelete:

    def test_existing_returns_true(self):
        sm = SessionManager(timeout_hours=1)
        token = sm.create()
        assert sm.delete(token) is True
        assert sm.get(token) is None

    def test_nonexistent_returns_false(self):
        sm = SessionManager(timeout_hours=1)
        assert sm.delete('nonexistent') is False


# =============================================================================
# SessionManager — cleanup_expired
# =============================================================================

class TestSessionManagerCleanup:

    def test_removes_expired(self):
        sm = SessionManager(timeout_hours=1)
        # Add expired sessions
        for _ in range(3):
            t = generate_token()
            sm._sessions[t] = {
                'created': datetime.now() - timedelta(hours=2),
                'expires': datetime.now() - timedelta(hours=1)
            }
        count = sm.cleanup_expired()
        assert count == 3
        assert len(sm._sessions) == 0

    def test_keeps_valid(self):
        sm = SessionManager(timeout_hours=1)
        valid_token = sm.create()
        expired_token = generate_token()
        sm._sessions[expired_token] = {
            'created': datetime.now() - timedelta(hours=2),
            'expires': datetime.now() - timedelta(hours=1)
        }
        count = sm.cleanup_expired()
        assert count == 1
        assert valid_token in sm._sessions
        assert expired_token not in sm._sessions

    def test_returns_count(self):
        sm = SessionManager(timeout_hours=1)
        count = sm.cleanup_expired()
        assert count == 0


# =============================================================================
# SessionManager — get_remaining_time
# =============================================================================

class TestSessionManagerRemainingTime:

    def test_valid_session(self):
        sm = SessionManager(timeout_hours=1)
        token = sm.create()
        remaining = sm.get_remaining_time(token)
        assert remaining > 3500  # ~3600 seconds

    def test_expired_session(self):
        sm = SessionManager(timeout_hours=1)
        token = generate_token()
        sm._sessions[token] = {
            'created': datetime.now() - timedelta(hours=2),
            'expires': datetime.now() - timedelta(hours=1)
        }
        assert sm.get_remaining_time(token) == 0

    def test_nonexistent(self):
        sm = SessionManager(timeout_hours=1)
        assert sm.get_remaining_time('nonexistent') == 0
