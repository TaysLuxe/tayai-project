"""
Unit tests for missing KB detector helper
"""
import pytest
from app.services.helpers.missing_kb_detector import detect_missing_kb
from app.services.rag_service import ContextResult, Source


class TestDetectMissingKB:
    """Tests for detect_missing_kb function."""
    
    def test_detects_missing_indicator_in_response(self):
        question = "How do I price wigs?"
        ai_response = "I don't have that info in my brain yet"
        context_result = ContextResult(
            context="Some context",
            sources=[Source(title="Test", content="Content", score=0.8)],
            total_matches=1,
        )
        
        result = detect_missing_kb(question, ai_response, context_result)
        assert result is not None
        assert "missing_detail" in result
        assert "suggested_namespace" in result
    
    def test_detects_low_rag_scores(self):
        question = "How do I price wigs?"
        ai_response = "Here's how to price your wigs..."
        context_result = ContextResult(
            context="Some context",
            sources=[Source(title="Test", content="Content", score=0.5)],
            total_matches=1,
        )
        
        result = detect_missing_kb(question, ai_response, context_result)
        assert result is not None
    
    def test_detects_empty_sources(self):
        question = "How do I price wigs?"
        ai_response = "Here's how to price your wigs..."
        context_result = ContextResult(
            context="",
            sources=[],
            total_matches=0,
        )
        
        result = detect_missing_kb(question, ai_response, context_result)
        assert result is not None
    
    def test_no_missing_kb_when_good_response(self):
        question = "How do I price wigs?"
        ai_response = "Here's how to price your wigs based on costs..."
        context_result = ContextResult(
            context="Good context about pricing",
            sources=[Source(title="Pricing Guide", content="Content", score=0.9)],
            total_matches=1,
        )
        
        result = detect_missing_kb(question, ai_response, context_result)
        assert result is None
    
    def test_extracts_missing_detail(self):
        question = "How do I price wigs?"
        ai_response = "I don't have that specific pricing structure in my brain yet"
        context_result = ContextResult(
            context="",
            sources=[],
            total_matches=0,
        )
        
        result = detect_missing_kb(question, ai_response, context_result)
        assert result is not None
        assert "pricing" in result["missing_detail"].lower() or "price" in result["missing_detail"].lower()
    
    def test_includes_suggested_namespace(self):
        question = "How do I price my wigs?"
        ai_response = "I don't have that info"
        context_result = ContextResult(
            context="",
            sources=[],
            total_matches=0,
        )
        
        result = detect_missing_kb(question, ai_response, context_result)
        assert result is not None
        assert result["suggested_namespace"] in [
            "business_foundations",
            "vendor_knowledge",
            "faqs",
        ]
