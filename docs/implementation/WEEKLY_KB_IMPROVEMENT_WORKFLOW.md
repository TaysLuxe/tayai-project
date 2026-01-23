# Weekly KB Improvement Workflow

## Overview

This document describes the **constant improvement loop** that makes Tay AI smarter every week:

```
User Question → Missing KB Detected → Graceful Response + Logged
    ↓
Weekly Review → Prioritize Gaps → Upload Content → Index in pgvector
    ↓
Tay AI Gets Smarter → Fewer Missing KB Items → Better User Experience
```

---

## The Complete Flow

### 1. User Asks Question

User asks a question that Tay AI doesn't have complete information for.

**Example**: "How do I price wigs if my vendor charges differently for curls vs straight?"

### 2. Tay AI Detects Missing KB

**Immediate Detection** (before sending response):
- Checks for "I don't know" indicators in AI response
- Analyzes RAG context quality (low scores, no sources)
- Extracts specific missing detail

**Graceful Replacement**:
- Replaces "I don't know" with helpful response
- Maintains vibe: "Babes, I can guide you, but this specific part isn't in my brain yet."
- Provides workaround so conversation doesn't dead-end
- Gives specific upload guidance

### 3. Response to User

**Example Response**:
> "Babes, I can guide you, but this specific part isn't in my brain yet. 
> 
> For vendor questions, here's my approach: I can help you create a vendor testing checklist, 
> guide you on what to look for in samples, or help you structure your questions to ask suppliers. 
> What specific vendor challenge are you facing right now?
> 
> Want me to show you what info to upload so I can help properly? 
> Here's what would help:
> • Vendor's price list (curls vs straight, different lengths, etc.)
> • Shipping costs
> • Cap size options
> • Density differences
> • Any extras like plucking or tinting
> 
> Share those details and I'll help you structure your pricing! 💜"

### 4. Automatic Logging

**What Gets Logged**:
- Original question
- Missing detail (specific info that's missing)
- Suggested namespace (where content should go)
- Original AI response (before replacement)
- RAG scores and context info
- User tier and context type
- Timestamp

**Database**: `missing_kb_items` table

**Metadata**:
- Flag that response was replaced gracefully
- Confidence scores
- Source information

### 5. Weekly Review (You/Annika)

**When**: Every week (e.g., Monday morning)

**How**:

#### Option A: Use Admin API
```bash
# Get weekly report
curl -X GET "http://localhost:8000/api/v1/admin/logs/missing-kb/export?days=7&format=notion" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Option B: Use Script
```bash
cd backend
python3 scripts/weekly_kb_review.py --days 7 --format notion
```

**Output**: JSON/CSV/Notion format with:
- All unresolved items from last 7 days
- Grouped by namespace
- Prioritized by frequency and importance
- Ready to import into Notion/Sheets/Airtable

### 6. Prioritize & Upload

**Review Process**:
1. **Group by namespace** - See which areas need most content
2. **Prioritize by frequency** - Questions asked multiple times = high priority
3. **Check RAG scores** - Low scores = urgent gaps
4. **Review user tiers** - Premium user questions = higher priority

**Upload Content**:
1. Create KB items for high-priority gaps
2. Use suggested namespace from logs
3. Address specific missing detail
4. Upload via admin API or bulk upload

**Example**:
- Missing KB: "Vendor pricing variations – curls vs straight structure"
- Namespace: `vendor_knowledge`
- Action: Create KB item explaining how to handle different pricing structures
- Upload: Use admin API or `build_foundational_kb.py`

### 7. Mark as Resolved

After uploading content:

```bash
# Mark item as resolved
curl -X PATCH "http://localhost:8000/api/v1/admin/logs/missing-kb/{item_id}" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_resolved": true,
    "resolved_by_kb_id": 123
  }'
```

### 8. Automatic Indexing

When KB item is created:
- Automatically chunked
- Embedded using OpenAI
- Indexed in PostgreSQL pgvector
- Available for RAG retrieval immediately

### 9. Tay AI Gets Smarter

Next time similar question is asked:
- RAG finds the new content
- Tay AI can answer completely
- No more "I don't know" for that topic
- User experience improves

---

## Weekly Workflow Checklist

### Monday Morning (Review)

- [ ] Run weekly KB review script
- [ ] Export to Notion/Sheets
- [ ] Review namespace distribution
- [ ] Identify top 10 priorities

### Monday-Tuesday (Content Creation)

- [ ] Create content for top priorities
- [ ] Use suggested namespaces
- [ ] Address specific missing details
- [ ] Upload via admin API

### Wednesday (Verification)

- [ ] Verify items are indexed
- [ ] Test with sample questions
- [ ] Check RAG retrieval works
- [ ] Mark items as resolved

### Thursday-Friday (Iteration)

- [ ] Review any new missing KB items
- [ ] Fill remaining gaps
- [ ] Update outdated content
- [ ] Prepare for next week

---

## Tools & Scripts

### 1. Weekly Review Script

**File**: `backend/scripts/weekly_kb_review.py`

**Usage**:
```bash
# Generate JSON report (last 7 days)
python3 scripts/weekly_kb_review.py --days 7 --format json

