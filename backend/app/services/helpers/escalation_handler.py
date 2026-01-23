"""
Escalation Handler Module

Handles escalation logic for paid offerings.
Extracted from ChatService for better organization and reusability.
"""
from typing import Dict, Optional, Tuple

from app.core.prompts.context import ConversationContext
from app.services.rag_service import ContextResult


def should_escalate_to_paid(
    question: str,
    context_type: ConversationContext,
    context_result: ContextResult,
    missing_kb_data: Optional[Dict] = None
) -> Optional[Dict]:
    """
    Determine if question should be escalated to paid offerings.
    
    Escalates when question needs:
    - Deep personalized help
    - Business-specific strategy
    - Custom action plans
    - Detailed audits/reviews
    - Personal situation analysis
    
    Args:
        question: The user's question
        context_type: The conversation context type
        context_result: The RAG context result
        missing_kb_data: Optional missing KB data
    
    Returns:
        Escalation data if should escalate, None otherwise.
    """
    question_lower = question.lower()
    
    # Keywords that indicate need for personalized help
    personal_indicators = [
        "my business", "my situation", "my specific", "my numbers",
        "my pricing", "my profit", "my margins", "my costs",
        "audit", "review my", "analyze my", "look at my",
        "personalized", "custom", "tailored", "specific to me",
        "my exact", "my current", "help me with my"
    ]
    
    # Strategic/detail-heavy indicators
    strategic_indicators = [
        "strategy", "strategic", "business model", "restructure",
        "rebuild", "transform", "overhaul", "complete",
        "entire business", "whole business", "full audit",
        "comprehensive", "detailed plan", "action plan"
    ]
    
    # Advanced/complex indicators
    advanced_indicators = [
        "advanced", "complex", "complicated", "deep dive",
        "go deep", "break down", "figure out", "solve",
        "fix my", "help me fix", "what's wrong with"
    ]
    
    # Count indicators
    personal_score = sum(1 for indicator in personal_indicators if indicator in question_lower)
    strategic_score = sum(1 for indicator in strategic_indicators if indicator in question_lower)
    advanced_score = sum(1 for indicator in advanced_indicators if indicator in question_lower)
    
    total_score = personal_score + strategic_score + advanced_score
    
    # Escalation logic
    should_escalate = (
        total_score >= 2 or  # Multiple indicators
        (personal_score >= 1 and context_type == ConversationContext.BUSINESS_MENTORSHIP) or
        (missing_kb_data and personal_score >= 1) or
        (strategic_score >= 1 and context_type == ConversationContext.BUSINESS_MENTORSHIP)
    )
    
    if not should_escalate:
        return None
    
    # Determine which offer to mention
    offer = determine_escalation_offer(question, context_type, total_score, personal_score)
    
    return {
        "should_escalate": True,
        "offer": offer,
        "reason": "personalized_help" if personal_score > 0 else "strategic" if strategic_score > 0 else "advanced",
        "personal_score": personal_score,
        "strategic_score": strategic_score,
        "advanced_score": advanced_score,
        "total_score": total_score
    }


def determine_escalation_offer(
    question: str,
    context_type: ConversationContext,
    total_score: int,
    personal_score: int
) -> str:
    """
    Determine which paid offer to mention based on question context.
    
    Args:
        question: The user's question
        context_type: The conversation context type
        total_score: Total escalation score
        personal_score: Personal indicator score
    
    Returns:
        "mentorship", "course", "masterclass", or "community"
    """
    question_lower = question.lower()
    
    # High personal score = mentorship (needs 1:1 attention)
    if personal_score >= 2 or (personal_score >= 1 and total_score >= 3):
        return "mentorship"
    
    # Business mentorship context with personal language = mentorship
    if context_type == ConversationContext.BUSINESS_MENTORSHIP and personal_score >= 1:
        return "mentorship"
    
    # Strategic questions = mentorship or masterclass
    if "strategy" in question_lower or "business model" in question_lower:
        return "mentorship" if personal_score > 0 else "masterclass"
    
    # Technique questions = course or tutorial
    if context_type == ConversationContext.HAIR_EDUCATION:
        return "course" if total_score >= 2 else "tutorial"
    
    # Default to mentorship for high-value questions
    if total_score >= 3:
        return "mentorship"
    
    # Default to community for lower-value questions
    return "community"


