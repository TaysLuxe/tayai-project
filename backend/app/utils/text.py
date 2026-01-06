"""
Text Processing Utilities

Provides functions for:
- Input sanitization
- Content validation
- Text formatting and truncation
"""
import re
import html
from typing import Tuple
from app.core.constants import MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH


def sanitize_user_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS and other security issues.
    
    Args:
        text: Raw user input text
        
    Returns:
        Sanitized text safe for processing
    """
    if not text:
        return ""
    
    # Decode HTML entities first (in case of double encoding)
    text = html.unescape(text)
    
    # Remove potentially dangerous HTML tags
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    
    # Escape remaining HTML
    text = html.escape(text)
    
    # Remove excessive whitespace
    text = ' '.join(text.split())
    
    return text.strip()


def validate_message_content(message: str) -> Tuple[bool, str]:
    """
    Validate message content for security and length requirements.
    
    Args:
        message: Message text to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not message:
        return False, "Message cannot be empty"
    
    if not isinstance(message, str):
        return False, "Message must be a string"
    
    # Check length
    if len(message) < MIN_MESSAGE_LENGTH:
        return False, f"Message must be at least {MIN_MESSAGE_LENGTH} characters"
    
    if len(message) > MAX_MESSAGE_LENGTH:
        return False, f"Message must not exceed {MAX_MESSAGE_LENGTH} characters"
    
    # Check for suspicious patterns
    suspicious_patterns = [
        (r'<script', 'Potentially dangerous script tag detected'),
        (r'javascript:', 'JavaScript injection attempt detected'),
        (r'data:text/html', 'HTML data URI detected'),
        (r'vbscript:', 'VBScript injection attempt detected'),
    ]
    
    for pattern, error_msg in suspicious_patterns:
        if re.search(pattern, message, re.IGNORECASE):
            return False, error_msg
    
    # Check for excessive special characters (potential encoding attacks)
    special_char_ratio = len(re.findall(r'[^\w\s]', message)) / len(message) if message else 0
    if special_char_ratio > 0.5:
        return False, "Message contains too many special characters"
    
    return True, ""


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to a maximum length with optional suffix.
    
    Args:
        text: Text to truncate
        max_length: Maximum length (including suffix)
        suffix: Suffix to append if truncated
        
    Returns:
        Truncated text
    """
    if not text:
        return ""
    
    if len(text) <= max_length:
        return text
    
    # Account for suffix length
    truncate_length = max_length - len(suffix)
    if truncate_length <= 0:
        return suffix[:max_length]
    
    return text[:truncate_length] + suffix

