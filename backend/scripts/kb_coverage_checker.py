#!/usr/bin/env python3
"""
KB Coverage Checker - Analyze knowledge base coverage and identify gaps.

Helps ensure all namespaces have adequate content and identifies missing areas.
"""
import asyncio
import json
from typing import Dict, List, Optional
from pathlib import Path
from collections import defaultdict

# Import database models (adjust import path as needed)
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func, text

from app.db.models import KnowledgeBase, VectorEmbedding
from app.core.config import settings


# Expected coverage per namespace (minimum items)
EXPECTED_COVERAGE = {
    "tutorials_technique": 20,
    "vendor_knowledge": 15,
    "business_foundations": 15,
    "content_playbooks": 15,
    "mindset_accountability": 10,
    "offer_explanations": 10,
    "faqs": 10
}

# Required subcategories per namespace
REQUIRED_SUBCATEGORIES = {
    "tutorials_technique": [
        "lace_melting", "bald_cap", "wig_construction", "tinting", "plucking",
        "maintenance", "troubleshooting", "beginner_mistakes", "product_recommendations"
    ],
    "vendor_knowledge": [
        "vendor_testing", "red_flags", "pricing", "samples", "quality_tiers",
        "raw_hair", "shipping", "moq", "bundles"
    ],
    "business_foundations": [
        "niche", "branding", "pricing", "profit_margins", "packaging",
        "shopify", "customer_experience", "refund_policies"
    ],
    "content_playbooks": [
        "hooks", "scripts", "reels_formats", "storytelling", "lifestyle",
        "pain_points", "authority", "soft_sell"
    ],
    "mindset_accountability": [
        "imposter_syndrome", "perfectionism", "creative_blocks",
        "consistency", "growth_plateaus"
    ],
    "offer_explanations": [
        "tutorials", "vendor_list", "vietnam_trip", "community",
        "mentorship", "masterclasses", "digital_products"
    ],
    "faqs": ["general", "account", "technical", "billing"]
}


