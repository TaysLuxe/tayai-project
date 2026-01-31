"""
Chat Endpoints - API operations for chat functionality.

Provides:
- Standard chat endpoint with JSON response
- Streaming chat endpoint with Server-Sent Events (SSE)
- WebSocket endpoint for real-time bidirectional chat
- Chat history management
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, status, Query, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import json
import logging

from app.db.database import get_db
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ChatMessage,
    ListConversationsResponse,
    ConversationSummary,
    ConversationMessagesResponse,
    VoiceRequest,
    VoiceResponse,
)
from app.services.chat_service import ChatService
from app.services.usage_service import UsageService
from app.core.exceptions import UsageLimitExceededError, to_http_exception
from app.core.constants import CHAT_HISTORY_DEFAULT_LIMIT, CHAT_HISTORY_MAX_LIMIT
from app.api.v1.decorators import handle_service_errors, validate_input
from app.dependencies import get_current_user
from app.utils import (
    sanitize_user_input,
    validate_message_content,
    convert_conversation_history,
)
from app.utils.usage import check_usage_limit_dependency

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=ChatResponse)
@handle_service_errors
@validate_input
async def send_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(check_usage_limit_dependency)
):
    """
    Send a chat message and get AI response.
    
    The message is processed through the RAG pipeline with context
    from the knowledge base.
    """
    # Sanitize input (validation handled by @validate_input decorator)
    sanitized_message = sanitize_user_input(request.message)
    
    # Convert conversation history
    history = convert_conversation_history(request.conversation_history)
    
    # Process message (conversation_id = session: omit for new chat, send for continuing)
    chat_service = ChatService(db)
    response = await chat_service.process_message(
        user_id=current_user["user_id"],
        message=sanitized_message,
        conversation_history=history,
        include_sources=request.include_sources,
        user_tier=current_user["tier"],
        conversation_id=request.conversation_id,
    )
    
    # Track usage
    usage_service = UsageService(db)
    await usage_service.record_usage(
        user_id=current_user["user_id"],
        tokens_used=response.tokens_used
    )
    
    return response


@router.post("/voice", response_model=VoiceResponse)
@handle_service_errors
async def process_voice(
    request: VoiceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(check_usage_limit_dependency)
):
    """
    Process voice input: DICTATION (return transcript as-is) or USER_VOICE (LLM response).
    Mode must be 'dictation' or 'user_voice'.
    """
    sanitized = sanitize_user_input(request.transcript)
    chat_service = ChatService(db)
    result = await chat_service.process_voice(transcript=sanitized, mode=request.mode)
    if request.mode == "user_voice" and result.tokens_used:
        usage_service = UsageService(db)
        await usage_service.record_usage(
            user_id=current_user["user_id"],
            tokens_used=result.tokens_used,
        )
    return result


# Max size for voice speak upload (e.g. 25MB for Whisper limit)
VOICE_SPEAK_MAX_BYTES = 25 * 1024 * 1024


@router.post("/voice/speak")
@handle_service_errors
async def voice_speak(
    audio: UploadFile = File(..., description="Audio recording (webm, mp3, wav, etc.)"),
    voice: str = Form("alloy", description="TTS voice: alloy, echo, fable, onyx, nova, shimmer"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(check_usage_limit_dependency),
):
    """
    Capture voice: upload audio -> transcribe (Whisper) -> LLM -> TTS -> stream audio back.
    Returns response with headers X-Transcript and X-Response-Text (URL-encoded), body = audio/mpeg stream.
    """
    from urllib.parse import quote

    if not audio.content_type and not audio.filename:
        raise HTTPException(status_code=400, detail="Audio file required")
    content = await audio.read()
    if len(content) > VOICE_SPEAK_MAX_BYTES:
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")
    if len(content) < 100:
        raise HTTPException(status_code=400, detail="Audio too short to transcribe")

    chat_service = ChatService(db)
    try:
        transcript_text, response_text, tokens_used, audio_stream = await chat_service.speak_from_audio(
            audio_bytes=content,
            audio_filename=audio.filename or "audio.webm",
            voice=voice.strip() or "alloy",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if tokens_used:
        usage_service = UsageService(db)
        await usage_service.record_usage(
            user_id=current_user["user_id"],
            tokens_used=tokens_used,
        )

    headers = {
        "X-Transcript": quote(transcript_text),
        "X-Response-Text": quote(response_text),
        "Content-Type": "audio/mpeg",
    }

    return StreamingResponse(
        audio_stream,
        media_type="audio/mpeg",
        headers=headers,
    )


@router.post("/stream")
async def send_message_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(check_usage_limit_dependency)
):
    """
    Send a chat message and get streaming AI response via Server-Sent Events.
    
    Returns a stream of SSE events:
    - `start`: Initial event with context type
    - `chunk`: Text chunks as they arrive from the AI
    - `sources`: Knowledge base sources used (if requested)
    - `done`: Final event with message ID and token count
    - `error`: Error event if something goes wrong
    
    Example client usage:
    ```javascript
    const eventSource = new EventSource('/api/v1/chat/stream?...');
    eventSource.addEventListener('chunk', (e) => {
        const data = JSON.parse(e.data);
        appendToResponse(data.content);
    });
    ```
    """
    # Convert conversation history
    history = convert_conversation_history(request.conversation_history)
    
    # Create streaming response
    chat_service = ChatService(db)
    
    async def generate():
        """Generate SSE events from the chat stream."""
        async for event in chat_service.process_message_stream(
            user_id=current_user["user_id"],
            message=request.message,
            conversation_history=history,
            include_sources=request.include_sources,
            user_tier=current_user["tier"]
        ):
            yield event
        
        # Record usage after streaming completes
        # Note: Actual token count tracked in the service
        await usage_service.record_usage(
            user_id=current_user["user_id"],
            tokens_used=0  # Will be updated from stored message
        )
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.get("/conversations", response_model=ListConversationsResponse)
@handle_service_errors
async def list_conversations(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List conversations (sessions) for the current user, newest first."""
    chat_service = ChatService(db)
    conversations, has_more = await chat_service.get_conversations(
        user_id=current_user["user_id"],
        limit=limit,
        offset=offset,
    )
    return ListConversationsResponse(
        conversations=[ConversationSummary.model_validate(c) for c in conversations],
        total_count=len(conversations),
        has_more=has_more,
    )


