# Escalation Tracking & Conversion Guide

## Overview

This guide explains how to track escalations to paid offerings, measure conversions, and optimize the escalation system for maximum revenue without being salesy.

---

## How Escalation Works

### 1. Detection

Tay AI automatically detects when a question needs deep, personalized help:

**Triggers**:
- Personal language ("my business", "my pricing", "my situation")
- Strategic questions ("strategy", "audit", "restructure", "transform")
- Advanced/complex questions ("deep dive", "break down", "fix my")
- Business mentorship context + personal language

**Threshold**: Escalates when 2+ indicators or business context + personal language

### 2. Offer Selection

Maps questions to appropriate offers:
- **Mentorship**: Business/personal/strategic questions
- **Course**: Technique learning questions
- **Masterclass**: Strategy framework questions

### 3. Natural Response

Adds escalation smoothly to response:
- Maintains Tay's voice
- No pressure, just helpful guidance
- Feels like value, not sales pitch

### 4. Automatic Logging

Every escalation is logged with:
- User ID and question
- Offer mentioned
- Escalation reason
- Detection scores
- Template used
- Timestamp

---

## Tracking Conversions

### Manual Tracking

When a user purchases after seeing an escalation:

```bash
# Mark escalation as converted
curl -X PATCH "http://localhost:8000/api/v1/admin/logs/escalations/{escalation_id}" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "converted": true
  }'
```

### Webhook Integration

Set up webhook from payment platform (Stripe, etc.) to automatically mark conversions:

```python
# Example webhook handler
@router.post("/webhooks/payment")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    # Parse payment event
    # Find escalation log for user
    # Mark as converted
    pass
```

---

## Admin Dashboard

### View Escalations

```bash
# List all escalations
GET /api/v1/admin/logs/escalations

# Filter by offer
GET /api/v1/admin/logs/escalations?offer=mentorship

# Show only converted
GET /api/v1/admin/logs/escalations?converted_only=true
```

### Get Statistics

```bash
# Get escalation stats
GET /api/v1/admin/logs/escalations/stats?period_days=30
```

**Returns**:
- Total escalations
- By offer (mentorship, course, etc.)
- Conversion rate (%)
- By reason (personalized_help, strategic, etc.)
- Recent escalations

---

## Key Metrics to Track

### 1. Escalation Rate
**What**: % of questions that trigger escalation
**Target**: 10-15% (not too frequent, not too rare)
**Action**: Adjust detection thresholds if needed

### 2. Conversion Rate
**What**: % of escalations that convert to paid
**Target**: 5-10% (natural, helpful escalation should convert)
**Action**: Optimize templates and offer selection

### 3. Offer Performance
**What**: Conversion rate by offer type
**Target**: Mentorship highest (most valuable)
**Action**: Refine offer selection logic

### 4. Template Performance
**What**: Conversion rate by template
**Target**: Find highest converting templates
**Action**: A/B test and optimize

### 5. User Tier Performance
**What**: Conversion rate by user tier
**Target**: Premium users convert higher
**Action**: Personalize escalation for tier

---

## Optimization Strategies

### 1. A/B Test Templates

Test different escalation language:
- Template A: "Babes, I can give you a general breakdown..."
- Template B: "For advanced strategies like this..."
- Template C: "This is something we can skim over here..."

**Track**: Which template converts best

### 2. Refine Detection

Adjust thresholds based on data:
- If too many escalations → Raise threshold
- If too few conversions → Lower threshold or improve templates
- If wrong offers selected → Refine offer selection logic

### 3. Personalize by Tier

Different escalation for different tiers:
- **Free users**: More gentle, educational
- **Premium users**: Direct, value-focused
- **VIP users**: Exclusive, personalized

### 4. Context-Aware Escalation

Consider conversation history:
- Multiple questions on same topic → Stronger escalation
- First-time user → Gentler escalation
- Returning user → More direct escalation

---

## Weekly Review Process

### Monday: Review Metrics

