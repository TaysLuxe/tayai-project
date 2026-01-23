"""
Conversation Context Detection for TayAI

Handles detecting WHAT type of help the user needs based on their message.
This affects which specialized instructions TayAI uses to respond.
"""
from enum import Enum
from typing import Dict, List, Optional


class ConversationContext(str, Enum):
    """
    Types of conversation contexts that affect AI response behavior.
    
    Each context type triggers different specialized instructions
    to ensure TayAI responds appropriately.
    """
    HAIR_EDUCATION = "hair_education"
    BUSINESS_MENTORSHIP = "business_mentorship"
    PRODUCT_RECOMMENDATION = "product_recommendation"
    TROUBLESHOOTING = "troubleshooting"
    GENERAL = "general"


class ProblemCategory(str, Enum):
    """
    Specific problem categories for Session Intent Logic.
    
    Used to identify the exact type of problem the user is facing
    so Tay AI can provide targeted help.
    """
    INSTALL_ISSUE = "install_issue"
    VENDOR_ISSUE = "vendor_issue"
    PRICING = "pricing"
    CONTENT = "content"
    BUSINESS_MODEL = "business_model"
    MINDSET = "mindset"
    TECHNIQUE = "technique"
    OTHER = "other"


# Keywords used to detect conversation context
# These are matched against user messages to determine context type
CONTEXT_KEYWORDS: Dict[ConversationContext, List[str]] = {
    ConversationContext.HAIR_EDUCATION: [
        "hair", "curl", "braid", "style", "texture", "moisture", "protein",
        "wash", "condition", "detangle", "protective", "natural", "relaxed",
        "extension", "wig", "loc", "twist", "coil", "strand", "scalp", "growth"
    ],
    ConversationContext.BUSINESS_MENTORSHIP: [
        "business", "client", "price", "pricing", "marketing", "social media",
        "instagram", "booking", "salon", "brand", "money", "income", "profit",
        "customer", "service", "charge", "start", "grow", "scale", "invest"
    ],
    ConversationContext.PRODUCT_RECOMMENDATION: [
        "product", "recommend", "buy", "purchase", "ingredient", "shampoo",
        "conditioner", "oil", "cream", "gel", "spray", "serum", "mask", "treatment"
    ],
    ConversationContext.TROUBLESHOOTING: [
        "problem", "issue", "help", "wrong", "damage", "break", "dry", "brittle",
        "falling", "thinning", "not working", "failed", "mistake", "fix", "repair"
    ],
}


def detect_conversation_context(message: str) -> ConversationContext:
    """
    Detect the conversation context from a user message using keyword matching.
    
    This analyzes the user's message to determine what type of help they need,
    which then influences how TayAI responds.
    
    Args:
        message: The user's message text
    
    Returns:
        The detected ConversationContext type
    
    Example:
        >>> detect_conversation_context("How do I price my services?")
        ConversationContext.BUSINESS_MENTORSHIP
        
        >>> detect_conversation_context("My hair is breaking")
        ConversationContext.TROUBLESHOOTING
    """
    message_lower = message.lower()
    
    # Count keyword matches for each context
    scores: Dict[ConversationContext, int] = {}
    for context, keywords in CONTEXT_KEYWORDS.items():
        scores[context] = sum(1 for kw in keywords if kw in message_lower)
    
    # Find the context with highest score
    max_score = max(scores.values())
    
    if max_score == 0:
        return ConversationContext.GENERAL
    
    # Priority order for tie-breaking (most specific first)
    priority = [
        ConversationContext.TROUBLESHOOTING,
        ConversationContext.PRODUCT_RECOMMENDATION,
        ConversationContext.BUSINESS_MENTORSHIP,
        ConversationContext.HAIR_EDUCATION,
    ]
    
    for context in priority:
        if scores.get(context, 0) == max_score:
            return context
    
    return ConversationContext.GENERAL


