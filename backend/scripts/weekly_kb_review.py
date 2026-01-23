#!/usr/bin/env python3
"""
Weekly KB Review Script

Generates a weekly report of missing KB items for review and upload.
Creates an exportable format for Notion/Sheets/Airtable integration.

This script supports the constant improvement loop:
User → Tay AI detects missing info → logs it → Weekly review → Upload content → RAG gets smarter
"""
import asyncio
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict
from collections import defaultdict

import sys
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir.parent))
sys.path.insert(0, str(backend_dir))

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select, func, desc
    from app.core.config import settings
    from app.db.models import MissingKBItem
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("Warning: Database dependencies not available.")


def format_for_notion(item: Dict) -> Dict:
    """Format item for Notion database import."""
    return {
        "Question": item["question"],
        "Missing Detail": item["missing_detail"],
        "Namespace": item["namespace"] or "unspecified",
        "Category": item.get("category", ""),
        "Date": item["created_at"].strftime("%Y-%m-%d") if item.get("created_at") else "",
        "Status": "Unresolved" if not item.get("is_resolved") else "Resolved",
        "Priority": "High" if item.get("rag_score", 1.0) < 0.5 else "Medium",
        "User Tier": item.get("user_tier", ""),
        "Context Type": item.get("context_type", ""),
        "Response Preview": item.get("ai_response_preview", "")[:200]
    }


def format_for_sheets(item: Dict) -> List:
    """Format item for Google Sheets/CSV export."""
    return [
        item["question"],
        item["missing_detail"],
        item["namespace"] or "unspecified",
        item.get("category", ""),
        item["created_at"].strftime("%Y-%m-%d %H:%M") if item.get("created_at") else "",
        "Unresolved" if not item.get("is_resolved") else "Resolved",
        "High" if item.get("rag_score", 1.0) < 0.5 else "Medium",
        item.get("user_tier", ""),
        item.get("context_type", ""),
        item.get("ai_response_preview", "")[:200]
    ]


async def generate_weekly_report(
    days: int = 7,
    export_format: str = "json",
    output_file: Optional[str] = None
) -> Dict:
    """Generate weekly report of missing KB items."""
    
    if not DB_AVAILABLE:
        print("Error: Database dependencies not available.")
        return {}
    
    # Create database connection
    database_url = settings.DATABASE_URL
    engine = create_async_engine(database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Get items from last N days
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(MissingKBItem)
            .where(
                MissingKBItem.is_resolved == False,
                MissingKBItem.created_at >= cutoff_date
            )
            .order_by(desc(MissingKBItem.created_at))
        )
        
        items = result.scalars().all()
        
        # Convert to dict format
        items_data = []
        namespace_counts = defaultdict(int)
        
        for item in items:
            metadata = item.extra_metadata or {}
            item_dict = {
                "id": item.id,
                "question": item.question,
                "missing_detail": item.missing_detail,
                "namespace": item.suggested_namespace,
                "category": None,  # Could extract from metadata if stored
                "created_at": item.created_at,
                "is_resolved": item.is_resolved,
                "user_tier": metadata.get("user_tier"),
                "context_type": metadata.get("context_type"),
                "rag_score": metadata.get("rag_score"),
                "ai_response_preview": item.ai_response_preview
            }
            items_data.append(item_dict)
            namespace_counts[item.suggested_namespace or "unspecified"] += 1
        
        # Generate report
        report = {
            "period": f"Last {days} days",
            "generated_at": datetime.utcnow().isoformat(),
            "total_unresolved": len(items_data),
            "namespace_distribution": dict(namespace_counts),
            "items": items_data
        }
        
        # Export based on format
        if output_file:
            output_path = Path(output_file)
        else:
            output_path = Path(__file__).parent.parent / "data" / f"kb_weekly_report_{datetime.now().strftime('%Y%m%d')}.{export_format}"
            output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if export_format == "json":
            output_path.write_text(json.dumps(report, indent=2, default=str))
            print(f"✅ JSON report saved to: {output_path}")
        
        elif export_format == "csv":
            with open(output_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                # Header
                writer.writerow([
                    "Question", "Missing Detail", "Namespace", "Category",
                    "Date", "Status", "Priority", "User Tier", "Context Type", "Response Preview"
                ])
                # Data
                for item in items_data:
                    writer.writerow(format_for_sheets(item))
            print(f"✅ CSV report saved to: {output_path}")
        
        elif export_format == "notion":
            notion_data = [format_for_notion(item) for item in items_data]
            output_path.write_text(json.dumps(notion_data, indent=2, default=str))
            print(f"✅ Notion-format report saved to: {output_path}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("WEEKLY KB REVIEW REPORT")
        print("=" * 60)
        print(f"Period: Last {days} days")
        print(f"Total Unresolved Items: {len(items_data)}")
        print("\nNamespace Distribution:")
        for namespace, count in sorted(namespace_counts.items(), key=lambda x: -x[1]):
            print(f"  {namespace}: {count} items")
        
        if items_data:
            print("\nTop 5 Items (by date):")
            for i, item in enumerate(items_data[:5], 1):
                print(f"\n{i}. {item['question'][:60]}...")
                print(f"   Namespace: {item['namespace']}")
                print(f"   Missing: {item['missing_detail'][:80]}...")
        
        return report


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate weekly KB review report")
    parser.add_argument("--days", type=int, default=7, help="Number of days to look back (default: 7)")
    parser.add_argument("--format", choices=["json", "csv", "notion"], default="json", help="Export format")
    parser.add_argument("--output", type=str, help="Output file path")
    
    args = parser.parse_args()
    
    await generate_weekly_report(
        days=args.days,
        export_format=args.format,
        output_file=args.output
    )


if __name__ == "__main__":
    asyncio.run(main())
