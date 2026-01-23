# Building the Foundational Knowledge Base

## Overview

This guide explains how to build the foundational knowledge base from source files in `backend/data/sources`. The KB is organized into **7 core namespaces** covering 80% of predictable questions.

---

## The 7 Core Namespaces

1. **tutorials_technique** - Tutorials & Technique Library
   - Lace melting, Bald cap, Wig construction, Tinting, Plucking
   - Maintenance, Troubleshooting, Beginner mistakes, Product recommendations

2. **vendor_knowledge** - Vendor Knowledge
   - Vendor testing, Red flags, Pricing structures, Sample guidelines
   - Quality tiers, Raw hair scaling, Shipping, MOQ, Bundles

3. **business_foundations** - Business Foundations
   - Niche, Branding, Pricing, Profit margins, Packaging
   - Shopify basics, Customer experience, Refund policies

4. **content_playbooks** - Content Playbooks
   - Hooks, Scripts, Reels formats, Storytelling
   - Lifestyle content, Pain points, Authority content, Soft sell

5. **mindset_accountability** - Mindset + Accountability
   - Imposter syndrome, Perfectionism, Creative blocks
   - Consistency, Growth plateaus

6. **offer_explanations** - Offer Explanations
   - Tutorials, Vendor list, Vietnam trip, Community
   - Mentorship, Masterclasses, Digital products

7. **faqs** - FAQs
   - General questions, Account questions, Technical support

---

## Source Files

The script processes content from:

- **YouTube Transcripts** (`youtube_transcripts/`)
  - Tutorial videos on techniques and methods
  - Automatically categorized by content

- **Instagram Posts** (`ig_posts/`)
  - Business advice, content strategies, mindset content
  - 500+ posts covering various topics

- **Zoom Recordings** (`zoom_recordings/`)
  - Mentorship sessions, masterclasses, guest speaker sessions
  - Organized by folder structure (mentorship → mindset_accountability, etc.)

---

## Usage

### 1. Dry Run (Preview)

Test the script without creating KB items:

```bash
cd backend
python3 scripts/build_foundational_kb.py --dry-run --limit 10
```

This will:
- Process files
- Show namespace distribution
- Preview what would be created
- **Not** create any KB items

### 2. Process All Files

Build the full foundational KB:

```bash
cd backend
python3 scripts/build_foundational_kb.py
```

This will:
- Process all source files (646+ files)
- Categorize by namespace and subcategory
- Create KB items in the database
- Index them in PostgreSQL pgvector

### 3. Process Limited Files (Testing)

Process a subset for testing:

```bash
cd backend
python3 scripts/build_foundational_kb.py --limit 50
```

---

## How It Works

### 1. File Collection

The script scans:
- `backend/data/sources/youtube_transcripts/*.txt`
- `backend/data/sources/ig_posts/*.txt`
- `backend/data/sources/zoom_recordings/**/*.txt`

### 2. Content Processing

For each file:
- **Extracts title** from content or filename
- **Cleans content** (removes timestamps, metadata)
- **Determines namespace** using keyword matching
- **Suggests category** within namespace
- **Preserves source metadata** (file path, source type)

### 3. Namespace Detection

Uses intelligent keyword matching:
- **tutorials_technique**: "install", "lace", "melting", "plucking", "tinting"
- **vendor_knowledge**: "vendor", "supplier", "sample", "moq", "raw hair"
- **business_foundations**: "price", "pricing", "profit", "shopify", "branding"
- **content_playbooks**: "hook", "reel", "script", "content", "caption"
- **mindset_accountability**: "imposter", "perfection", "mindset", "consistency"
- **offer_explanations**: "tutorial", "mentorship", "course", "masterclass"
- **faqs**: Default catch-all

### 4. KB Item Creation

Creates structured KB items with:
- **Title**: Meaningful title extracted from content
- **Content**: Cleaned, normalized content
- **Namespace**: One of the 7 core namespaces
- **Category**: Subcategory within namespace
- **Metadata**: Source file path and type

### 5. Vector Indexing

Each KB item is automatically:
- Chunked into smaller pieces
- Embedded using OpenAI embeddings
- Indexed in PostgreSQL pgvector
- Ready for RAG retrieval

---

## Expected Results

Based on source files:

- **~13 YouTube transcripts** → tutorials_technique
- **~500 Instagram posts** → Mixed (content_playbooks, business_foundations, mindset_accountability)
- **~34 Zoom recordings** → Mixed (mentorship → mindset_accountability, masterclasses → offer_explanations)

**Total**: ~550+ KB items covering all 7 namespaces

---

## Verification

After building, verify coverage:

```bash
# Check KB stats
curl -X GET "http://localhost:8000/api/v1/admin/knowledge/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check namespace distribution
python3 scripts/kb_coverage_checker.py
```

---

## Troubleshooting

### Database Connection Errors

If you see database connection errors:
1. Ensure you're in the `backend` directory
2. Activate virtual environment: `source venv/bin/activate`
3. Check `.env` file has `DATABASE_URL` set
4. Ensure database is running

### Import Errors

If you see import errors:
1. Install dependencies: `pip install -r requirements.txt`
2. Ensure you're running from `backend` directory
3. Use `--dry-run` to test without database

### Processing Errors

If some files fail to process:
- Check file encoding (should be UTF-8)
- Verify file is not empty
- Check file path is correct
- Review error messages in output

---

## Next Steps

After building the foundational KB:

1. **Review Coverage**
   - Run `kb_coverage_checker.py` to see gaps
   - Check namespace distribution
   - Identify missing subcategories

2. **Fill Gaps**
   - Add content for missing subcategories
   - Prioritize high-frequency question areas
   - Use missing KB item logs as guide

3. **Test with Real Questions**
   - Test questions from each namespace
   - Verify namespace routing works
   - Check answer quality

4. **Iterate**
   - Monitor missing KB items
   - Add content weekly
   - Improve namespace detection

---

## Maintenance

### Weekly
- Review missing KB item logs
- Add content for new gaps
- Update outdated information

### Monthly
- Run coverage checker
- Audit namespace distribution
- Review and improve categorization

### Quarterly
- Comprehensive KB audit
- Re-process source files if updated
- Optimize namespace keywords

---

## Script Options

```bash
python3 scripts/build_foundational_kb.py [OPTIONS]

Options:
  --dry-run          Process files but don't create KB items
  --limit N          Limit number of files to process (for testing)
  -h, --help         Show help message
```

---

## Example Output

```
============================================================
BUILDING FOUNDATIONAL KNOWLEDGE BASE
============================================================

Collecting source files...
Found 646 source files

Processing files...
  Processed 50/646 files...
  Processed 100/646 files...
  ...

Processed 646 items

Namespace distribution:
  tutorials_technique: 45 items
  vendor_knowledge: 12 items
  business_foundations: 89 items
  content_playbooks: 234 items
  mindset_accountability: 67 items
  offer_explanations: 23 items
  faqs: 176 items

Connecting to database...
Creating knowledge base items...
  Created 10 items (batch 1)...
  Created 10 items (batch 2)...
  ...

============================================================
SUMMARY
============================================================
Total items processed: 646
Successfully created: 646
Errors: 0
```

---

## Support

For issues or questions:
1. Check script output for error messages
2. Review file encoding and format
3. Verify database connection
4. Test with `--dry-run` first