1. **Check Escalation Stats**
   ```bash
   GET /api/v1/admin/logs/escalations/stats?period_days=7
   ```

2. **Review Conversion Rate**
   - Is it in target range (5-10%)?
   - Which offers convert best?
   - Which templates convert best?

3. **Identify Patterns**
   - What types of questions escalate?
   - What offers are mentioned most?
   - What's the average time to conversion?

### Tuesday-Thursday: Optimize

1. **Test New Templates**
   - Create variations
   - A/B test
   - Measure results

2. **Refine Detection**
   - Adjust thresholds
   - Add/remove indicators
   - Improve offer selection

3. **Personalize by Context**
   - Add tier-based logic
   - Consider conversation history
   - Improve timing

### Friday: Analyze & Plan

1. **Review Week's Data**
   - Total escalations
   - Conversions
   - Revenue impact

2. **Plan Next Week**
   - What to test
   - What to optimize
   - What to track

---

## Example Workflow

### Week 1: Baseline
- Track all escalations
- Measure conversion rate
- Identify patterns

### Week 2: Optimize Templates
- Test 3 different mentorship templates
- Measure conversion for each
- Keep highest converting

### Week 3: Refine Detection
- Adjust thresholds based on data
- Improve offer selection
- Add context awareness

### Week 4: Personalize
- Add tier-based escalation
- Consider conversation history
- Optimize timing

### Ongoing: Continuous Improvement
- Weekly review
- Monthly optimization
- Quarterly strategy review

---

## Success Metrics

### Revenue Impact
- **Escalation Revenue**: Revenue from escalated users
- **Conversion Value**: Average value per conversion
- **ROI**: Revenue vs. cost of escalation system

### User Experience
- **User Satisfaction**: Feedback on escalation (should feel helpful)
- **Engagement**: Do users continue after escalation?
- **Retention**: Do escalated users stay longer?

### System Performance
- **Escalation Accuracy**: Right offer for right question?
- **Template Performance**: Which templates convert?
- **Detection Quality**: Are we escalating the right questions?

---

## Best Practices

### ✅ DO

1. **Escalate Naturally**
   - Feels like helpful guidance
   - No pressure
   - Value-first

2. **Track Everything**
   - Log all escalations
   - Track conversions
   - Measure performance

3. **Optimize Continuously**
   - Test templates
   - Refine detection
   - Improve offer selection

4. **Personalize When Possible**
   - Consider user tier
   - Consider context
   - Consider history

### ❌ DON'T

1. **Don't Over-Escalate**
   - Not every question needs escalation
   - Too frequent = feels salesy
   - Maintain trust

2. **Don't Pressure**
   - No urgency language
   - No hard sell
   - No manipulation

3. **Don't Ignore Data**
   - Track conversions
   - Measure performance
   - Optimize based on data

4. **Don't Set and Forget**
   - Review weekly
   - Optimize monthly
   - Improve continuously

---

## Tools & Scripts

### View Escalations
```bash
# List recent escalations
curl -X GET "http://localhost:8000/api/v1/admin/logs/escalations?limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Stats
```bash
# Get escalation statistics
curl -X GET "http://localhost:8000/api/v1/admin/logs/escalations/stats?period_days=30" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Mark Conversion
```bash
# Mark escalation as converted
curl -X PATCH "http://localhost:8000/api/v1/admin/logs/escalations/{id}" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"converted": true}'
```

---

## Next Steps

1. **Set Up Tracking**
   - Run migration to create escalation_logs table
   - Test escalation detection
   - Verify logging works

2. **Monitor First Week**
   - Track all escalations
   - Measure baseline conversion
   - Identify patterns

3. **Optimize**
   - Test templates
   - Refine detection
   - Improve offer selection

4. **Scale**
   - Add webhook integration
   - Automate conversion tracking
   - Build dashboard

---

## Support

For questions or issues:
1. Check escalation logs in admin panel
2. Review detection logic in code
3. Test with sample questions
4. Monitor metrics for trends
