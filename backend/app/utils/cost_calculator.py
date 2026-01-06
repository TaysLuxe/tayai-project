"""
Cost Calculator Utilities

Provides functions for calculating API costs based on token usage.
Uses OpenAI pricing as reference.
"""
from app.core.config import settings


# OpenAI GPT-4 pricing (as of 2024, adjust as needed)
# Prices per 1K tokens
GPT4_INPUT_PRICE_PER_1K = 0.03   # $0.03 per 1K input tokens
GPT4_OUTPUT_PRICE_PER_1K = 0.06  # $0.06 per 1K output tokens

# Default ratio: assume 70% input, 30% output for estimation
DEFAULT_INPUT_RATIO = 0.7
DEFAULT_OUTPUT_RATIO = 0.3


def estimate_cost_from_total_tokens(
    total_tokens: int,
    input_ratio: float = DEFAULT_INPUT_RATIO,
    output_ratio: float = DEFAULT_OUTPUT_RATIO,
    model: str = None
) -> float:
    """
    Estimate API cost in USD from total token count.
    
    This is an estimation since we don't always have separate
    input/output token counts. Uses a default ratio split.
    
    Args:
        total_tokens: Total number of tokens used
        input_ratio: Ratio of tokens that are input (default 0.7)
        output_ratio: Ratio of tokens that are output (default 0.3)
        model: Model name (currently uses GPT-4 pricing)
        
    Returns:
        Estimated cost in USD
    """
    if total_tokens <= 0:
        return 0.0
    
    # Use model-specific pricing if model is provided
    # For now, default to GPT-4 pricing
    input_price = GPT4_INPUT_PRICE_PER_1K
    output_price = GPT4_OUTPUT_PRICE_PER_1K
    
    # Calculate input and output tokens
    input_tokens = int(total_tokens * input_ratio)
    output_tokens = int(total_tokens * output_ratio)
    
    # Calculate costs
    input_cost = (input_tokens / 1000) * input_price
    output_cost = (output_tokens / 1000) * output_price
    
    total_cost = input_cost + output_cost
    
    return round(total_cost, 6)  # Round to 6 decimal places for precision


def estimate_cost_from_tokens(
    input_tokens: int,
    output_tokens: int,
    model: str = None
) -> float:
    """
    Calculate API cost from separate input and output token counts.
    
    Args:
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        model: Model name (currently uses GPT-4 pricing)
        
    Returns:
        Cost in USD
    """
    input_price = GPT4_INPUT_PRICE_PER_1K
    output_price = GPT4_OUTPUT_PRICE_PER_1K
    
    input_cost = (input_tokens / 1000) * input_price
    output_cost = (output_tokens / 1000) * output_price
    
    total_cost = input_cost + output_cost
    
    return round(total_cost, 6)