def generate_escalation_text(offer: str, reason: str, question: str) -> Tuple[str, int]:
    """
    Generate natural, non-salesy escalation text.
    
    Smooth. Natural. No pressure. High conversion.
    
    Args:
        offer: The offer type ("mentorship", "course", etc.)
        reason: The escalation reason
        question: The user's question
    
    Returns:
        Tuple of (escalation_text, template_index) for tracking
    """
    question_lower = question.lower()
    
    # Escalation templates by offer type
    escalation_templates = {
        "mentorship": [
            "Babes, I can give you a general breakdown, but the level of detail you're asking for is exactly what Tay does inside her 1:1 mentorship. If you want her eyes on YOUR business specifically, that's where she goes deep.",
            "For advanced strategies like this, you'd get the most value inside Tay's mentorship because she personalizes everything to your situation.",
            "This is something we can skim over here, but the real transformation comes inside Tay's 1:1 where she can literally audit your entire business and fix it with you.",
            "I can give you the framework, but to get it tailored to YOUR exact numbers and situation, that's where Tay's mentorship really shines. She breaks down your specific costs, margins, and structures everything with you.",
            "For something this personalized, Tay's mentorship is where you'd get the most value. She literally looks at YOUR business and creates a custom plan that fits your exact situation."
        ],
        "course": [
            "I can give you the basics here, but if you want to master this technique step-by-step, Tay's course walks you through everything with video tutorials and detailed guides.",
            "For a deep dive into this, Tay's course covers all the details with hands-on tutorials. It's way more comprehensive than what I can share in a quick answer.",
            "I can point you in the right direction, but Tay's course has the full breakdown with video tutorials, troubleshooting guides, and all the details you need to master this."
        ],
        "tutorial": [
            "I can give you the overview, but Tay's tutorials have the complete step-by-step breakdown with video walkthroughs. That's where you'll get all the details.",
            "For the full tutorial on this, Tay has detailed video guides that walk you through every step. Much more comprehensive than what I can share here."
        ],
        "masterclass": [
            "I can give you the basics, but Tay's masterclass goes deep into the strategy and frameworks. That's where you'll get the complete breakdown.",
            "For advanced strategies like this, Tay's masterclass covers all the frameworks and systems. Way more detail than I can share in a quick answer."
        ]
    }
    
    # Get templates for offer
    templates = escalation_templates.get(offer, escalation_templates["mentorship"])
    
    # Select template based on question context
    template_index = 0
    if "business" in question_lower or "my" in question_lower or "personal" in question_lower:
        template_index = 0
    elif "how to" in question_lower or "learn" in question_lower:
        template_index = 1 if len(templates) > 1 else 0
    else:
        template_index = 0
    
    selected_template = templates[template_index] if len(templates) > template_index else templates[0]
    
    return selected_template, template_index


def add_escalation_to_response(
    response: str,
    escalation_data: Dict,
    question: str
) -> str:
    """
    Add natural escalation to paid offerings in response.
    
    Smooth, natural, no pressure. Feels like helpful guidance.
    
    Args:
        response: The current AI response
        escalation_data: Escalation data dictionary
        question: The user's question
    
    Returns:
        Response with escalation added
    """
    offer = escalation_data.get("offer", "mentorship")
    reason = escalation_data.get("reason", "personalized_help")
    
    # Generate escalation based on offer type
    escalation_text, template_index = generate_escalation_text(offer, reason, question)
    
    # Store template index for logging
    escalation_data["template_index"] = template_index
    
    # Add escalation naturally at the end
    # Only if response doesn't already mention it
    if offer.lower() not in response.lower() and "mentorship" not in response.lower():
        response += f"\n\n{escalation_text}"
    
    return response
