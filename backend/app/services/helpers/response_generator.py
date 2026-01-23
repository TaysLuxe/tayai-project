"""
Response Generator Module

Generates graceful responses for missing KB and workarounds.
Extracted from ChatService for better organization and reusability.
"""
from typing import Dict, Optional

from app.core.prompts.context import ConversationContext
from app.services.rag_service import ContextResult
from .escalation_handler import generate_escalation_text


def generate_missing_kb_response(
    question: str,
    missing_kb_data: Dict,
    context_type: ConversationContext,
    context_result: ContextResult,
    escalation_data: Optional[Dict] = None
) -> str:
    """
    Generate a graceful response when missing KB is detected.
    
    This replaces "I don't know" responses with:
    - Graceful acknowledgment (maintains vibe)
    - Workaround or next steps (prevents dead-end)
    - Specific upload guidance (what info to provide)
    - Maintains Tay's voice and big-sister energy
    
    Args:
        question: The user's question
        missing_kb_data: Missing KB detection data
        context_type: The conversation context type
        context_result: The RAG context result
        escalation_data: Optional escalation data
    
    Returns:
        Graceful response string
    """
    namespace = missing_kb_data.get("suggested_namespace", "faqs")
    
    # Base acknowledgment (maintains vibe, doesn't break flow)
    base_response = "Babes, I can guide you, but this specific part isn't in my brain yet. "
    
    # Generate workaround based on namespace/question type
    workaround = generate_workaround(question, namespace, context_type, context_result)
    
    # Generate specific upload guidance
    upload_guidance = generate_upload_guidance(question, namespace, missing_kb_data)
    
    # Combine into full response
    full_response = f"{base_response}{workaround}\n\n{upload_guidance}"
    
    # Add escalation if question needs deep personalized help
    if escalation_data and escalation_data.get("should_escalate"):
        escalation_text, template_index = generate_escalation_text(
            escalation_data.get("offer", "mentorship"),
            escalation_data.get("reason", "personalized_help"),
            question
        )
        escalation_data["template_index"] = template_index  # Store for logging
        full_response += f"\n\n{escalation_text}"
    
    return full_response


def generate_workaround(
    question: str,
    namespace: str,
    context_type: ConversationContext,
    context_result: ContextResult
) -> str:
    """
    Generate a workaround or next steps when KB is missing.
    
    Provides actionable guidance so conversation doesn't dead-end.
    
    Args:
        question: The user's question
        namespace: The suggested namespace
        context_type: The conversation context type
        context_result: The RAG context result
    
    Returns:
        Workaround text
    """
    question_lower = question.lower()
    
    # Workarounds by namespace (prevents dead-ends)
    workarounds = {
        "tutorials_technique": (
            "Here's what I can help with right now: I can walk you through the general process, "
            "or you can check out my tutorials for step-by-step guides. If you have a specific technique "
            "you're struggling with, describe what you're trying to achieve and I'll give you a framework to work with."
        ),
        "vendor_knowledge": (
            "For vendor questions, here's my approach: I can help you create a vendor testing checklist, "
            "guide you on what to look for in samples, or help you structure your questions to ask suppliers. "
            "What specific vendor challenge are you facing right now?"
        ),
        "business_foundations": (
            "Let's work with what you have! I can help you think through pricing frameworks, "
            "calculate your margins, or structure your business model. Tell me more about your current situation "
            "and I'll give you a framework to build on."
        ),
        "content_playbooks": (
            "I've got you! I can help you brainstorm hooks, structure your content, or create a content calendar. "
            "What type of content are you trying to create? Reels, posts, or stories? Let's build something together."
        ),
        "mindset_accountability": (
            "This is exactly what I'm here for. Let's talk through what's blocking you - is it fear, perfectionism, "
            "or something else? I can help you break it down into actionable steps. What's the biggest thing "
            "holding you back right now?"
        ),
        "offer_explanations": (
            "Let me point you in the right direction! Check out my offers page or DM me for details. "
            "I can also help you figure out which offer might be best for where you're at. What are you trying to achieve?"
        ),
        "faqs": (
            "I'm here to help! Can you give me a bit more context about what you're looking for? "
            "The more details you share, the better I can guide you. What's the main thing you need help with?"
        )
    }
    
    # Get workaround for namespace, or default
    workaround = workarounds.get(namespace, workarounds["faqs"])
    
    # Add context-specific guidance if we have partial context
    if isinstance(context_result, ContextResult) and context_result.sources:
        # Even with low scores, we might have some relevant info
        best_source = max(context_result.sources, key=lambda s: s.score)
        if best_source.score > 0.5:  # Somewhat relevant
            workaround += f"\n\nI found some related info that might help - want me to share what I do know about this topic?"
    
    return workaround


