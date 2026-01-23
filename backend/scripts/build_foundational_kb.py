#!/usr/bin/env python3
"""
Build Foundational Knowledge Base from Source Files

Processes all content from backend/data/sources and organizes it into
the 7 core namespaces for structured, layered knowledge base.

Namespaces:
1. tutorials_technique - Tutorials & Technique Library
2. vendor_knowledge - Vendor Knowledge
3. business_foundations - Business Foundations
4. content_playbooks - Content Playbooks
5. mindset_accountability - Mindset + Accountability
6. offer_explanations - Offer Explanations
7. faqs - FAQs
"""
import asyncio
import json
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from collections import defaultdict

import sys
# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir.parent))  # Project root
sys.path.insert(0, str(backend_dir))  # Backend directory

# Conditional imports for database operations
try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings
    from app.services.knowledge_service import KnowledgeService
    from app.schemas.knowledge import KnowledgeBaseCreate
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("Warning: Database dependencies not available. Dry-run mode only.")

# Import namespace mapper functions directly
try:
    from scripts.kb_namespace_mapper import suggest_namespace, suggest_category
except ImportError:
    # Fallback: define inline if import fails
    def suggest_namespace(title: str, content: str) -> Tuple[str, float]:
        """Simple namespace suggestion."""
        text = f"{title} {content}".lower()
        if any(kw in text for kw in ["install", "lace", "melting", "plucking", "tinting", "wig construction", "bald cap"]):
            return ("tutorials_technique", 0.8)
        elif any(kw in text for kw in ["vendor", "supplier", "hair vendor", "sample", "moq", "raw hair"]):
            return ("vendor_knowledge", 0.8)
        elif any(kw in text for kw in ["price", "pricing", "profit", "business", "shopify", "branding", "niche"]):
            return ("business_foundations", 0.8)
        elif any(kw in text for kw in ["hook", "reel", "content", "script", "story", "caption", "post"]):
            return ("content_playbooks", 0.8)
        elif any(kw in text for kw in ["imposter", "perfection", "mindset", "confidence", "accountability", "consistency"]):
            return ("mindset_accountability", 0.8)
        elif any(kw in text for kw in ["tutorial", "mentorship", "course", "offer", "masterclass", "community"]):
            return ("offer_explanations", 0.8)
        return ("faqs", 0.5)
    
    def suggest_category(title: str, content: str, namespace: str) -> Optional[str]:
        """Simple category suggestion."""
        return None


# Source directories
# Get sources directory relative to backend
backend_dir = Path(__file__).parent.parent
SOURCES_DIR = backend_dir / "data" / "sources"
YOUTUBE_DIR = SOURCES_DIR / "youtube_transcripts"
ZOOM_DIR = SOURCES_DIR / "zoom_recordings"
IG_POSTS_DIR = SOURCES_DIR / "ig_posts"

# Namespace to subcategory mapping
NAMESPACE_SUBCATEGORIES = {
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


def extract_title_from_content(content: str, file_path: Path) -> str:
    """Extract a meaningful title from content."""
    lines = content.split('\n')
    
    # Try to find title in first few lines
    for line in lines[:10]:
        line = line.strip()
        # Skip empty lines and metadata
        if not line or line.startswith('#') or line.startswith('00:'):
            continue
        # Remove markdown headers
        line = re.sub(r'^#+\s*', '', line)
        if len(line) > 10 and len(line) < 200:
            return line[:200]
    
    # Fallback to filename
    return file_path.stem.replace('_', ' ').replace('-', ' ').title()


def clean_content(content: str) -> str:
    """Clean and normalize content."""
    # Remove timestamp lines (00:00:00.000 format)
    content = re.sub(r'^\d{2}:\d{2}:\d{2}\.\d+\s+', '', content, flags=re.MULTILINE)
    
    # Remove metadata headers
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        # Skip empty lines at start
        if not cleaned_lines and not line:
            continue
        # Skip metadata lines
        if line.startswith('#') and ('URL:' in line or 'Likes:' in line or 'Comments:' in line):
            continue
        cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines).strip()
    
    # Remove excessive whitespace
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    return content


def process_youtube_transcript(file_path: Path) -> Optional[Dict]:
    """Process a YouTube transcript file."""
    try:
        content = file_path.read_text(encoding='utf-8')
        if len(content) < 100:  # Skip very short files
            return None
        
        # Extract title from content
        title = extract_title_from_content(content, file_path)
        
        # Clean content
        content = clean_content(content)
        
        if len(content) < 50:  # Skip if too short after cleaning
            return None
        
        # Determine namespace and category
        namespace, confidence = suggest_namespace(title, content)
        category = suggest_category(title, content, namespace)
        
        return {
            "title": title,
            "content": content,
            "namespace": namespace,
            "category": category,
            "source": "youtube_transcript",
            "source_file": str(file_path.relative_to(SOURCES_DIR))
        }
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None


