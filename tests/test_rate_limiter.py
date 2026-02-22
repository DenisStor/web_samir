"""
Tests for server/auth.py — RateLimiter, UploadRateLimiter
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.auth import RateLimiter, UploadRateLimiter


# =============================================================================
# RateLimiter — check / record
# =============================================================================

class TestRateLimiterCheck:

    def test_first_attempt_allowed(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        assert rl.check('192.168.1.1') is True

    def test_under_limit_allowed(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        for _ in range(2):
            rl.record('192.168.1.1', False)
        assert rl.check('192.168.1.1') is True

    def test_at_limit_blocked(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        for _ in range(3):
            rl.record('192.168.1.1', False)
        assert rl.check('192.168.1.1') is False

    def test_success_resets_count(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        rl.record('192.168.1.1', False)
        rl.record('192.168.1.1', False)
        rl.record('192.168.1.1', True)  # success resets
        rl.record('192.168.1.1', False)
        assert rl.check('192.168.1.1') is True

    def test_lockout_expires(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        for _ in range(3):
            rl.record('192.168.1.1', False)
        # Manually expire lockout
        rl._attempts['192.168.1.1']['lockout_until'] = datetime.now() - timedelta(minutes=1)
        assert rl.check('192.168.1.1') is True

    def test_different_ips_independent(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        for _ in range(3):
            rl.record('192.168.1.1', False)
        assert rl.check('192.168.1.1') is False
        assert rl.check('192.168.1.2') is True


# =============================================================================
# RateLimiter — get_lockout_remaining
# =============================================================================

class TestRateLimiterGetLockoutRemaining:

    def test_no_lockout_zero(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        assert rl.get_lockout_remaining('192.168.1.1') == 0

    def test_active_lockout_seconds(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=5)
        for _ in range(3):
            rl.record('192.168.1.1', False)
        remaining = rl.get_lockout_remaining('192.168.1.1')
        assert remaining > 200  # ~300 seconds

    def test_expired_lockout_zero(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        for _ in range(3):
            rl.record('192.168.1.1', False)
        rl._attempts['192.168.1.1']['lockout_until'] = datetime.now() - timedelta(minutes=1)
        assert rl.get_lockout_remaining('192.168.1.1') == 0

    def test_unknown_ip_zero(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        assert rl.get_lockout_remaining('10.0.0.1') == 0


# =============================================================================
# RateLimiter — cleanup_old
# =============================================================================

class TestRateLimiterCleanupOld:

    def test_removes_old(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        rl._attempts['old_ip'] = {
            'count': 3,
            'lockout_until': datetime.now() - timedelta(hours=48)
        }
        count = rl.cleanup_old(hours=24)
        assert count == 1
        assert 'old_ip' not in rl._attempts

    def test_keeps_recent(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        rl._attempts['recent_ip'] = {
            'count': 3,
            'lockout_until': datetime.now() - timedelta(hours=1)
        }
        count = rl.cleanup_old(hours=24)
        assert count == 0
        assert 'recent_ip' in rl._attempts

    def test_returns_count(self):
        rl = RateLimiter(max_attempts=3, lockout_minutes=1)
        count = rl.cleanup_old()
        assert count == 0


# =============================================================================
# UploadRateLimiter
# =============================================================================

class TestUploadRateLimiter:

    def test_first_upload_allowed(self):
        url = UploadRateLimiter(max_uploads=3, window_seconds=10)
        assert url.check('192.168.1.1') is True

    def test_under_limit_allowed(self):
        url = UploadRateLimiter(max_uploads=3, window_seconds=10)
        assert url.check('192.168.1.1') is True  # count=1
        assert url.check('192.168.1.1') is True  # count=2

    def test_at_limit_blocked(self):
        url = UploadRateLimiter(max_uploads=3, window_seconds=10)
        assert url.check('192.168.1.1') is True   # 1
        assert url.check('192.168.1.1') is True   # 2
        assert url.check('192.168.1.1') is True   # 3
        assert url.check('192.168.1.1') is False  # 4 — blocked

    def test_window_reset(self):
        url = UploadRateLimiter(max_uploads=2, window_seconds=1)
        url.check('192.168.1.1')
        url.check('192.168.1.1')
        # Manually expire window
        url._attempts['192.168.1.1']['window_start'] = datetime.now() - timedelta(seconds=2)
        assert url.check('192.168.1.1') is True

    def test_cleanup_old(self):
        url = UploadRateLimiter(max_uploads=3, window_seconds=10)
        url._attempts['old_ip'] = {
            'count': 1,
            'window_start': datetime.now() - timedelta(seconds=30)
        }
        count = url.cleanup_old()
        assert count == 1
        assert 'old_ip' not in url._attempts

    def test_cleanup_keeps_recent(self):
        url = UploadRateLimiter(max_uploads=3, window_seconds=60)
        url.check('recent_ip')
        count = url.cleanup_old()
        assert count == 0
        assert 'recent_ip' in url._attempts
