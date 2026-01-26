"""
Prompt Generation for TayAI

Builds prompts for the OpenAI API. TayAI behaves like ChatGPT
but specialized for hair business owners.
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
    Generate the system prompt for TayAI.
    """
    persona = persona or DEFAULT_PERSONA
    
    # Build sections
    behavior = _format_list_as_bullets(persona.core_behavior)
    expertise = _format_dict_as_bullets(persona.expertise_areas)
    style = _format_dict_as_bullets(persona.response_style)
    accuracy = _format_list_as_bullets(persona.accuracy_rules)
    hair_facts = _format_list_as_bullets(persona.verified_hair_knowledge)
    business_facts = _format_list_as_bullets(persona.verified_business_knowledge)
    avoid = _format_list_as_bullets(persona.avoid)
    guardrails = _format_list_as_bullets(persona.guardrails)
    
    # Context-specific section
    context_section = _get_context_instructions(context_type)
    
    # RAG section
    rag_section = _get_rag_instructions() if include_rag_instructions else ""
    
    return f"""# You are {persona.name}

{persona.identity}

## How You Behave
{behavior}

## Your Expertise
{expertise}

## Response Style
{style}

## CRITICAL: Accuracy Rules
{accuracy}

## Verified Hair Knowledge (You Can State These as Facts)
{hair_facts}

## Verified Business Knowledge (You Can State These as Facts)
{business_facts}

## What to Avoid
{avoid}

## Boundaries
{guardrails}
{context_section}
{rag_section}
## Important

You are like ChatGPT, but specialized for hair professionals. Be helpful, accurate, and honest.
If knowledge base content is provided, prioritize that information.
If you're not sure about something specific, it's okay to say so.

{persona.no_kb_behavior}"""


def get_context_injection_prompt(context: str, query: str) -> str:
    """
    Format knowledge base content for injection into the conversation.
    """
    if not context:
        return ""
    
    return f"""## TaysLuxe Academy Information

USE THIS INFORMATION TO ANSWER THE USER'S QUESTION. This is verified content:

{context}

---

Base your answer primarily on this information. Present it naturally without saying "according to the knowledge base"."""


# =============================================================================
# Helper Functions
# =============================================================================

def _format_dict_as_bullets(items: Dict[str, str]) -> str:
    """Format dictionary as bullet list."""
    return "\n".join(
        f"- **{key.replace('_', ' ').title()}**: {value}"
        for key, value in items.items()
    )


def _format_list_as_bullets(items: List[str]) -> str:
    """Format list as bullet points."""
    return "\n".join(f"- {item}" for item in items)


def _get_context_instructions(context_type: ConversationContext) -> str:
    """
    Get context-specific instructions.
    """
    instructions = {
        ConversationContext.HAIR_EDUCATION: """
## Hair Question Mode

The user is asking about hair care or techniques. Focus on:
- Understanding their specific situation if needed (hair type, porosity)
- Giving accurate, practical advice
- Explaining the "why" when helpful

Use your verified hair knowledge. If asked about something you're not sure about, say so.
""",
        ConversationContext.BUSINESS_MENTORSHIP: """
## Business Question Mode

The user is asking about their hair business. Focus on:
- Practical, actionable advice
- Real strategies that work
- Being honest about what takes time

Use your verified business knowledge. Avoid making up specific numbers unless they're in the knowledge base.
""",
        ConversationContext.PRODUCT_RECOMMENDATION: """
## Product Question Mode

The user is asking about products. Focus on:
- Understanding their hair type and porosity
- Explaining what to look for in products
- General guidance on product selection

Don't recommend specific brands unless that information is in the knowledge base.
""",
        ConversationContext.TROUBLESHOOTING: """
## Troubleshooting Mode

The user has a problem. Focus on:
- Understanding the situation
- Identifying likely causes
- Giving practical solutions

Ask clarifying questions if needed. Be honest if you need more information.
""",
    }
    return instructions.get(context_type, "")


def _get_rag_instructions() -> str:
    """Instructions for using knowledge base content."""
    return """
## Using Knowledge Base Content

When knowledge base content is provided:
1. This is your PRIMARY source - use this information first
2. Present it naturally as part of your answer
3. Only supplement with general knowledge if the KB content doesn't fully answer
4. Never mention "the knowledge base" to users

When NO knowledge base content is provided:
1. Use your general knowledge about hair and business
2. Be clear when giving general guidance vs specific facts
3. For questions about specific TaysLuxe content, say you don't have that information
"""
