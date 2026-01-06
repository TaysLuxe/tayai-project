"""
Conversation Utilities

Provides functions for:
- Converting conversation history formats
- Formatting conversation data
"""
from typing import List, Dict, Optional
from app.schemas.chat import ConversationMessage


def convert_conversation_history(
    history: Optional[List[ConversationMessage]]
) -> Optional[List[Dict[str, str]]]:
    """
    Convert conversation history from Pydantic models to dict format.
    
    Args:
        history: List of ConversationMessage objects or None
        
    Returns:
        List of dicts with 'role' and 'content' keys, or None
    """
    if not history:
        return None
    
    return [
        {"role": msg.role, "content": msg.content}
        for msg in history
    ]

