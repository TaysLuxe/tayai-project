"""
Namespace Mapping Module

Maps questions to appropriate knowledge base namespaces.
Extracted from ChatService for better organization and reusability.
"""
from typing import Optional


def suggest_namespace(question: str) -> Optional[str]:
    """
    Suggest a KB namespace based on question content.
    
    Args:
        question: The user's question
    
    Returns:
        Suggested namespace string, or "faqs" as default
    """
    question_lower = question.lower()
    
    # Comprehensive namespace keywords mapping aligned with KB structure
    namespace_keywords = {
        "tutorials_technique": [
            "install", "lace", "melting", "plucking", "tinting", "bleaching", 
            "wig construction", "bald cap", "maintenance", "troubleshooting",
            "beginner mistake", "product recommendation", "technique", "how to"
        ],
        "vendor_knowledge": [
            "vendor", "supplier", "hair vendor", "quality", "sample", "moq", 
            "shipping", "pricing", "bundle", "raw hair", "testing", "red flag",
            "order", "supplier communication"
        ],
        "business_foundations": [
            "price", "pricing", "profit", "margin", "shopify", "brand", "branding",
            "niche", "packaging", "refund", "policy", "customer experience",
            "business", "revenue", "cost"
        ],
        "content_playbooks": [
            "hook", "reel", "script", "story", "storytelling", "content", "caption",
            "post", "social media", "lifestyle", "pain point", "authority",
            "soft sell", "format", "reels"
        ],
        "mindset_accountability": [
            "confidence", "imposter", "perfection", "perfectionism", "block",
            "motivation", "fear", "consistency", "plateau", "growth", "accountability",
            "mindset", "stuck"
        ],
        "offer_explanations": [
            "tutorial", "mentorship", "course", "community", "masterclass", "trip",
            "offer", "program", "academy", "what is", "explain"
        ],
        "faqs": []  # Catch-all for general questions
    }
    
    # Score each namespace
    scores = {}
    for namespace, keywords in namespace_keywords.items():
        if namespace == "faqs":
            continue
        score = sum(1 for keyword in keywords if keyword in question_lower)
        if score > 0:
            scores[namespace] = score
    
    # Return highest scoring namespace, or FAQs as default
    if scores:
        return max(scores.items(), key=lambda x: x[1])[0]
    
    return "faqs"
