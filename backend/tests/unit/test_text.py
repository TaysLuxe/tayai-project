"""
Unit tests for text processing utilities
"""
import pytest
from app.utils.text import (
    sanitize_user_input,
    validate_message_content,
    truncate_text,
)
from app.core.constants import MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH


class TestSanitizeUserInput:
    """Tests for sanitize_user_input function"""
    
    def test_sanitize_normal_text(self):
        """Test sanitizing normal text"""
        text = "This is a normal message"
        result = sanitize_user_input(text)
        
        assert result == "This is a normal message"
    
    def test_sanitize_empty_string(self):
        """Test sanitizing empty string"""
        result = sanitize_user_input("")
        assert result == ""
    
    def test_sanitize_none(self):
        """Test sanitizing None"""
        result = sanitize_user_input(None)
        assert result == ""
    
    def test_sanitize_removes_script_tags(self):
        """Test that script tags are removed"""
        text = "Hello <script>alert('xss')</script> world"
        result = sanitize_user_input(text)
        
        assert "<script>" not in result.lower()
        assert "alert" not in result
    
    def test_sanitize_removes_iframe_tags(self):
        """Test that iframe tags are removed"""
        text = "Content <iframe src='evil.com'></iframe> here"
        result = sanitize_user_input(text)
        
        assert "<iframe" not in result.lower()
    
    def test_sanitize_removes_javascript_protocol(self):
        """Test that javascript: protocol is removed"""
        text = "Link javascript:alert('xss') here"
        result = sanitize_user_input(text)
        
        assert "javascript:" not in result.lower()
    
    def test_sanitize_removes_event_handlers(self):
        """Test that event handlers are removed"""
        text = "Text onclick='evil()' here"
        result = sanitize_user_input(text)
        
        assert "onclick" not in result.lower()
    
    def test_sanitize_escapes_html(self):
        """Test that HTML is escaped"""
        text = "<div>Hello</div>"
        result = sanitize_user_input(text)
        
        assert "<div>" not in result
        assert "&lt;" in result or result == text.strip()
    
    def test_sanitize_normalizes_whitespace(self):
        """Test that excessive whitespace is normalized"""
        text = "Hello    world\n\n\nhere"
        result = sanitize_user_input(text)
        
        assert "    " not in result
        assert "\n\n" not in result


class TestValidateMessageContent:
    """Tests for validate_message_content function"""
    
    def test_validate_valid_message(self):
        """Test validating a valid message"""
        message = "This is a valid message with enough content"
        is_valid, error = validate_message_content(message)
        
        assert is_valid is True
        assert error == ""
    
    def test_validate_empty_message(self):
        """Test validating empty message"""
        is_valid, error = validate_message_content("")
        
        assert is_valid is False
        assert "empty" in error.lower()
    
    def test_validate_none_message(self):
        """Test validating None message"""
        is_valid, error = validate_message_content(None)
        
        assert is_valid is False
        assert "string" in error.lower()
    
    def test_validate_too_short_message(self):
        """Test validating message that's too short"""
        message = ""  # Empty is less than MIN_MESSAGE_LENGTH
        is_valid, error = validate_message_content(message)
        
        assert is_valid is False
        assert str(MIN_MESSAGE_LENGTH) in error
    
    def test_validate_too_long_message(self):
        """Test validating message that's too long"""
        message = "x" * (MAX_MESSAGE_LENGTH + 1)
        is_valid, error = validate_message_content(message)
        
        assert is_valid is False
        assert str(MAX_MESSAGE_LENGTH) in error
    
    def test_validate_detects_script_tags(self):
        """Test that script tags are detected"""
        message = "Hello <script>alert('xss')</script>"
        is_valid, error = validate_message_content(message)
        
        assert is_valid is False
        assert "script" in error.lower()
    
    def test_validate_detects_javascript_protocol(self):
        """Test that javascript: protocol is detected"""
        message = "Link javascript:alert('xss')"
        is_valid, error = validate_message_content(message)
        
        assert is_valid is False
        assert "javascript" in error.lower()
    
    def test_validate_detects_html_data_uri(self):
        """Test that HTML data URI is detected"""
        message = "data:text/html,<script>alert('xss')</script>"
        is_valid, error = validate_message_content(message)
        
        assert is_valid is False
        assert "html" in error.lower() or "data" in error.lower()
    
    def test_validate_detects_vbscript(self):
        """Test that VBScript is detected"""
        message = "vbscript:msgbox('xss')"
        is_valid, error = validate_message_content(message)
        
        assert is_valid is False
        assert "vbscript" in error.lower()
    
    def test_validate_detects_excessive_special_chars(self):
        """Test that excessive special characters are detected"""
        message = "!@#$%^&*()" * 100  # Mostly special characters
        is_valid, error = validate_message_content(message)
        
        assert is_valid is False
        assert "special" in error.lower()


class TestTruncateText:
    """Tests for truncate_text function"""
    
    def test_truncate_short_text(self):
        """Test truncating text that's already short"""
        text = "Short text"
        result = truncate_text(text, max_length=100)
        
        assert result == text
    
    def test_truncate_long_text(self):
        """Test truncating long text"""
        text = "x" * 200
        result = truncate_text(text, max_length=100)
        
        assert len(result) == 100
        assert result.endswith("...")
    
    def test_truncate_empty_string(self):
        """Test truncating empty string"""
        result = truncate_text("", max_length=100)
        assert result == ""
    
    def test_truncate_none(self):
        """Test truncating None"""
        result = truncate_text(None, max_length=100)
        assert result == ""
    
    def test_truncate_custom_suffix(self):
        """Test truncating with custom suffix"""
        text = "x" * 200
        result = truncate_text(text, max_length=100, suffix="[more]")
        
        assert len(result) == 100
        assert result.endswith("[more]")
    
    def test_truncate_exact_length(self):
        """Test truncating text that's exactly max_length"""
        text = "x" * 100
        result = truncate_text(text, max_length=100)
        
        assert result == text
        assert not result.endswith("...")
    
    def test_truncate_very_short_max_length(self):
        """Test truncating with very short max_length"""
        text = "Hello world"
        result = truncate_text(text, max_length=3)
        
        assert len(result) == 3
        assert result == "..."
    
    def test_truncate_suffix_longer_than_max(self):
        """Test truncating when suffix is longer than max_length"""
        text = "Hello"
        result = truncate_text(text, max_length=2, suffix="...")
        
        assert len(result) == 2
        assert result == ".."