def process_ig_post(file_path: Path) -> Optional[Dict]:
    """Process an Instagram post file."""
    try:
        content = file_path.read_text(encoding='utf-8')
        if len(content) < 50:
            return None
        
        # Extract title from first meaningful line
        lines = content.split('\n')
        title = None
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and len(line) > 10:
                title = line[:100]  # First meaningful line as title
                break
        
        if not title:
            title = f"Instagram Post - {file_path.stem}"
        
        # Clean content (remove metadata headers)
        content_lines = []
        in_content = False
        for line in lines:
            if line.startswith('#') and ('URL:' in line or 'Likes:' in line):
                continue
            if not line.startswith('#') and line.strip():
                in_content = True
            if in_content:
                content_lines.append(line)
        
        content = '\n'.join(content_lines).strip()
        
        if len(content) < 30:
            return None
        
        # Determine namespace and category
        namespace, confidence = suggest_namespace(title, content)
        category = suggest_category(title, content, namespace)
        
        return {
            "title": title,
            "content": content,
            "namespace": namespace,
            "category": category,
            "source": "instagram_post",
            "source_file": str(file_path.relative_to(SOURCES_DIR))
        }
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None


def process_zoom_recording(file_path: Path) -> Optional[Dict]:
    """Process a Zoom recording transcript."""
    try:
        content = file_path.read_text(encoding='utf-8')
        if len(content) < 100:
            return None
        
        # Extract title from path (folder structure gives context)
        path_parts = file_path.parts
        # Find the source directory index
        try:
            sources_idx = path_parts.index('sources')
            folder_name = path_parts[sources_idx + 2] if len(path_parts) > sources_idx + 2 else ""
            date_part = path_parts[-2] if len(path_parts) > 1 else ""
            title = f"{folder_name} - {date_part}" if folder_name else file_path.stem
        except:
            title = file_path.stem
        
        # Clean content
        content = clean_content(content)
        
        if len(content) < 50:
            return None
        
        # Determine namespace based on folder name
        folder_lower = folder_name.lower() if 'folder_name' in locals() else ""
        
        # Map folder names to namespaces
        folder_to_namespace = {
            "mentorship": "mindset_accountability",
            "masterclass": "offer_explanations",
            "guest speaker": "business_foundations",
            "challenge": "tutorials_technique",
            "launch": "business_foundations"
        }
        
        namespace = "faqs"  # Default
        for key, ns in folder_to_namespace.items():
            if key in folder_lower:
                namespace = ns
                break
        
        # If not found by folder, use content analysis
        if namespace == "faqs":
            namespace, _ = suggest_namespace(title, content)
        
        category = suggest_category(title, content, namespace)
        
        return {
            "title": title,
            "content": content,
            "namespace": namespace,
            "category": category,
            "source": "zoom_recording",
            "source_file": str(file_path.relative_to(SOURCES_DIR))
        }
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None


def collect_all_source_files() -> List[Tuple[Path, str]]:
    """Collect all source files with their types."""
    files = []
    
    # YouTube transcripts
    if YOUTUBE_DIR.exists():
        for file_path in YOUTUBE_DIR.glob("*.txt"):
            files.append((file_path, "youtube"))
    
    # Instagram posts
    if IG_POSTS_DIR.exists():
        for file_path in IG_POSTS_DIR.glob("*.txt"):
            files.append((file_path, "instagram"))
    
    # Zoom recordings
    if ZOOM_DIR.exists():
        for file_path in ZOOM_DIR.rglob("*.txt"):
            files.append((file_path, "zoom"))
    
    return files


