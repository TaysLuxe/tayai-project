"""
Chat Schemas - Pydantic models for chat-related API operations.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# =============================================================================
# Message Models
# =============================================================================

class ChatMessage(BaseModel):
    """Chat message from database."""
    id: Optional[int] = None
    user_id: int
    message: str
    response: Optional[str] = None
    tokens_used: int = 0
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ConversationMessage(BaseModel):
    """Single message in conversation history."""
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


# =============================================================================
# Request Models
# =============================================================================

class ChatRequest(BaseModel):
    """Request to send a chat message."""
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_history: Optional[List[ConversationMessage]] = None
    include_sources: bool = False
    conversation_id: Optional[int] = None  # Session: omit for new chat, send for continuing


class VoiceRequest(BaseModel):
    """Request for voice/dictation processing (DICTATION or USER_VOICE mode)."""
    transcript: str = Field(..., min_length=1, max_length=4000)
    mode: str = Field(..., pattern="^(dictation|user_voice)$")


class PersonaTestRequest(BaseModel):
    """Request for testing persona responses."""
    message: str = Field(..., min_length=1, max_length=4000)
    context_type: Optional[str] = Field(
        None,
        description="Force context: hair_education, business_mentorship, etc."
    )


# =============================================================================
# Response Models
# =============================================================================

class SourceInfo(BaseModel):
    """Knowledge base source information."""
    title: str
    category: Optional[str] = None
    score: float
    chunk_id: str


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    response: str
    tokens_used: int
    message_id: Optional[int] = None
    conversation_id: Optional[int] = None  # Session: use for subsequent messages
    sources: Optional[List[SourceInfo]] = None


class VoiceResponse(BaseModel):
    """Response from voice endpoint (dictation or user_voice)."""
    text: str
    tokens_used: int = 0


class ChatHistoryResponse(BaseModel):
    """Response for chat history requests."""
    messages: List[ChatMessage]
    total_count: int
    has_more: bool


class ConversationSummary(BaseModel):
    """One conversation/session for sidebar."""
    id: int
    title: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ListConversationsResponse(BaseModel):
    """List of conversations (sessions)."""
    conversations: List[ConversationSummary]
    total_count: int
    has_more: bool


class ConversationMessagesResponse(BaseModel):
    """All messages in one conversation (full thread)."""
    conversation_id: int
    messages: List[ChatMessage]
    total_count: int


class PersonaTestResponse(BaseModel):
    """Response from persona testing."""
    response: str
    tokens_used: int
    context_type: str
    sources: List[Dict[str, Any]]
    system_prompt_preview: str