# Generate CSV for Sheets
python3 scripts/weekly_kb_review.py --days 7 --format csv

# Generate Notion format
python3 scripts/weekly_kb_review.py --days 7 --format notion
```

**Output**: Report file with all unresolved items, ready for review

### 2. Admin API Endpoints

**List Missing KB Items**:
```
GET /api/v1/admin/logs/missing-kb?unresolved_only=true&namespace=vendor_knowledge
```

**Get Stats**:
```
GET /api/v1/admin/logs/missing-kb/stats
```

**Export**:
```
GET /api/v1/admin/logs/missing-kb/export?format=notion&days=7
```

**Mark Resolved**:
```
PATCH /api/v1/admin/logs/missing-kb/{item_id}
{
  "is_resolved": true,
  "resolved_by_kb_id": 123
}
```

### 3. Coverage Checker

**File**: `backend/scripts/kb_coverage_checker.py`

**Usage**:
```bash
python3 scripts/kb_coverage_checker.py
```

**Output**: Coverage report showing gaps by namespace

---

## Upload Guidance by Namespace

When users ask what to upload, Tay AI provides specific guidance:

### tutorials_technique
- Specific technique you're working on
- What you're trying to achieve
- Any issues you're facing
- Product names or tools

### vendor_knowledge
- Vendor's price list or pricing structure
- Sample details
- Shipping costs and timelines
- MOQ requirements
- Specific questions for vendor

### business_foundations
- Current pricing structure
- Cost breakdown
- Target market/niche
- Current revenue and goals
- Specific business challenge

### content_playbooks
- Type of content (Reels, posts, stories)
- Your goal (engagement, sales, authority)
- Your niche or target audience
- Examples of content you like

### mindset_accountability
- What's blocking you
- Current situation
- What you've tried
- Your goals and what's holding you back

### offer_explanations
- What you're trying to achieve
- Where you're at in your journey
- Specific offer you're curious about
- Questions about pricing, access, or what's included

---

## Success Metrics

Track these to measure improvement:

1. **Missing KB Items**: Decreasing over time
2. **Resolution Rate**: % of items resolved within 7 days
3. **Coverage Rate**: % of questions answered (target: 80%+)
4. **Response Quality**: Average RAG scores increasing
5. **User Satisfaction**: Feedback on graceful responses

---

## Example Weekly Report

```
============================================================
WEEKLY KB REVIEW REPORT
============================================================
Period: Last 7 days
Total Unresolved Items: 23

Namespace Distribution:
  vendor_knowledge: 8 items
  business_foundations: 6 items
  tutorials_technique: 4 items
  content_playbooks: 3 items
  mindset_accountability: 2 items

Top 5 Items (by date):

1. How do I price wigs if my vendor charges differently for curls vs straight?
   Namespace: vendor_knowledge
   Missing: Vendor pricing variations – curls vs straight structure

2. What's the best way to test a new vendor in Vietnam?
   Namespace: vendor_knowledge
   Missing: Vietnam-specific vendor testing process

3. How do I calculate profit margins for custom wigs?
   Namespace: business_foundations
   Missing: Custom wig profit margin calculation
...
```

---

## Benefits

### For Users
- ✅ Never hit dead-ends
- ✅ Always get helpful guidance
- ✅ Know exactly what to share
- ✅ Feel supported and guided

### For You/Annika
- ✅ Clear weekly priorities
- ✅ Data-driven content decisions
- ✅ Easy export to Notion/Sheets
- ✅ Track improvement over time

### For Tay AI
- ✅ Gets smarter every week
- ✅ Fewer gaps over time
- ✅ Better answer quality
- ✅ Higher user satisfaction

---

## Next Steps

1. **Set Up Weekly Review**
   - Schedule Monday morning review
   - Set up Notion/Sheets integration
   - Create workflow checklist

2. **Start First Review**
   - Run weekly review script
   - Export to your preferred tool
   - Identify top priorities

3. **Create Content**
   - Address top 10 priorities
   - Use suggested namespaces
   - Upload via admin API

4. **Track Progress**
   - Monitor missing KB items weekly
   - Track resolution rate
   - Measure coverage improvement

---

## Support

For questions or issues:
1. Check script output for errors
2. Review API documentation
3. Test with sample questions
4. Verify database connection
