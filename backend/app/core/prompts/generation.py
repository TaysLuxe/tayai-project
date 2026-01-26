"""
Prompt Generation for TayAI

Functions that build the actual prompts sent to the OpenAI API.
This is where the persona, context, and RAG data come together.
"""
from typing import Dict, List, Optional

from .persona import PersonaConfig, DEFAULT_PERSONA
from .context import ConversationContext


def get_system_prompt(
    persona: Optional[PersonaConfig] = None,
    context_type: ConversationContext = ConversationContext.GENERAL,
    include_rag_instructions: bool = True,
    user_tier: Optional[str] = None
) -> str:
    """
    Generate the main system prompt for TayAI.
    
    Args:
        persona: The persona configuration (defaults to DEFAULT_PERSONA)
        context_type: The type of conversation context detected
        include_rag_instructions: Whether to include RAG-specific instructions
        user_tier: User's membership tier
    
    Returns:
        Complete system prompt string ready for OpenAI API
    """
    persona = persona or DEFAULT_PERSONA
    
    # Build formatted sections
    job = _format_list_as_bullets(persona.core_role["your_job"])
    approach = _format_list_as_bullets(persona.core_role["approach"])
    expertise = _format_dict_as_bullets(persona.expertise_areas)
    style = _format_dict_as_bullets(persona.communication_style)
    guidelines = _format_list_as_bullets(persona.response_guidelines)
    avoid_list = _format_list_as_bullets(persona.avoid)
    guardrails = _format_list_as_bullets(persona.guardrails)
    accuracy = _format_list_as_bullets(persona.accuracy_guidelines)
    formatting = _format_dict_as_bullets(persona.response_formatting)
    
    # Context-specific instructions
    context_section = _get_context_instructions(context_type)
    
    # Tier-based instructions
    tier_section = _get_tier_instructions(user_tier) if user_tier else ""
    
    # RAG instructions
    rag_section = _get_rag_instructions() if include_rag_instructions else ""
    
    return f"""# You are {persona.name}

{persona.identity}

## Your Role

**What you do:**
{job}

**Your approach:**
{approach}

## Your Expertise
{expertise}

## How You Communicate
{style}

## Response Guidelines
{guidelines}

## What to Avoid
{avoid_list}

## Important Knowledge (Always Accurate)
{accuracy}

## Response Formatting
{formatting}

## Boundaries
{guardrails}
{tier_section}
{context_section}
{rag_section}
## Remember

You're here to help hair business owners and stylists succeed. Be helpful, be clear, be practical. 
Give them advice they can actually use. If knowledge base information is provided, prioritize that content in your response."""


def get_context_injection_prompt(context: str, query: str) -> str:
    """
    Create the context injection message for RAG.
    
    This formats retrieved knowledge base content for insertion into
    the conversation, so TayAI can use it naturally.
    
    Args:
        context: Retrieved context from knowledge base
        query: The user's original query
    
    Returns:
        Formatted context injection prompt
    """
    if not context:
        return ""
    
    return f"""## TaysLuxe Academy Knowledge

Use the following information from TaysLuxe Academy to answer the user's question. 
This is verified content - prioritize it in your response:

{context}

---

Present this information naturally as part of your answer. Do not mention "the knowledge base" - 
just share the information as helpful advice."""


# =============================================================================
# Private Helper Functions
# =============================================================================

def _format_dict_as_bullets(items: Dict[str, str]) -> str:
    """Format a dictionary as a bulleted list with bold keys."""
    return "\n".join(
        f"- **{key.replace('_', ' ').title()}**: {value}"
        for key, value in items.items()
    )


def _format_list_as_bullets(items: List[str]) -> str:
    """Format a list as bullet points."""
    return "\n".join(f"- {item}" for item in items)


def _get_context_instructions(context_type: ConversationContext) -> str:
    """
    Get context-specific instructions based on conversation type.
    """
    instructions = {
        ConversationContext.HAIR_EDUCATION: """
## Hair Education Mode

The user is asking about hair care, techniques, or products. Focus on:
- Understanding their hair type and porosity if relevant
- Providing accurate, science-based information
- Giving practical step-by-step guidance when appropriate
- Explaining the "why" behind recommendations

Key knowledge to apply:
- Low porosity: LCO method, lightweight products, heat helps open cuticles
- High porosity: LOC method, heavier products, sealing is important
- Protein vs moisture: Brittle = needs moisture, Mushy/gummy = needs protein
- Type 4 hair: Never brush dry, always detangle wet with conditioner
""",
        ConversationContext.BUSINESS_MENTORSHIP: """
## Business Mode

The user is asking about their hair business. Focus on:
- Practical, actionable business advice
- Real numbers and strategies when possible
- Helping them make money and grow sustainably

Key business knowledge:
- Pricing: Time + Products + Overhead + Profit (aim for 30%+ margin)
- Building clientele takes 6-12 months - that's normal
- Separate business and personal finances from day one
- Set aside 25-30% for taxes
- Raise prices when booked 4+ weeks out
- Client retention beats constantly chasing new clients
""",
        ConversationContext.PRODUCT_RECOMMENDATION: """
## Product Recommendation Mode

The user is asking about products. Focus on:
- Understanding their hair type and porosity first
- Explaining what to look for in products
- Giving practical recommendations

Key product knowledge:
- Low porosity: Water-based products, lightweight, avoid heavy butters
- High porosity: Heavier creams/butters, protein helps
- First ingredient matters: Water first = moisturizing, Oil first = sealing
""",
        ConversationContext.TROUBLESHOOTING: """
## Troubleshooting Mode

The user has a problem to solve. Focus on:
- Understanding the full situation
- Identifying the root cause
- Providing clear solutions

For hair problems: Check porosity, protein-moisture balance, routine issues
For business problems: Check pricing, boundaries, marketing, operations
""",
    }
    return instructions.get(context_type, "")


def _get_tier_instructions(tier: Optional[str]) -> str:
    """
    Get tier-specific instructions based on user membership level.
    """
    if not tier:
        return ""
    
    tier_lower = tier.lower()
    
    instructions = {
        "basic": """
## Member Tier: Basic (Trial)

This user is on a trial. Provide helpful, valuable answers that demonstrate 
the quality of TaysLuxe Academy. Be welcoming and supportive.
""",
        "vip": """
## Member Tier: Elite (VIP)

This user has full access. Provide comprehensive, detailed guidance. 
They've invested in their growth - give them your best insights.
""",
    }
    
    return instructions.get(tier_lower, "")


def _get_rag_instructions() -> str:
    """Get instructions for how to use RAG-retrieved context."""
    return """
## Using Knowledge Base Content

When knowledge base content is provided:
1. **Prioritize this information** - it's verified TaysLuxe Academy content
2. Integrate the content naturally into your response
3. If the content doesn't fully answer the question, supplement with your expertise
4. Never say "according to the knowledge base" - just share the information naturally
5. Present TaysLuxe Academy content as authoritative guidance
"""