def detect_problem_category(message: str) -> ProblemCategory:
    """
    Detect the specific problem category from user message.
    
    Used for Session Intent Logic to identify:
    - install issue
    - vendor issue
    - pricing
    - content
    - business model
    - mindset
    - technique
    
    Args:
        message: The user's message text
    
    Returns:
        The detected ProblemCategory
    """
    message_lower = message.lower()
    
    # Install issue keywords
    install_keywords = [
        "install", "installation", "lace", "melting", "glue", "tape",
        "wig", "not sticking", "lifting", "coming off", "install problem",
        "lace front", "install issue", "wig install"
    ]
    
    # Vendor issue keywords
    vendor_keywords = [
        "vendor", "supplier", "sourcing", "sample", "moq", "shipping",
        "quality", "hair supplier", "wholesale", "bulk order", "vendor problem",
        "supplier issue", "sourcing problem", "vendor testing"
    ]
    
    # Pricing keywords
    pricing_keywords = [
        "price", "pricing", "charge", "cost", "how much", "fee", "rate",
        "profit", "margin", "pricing strategy", "what should i charge",
        "how to price", "pricing model", "charge for"
    ]
    
    # Content keywords
    content_keywords = [
        "content", "reel", "post", "instagram", "social media", "caption",
        "hook", "storytelling", "content strategy", "what to post",
        "content plan", "reels", "stories", "content creation"
    ]
    
    # Business model keywords
    business_model_keywords = [
        "business model", "niche", "brand", "target market", "positioning",
        "business structure", "how to structure", "business plan",
        "branding", "positioning", "target audience"
    ]
    
    # Mindset keywords
    mindset_keywords = [
        "mindset", "confidence", "fear", "anxiety", "imposter", "perfectionism",
        "stuck", "blocked", "overwhelmed", "doubt", "scared", "nervous",
        "imposter syndrome", "self-doubt", "afraid", "worried"
    ]
    
    # Technique keywords
    technique_keywords = [
        "technique", "how to", "method", "process", "tutorial", "learn",
        "master", "practice", "skill", "trick", "tip", "teach me",
        "show me", "walk me through"
    ]
    
    # Score each category
    scores = {
        ProblemCategory.INSTALL_ISSUE: sum(1 for kw in install_keywords if kw in message_lower),
        ProblemCategory.VENDOR_ISSUE: sum(1 for kw in vendor_keywords if kw in message_lower),
        ProblemCategory.PRICING: sum(1 for kw in pricing_keywords if kw in message_lower),
        ProblemCategory.CONTENT: sum(1 for kw in content_keywords if kw in message_lower),
        ProblemCategory.BUSINESS_MODEL: sum(1 for kw in business_model_keywords if kw in message_lower),
        ProblemCategory.MINDSET: sum(1 for kw in mindset_keywords if kw in message_lower),
        ProblemCategory.TECHNIQUE: sum(1 for kw in technique_keywords if kw in message_lower),
    }
    
    # Find highest score
    max_score = max(scores.values())
    
    if max_score == 0:
        return ProblemCategory.OTHER
    
    # Return category with highest score
    for category, score in scores.items():
        if score == max_score:
            return category
    
    return ProblemCategory.OTHER


def is_first_message(conversation_history: Optional[List[Dict]]) -> bool:
    """
    Check if this is the first message in the conversation (after greeting).
    
    Args:
        conversation_history: Previous messages in conversation
    
    Returns:
        True if this is the first user message (after greeting)
    """
    if not conversation_history:
        return True
    
    # Count user messages (excluding system/assistant)
    user_messages = [
        msg for msg in conversation_history 
        if msg.get("role") == "user"
    ]
    
    return len(user_messages) == 0


def is_new_session(conversation_history: Optional[List[Dict]]) -> bool:
    """
    Check if this is a completely new session (no conversation history at all).
    
    Used to determine if we should show the onboarding greeting.
    
    Args:
        conversation_history: Previous messages in conversation
    
    Returns:
        True if this is a brand new session (no history)
    """
    return not conversation_history or len(conversation_history) == 0


def should_add_accountability(message: str, problem_category: ProblemCategory) -> bool:
    """
    Determine if accountability follow-up is appropriate for this message.
    
    Accountability should be added ONLY when the topic requires direction, action, or structure.
    
    Args:
        message: The user's message text
        problem_category: The detected problem category
    
    Returns:
        True if accountability follow-up is appropriate
    """
    message_lower = message.lower()
    
    # Topics that REQUIRE accountability (direction, action, structure)
    accountability_topics = [
        ProblemCategory.PRICING,
        ProblemCategory.BUSINESS_MODEL,
        ProblemCategory.CONTENT,
        ProblemCategory.VENDOR_ISSUE,
        ProblemCategory.MINDSET,
        ProblemCategory.INSTALL_ISSUE,  # When it requires troubleshooting/action
        ProblemCategory.TECHNIQUE  # When it requires practice/building habits
    ]
    
    # Check if problem category requires accountability
    if problem_category in accountability_topics:
        return True
    
    # Additional keywords that indicate accountability is needed
    accountability_keywords = [
        "plan", "planning", "strategy", "timeline", "schedule",
        "consistent", "consistency", "habit", "routine",
        "launch", "prep", "prepare", "ready",
        "stuck", "blocked", "overwhelmed", "don't know where to start",
        "troubleshoot", "fix", "solve", "improve",
        "build", "create", "develop", "grow",
        "accountable", "check in", "follow up"
    ]
    
    # Check for accountability keywords
    if any(kw in message_lower for kw in accountability_keywords):
        return True
    
    # Topics that DO NOT need accountability
    no_accountability_keywords = [
        "what is", "what does", "explain", "define",
        "how does", "tell me about", "what's the",
        "yes", "no", "okay", "thanks", "thank you",
        "policy", "refund", "shipping", "return",
        "just asking", "curious", "wondering",
        "vent", "venting", "frustrated", "upset"  # Emotional venting (until ready for action)
    ]
    
    # Check if message is a simple question that doesn't need accountability
    if any(kw in message_lower for kw in no_accountability_keywords):
        # Exception: If it's also asking for action/plan, still add accountability
        if not any(acc_kw in message_lower for acc_kw in accountability_keywords):
            return False
    
    # Default: If it's a business/action-oriented category, add accountability
    # Otherwise, don't add it
    return problem_category in accountability_topics
