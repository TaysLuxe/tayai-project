"""
Unit tests for context detection functions
"""
import pytest
from app.core.prompts.context import (
    ConversationContext,
    ProblemCategory,
    detect_conversation_context,
    detect_problem_category,
    is_first_message,
    is_new_session,
    should_add_accountability,
)


class TestDetectConversationContext:
    """Tests for detect_conversation_context function."""
    
    def test_hair_education_context(self):
        message = "How do I install a wig properly?"
        context = detect_conversation_context(message)
        assert context == ConversationContext.HAIR_EDUCATION
    
    def test_business_mentorship_context(self):
        message = "How should I price my services?"
        context = detect_conversation_context(message)
        assert context == ConversationContext.BUSINESS_MENTORSHIP
    
    def test_product_recommendation_context(self):
        message = "What shampoo should I use?"
        context = detect_conversation_context(message)
        assert context == ConversationContext.PRODUCT_RECOMMENDATION
    
    def test_troubleshooting_context(self):
        message = "My wig is falling off, what's wrong?"
        context = detect_conversation_context(message)
        assert context == ConversationContext.TROUBLESHOOTING
    
    def test_general_context(self):
        message = "Hello, how are you?"
        context = detect_conversation_context(message)
        assert context == ConversationContext.GENERAL
    
    def test_case_insensitive(self):
        message = "HOW DO I PRICE MY SERVICES?"
        context = detect_conversation_context(message)
        assert context == ConversationContext.BUSINESS_MENTORSHIP


class TestDetectProblemCategory:
    """Tests for detect_problem_category function."""
    
    def test_install_issue(self):
        message = "My wig installation is not working"
        category = detect_problem_category(message)
        assert category == ProblemCategory.INSTALL_ISSUE
    
    def test_vendor_issue(self):
        message = "I'm having problems with my vendor"
        category = detect_problem_category(message)
        assert category == ProblemCategory.VENDOR_ISSUE
    
    def test_pricing(self):
        message = "How much should I charge for this?"
        category = detect_problem_category(message)
        assert category == ProblemCategory.PRICING
    
    def test_content(self):
        message = "What should I post on Instagram?"
        category = detect_problem_category(message)
        assert category == ProblemCategory.CONTENT
    
    def test_business_model(self):
        message = "How should I structure my business?"
        category = detect_problem_category(message)
        assert category == ProblemCategory.BUSINESS_MODEL
    
    def test_mindset(self):
        message = "I'm feeling imposter syndrome"
        category = detect_problem_category(message)
        assert category == ProblemCategory.MINDSET
    
    def test_technique(self):
        message = "How do I learn lace melting?"
        category = detect_problem_category(message)
        assert category == ProblemCategory.TECHNIQUE
    
    def test_other(self):
        message = "Hello"
        category = detect_problem_category(message)
        assert category == ProblemCategory.OTHER


class TestIsFirstMessage:
    """Tests for is_first_message function."""
    
    def test_empty_history(self):
        assert is_first_message(None) is True
        assert is_first_message([]) is True
    
    def test_only_assistant_messages(self):
        history = [{"role": "assistant", "content": "Hello"}]
        assert is_first_message(history) is True
    
    def test_has_user_messages(self):
        history = [{"role": "user", "content": "Hello"}]
        assert is_first_message(history) is False


class TestIsNewSession:
    """Tests for is_new_session function."""
    
    def test_empty_history(self):
        assert is_new_session(None) is True
        assert is_new_session([]) is True
    
    def test_has_history(self):
        history = [{"role": "user", "content": "Hello"}]
        assert is_new_session(history) is False


class TestShouldAddAccountability:
    """Tests for should_add_accountability function."""
    
    def test_pricing_requires_accountability(self):
        message = "How should I price my services?"
        category = ProblemCategory.PRICING
        assert should_add_accountability(message, category) is True
    
    def test_business_model_requires_accountability(self):
        message = "How should I structure my business?"
        category = ProblemCategory.BUSINESS_MODEL
        assert should_add_accountability(message, category) is True
    
    def test_simple_question_no_accountability(self):
        message = "What is a wig?"
        category = ProblemCategory.OTHER
        assert should_add_accountability(message, category) is False
    
    def test_planning_keywords_require_accountability(self):
        message = "I need to plan my content strategy"
        category = ProblemCategory.CONTENT
        assert should_add_accountability(message, category) is True