@router.get("/conversations/{conversation_id}/messages", response_model=ConversationMessagesResponse)
@handle_service_errors
async def get_conversation_messages(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get all messages in one conversation (full thread)."""
    chat_service = ChatService(db)
    messages = await chat_service.get_conversation_messages(
        user_id=current_user["user_id"],
        conversation_id=conversation_id,
    )
    if messages is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationMessagesResponse(
        conversation_id=conversation_id,
        messages=messages,
        total_count=len(messages),
    )


@router.get("/history", response_model=ChatHistoryResponse)
@handle_service_errors
async def get_chat_history(
    limit: int = Query(CHAT_HISTORY_DEFAULT_LIMIT, ge=1, le=CHAT_HISTORY_MAX_LIMIT),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get chat history for the current user (flat; legacy)."""
    chat_service = ChatService(db)
    messages = await chat_service.get_chat_history(
        user_id=current_user["user_id"],
        limit=limit + 1,
        offset=offset
    )
    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]
    return ChatHistoryResponse(
        messages=messages,
        total_count=len(messages),
        has_more=has_more
    )


@router.get("/context")
async def get_conversation_context(
    message_count: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get recent conversation for continuing a chat."""
    chat_service = ChatService(db)
    context = await chat_service.get_conversation_context(
        user_id=current_user["user_id"],
        message_count=message_count
    )
    return {"conversation_history": context}


@router.delete("/history")
async def clear_chat_history(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Clear all chat history for the current user."""
    chat_service = ChatService(db)
    deleted = await chat_service.clear_chat_history(current_user["user_id"])
    return {"message": f"Deleted {deleted} messages", "deleted_count": deleted}


# =============================================================================
# WebSocket Endpoint for Real-Time Chat
# =============================================================================

@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for real-time bidirectional chat.
    
    Supports:
    - Real-time message sending/receiving
    - Streaming AI responses
    - Connection management
    
    Message Format (Client → Server):
    ```json
    {
        "type": "message",
        "content": "user message text",
        "token": "jwt_access_token",
        "conversation_history": [...]
    }
    ```
    
    Message Format (Server → Client):
    ```json
    {
        "type": "start" | "chunk" | "sources" | "done" | "error",
        "data": {...}
    }
    ```
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    user_id = None
    user_tier = None
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "message":
                # Extract token and verify user
                token = data.get("token")
                if not token:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": "Authentication required"}
                    })
                    continue
                
                # Verify token and get user
                from app.core.security import decode_access_token
                from app.db.database import get_db
                
                payload = decode_access_token(token)
                if not payload:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": "Invalid or expired token"}
                    })
                    continue
                
                user_id = payload.get("user_id")
                user_tier = payload.get("tier", "basic")
                
                # Get database session
                from app.db.database import AsyncSessionLocal
                async with AsyncSessionLocal() as db:
                    # Initialize services
                    chat_service = ChatService(db)
                    usage_service = UsageService(db)
                    
                    # Check usage limits
                    try:
                        await usage_service.check_usage_limit(user_id, user_tier)
                    except UsageLimitExceededError as e:
                        await websocket.send_json({
                            "type": "error",
                            "data": e.to_dict()
                        })
                        continue
                    
                    # Get message content
                    message_content = data.get("content", "")
                    # Note: conversation_history from WebSocket is already in dict format
                    conversation_history = data.get("conversation_history", [])
                    include_sources = data.get("include_sources", False)
                    
                    if not message_content:
                        await websocket.send_json({
                            "type": "error",
                            "data": {"message": "Message content is required"}
                        })
                        continue
                    
                    # Send start event
                    await websocket.send_json({
                        "type": "start",
                        "data": {
                            "message": "Processing your message...",
                            "context_type": "processing"
                        }
                    })
                    
                    # Process message with streaming
                    full_response = ""
                    sources = []
                    
                    async for event in chat_service.process_message_stream(
                        user_id=user_id,
                        message=message_content,
                        conversation_history=conversation_history,
                        include_sources=include_sources,
                        user_tier=user_tier
                    ):
                        # Parse SSE event and send as WebSocket message
                        if event.startswith("event: "):
                            lines = event.strip().split("\n")
                            event_type = None
                            event_data = None
                            
                            for line in lines:
                                if line.startswith("event: "):
                                    event_type = line[7:]
                                elif line.startswith("data: "):
                                    event_data = json.loads(line[6:])
                            
                            if event_type and event_data:
                                # Send chunk events in real-time
                                if event_type == "chunk":
                                    full_response += event_data.get("content", "")
                                    await websocket.send_json({
                                        "type": "chunk",
                                        "data": event_data
                                    })
                                elif event_type == "sources":
                                    sources = event_data.get("sources", [])
                                    await websocket.send_json({
                                        "type": "sources",
                                        "data": event_data
                                    })
                                elif event_type == "done":
                                    # Record usage
                                    await usage_service.record_usage(
                                        user_id=user_id,
                                        tokens_used=event_data.get("tokens_used", 0)
                                    )
                                    await websocket.send_json({
                                        "type": "done",
                                        "data": event_data
                                    })
                                elif event_type == "error":
                                    await websocket.send_json({
                                        "type": "error",
                                        "data": event_data
                                    })
                
            elif message_type == "ping":
                # Heartbeat/ping
                await websocket.send_json({"type": "pong"})
            
            elif message_type == "close":
                # Client-initiated close
                break
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": f"Unknown message type: {message_type}"}
                })
    
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "data": {"message": "An error occurred processing your message"}
            })
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
