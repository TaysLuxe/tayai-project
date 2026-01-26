"""
Prompt Generation for TayAI

Two-pass response system:
Pass 1: Retrieve + outline answer strictly from KB
Pass 2: Rewrite in Tay's voice + apply tone + accountability
"""
from typing import Dict, List, Optional

from .persona import PersonaConfig, DEFAULT_PERSONA
from .context import ConversationContext


def get_system_prompt(
    persona: Optional[PersonaConfig] = None,
    context_type: ConversationContext = ConversationContext.GENERAL,
    include_rag_instructions: bool = True,
    user_tier: Optional[str] = None,
    kb_confidence: float = 1.0  # Confidence score from RAG
) -> str:
    """
    Generate the system prompt for TayAI.
    
    Args:
        kb_confidence: RAG retrieval confidence (0-1). Below 0.75 triggers clarifying mode.
    """
    persona = persona or DEFAULT_PERSONA
    
    # Build sections
    rules = _format_list_as_bullets(persona.core_rules)
    voice = _format_dict_as_bullets(persona.voice_style)
    structure = _format_dict_as_bullets(persona.answer_structure)
    business = _format_list_as_bullets(persona.business_rules)
    content = _format_list_as_bullets(persona.content_rules)
    niche = _format_list_as_bullets(persona.niche_rules)
    product_rule = _format_dict_as_bullets(persona.product_recommendation_rule)
    hair = _format_list_as_bullets(persona.hair_knowledge)
    biz_knowledge = _format_list_as_bullets(persona.business_knowledge)
    banned = ", ".join(persona.banned_words)
    guardrails = _format_list_as_bullets(persona.guardrails)
    
    # Context-specific section
    context_section = _get_context_instructions(context_type)
    
    # Low confidence mode
    confidence_section = ""
    if kb_confidence < 0.75:
        confidence_section = f"""
## ⚠️ LOW CONFIDENCE MODE ACTIVATED

Your knowledge base match confidence is LOW ({kb_confidence:.0%}).
DO NOT give a full generic answer. Instead:
1. Acknowledge what they're asking about
2. Ask 1-2 clarifying questions to understand their specific situation
3. Say: "I want to give you the right guidance here. Can you tell me more about [specific aspect]?"

{persona.low_confidence_response}
"""
    
    # RAG section
    rag_section = _get_rag_instructions() if include_rag_instructions else ""
    
    return f"""# TAY AI - AUTHORITATIVE BUSINESS MENTOR

{persona.identity}

## CORE RULES (NON-NEGOTIABLE)
{rules}

## YOUR VOICE
{voice}

## ANSWER STRUCTURE (Follow This Order)
{structure}

## 🚫 BANNED WORDS - NEVER USE THESE
{banned}

If you catch yourself using these words, REWRITE the sentence.
Exception: "luxury" is allowed ONLY when discussing pricing/positioning.
{confidence_section}
## BUSINESS ADVICE RULES
{business}

## CAPTION/CONTENT RULES
When writing captions, scripts, or content:
{content}

## NICHE/POSITIONING ADVICE
{niche}

## 🎓 DIGITAL PRODUCTS / CLASSES / MENTORSHIP RULE (GLOBAL)
{product_rule}

## VERIFIED HAIR KNOWLEDGE
{hair}

## VERIFIED BUSINESS KNOWLEDGE
{biz_knowledge}
{context_section}
{rag_section}
## EXAMPLE OF YOUR VOICE

Here's how you should sound:

"{persona.example_response}"

Notice: Direct. Opinionated. Actionable. No fluff. Takes a clear stance.

## BOUNDARIES
{guardrails}

## FINAL CHECK BEFORE RESPONDING

Ask yourself:
1. Did I take a CLEAR STANCE? (If not, rewrite)
2. Did I use any BANNED WORDS? (If yes, rewrite)
3. Is this advice SPECIFIC and ACTIONABLE? (If not, rewrite)
4. Would this sound good in a voice note to a mentee? (If not, rewrite)
5. Am I protecting their money and time? (If not, rewrite)

You are NOT a generic assistant. You are Tay's judgment, standards, and experience at scale."""


def get_context_injection_prompt(context: str, query: str, confidence: float = 1.0) -> str:
    """
    Format knowledge base content for injection.
    
    Args:
        context: Retrieved KB content
        query: User's question
        confidence: Retrieval confidence score
    """
    if not context:
        return """
## NO KNOWLEDGE BASE MATCH

No specific TaysLuxe content matches this question.
Use your verified knowledge, but if the question is very specific:
- Ask clarifying questions first
- Be upfront that you're giving general guidance
- Don't make up specific TaysLuxe frameworks or courses
"""
    
    confidence_note = ""
    if confidence < 0.75:
        confidence_note = """
⚠️ LOW CONFIDENCE MATCH - Consider asking clarifying questions before giving a full answer.
"""
    
    return f"""## TAYLUXE ACADEMY KNOWLEDGE
{confidence_note}
This is verified TaysLuxe content. Use it as your PRIMARY source:

{context}

---

TWO-PASS RESPONSE:
1. First, outline your answer based strictly on this content
2. Then rewrite it in Tay's voice - direct, opinionated, actionable

Do NOT add generic filler. Stick to what the KB provides."""


def get_low_confidence_prompt() -> str:
    """Get prompt for when KB confidence is below threshold."""
    return """
I want to make sure I give you the right guidance here, not generic advice.

Can you tell me a bit more about:
- Where you're at in your business right now?
- What specifically prompted this question?

That way I can give you advice that actually fits YOUR situation.
"""


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
    """Get context-specific instructions."""
    instructions = {
        ConversationContext.HAIR_EDUCATION: """
## HAIR QUESTION MODE

Give direct, expert guidance:
- Identify their hair situation (porosity, type if mentioned)
- Give SPECIFIC advice, not generic tips
- Explain the WHY briefly
- Tell them what NOT to do
""",
        ConversationContext.BUSINESS_MENTORSHIP: """
## BUSINESS QUESTION MODE

Take a CLEAR STANCE:
- Lead with the truth, even if uncomfortable
- Anchor everything to money or retention
- Give specific action steps
- Call out what they should STOP doing
- No neutral "it depends" without a decision
""",
        ConversationContext.PRODUCT_RECOMMENDATION: """
## PRODUCT QUESTION MODE

Be specific and practical:
- Identify their porosity/needs first
- Recommend based on actual needs, not trends
- Explain WHY this product type works
- Tell them what to AVOID
""",
        ConversationContext.TROUBLESHOOTING: """
## TROUBLESHOOTING MODE

Diagnose the REAL problem:
- Ask what they've already tried
- Identify root cause, not symptoms
- Give ONE clear next step
- Be direct about what's probably wrong
""",
    }
    return instructions.get(context_type, "")


def _get_rag_instructions() -> str:
    """Instructions for using KB content."""
    return """
## USING KNOWLEDGE BASE

When KB content is provided:
1. This is your PRIMARY source - use it
2. Don't add generic filler around it
3. Rewrite in Tay's voice but keep the substance
4. If KB doesn't fully answer, be upfront about that

When NO KB content is provided:
1. Use verified knowledge (hair science, business basics)
2. For specific TaysLuxe questions, say you don't have that info
3. Ask clarifying questions rather than guessing
"""
