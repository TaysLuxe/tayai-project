"""
Chat Service - Business logic for chat operations with RAG

Handles:
1. Processing user messages with RAG-enhanced context
2. Managing conversation history
3. Interacting with OpenAI API
4. Storing chat messages
5. Streaming responses via SSE
"""
import logging
import json
from typing import List, Dict, Optional, AsyncGenerator, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete

from app.core.config import settings
from app.core.clients import get_openai_client
from app.core.performance import cache_result, measure_performance, optimize_query
from app.core.constants import (
    MAX_CONVERSATION_HISTORY,
    DEFAULT_TEMPERATURE,
    DEFAULT_MAX_TOKENS,
    DEFAULT_TOP_K,
    DEFAULT_SCORE_THRESHOLD,
    CHAT_HISTORY_DEFAULT_LIMIT,
)
from app.core.prompts import (
    get_system_prompt,
    get_context_injection_prompt,
    detect_conversation_context,
    ConversationContext,
    FALLBACK_RESPONSES
)
from app.db.models import ChatMessage, MissingKBItem, QuestionLog, EscalationLog
from app.services.rag_service import RAGService, ContextResult
from app.schemas.chat import ChatResponse
from app.services.helpers import (
    detect_missing_kb,
    suggest_namespace,
    should_escalate_to_paid,
    determine_escalation_offer,
    generate_escalation_text,
    add_escalation_to_response,
    generate_missing_kb_response,
    generate_workaround,
    generate_upload_guidance,
)
import re
from datetime import datetime

logger = logging.getLogger(__name__)


