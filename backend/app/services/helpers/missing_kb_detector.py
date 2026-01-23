"""
Missing KB Detection Module

Handles detection of missing knowledge base items from AI responses.
Extracted from ChatService for better organization and reusability.
"""
import re
import logging
from typing import Dict, Optional

from app.services.rag_service import ContextResult
from .namespace_mapper import suggest_namespace as map_namespace

logger = logging.getLogger(__name__)


def detect_missing_kb(
    question: str,
    ai_response: str,
    context_result: ContextResult
) -> Optional[Dict]:
    """
    Detect if the AI response indicates missing knowledge.
    
    Looks for phrases like:
    - "isn't in my brain yet"
    - "don't have that info"
    - "not in my brain"
    - "I don't have"
    - Low RAG scores
    
    Args:
        question: The user's question
        ai_response: The AI's response
        context_result: The RAG context result
    
    Returns:
        dict with missing_detail and suggested_namespace if detected, None otherwise.
    """
    # Check for missing KB indicators in response
    missing_indicators = [
        r"isn't in my brain",
        r"not in my brain",
        r"don't have that",
        r"don't have this",
        r"don't have the",
        r"can't find",
        r"don't have access to",
        r"isn't available",
        r"not available in",
    ]
    
    response_lower = ai_response.lower()
    has_missing_indicator = any(re.search(pattern, response_lower) for pattern in missing_indicators)
    
    # Check RAG context quality
    has_good_sources = isinstance(context_result, ContextResult) and (
        len(context_result.sources) == 0 or
        any(s.score < 0.7 for s in context_result.sources)  # Low confidence scores
    )
    
    if has_missing_indicator or has_good_sources:
        # Extract missing detail from question and response
        missing_detail = question  # Start with the question
        
        # Try to extract more specific detail from response
        # Look for phrases after "isn't in my brain" or similar
        detail_patterns = [
            r"isn't in my brain[^.]*\.\s*([^.]*)",
            r"don't have that[^.]*\.\s*([^.]*)",
            r"don't have the ([^.]*)",
        ]
        
        for pattern in detail_patterns:
            match = re.search(pattern, response_lower)
            if match:
                missing_detail = f"{question} - Specifically: {match.group(1)}"
                break
        
            # Suggest namespace based on question content
            suggested_namespace = map_namespace(question)
        
        return {
            "missing_detail": missing_detail.strip(),
            "suggested_namespace": suggested_namespace,
            "rag_score": (
                min(s.score for s in context_result.sources) if 
                isinstance(context_result, ContextResult) and context_result.sources else None
            )
        }
    
    return None
