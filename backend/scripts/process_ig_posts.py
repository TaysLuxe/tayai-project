#!/usr/bin/env python3
"""
Process Instagram posts CSV and save each post as a separate text file.
"""
import csv
import os
from pathlib import Path
from urllib.parse import urlparse

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    print("Warning: pandas not available, using csv module (may have issues with multiline fields)")

def extract_post_id(url):
    """Extract post ID from Instagram URL."""
    if not url:
        return None
    # Instagram URLs are like: https://www.instagram.com/p/DRiYj4kAkcZ/
    parts = url.rstrip('/').split('/')
    if len(parts) > 0:
        return parts[-1]
    return None

def sanitize_filename(text, max_length=100):
    """Create a safe filename from text."""
    if not text:
        return "untitled"
    # Take first part of caption, remove special chars, limit length
    safe = "".join(c for c in text[:max_length] if c.isalnum() or c in (' ', '-', '_')).strip()
    return safe[:max_length] or "untitled"

def process_ig_posts_csv(csv_path, output_dir):
    """Process CSV file and save each post as a text file."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    posts_saved = 0
    posts_skipped = 0
    errors = []
    
    try:
        use_pandas = HAS_PANDAS
        rows = []
        
        # Try using pandas first for better multiline CSV handling
        if use_pandas:
            try:
                df = pd.read_csv(csv_path, encoding='utf-8', on_bad_lines='skip')
                rows = df.to_dict('records')
                print(f"Loaded {len(rows)} rows using pandas")
            except Exception as e:
                print(f"Pandas failed: {e}, falling back to csv module")
                use_pandas = False
        
        if not use_pandas:
            # Fallback to csv module with better error handling
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, quoting=csv.QUOTE_ALL)
                try:
                    rows = list(reader)
                    print(f"Loaded {len(rows)} rows using csv module")
                except csv.Error as e:
                    print(f"CSV parsing error: {e}")
                    # Try reading line by line with error recovery
                    f.seek(0)
                    f.readline()  # Skip header
                    # Manual parsing as fallback
                    print("Attempting manual CSV parsing...")
                    # This is a simplified approach - for production, consider using a more robust library
                    raise
        
        for idx, row in enumerate(rows, start=1):
                try:
                    caption = row.get('caption', '').strip()
                    url = row.get('url', '').strip()
                    comments_count = row.get('commentsCount', '0')
                    first_comment = row.get('firstComment', '').strip()
                    likes_count = row.get('likesCount', '0')
                    
                    # Skip if no caption
                    if not caption:
                        posts_skipped += 1
                        continue
                    
                    # Create filename
                    post_id = extract_post_id(url)
                    if post_id:
                        filename = f"ig-post-{post_id}.txt"
                    else:
                        # Fallback: use first part of caption
                        safe_name = sanitize_filename(caption)
                        filename = f"ig-post-{idx:04d}-{safe_name}.txt"
                    
                    filepath = output_path / filename
                    
                    # If file exists, add index to make it unique
                    if filepath.exists():
                        base_name = filepath.stem
                        filepath = output_path / f"{base_name}-{idx}.txt"
                    
                    # Create content
                    content_parts = []
                    content_parts.append(f"# Instagram Post")
                    if url:
                        content_parts.append(f"# URL: {url}")
                    content_parts.append(f"# Likes: {likes_count}")
                    content_parts.append(f"# Comments: {comments_count}")
                    if first_comment:
                        content_parts.append(f"# First Comment: {first_comment}")
                    content_parts.append("")
                    content_parts.append(caption)
                    
                    content = "\n".join(content_parts)
                    
                    # Write file
                    with open(filepath, 'w', encoding='utf-8') as out_f:
                        out_f.write(content)
                    
                    posts_saved += 1
                    
                    if posts_saved % 100 == 0:
                        print(f"Processed {posts_saved} posts...")
                        
                except Exception as e:
                    errors.append(f"Row {idx}: {str(e)}")
                    continue
                    
    except Exception as e:
        print(f"Error reading CSV: {str(e)}")
        import traceback
        traceback.print_exc()
        return 0
    
    print(f"✅ Successfully saved {posts_saved} Instagram posts to {output_dir}")
    if posts_skipped > 0:
        print(f"⚠️  Skipped {posts_skipped} posts (no caption)")
    if errors:
        print(f"⚠️  {len(errors)} errors encountered (first 5):")
        for err in errors[:5]:
            print(f"   {err}")
    
    return posts_saved

if __name__ == "__main__":
    csv_path = "/Users/jumar.juaton/Downloads/Taysluxe _ IG posts - All best posts.csv"
    output_dir = "/Users/jumar.juaton/Documents/GitHub/tayai-project/backend/data/sources/ig_posts"
    
    process_ig_posts_csv(csv_path, output_dir)
