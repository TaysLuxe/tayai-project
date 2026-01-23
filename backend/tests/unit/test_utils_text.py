"""
Unit tests for text utility functions
"""
import pytest
from app.utils.text import sanitize_user_input, validate_message_content, truncate_text


class TestSanitizeUserInput:
    """Tests for sanitize_user_input function."""
    
    def test_removes_leading_trailing_whitespace(self):
        assert sanitize_user_input("  hello  ") == "hello"
    
    def test_removes_newlines(self):
        result = sanitize_user_input("hello\nworld")
        assert "hello" in result and "world" in result
    
    def test_removes_tabs(self):
        result = sanitize_user_input("hello\tworld")
        assert "hello" in result and "world" in result
    
    def test_removes_multiple_spaces(self):
        result = sanitize_user_input("hello    world")
        assert "hello" in result and "world" in result
    
    def test_handles_empty_string(self):
        assert sanitize_user_input("") == ""
    
    def test_handles_only_whitespace(self):
        assert sanitize_user_input("   \n\t   ") == ""


class TestValidateMessageContent:
    """Tests for validate_message_content function."""
    
    def test_valid_message(self):
        valid, message = validate_message_content("Hello, how are you?")
        assert valid is True
        assert message == ""
    
    def test_message_too_short(self):
        valid, message = validate_message_content("")
        assert valid is False
        assert "empty" in message.lower() or "cannot" in message.lower()
    
    def test_message_too_long(self):
        long_message = "a" * 10001
        valid, message = validate_message_content(long_message)
        assert valid is False
        assert "too long" in message.lower()
    
    def test_empty_message(self):
        valid, message = validate_message_content("")
        assert valid is False
    
    def test_whitespace_only_message(self):
        valid, message = validate_message_content("   \n\t   ")
        assert valid is False


class TestTruncateText:
    """Tests for truncate_text function."""
    
    def test_truncates_long_text(self):
        long_text = "a" * 200
        truncated = truncate_text(long_text, max_length=100)
        assert len(truncated) <= 103  # 100 + "..."
        assert truncated.endswith("...")
    
    def test_keeps_short_text(self):
        short_text = "Hello world"
        truncated = truncate_text(short_text, max_length=100)
        assert truncated == short_text
        assert not truncated.endswith("...")
    
    def test_exact_length(self):
        text = "a" * 100
        truncated = truncate_text(text, max_length=100)
        assert len(truncated) == 100
        assert not truncated.endswith("...")
    
    def test_default_max_length(self):
        long_text = "a" * 5000
        truncated = truncate_text(long_text)
        assert len(truncated) < len(long_text)
