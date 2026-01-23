#!/usr/bin/env python3
"""
KB Namespace Mapper - Utility for mapping content to correct namespaces.

Helps ensure content is properly categorized and organized in the knowledge base.
"""
import re
from typing import Optional, Dict, List, Tuple
from pathlib import Path


# Namespace definitions with keywords and patterns
NAMESPACE_DEFINITIONS = {
    "tutorials_technique": {
        "keywords": [
            "install", "lace", "melting", "plucking", "tinting", "bleaching",
            "wig construction", "bald cap", "maintenance", "troubleshooting",
            "beginner mistake", "product recommendation", "technique", "how to",
            "application", "method", "process", "step", "tutorial", "guide"
        ],
        "categories": [
            "lace_melting", "bald_cap", "wig_construction", "tinting", "plucking",
            "maintenance", "troubleshooting", "beginner_mistakes", "product_recommendations"
        ]
    },
    "vendor_knowledge": {
        "keywords": [
            "vendor", "supplier", "hair vendor", "quality", "sample", "moq",
            "shipping", "pricing", "bundle", "raw hair", "testing", "red flag",
            "order", "supplier communication", "hair source", "wholesale"
        ],
        "categories": [
            "vendor_testing", "red_flags", "pricing", "samples", "quality_tiers",
            "raw_hair", "shipping", "moq", "bundles"
        ]
    },
    "business_foundations": {
        "keywords": [
            "price", "pricing", "profit", "margin", "shopify", "brand", "branding",
            "niche", "packaging", "refund", "policy", "customer experience",
            "business", "revenue", "cost", "profitability", "operations"
        ],
        "categories": [
            "niche", "branding", "pricing", "profit_margins", "packaging",
            "shopify", "customer_experience", "refund_policies"
        ]
    },
    "content_playbooks": {
        "keywords": [
            "hook", "reel", "script", "story", "storytelling", "content", "caption",
            "post", "social media", "lifestyle", "pain point", "authority",
            "soft sell", "format", "reels", "instagram", "tiktok", "engagement"
        ],
        "categories": [
            "hooks", "scripts", "reels_formats", "storytelling", "lifestyle",
            "pain_points", "authority", "soft_sell"
        ]
    },
    "mindset_accountability": {
        "keywords": [
            "confidence", "imposter", "perfection", "perfectionism", "block",
            "motivation", "fear", "consistency", "plateau", "growth", "accountability",
            "mindset", "stuck", "overwhelm", "procrastination"
        ],
        "categories": [
            "imposter_syndrome", "perfectionism", "creative_blocks",
            "consistency", "growth_plateaus"
        ]
    },
    "offer_explanations": {
        "keywords": [
            "tutorial", "mentorship", "course", "community", "masterclass", "trip",
            "offer", "program", "academy", "what is", "explain", "includes",
            "purchase", "buy", "enroll"
        ],
        "categories": [
            "tutorials", "vendor_list", "vietnam_trip", "community",
            "mentorship", "masterclasses", "digital_products"
        ]
    },
    "faqs": {
        "keywords": [],  # Catch-all
        "categories": ["general", "account", "technical", "billing"]
    }
}


def suggest_namespace(title: str, content: str, category: Optional[str] = None) -> Tuple[str, float]:
    """
    Suggest the best namespace for content based on title, content, and category.
    
    Returns:
        Tuple of (namespace, confidence_score)
    """
    text = f"{title} {content}".lower()
    
    # If category matches a namespace category, boost that namespace
    category_boost = {}
    if category:
        category_lower = category.lower()
        for namespace, definition in NAMESPACE_DEFINITIONS.items():
            for ns_category in definition["categories"]:
                if ns_category.lower() in category_lower or category_lower in ns_category.lower():
                    category_boost[namespace] = category_boost.get(namespace, 0) + 2
    
    # Score each namespace
    scores = {}
    for namespace, definition in NAMESPACE_DEFINITIONS.items():
        if namespace == "faqs":
            continue
        
        score = 0
        # Keyword matching
        for keyword in definition["keywords"]:
            if keyword in text:
                score += 1
        
        # Category boost
        score += category_boost.get(namespace, 0)
        
        if score > 0:
            scores[namespace] = score
    
    # If no matches, default to FAQs
    if not scores:
        return ("faqs", 0.0)
    
    # Return highest scoring namespace
    best_namespace = max(scores.items(), key=lambda x: x[1])[0]
    max_score = scores[best_namespace]
    
    # Normalize confidence (0-1 scale)
    total_possible = len(NAMESPACE_DEFINITIONS[best_namespace]["keywords"]) + 2
    confidence = min(max_score / total_possible, 1.0)
    
    return (best_namespace, confidence)


def suggest_category(title: str, content: str, namespace: str) -> Optional[str]:
    """Suggest a category within a namespace."""
    if namespace not in NAMESPACE_DEFINITIONS:
        return None
    
    text = f"{title} {content}".lower()
    categories = NAMESPACE_DEFINITIONS[namespace]["categories"]
    
    # Find best matching category
    for category in categories:
        if category.replace("_", " ") in text or category.replace("_", " ") in title.lower():
            return category
    
    return None


def validate_namespace(namespace: str) -> bool:
    """Check if namespace is valid."""
    return namespace in NAMESPACE_DEFINITIONS


def get_namespace_info(namespace: str) -> Optional[Dict]:
    """Get information about a namespace."""
    if namespace not in NAMESPACE_DEFINITIONS:
        return None
    
    return NAMESPACE_DEFINITIONS[namespace].copy()


def list_all_namespaces() -> List[str]:
    """List all available namespaces."""
    return list(NAMESPACE_DEFINITIONS.keys())


def analyze_content_file(file_path: Path) -> Dict:
    """Analyze a content file and suggest namespace/category."""
    if not file_path.exists():
        return {"error": "File not found"}
    
    # Read file
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        return {"error": f"Could not read file: {e}"}
    
    # Extract title (first line or filename)
    lines = content.split('\n')
    title = lines[0].strip() if lines else file_path.stem
    
    # Remove markdown headers if present
    title = re.sub(r'^#+\s*', '', title).strip()
    
    # Suggest namespace
    namespace, confidence = suggest_namespace(title, content)
    
    # Suggest category
    category = suggest_category(title, content, namespace)
    
    return {
        "file": str(file_path),
        "title": title,
        "suggested_namespace": namespace,
        "confidence": round(confidence, 2),
        "suggested_category": category,
        "content_length": len(content)
    }


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python kb_namespace_mapper.py <file_path>")
        print("\nOr use as module:")
        print("  from kb_namespace_mapper import suggest_namespace")
        sys.exit(1)
    
    file_path = Path(sys.argv[1])
    result = analyze_content_file(file_path)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        sys.exit(1)
    
    print(f"File: {result['file']}")
    print(f"Title: {result['title']}")
    print(f"Suggested Namespace: {result['suggested_namespace']} (confidence: {result['confidence']})")
    print(f"Suggested Category: {result['suggested_category']}")
    print(f"Content Length: {result['content_length']} characters")
