"""
Unit tests for cost calculator utilities
"""
import pytest
from app.utils.cost_calculator import (
    estimate_cost_from_total_tokens,
    estimate_cost_from_tokens,
    GPT4_INPUT_PRICE_PER_1K,
    GPT4_OUTPUT_PRICE_PER_1K,
    DEFAULT_INPUT_RATIO,
    DEFAULT_OUTPUT_RATIO,
)


class TestEstimateCostFromTotalTokens:
    """Tests for estimate_cost_from_total_tokens function"""
    
    def test_zero_tokens(self):
        """Test cost calculation with zero tokens"""
        cost = estimate_cost_from_total_tokens(0)
        assert cost == 0.0
    
    def test_negative_tokens(self):
        """Test cost calculation with negative tokens"""
        cost = estimate_cost_from_total_tokens(-100)
        assert cost == 0.0
    
    def test_small_token_count(self):
        """Test cost calculation with small token count"""
        cost = estimate_cost_from_total_tokens(1000)
        
        # 1000 tokens with 70% input, 30% output
        # Input: 700 tokens = 0.7 * 0.03 = 0.021
        # Output: 300 tokens = 0.3 * 0.06 = 0.018
        # Total: 0.039
        expected_input_cost = (700 / 1000) * GPT4_INPUT_PRICE_PER_1K
        expected_output_cost = (300 / 1000) * GPT4_OUTPUT_PRICE_PER_1K
        expected_total = round(expected_input_cost + expected_output_cost, 6)
        
        assert cost == expected_total
        assert cost > 0
    
    def test_large_token_count(self):
        """Test cost calculation with large token count"""
        cost = estimate_cost_from_total_tokens(100000)
        
        assert cost > 0
        assert isinstance(cost, float)
    
    def test_custom_ratios(self):
        """Test cost calculation with custom input/output ratios"""
        cost = estimate_cost_from_total_tokens(
            1000,
            input_ratio=0.5,
            output_ratio=0.5
        )
        
        # 1000 tokens with 50% input, 50% output
        expected_input_cost = (500 / 1000) * GPT4_INPUT_PRICE_PER_1K
        expected_output_cost = (500 / 1000) * GPT4_OUTPUT_PRICE_PER_1K
        expected_total = round(expected_input_cost + expected_output_cost, 6)
        
        assert cost == expected_total
    
    def test_all_input_tokens(self):
        """Test cost calculation with all input tokens"""
        cost = estimate_cost_from_total_tokens(
            1000,
            input_ratio=1.0,
            output_ratio=0.0
        )
        
        expected_cost = round((1000 / 1000) * GPT4_INPUT_PRICE_PER_1K, 6)
        assert cost == expected_cost
    
    def test_all_output_tokens(self):
        """Test cost calculation with all output tokens"""
        cost = estimate_cost_from_total_tokens(
            1000,
            input_ratio=0.0,
            output_ratio=1.0
        )
        
        expected_cost = round((1000 / 1000) * GPT4_OUTPUT_PRICE_PER_1K, 6)
        assert cost == expected_cost
    
    def test_precision(self):
        """Test that cost is rounded to 6 decimal places"""
        cost = estimate_cost_from_total_tokens(1234)
        
        # Check that it's rounded to 6 decimal places
        decimal_places = len(str(cost).split('.')[-1]) if '.' in str(cost) else 0
        assert decimal_places <= 6


class TestEstimateCostFromTokens:
    """Tests for estimate_cost_from_tokens function"""
    
    def test_zero_tokens(self):
        """Test cost calculation with zero tokens"""
        cost = estimate_cost_from_tokens(0, 0)
        assert cost == 0.0
    
    def test_input_only(self):
        """Test cost calculation with input tokens only"""
        cost = estimate_cost_from_tokens(1000, 0)
        
        expected_cost = round((1000 / 1000) * GPT4_INPUT_PRICE_PER_1K, 6)
        assert cost == expected_cost
    
    def test_output_only(self):
        """Test cost calculation with output tokens only"""
        cost = estimate_cost_from_tokens(0, 1000)
        
        expected_cost = round((1000 / 1000) * GPT4_OUTPUT_PRICE_PER_1K, 6)
        assert cost == expected_cost
    
    def test_both_input_and_output(self):
        """Test cost calculation with both input and output tokens"""
        cost = estimate_cost_from_tokens(1000, 500)
        
        expected_input_cost = (1000 / 1000) * GPT4_INPUT_PRICE_PER_1K
        expected_output_cost = (500 / 1000) * GPT4_OUTPUT_PRICE_PER_1K
        expected_total = round(expected_input_cost + expected_output_cost, 6)
        
        assert cost == expected_total
    
    def test_large_token_counts(self):
        """Test cost calculation with large token counts"""
        cost = estimate_cost_from_tokens(50000, 25000)
        
        assert cost > 0
        assert isinstance(cost, float)
    
    def test_precision(self):
        """Test that cost is rounded to 6 decimal places"""
        cost = estimate_cost_from_tokens(1234, 567)
        
        decimal_places = len(str(cost).split('.')[-1]) if '.' in str(cost) else 0
        assert decimal_places <= 6
    
    def test_negative_tokens(self):
        """Test cost calculation with negative tokens (should still calculate)"""
        cost = estimate_cost_from_tokens(-100, -50)
        
        # Should still calculate (negative costs are possible in edge cases)
        assert isinstance(cost, float)
