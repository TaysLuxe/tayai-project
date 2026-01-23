"""
Helper modules for chat service.

This package contains extracted helper functions and classes that were
previously part of ChatService, organized into logical modules for
better maintainability and reusability.
"""

from .missing_kb_detector import detect_missing_kb
from .escalation_handler import (
    should_escalate_to_paid,
    determine_escalation_offer,
    generate_escalation_text,
    add_escalation_to_response
)
from .response_generator import (
    generate_missing_kb_response,
    generate_workaround,
    generate_upload_guidance
)
from .namespace_mapper import suggest_namespace as map_namespace

__all__ = [
    # Missing KB detection
    "detect_missing_kb",
    "suggest_namespace",
    # Escalation
    "should_escalate_to_paid",
    "determine_escalation_offer",
    "generate_escalation_text",
    "add_escalation_to_response",
    # Response generation
    "generate_missing_kb_response",
    "generate_workaround",
    "generate_upload_guidance",
    # Namespace mapping
    "map_namespace",
]
