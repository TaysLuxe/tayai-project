"""
Unit tests for cost calculator utility functions
"""
import pytest
from app.utils.cost_calculator import (
    estimate_cost_from_total_tokens,
    estimate_cost_from_tokens,
)


class TestEstimateCostFromTotalTokens:
    """Tests for estimate_cost_from_total_tokens function."""
    
    def test_basic_calculation(self):
        cost = estimate_cost_from_total_tokens(1000, model="gpt-4")
        assert isinstance(cost, float)
        assert cost > 0
    
    def test_different_models(self):
        cost_gpt4 = estimate_cost_from_total_tokens(1000, model="gpt-4")
        cost_gpt35 = estimate_cost_from_total_tokens(1000, model="gpt-3.5-turbo")
        assert cost_gpt4 != cost_gpt35
    
    def test_zero_tokens(self):
        cost = estimate_cost_from_total_tokens(0)
        assert cost == 0.0
    
    def test_custom_ratios(self):
        cost = estimate_cost_from_total_tokens(
            1000, input_ratio=0.8, output_ratio=0.2
        )
        assert isinstance(cost, float)
        assert cost > 0


class TestEstimateCostFromTokens:
    """Tests for estimate_cost_from_tokens function."""
    
    def test_basic_calculation(self):
        cost = estimate_cost_from_tokens(500, 500, model="gpt-4")
        assert isinstance(cost, float)
        assert cost > 0
    
    def test_input_only(self):
        cost = estimate_cost_from_tokens(1000, 0)
        assert isinstance(cost, float)
        assert cost > 0
    
    def test_output_only(self):
        cost = estimate_cost_from_tokens(0, 1000)
        assert isinstance(cost, float)
        assert cost > 0
    
    def test_zero_tokens(self):
        cost = estimate_cost_from_tokens(0, 0)
        assert cost == 0.0
    
    def test_different_models(self):
        cost_gpt4 = estimate_cost_from_tokens(500, 500, model="gpt-4")
        cost_gpt35 = estimate_cost_from_tokens(500, 500, model="gpt-3.5-turbo")
        assert cost_gpt4 != cost_gpt35