def generate_upload_guidance(
    question: str,
    namespace: str,
    missing_kb_data: Dict
) -> str:
    """
    Generate specific guidance on what info to upload.
    
    Provides actionable, specific guidance so user knows exactly
    what to share to get help.
    
    Args:
        question: The user's question
        namespace: The suggested namespace
        missing_kb_data: Missing KB detection data
    
    Returns:
        Upload guidance text
    """
    question_lower = question.lower()
    
    # Upload guidance by namespace (specific and actionable)
    upload_guides = {
        "tutorials_technique": (
            "Want me to show you what info to upload so I can help properly? "
            "Here's what would help:\n"
            "• The specific technique you're working on (lace melting, plucking, etc.)\n"
            "• What you're trying to achieve\n"
            "• Any issues you're facing\n"
            "• Product names or tools you're using\n\n"
            "Just share those details and I'll give you a step-by-step guide! 💜"
        ),
        "vendor_knowledge": (
            "Want me to show you what info to upload so I can help properly? "
            "Here's what would help:\n"
            "• Vendor's price list or pricing structure\n"
            "• Sample details (what you ordered, quality, etc.)\n"
            "• Shipping costs and timelines\n"
            "• MOQ requirements\n"
            "• Any specific questions you have for the vendor\n\n"
            "Share those details and I'll help you navigate it! 💜"
        ),
        "business_foundations": (
            "Want me to show you what info to upload so I can help properly? "
            "Here's what would help:\n"
            "• Your current pricing structure\n"
            "• Cost breakdown (materials, time, overhead)\n"
            "• Your target market/niche\n"
            "• Current revenue and goals\n"
            "• Any specific business challenge you're facing\n\n"
            "Share those details and I'll give you a framework to work with! 💜"
        ),
        "content_playbooks": (
            "Want me to show you what info to upload so I can help properly? "
            "Here's what would help:\n"
            "• Type of content you want to create (Reels, posts, stories)\n"
            "• Your goal (engagement, sales, authority)\n"
            "• Your niche or target audience\n"
            "• Examples of content you like or want to emulate\n\n"
            "Share those details and let's build something together! 💜"
        ),
        "mindset_accountability": (
            "Want me to show you what info to upload so I can help properly? "
            "Here's what would help:\n"
            "• What's blocking you right now (fear, perfectionism, etc.)\n"
            "• Your current situation\n"
            "• What you've tried so far\n"
            "• Your goals and what's holding you back\n\n"
            "Share those details and let's break it down into actionable steps! 💜"
        ),
        "offer_explanations": (
            "Want me to show you what info to upload so I can help properly? "
            "Here's what would help:\n"
            "• What you're trying to achieve\n"
            "• Where you're at in your journey\n"
            "• What specific offer you're curious about\n"
            "• Any questions about pricing, access, or what's included\n\n"
            "Share those details and I'll point you in the right direction! 💜"
        ),
        "faqs": (
            "Want me to show you what info to upload so I can help properly? "
            "Here's what would help:\n"
            "• More context about what you're looking for\n"
            "• Your specific situation\n"
            "• What you've already tried\n"
            "• Your end goal\n\n"
            "The more details you share, the better I can guide you! 💜"
        )
    }
    
    # Get base guidance
    base_guidance = upload_guides.get(namespace, upload_guides["faqs"])
    
    # Add context-specific guidance based on question keywords
    if "price" in question_lower or "pricing" in question_lower:
        if namespace == "vendor_knowledge":
            base_guidance = (
                "Want me to show you what info to upload so I can help properly? "
                "Here's what would help:\n"
                "• Vendor's price list (curls vs straight, different lengths, etc.)\n"
                "• Shipping costs\n"
                "• Cap size options\n"
                "• Density differences\n"
                "• Any extras like plucking or tinting\n\n"
                "Share those details and I'll help you structure your pricing! 💜"
            )
        elif namespace == "business_foundations":
            base_guidance = (
                "Want me to show you what info to upload so I can help properly? "
                "Here's what would help:\n"
                "• Your cost breakdown (materials, labor, overhead)\n"
                "• Your target profit margin\n"
                "• Competitor pricing (if you know it)\n"
                "• Your positioning (premium, mid-range, budget)\n\n"
                "Share those details and I'll help you price strategically! 💜"
            )
    
    return base_guidance
