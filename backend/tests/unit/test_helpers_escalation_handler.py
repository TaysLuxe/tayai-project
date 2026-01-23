"""
Unit tests for escalation handler helper
"""
import pytest
from app.services.helpers.escalation_handler import (
    should_escalate_to_paid,
    determine_escalation_offer,
)
from app.core.prompts.context import ConversationContext
from app.services.rag_service import ContextResult, Source


class TestShouldEscalateToPaid:
    """Tests for should_escalate_to_paid function."""
    
    def test_escalates_personal_business_question(self):
        question = "Can you audit my business and help me fix my pricing?"
        context_type = ConversationContext.BUSINESS_MENTORSHIP
        context_result = ContextResult(
            context="Some context",
            sources=[Source(title="Test", content="Content", score=0.8)],
            total_matches=1,
        )
        
        result = should_escalate_to_paid(question, context_type, context_result)
        assert result is not None
        assert result["should_escalate"] is True
        assert result["offer"] in ["mentorship", "course", "masterclass"]
    
    def test_escalates_strategic_question(self):
        question = "I need a complete business strategy overhaul"
        context_type = ConversationContext.BUSINESS_MENTORSHIP
        context_result = ContextResult(
            context="Some context",
            sources=[Source(title="Test", content="Content", score=0.8)],
            total_matches=1,
        )
        
        result = should_escalate_to_paid(question, context_type, context_result)
        assert result is not None
        assert result["should_escalate"] is True
    
    def test_no_escalation_for_simple_question(self):
        question = "What is a wig?"
        context_type = ConversationContext.GENERAL
        context_result = ContextResult(
            context="Some context",
            sources=[Source(title="Test", content="Content", score=0.8)],
            total_matches=1,
        )
        
        result = should_escalate_to_paid(question, context_type, context_result)
        assert result is None
    
    def test_escalates_with_missing_kb_and_personal(self):
        question = "Can you help me with my specific pricing structure?"
        context_type = ConversationContext.BUSINESS_MENTORSHIP
        context_result = ContextResult(
            context="",
            sources=[],
            total_matches=0,
        )
        missing_kb_data = {
            "missing_detail": "pricing structure",
            "suggested_namespace": "business_foundations",
        }
        
        result = should_escalate_to_paid(question, context_type, context_result, missing_kb_data)
        assert result is not None
        assert result["should_escalate"] is True


class TestDetermineEscalationOffer:
    """Tests for determine_escalation_offer function."""
    
    def test_mentorship_for_business_context(self):
        question = "Help me with my business"
        context_type = ConversationContext.BUSINESS_MENTORSHIP
        offer = determine_escalation_offer(question, context_type, 3, 2)
        assert offer == "mentorship"
    
    def test_course_for_technique_question(self):
        question = "How do I learn this technique?"
        context_type = ConversationContext.HAIR_EDUCATION
        offer = determine_escalation_offer(question, context_type, 2, 0)
        assert offer in ["course", "tutorial"]
    
    def test_mentorship_for_high_personal_score(self):
        question = "Help me"
        context_type = ConversationContext.GENERAL
        offer = determine_escalation_offer(question, context_type, 3, 2)
        assert offer == "mentorship"
    
    def test_masterclass_for_strategy(self):
        question = "I need a complete strategy"
        context_type = ConversationContext.BUSINESS_MENTORSHIP
        offer = determine_escalation_offer(question, context_type, 2, 0)
        assert offer in ["mentorship", "masterclass"]