class ChatService:
    """Service for chat-related operations."""
    
    # Configuration (using constants)
    MAX_HISTORY = MAX_CONVERSATION_HISTORY
    TEMPERATURE = DEFAULT_TEMPERATURE
    MAX_TOKENS = DEFAULT_MAX_TOKENS
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag_service = RAGService(db=db)
    
    # -------------------------------------------------------------------------
    # Message Processing
    # -------------------------------------------------------------------------
    
    @measure_performance
    async def process_message(
        self,
        user_id: int,
        message: str,
        conversation_history: Optional[List[Dict]] = None,
        include_sources: bool = False,
        user_tier: Optional[str] = None
    ) -> ChatResponse:
        """
        Process a chat message using RAG and return AI response.
        
        Args:
            user_id: The user's ID
            message: The user's message
            conversation_history: Previous messages in conversation
            include_sources: Whether to include source info
        
        Returns:
            ChatResponse with AI response and metadata
        """
        try:
            # Detect context type
            context_type = detect_conversation_context(message)
            logger.info(f"Context: {context_type.value} for: {message[:50]}...")
            
            # Retrieve RAG context
            context_result = await self.rag_service.retrieve_context(
                query=message,
                top_k=DEFAULT_TOP_K,
                score_threshold=DEFAULT_SCORE_THRESHOLD,
                include_sources=True
            )
            
            # Extract context string
            context = (
                context_result.context 
                if isinstance(context_result, ContextResult) 
                else context_result
            )
            
            # Detect problem category for Session Intent Logic
            problem_category = detect_problem_category(message)
            logger.info(f"Problem category: {problem_category.value} for: {message[:50]}...")
            
            # Build messages and call API
            messages = self._build_messages(
                message, context, conversation_history, context_type, user_tier
            )
            
            response = await get_openai_client().chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=self.TEMPERATURE,
                max_tokens=self.MAX_TOKENS
            )
            
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            # Check if question needs escalation to paid offerings FIRST
            # BUT: Don't escalate for paid users - they already have access
            # Only escalate for free/trial users
            escalation_data = None
            if not user_tier or user_tier.lower() not in ["vip", "elite", "paid", "premium"]:
                # Free users: Check for escalation
                escalation_data = should_escalate_to_paid(message, context_type, context_result, None)
            
            # Check if response indicates missing knowledge BEFORE sending to user
            missing_kb_data = detect_missing_kb(message, ai_response, context_result)
            
            # Re-check escalation with missing KB context if needed (may strengthen case for escalation)
            # Only for free users
            if missing_kb_data and not escalation_data and (not user_tier or user_tier.lower() not in ["vip", "elite", "paid", "premium"]):
                escalation_data = should_escalate_to_paid(message, context_type, context_result, missing_kb_data)
            
            # If missing KB detected, replace response with better one (maintains vibe, provides workaround)
            if missing_kb_data:
                logger.info(f"Missing KB detected for user {user_id}, replacing response gracefully")
                original_response = ai_response  # Keep original for logging
                ai_response = generate_missing_kb_response(
                    message, 
                    missing_kb_data, 
                    context_type,
                    context_result,
                    escalation_data  # Include escalation info if applicable
                )
                # Update missing_kb_data with original response for logging
                missing_kb_data["original_response"] = original_response
            elif escalation_data:
                # Even if KB exists, escalate if question needs deep personalized help
                logger.info(f"Escalation opportunity detected for user {user_id} (offer: {escalation_data.get('offer')})")
                ai_response = add_escalation_to_response(ai_response, escalation_data, message)
            else:
                missing_kb_data = None
            
            # Save to database (save the improved response, not the original "I don't know")
            chat_message = ChatMessage(
                user_id=user_id,
                message=message,
                response=ai_response,
                tokens_used=tokens_used
            )
            self.db.add(chat_message)
            await self.db.commit()
            await self.db.refresh(chat_message)
            
            logger.info(f"Processed message for user {user_id}, tokens: {tokens_used}")
            
            # Log escalation if it happened (after chat_message is saved)
            if escalation_data and escalation_data.get("should_escalate"):
                await self._log_escalation(
                    user_id=user_id,
                    question=message,
                    escalation_data=escalation_data,
                    context_type=context_type,
                    user_tier=user_tier,
                    chat_message_id=chat_message.id
                )
            
            # Log question and missing KB items (async logging)
            # Pass missing_kb_data if detected so it can be logged
            await self._log_question_and_missing_kb(
                user_id=user_id,
                question=message,
                ai_response=ai_response,
                context_type=context_type,
                context_result=context_result,
                user_tier=user_tier,
                tokens_used=tokens_used,
                missing_kb_data=missing_kb_data  # Pass detected missing KB data
            )
            
            # Build response
            result = ChatResponse(
                response=ai_response,
                tokens_used=tokens_used,
                message_id=chat_message.id
            )
            
            if include_sources and isinstance(context_result, ContextResult):
                result.sources = context_result.sources
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return ChatResponse(
                response=FALLBACK_RESPONSES["error_graceful"],
                tokens_used=0,
                message_id=None
            )
    
    def _build_messages(
        self,
        user_message: str,
        context: str,
        history: Optional[List[Dict]],
        context_type: ConversationContext,
        user_tier: Optional[str] = None
    ) -> List[Dict]:
        """Build the message array for OpenAI API."""
        from app.core.prompts.context import is_new_session
        
        messages = [
            {"role": "system", "content": get_system_prompt(
                context_type=context_type,
                user_tier=user_tier,
                conversation_history=history
            )}
        ]
        
        # Add RAG context
        if context:
            messages.append({
                "role": "system",
                "content": get_context_injection_prompt(context, user_message)
            })
        
        # Add onboarding greeting if new session
        if is_new_session(history):
            from app.core.prompts.persona import DEFAULT_PERSONA
            greeting = DEFAULT_PERSONA.onboarding_greeting
            messages.append({
                "role": "assistant",
                "content": greeting
            })
        
        # Add conversation history
        if history:
            for msg in history[-self.MAX_HISTORY:]:
                if self._is_valid_message(msg):
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
        
        # Add current message
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    @staticmethod
    def _is_valid_message(msg: Dict) -> bool:
        """Validate a message dictionary."""
        return (
            isinstance(msg, dict)
            and msg.get("role") in ("user", "assistant", "system")
            and "content" in msg
        )
    
    # -------------------------------------------------------------------------
    # Chat History
    # -------------------------------------------------------------------------
    
    @measure_performance
    async def get_chat_history(
        self,
        user_id: int,
        limit: int = CHAT_HISTORY_DEFAULT_LIMIT,
        offset: int = 0
    ) -> List[ChatMessage]:
        """Get chat history for a user."""
        # Optimize query with proper indexing and limits
        query = select(ChatMessage).where(ChatMessage.user_id == user_id)
        query = query.order_by(desc(ChatMessage.created_at))
        query = optimize_query(query, limit=limit, offset=offset)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    @measure_performance
    async def get_conversation_context(
        self,
        user_id: int,
        message_count: int = 5
    ) -> List[Dict]:
        """Get recent conversation as context for new messages."""
        # Use optimized query with limit
        messages = await self.get_chat_history(user_id, limit=message_count)
        
        # Convert to conversation format (chronological order)
        context = []
        for msg in reversed(messages):
            context.append({"role": "user", "content": msg.message})
            if msg.response:
                context.append({"role": "assistant", "content": msg.response})
        
        return context
    
    async def clear_chat_history(self, user_id: int) -> int:
        """Clear all chat history for a user."""
        # Use bulk delete for better performance
        result = await self.db.execute(
            delete(ChatMessage).where(ChatMessage.user_id == user_id)
        )
        count = result.rowcount or 0
        
        await self.db.commit()
        logger.info(f"Cleared {count} messages for user {user_id}")
        
        return count
    
    # -------------------------------------------------------------------------
    # Persona Testing
    # -------------------------------------------------------------------------
    
    async def test_persona_response(
        self,
        test_message: str,
        context_type: Optional[ConversationContext] = None,
        user_tier: Optional[str] = None
    ) -> Dict:
        """
        Test AI response without saving to database.
        
        Args:
            test_message: The test message
            context_type: Optional forced context type
        
        Returns:
            Dictionary with response and metadata
        """
        # Detect context if not provided
        if context_type is None:
            context_type = detect_conversation_context(test_message)
        
        # Get RAG context
        context_result = await self.rag_service.retrieve_context(
            query=test_message,
            top_k=DEFAULT_TOP_K,
            include_sources=True
        )
        
        context = (
            context_result.context 
            if isinstance(context_result, ContextResult) 
            else context_result
        )
        
        # Build messages and call API
        messages = self._build_messages(test_message, context, None, context_type, user_tier)
        
        response = await get_openai_client().chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=self.TEMPERATURE,
            max_tokens=self.MAX_TOKENS
        )
        
        sources = (
            context_result.sources 
            if isinstance(context_result, ContextResult) 
            else []
        )
        
        return {
            "response": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens,
            "context_type": context_type.value,
            "sources": sources,
            "system_prompt_preview": messages[0]["content"][:500] + "..."
        }
    
    # -------------------------------------------------------------------------
    # Streaming Responses (SSE)
    # -------------------------------------------------------------------------
    
    async def process_message_stream(
        self,
        user_id: int,
        message: str,
        conversation_history: Optional[List[Dict]] = None,
        include_sources: bool = False,
        user_tier: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process a chat message and stream the response via SSE.
        
        Yields SSE-formatted events:
        - 'start': Initial event with context info
        - 'chunk': Text chunks as they arrive
        - 'sources': Source information (if requested)
        - 'done': Final event with message ID and token count
        - 'error': Error event if something goes wrong
        
        Args:
            user_id: The user's ID
            message: The user's message
            conversation_history: Previous messages in conversation
            include_sources: Whether to include source info
            
        Yields:
            SSE-formatted event strings
        """
        try:
            # Detect context type
            context_type = detect_conversation_context(message)
            
            # Detect problem category for Session Intent Logic
            problem_category = detect_problem_category(message)
            logger.info(f"[Stream] Context: {context_type.value}, Problem category: {problem_category.value} for: {message[:50]}...")
            
            # Send start event
            yield self._format_sse_event("start", {
                "context_type": context_type.value,
                "problem_category": problem_category.value,
                "message": "Processing your message..."
            })
            
            # Retrieve RAG context - adjust based on tier
            if user_tier and user_tier.lower() in ["vip", "elite", "paid", "premium"]:
                top_k = DEFAULT_TOP_K * 2
                score_threshold = DEFAULT_SCORE_THRESHOLD * 0.9
            else:
                top_k = DEFAULT_TOP_K
                score_threshold = DEFAULT_SCORE_THRESHOLD
            
            context_result = await self.rag_service.retrieve_context(
                query=message,
                top_k=top_k,
                score_threshold=score_threshold,
                include_sources=True
            )
            
            # Extract context string
            context = (
                context_result.context 
                if isinstance(context_result, ContextResult) 
                else context_result
            )
            
            # Build messages
            messages = self._build_messages(
                message, context, conversation_history, context_type, user_tier
            )
            
            # Call OpenAI with streaming
            stream = await get_openai_client().chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=self.TEMPERATURE,
                max_tokens=self.MAX_TOKENS,
                stream=True
            )
            
            # Collect full response for saving and checking
            full_response = ""
            
            # Stream chunks and collect response
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield self._format_sse_event("chunk", {"content": content})
            
            # Check if response indicates missing knowledge BEFORE saving
            missing_kb_data = detect_missing_kb(message, full_response, context_result)
            
            # If missing KB detected, replace response (but we've already streamed it)
            # For streaming, we'll save the graceful replacement and log the issue
            if missing_kb_data:
                logger.info(f"[Stream] Missing KB detected for user {user_id}, will save graceful replacement")
                original_response = full_response
                full_response = generate_missing_kb_response(
                    message, 
                    missing_kb_data, 
                    context_type,
                    context_result,
                    escalation_data  # Include escalation info if applicable
                )
                missing_kb_data["original_response"] = original_response
                # Note: User already saw original, but we save the better version for future reference
            else:
                missing_kb_data = None
            
            # Estimate tokens (actual count not available in streaming)
            estimated_tokens = len(full_response.split()) * 1.3  # Rough estimate
            
            # Save to database (save the improved response if replacement was made)
            chat_message = ChatMessage(
                user_id=user_id,
                message=message,
                response=full_response,
                tokens_used=int(estimated_tokens)
            )
            self.db.add(chat_message)
            await self.db.commit()
            await self.db.refresh(chat_message)
            
            # Log question and missing KB items (async logging)
            await self._log_question_and_missing_kb(
                user_id=user_id,
                question=message,
                ai_response=full_response,
                context_type=context_type,
                context_result=context_result,
                user_tier=user_tier,
                tokens_used=int(estimated_tokens),
                missing_kb_data=missing_kb_data
            )
            
            # Send sources if requested
            if include_sources and isinstance(context_result, ContextResult):
                sources_data = [
                    {
                        "title": s.title,
                        "category": s.category,
                        "score": s.score,
                        "chunk_id": s.chunk_id
                    }
                    for s in context_result.sources
                ]
                yield self._format_sse_event("sources", {"sources": sources_data})
            
            # Send done event
            yield self._format_sse_event("done", {
                "message_id": chat_message.id,
                "tokens_used": int(estimated_tokens)
            })
            
            logger.info(f"[Stream] Completed for user {user_id}, tokens: {estimated_tokens}")
            
        except Exception as e:
            logger.error(f"[Stream] Error: {e}")
            yield self._format_sse_event("error", {
                "message": FALLBACK_RESPONSES["error_graceful"]
            })
    
    @staticmethod
    def _format_sse_event(event_type: str, data: dict) -> str:
        """
        Format data as an SSE event.
        
        Args:
            event_type: The event name (start, chunk, done, error)
            data: The event data
            
        Returns:
            SSE-formatted string
        """
        json_data = json.dumps(data)
        return f"event: {event_type}\ndata: {json_data}\n\n"
    
    # -------------------------------------------------------------------------
    # Logging & Analytics
    # -------------------------------------------------------------------------
    
    async def _log_question_and_missing_kb(
        self,
        user_id: int,
        question: str,
        ai_response: str,
        context_type: ConversationContext,
        context_result: ContextResult,
        user_tier: Optional[str] = None,
        tokens_used: int = 0,
        missing_kb_data: Optional[Dict] = None
    ) -> None:
        """
        Log the question and detect/log missing KB items.
        
        This creates the knowledge feedback loop:
        User → Tay AI detects missing info → logs it → Annika uploads → PostgreSQL pgvector updates → Tay AI gets smarter
        """
        try:
            # Always log the question
            normalized_question = self._normalize_question(question)
            has_sources = isinstance(context_result, ContextResult) and len(context_result.sources) > 0
            
            # Determine category from context
            category = self._determine_category(question, context_type)
            
            question_log = QuestionLog(
                user_id=user_id,
                question=question,
                normalized_question=normalized_question,
                context_type=context_type.value,
                category=category,
                user_tier=user_tier,
                tokens_used=tokens_used,
                has_sources=has_sources,
                extra_metadata={
                    "rag_score_avg": (
                        sum(s.score for s in context_result.sources) / len(context_result.sources)
                        if has_sources else None
                    ),
                    "sources_count": len(context_result.sources) if has_sources else 0
                }
            )
            self.db.add(question_log)
            
            # Use provided missing_kb_data if available, otherwise detect
            if not missing_kb_data:
                missing_kb_data = detect_missing_kb(question, ai_response, context_result)
            
            if missing_kb_data:
                # Use original response for preview if available (before graceful replacement)
                response_preview = missing_kb_data.get("original_response", ai_response)[:500]
                
                # Generate upload guidance for dashboard
                namespace = missing_kb_data.get("suggested_namespace", "faqs")
                upload_guidance = generate_upload_guidance(question, namespace, missing_kb_data)
                
                missing_kb_item = MissingKBItem(
                    user_id=user_id,
                    question=question,
                    missing_detail=missing_kb_data["missing_detail"],
                    ai_response_preview=response_preview,  # Original "I don't know" response
                    suggested_namespace=namespace,
                    extra_metadata={
                        "context_type": context_type.value,
                        "user_tier": user_tier,
                        "rag_score": missing_kb_data.get("rag_score"),
                        "has_sources": has_sources,
                        "replaced_with_graceful_response": True,  # Flag that we replaced it
                        "upload_guidance": upload_guidance  # What to upload to resolve this
                    }
                )
                self.db.add(missing_kb_item)
                logger.info(f"Missing KB item logged: {missing_kb_data['missing_detail'][:100]}")
            
            # Commit both logs
            await self.db.commit()
            
        except Exception as e:
            # Don't fail the request if logging fails
            logger.error(f"Error logging question/missing KB: {e}")
    
    async def _log_escalation(
        self,
        user_id: int,
        question: str,
        escalation_data: Dict,
        context_type: ConversationContext,
        user_tier: Optional[str] = None,
        chat_message_id: Optional[int] = None
    ) -> None:
        """
        Log escalation to paid offerings for tracking and conversion analysis.
        
        Creates the escalation feedback loop:
        User Question → Escalation → Logged → Track Conversion → Optimize
        """
        try:
            escalation_log = EscalationLog(
                user_id=user_id,
                question=question,
                offer=escalation_data.get("offer", "mentorship"),
                escalation_reason=escalation_data.get("reason", "personalized_help"),
                context_type=context_type.value,
                user_tier=user_tier,
                chat_message_id=chat_message_id,
                extra_metadata={
                    "personal_score": escalation_data.get("personal_score", 0),
                    "strategic_score": escalation_data.get("strategic_score", 0),
                    "advanced_score": escalation_data.get("advanced_score", 0),
                    "total_score": escalation_data.get("total_score", 0),
                    "template_index": escalation_data.get("template_index", 0)
                }
            )
            self.db.add(escalation_log)
            await self.db.commit()
            logger.info(f"Escalation logged: user {user_id}, offer: {escalation_data.get('offer')}, reason: {escalation_data.get('reason')}")
        except Exception as e:
            # Don't fail the request if logging fails
            logger.error(f"Error logging escalation: {e}")
    
    # Note: Helper methods have been extracted to app.services.helpers module
    # for better organization and reusability. See:
    # - missing_kb_detector.py
    # - escalation_handler.py
    # - response_generator.py
    # - namespace_mapper.py
    
    @staticmethod
    def _normalize_question(question: str) -> str:
        """
        Normalize a question for grouping similar questions.
        
        This helps identify top asked questions even with slight variations.
        """
        # Convert to lowercase
        normalized = question.lower().strip()
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Remove common question prefixes
        prefixes = ["how do i", "how can i", "what is", "what are", "when should", "where can"]
        for prefix in prefixes:
            if normalized.startswith(prefix):
                normalized = normalized[len(prefix):].strip()
                break
        
        # Remove trailing question marks and punctuation
        normalized = normalized.rstrip('?.,!')
        
        return normalized
    
    @staticmethod
    def _determine_category(question: str, context_type: ConversationContext) -> Optional[str]:
        """Determine question category based on content and context."""
        question_lower = question.lower()
        
        # Map context types to categories
        context_category_map = {
            ConversationContext.HAIR_EDUCATION: "techniques",
            ConversationContext.BUSINESS_MENTORSHIP: "business",
            ConversationContext.PRODUCT_RECOMMENDATION: "vendor",
            ConversationContext.TROUBLESHOOTING: "techniques",
            ConversationContext.GENERAL: None
        }
        
        category = context_category_map.get(context_type)
        
        # Override with specific keywords if found
        if "vendor" in question_lower or "supplier" in question_lower:
            category = "vendor"
        elif "price" in question_lower or "cost" in question_lower:
            category = "business"
        elif "content" in question_lower or "reel" in question_lower:
            category = "content"
        
        return category