class KBCoverageChecker:
    """Check knowledge base coverage and identify gaps."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_namespace_stats(self) -> Dict[str, Dict]:
        """Get statistics for each namespace."""
        stats = {}
        
        # Get vector embedding counts by namespace
        result = await self.db.execute(
            text("""
                SELECT namespace, COUNT(*) as count
                FROM vector_embeddings
                WHERE namespace IS NOT NULL
                GROUP BY namespace
            """)
        )
        
        namespace_counts = {row.namespace: row.count for row in result.fetchall()}
        
        # Get knowledge base item counts by category (as proxy for namespace)
        kb_result = await self.db.execute(
            select(
                KnowledgeBase.category,
                func.count(KnowledgeBase.id).label("count")
            )
            .where(KnowledgeBase.is_active == True)
            .group_by(KnowledgeBase.category)
        )
        
        category_counts = {row.category: row.count for row in kb_result if row.category}
        
        # Combine stats
        all_namespaces = set(EXPECTED_COVERAGE.keys()) | set(namespace_counts.keys())
        
        for namespace in all_namespaces:
            vector_count = namespace_counts.get(namespace, 0)
            expected = EXPECTED_COVERAGE.get(namespace, 0)
            
            stats[namespace] = {
                "vector_count": vector_count,
                "expected_count": expected,
                "coverage_percent": round((vector_count / expected * 100) if expected > 0 else 0, 1),
                "status": "adequate" if vector_count >= expected else "needs_content"
            }
        
        return stats
    
    async def get_category_coverage(self, namespace: str) -> Dict[str, int]:
        """Get coverage for subcategories within a namespace."""
        if namespace not in REQUIRED_SUBCATEGORIES:
            return {}
        
        # Query for items with categories matching subcategories
        required = REQUIRED_SUBCATEGORIES[namespace]
        coverage = {}
        
        for subcat in required:
            result = await self.db.execute(
                select(func.count(KnowledgeBase.id))
                .where(
                    KnowledgeBase.is_active == True,
                    KnowledgeBase.category.ilike(f"%{subcat}%")
                )
            )
            count = result.scalar() or 0
            coverage[subcat] = count
        
        return coverage
    
    async def check_coverage(self) -> Dict:
        """Run comprehensive coverage check."""
        namespace_stats = await self.get_namespace_stats()
        
        # Check subcategory coverage
        subcategory_coverage = {}
        for namespace in REQUIRED_SUBCATEGORIES.keys():
            subcategory_coverage[namespace] = await self.get_category_coverage(namespace)
        
        # Identify gaps
        gaps = []
        for namespace, stats in namespace_stats.items():
            if stats["status"] == "needs_content":
                gaps.append({
                    "namespace": namespace,
                    "current": stats["vector_count"],
                    "needed": stats["expected_count"] - stats["vector_count"],
                    "priority": "high" if stats["coverage_percent"] < 50 else "medium"
                })
            
            # Check subcategory gaps
            if namespace in subcategory_coverage:
                for subcat, count in subcategory_coverage[namespace].items():
                    if count == 0:
                        gaps.append({
                            "namespace": namespace,
                            "subcategory": subcat,
                            "current": 0,
                            "needed": 1,
                            "priority": "high"
                        })
        
        # Calculate overall coverage
        total_expected = sum(EXPECTED_COVERAGE.values())
        total_current = sum(s["vector_count"] for s in namespace_stats.values())
        overall_coverage = round((total_current / total_expected * 100) if total_expected > 0 else 0, 1)
        
        return {
            "overall_coverage_percent": overall_coverage,
            "total_items": total_current,
            "total_expected": total_expected,
            "namespace_stats": namespace_stats,
            "subcategory_coverage": subcategory_coverage,
            "gaps": gaps,
            "status": "adequate" if overall_coverage >= 80 else "needs_content"
        }
    
    async def generate_report(self) -> str:
        """Generate a human-readable coverage report."""
        coverage = await self.check_coverage()
        
        report = []
        report.append("=" * 60)
        report.append("KNOWLEDGE BASE COVERAGE REPORT")
        report.append("=" * 60)
        report.append("")
        report.append(f"Overall Coverage: {coverage['overall_coverage_percent']}%")
        report.append(f"Total Items: {coverage['total_items']} / {coverage['total_expected']} expected")
        report.append(f"Status: {coverage['status'].upper()}")
        report.append("")
        report.append("-" * 60)
        report.append("NAMESPACE BREAKDOWN")
        report.append("-" * 60)
        
        for namespace, stats in coverage["namespace_stats"].items():
            status_icon = "✅" if stats["status"] == "adequate" else "⚠️"
            report.append(f"\n{status_icon} {namespace.upper()}")
            report.append(f"   Items: {stats['vector_count']} / {stats['expected_count']} expected")
            report.append(f"   Coverage: {stats['coverage_percent']}%")
            
            # Show subcategory coverage
            if namespace in coverage["subcategory_coverage"]:
                report.append("   Subcategories:")
                for subcat, count in coverage["subcategory_coverage"][namespace].items():
                    icon = "✓" if count > 0 else "✗"
                    report.append(f"     {icon} {subcat}: {count} items")
        
        # Show gaps
        if coverage["gaps"]:
            report.append("")
            report.append("-" * 60)
            report.append("IDENTIFIED GAPS")
            report.append("-" * 60)
            
            high_priority = [g for g in coverage["gaps"] if g["priority"] == "high"]
            medium_priority = [g for g in coverage["gaps"] if g["priority"] == "medium"]
            
            if high_priority:
                report.append("\n🔴 HIGH PRIORITY:")
                for gap in high_priority:
                    if "subcategory" in gap:
                        report.append(f"   - {gap['namespace']}/{gap['subcategory']}: Missing")
                    else:
                        report.append(f"   - {gap['namespace']}: Need {gap['needed']} more items")
            
            if medium_priority:
                report.append("\n🟡 MEDIUM PRIORITY:")
                for gap in medium_priority:
                    report.append(f"   - {gap['namespace']}: Need {gap['needed']} more items")
        
        report.append("")
        report.append("=" * 60)
        
        return "\n".join(report)


async def main():
    """Run coverage check."""
    # Create database connection
    database_url = settings.DATABASE_URL
    engine = create_async_engine(database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        checker = KBCoverageChecker(db)
        report = await checker.generate_report()
        print(report)
        
        # Also save JSON report
        coverage = await checker.check_coverage()
        report_path = Path(__file__).parent.parent / "data" / "kb_coverage_report.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(coverage, indent=2))
        print(f"\nJSON report saved to: {report_path}")


if __name__ == "__main__":
    asyncio.run(main())
