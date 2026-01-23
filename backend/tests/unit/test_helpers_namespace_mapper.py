"""
Unit tests for namespace mapper helper
"""
import pytest
from app.services.helpers.namespace_mapper import suggest_namespace


class TestSuggestNamespace:
    """Tests for suggest_namespace function."""
    
    def test_tutorials_technique_namespace(self):
        question = "How do I install a lace front wig?"
        namespace = suggest_namespace(question)
        assert namespace == "tutorials_technique"
    
    def test_vendor_knowledge_namespace(self):
        question = "What should I look for in a hair vendor?"
        namespace = suggest_namespace(question)
        assert namespace == "vendor_knowledge"
    
    def test_business_foundations_namespace(self):
        question = "How do I price my services?"
        namespace = suggest_namespace(question)
        assert namespace == "business_foundations"
    
    def test_content_playbooks_namespace(self):
        question = "What hooks should I use for my reels?"
        namespace = suggest_namespace(question)
        assert namespace == "content_playbooks"
    
    def test_mindset_accountability_namespace(self):
        question = "I'm struggling with imposter syndrome"
        namespace = suggest_namespace(question)
        assert namespace == "mindset_accountability"
    
    def test_offer_explanations_namespace(self):
        question = "What is included in the mentorship program?"
        namespace = suggest_namespace(question)
        assert namespace == "offer_explanations"
    
    def test_defaults_to_faqs(self):
        question = "Hello, how are you?"
        namespace = suggest_namespace(question)
        assert namespace == "faqs"
    
    def test_case_insensitive(self):
        question = "HOW DO I INSTALL A WIG?"
        namespace = suggest_namespace(question)
        assert namespace == "tutorials_technique"
    
    def test_multiple_keywords(self):
        question = "How do I install a wig and what vendor should I use?"
        namespace = suggest_namespace(question)
        assert namespace in ["tutorials_technique", "vendor_knowledge"]