async def build_foundational_kb(
    dry_run: bool = False,
    limit: Optional[int] = None
) -> Dict:
    """Build foundational knowledge base from source files."""
    
    print("=" * 60)
    print("BUILDING FOUNDATIONAL KNOWLEDGE BASE")
    print("=" * 60)
    print()
    
    # Collect all source files
    print("Collecting source files...")
    all_files = collect_all_source_files()
    print(f"Found {len(all_files)} source files")
    
    if limit:
        all_files = all_files[:limit]
        print(f"Processing first {limit} files (limit set)")
    
    print()
    
    # Process files
    processed_items = []
    namespace_counts = defaultdict(int)
    
    print("Processing files...")
    for i, (file_path, file_type) in enumerate(all_files, 1):
        if i % 50 == 0:
            print(f"  Processed {i}/{len(all_files)} files...")
        
        try:
            if file_type == "youtube":
                item = process_youtube_transcript(file_path)
            elif file_type == "instagram":
                item = process_ig_post(file_path)
            elif file_type == "zoom":
                item = process_zoom_recording(file_path)
            else:
                continue
            
            if item:
                processed_items.append(item)
                namespace_counts[item["namespace"]] += 1
        except Exception as e:
            print(f"  Error processing {file_path}: {e}")
            continue
    
    print(f"\nProcessed {len(processed_items)} items")
    print("\nNamespace distribution:")
    for namespace, count in sorted(namespace_counts.items()):
        print(f"  {namespace}: {count} items")
    
    if dry_run:
        print("\n[DRY RUN] Would create the following items:")
        for item in processed_items[:10]:
            print(f"  - {item['title'][:60]}... ({item['namespace']}/{item['category']})")
        if len(processed_items) > 10:
            print(f"  ... and {len(processed_items) - 10} more")
        return {
            "total": len(processed_items),
            "namespace_counts": dict(namespace_counts),
            "items": processed_items
        }
    
    # Create database connection (only if not dry run and DB available)
    if not DB_AVAILABLE:
        print("\n[ERROR] Database dependencies not available.")
        print("Install dependencies or run with --dry-run to process files without database.")
        return {
            "total_processed": len(processed_items),
            "success_count": 0,
            "error_count": len(processed_items),
            "namespace_counts": dict(namespace_counts),
            "errors": [{"error": "Database dependencies not available"}]
        }
    
    print("\nConnecting to database...")
    try:
        database_url = settings.DATABASE_URL
        engine = create_async_engine(database_url)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print("Make sure you're running from the backend directory with proper environment setup")
        return {
            "total_processed": len(processed_items),
            "success_count": 0,
            "error_count": len(processed_items),
            "namespace_counts": dict(namespace_counts),
            "errors": [{"error": f"Database connection failed: {e}"}]
        }
    
    # Create KB items
    print("\nCreating knowledge base items...")
    success_count = 0
    error_count = 0
    errors = []
    
    async with async_session() as db:
        service = KnowledgeService(db)
        
        # Process in batches to avoid overwhelming the system
        batch_size = 10
        for i in range(0, len(processed_items), batch_size):
            batch = processed_items[i:i + batch_size]
            
            kb_items = []
            for item in batch:
                try:
                    kb_item = KnowledgeBaseCreate(
                        title=item["title"],
                        content=item["content"],
                        category=item["category"],
                        namespace=item["namespace"],
                        metadata=json.dumps({
                            "source": item["source"],
                            "source_file": item["source_file"]
                        })
                    )
                    kb_items.append(kb_item)
                except Exception as e:
                    error_count += 1
                    errors.append({"item": item["title"], "error": str(e)})
                    print(f"  Error creating KB item for '{item['title'][:50]}...': {e}")
            
            if kb_items:
                try:
                    result = await service.bulk_create(kb_items)
                    success_count += result.success_count
                    error_count += result.error_count
                    errors.extend(result.errors)
                    
                    if result.success_count > 0:
                        print(f"  Created {result.success_count} items (batch {i//batch_size + 1})...")
                except Exception as e:
                    error_count += len(kb_items)
                    errors.append({"batch": i//batch_size + 1, "error": str(e)})
                    print(f"  Error creating batch {i//batch_size + 1}: {e}")
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total items processed: {len(processed_items)}")
    print(f"Successfully created: {success_count}")
    print(f"Errors: {error_count}")
    
    if errors:
        print(f"\nFirst 5 errors:")
        for err in errors[:5]:
            print(f"  - {err}")
    
    return {
        "total_processed": len(processed_items),
        "success_count": success_count,
        "error_count": error_count,
        "namespace_counts": dict(namespace_counts),
        "errors": errors
    }


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Build foundational knowledge base from source files")
    parser.add_argument("--dry-run", action="store_true", help="Process files but don't create KB items")
    parser.add_argument("--limit", type=int, help="Limit number of files to process (for testing)")
    
    args = parser.parse_args()
    
    result = await build_foundational_kb(dry_run=args.dry_run, limit=args.limit)
    
    if args.dry_run:
        print("\n[DRY RUN] No items were created. Run without --dry-run to create KB items.")


if __name__ == "__main__":
    asyncio.run(main())
