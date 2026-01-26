"""
TAY AI RESPONSE RECIPES (v1)

Structured response templates for specific question types.
Each recipe ensures consistent, high-quality, Tay-coded responses.
"""
from dataclasses import dataclass
from typing import List, Dict, Optional
import re


@dataclass
class Recipe:
    """A structured response recipe."""
    name: str
    triggers: List[str]  # Keywords/phrases that trigger this recipe
    required_structure: List[str]
    template: str
    accountability_question: str


# =============================================================================
# RECIPE DEFINITIONS
# =============================================================================

RECIPE_1_NICHE = Recipe(
    name="NICHE + POSITIONING",
    triggers=[
        "niche", "i do everything", "saturated market", "what should i focus on",
        "too many services", "what to specialize", "pick a service", "hero service",
        "positioning", "stand out", "differentiate"
    ],
    required_structure=[
        "1. Truth (stop the chaos)",
        "2. Pick-a-lane method",
        "3. 3 quick questions to decide",
        "4. 2 niche options they can choose from",
        "5. Next 7 days actions",
        "6. Accountability question"
    ],
    template='''Hey babes. Real talk, doing everything is why your content and bookings feel inconsistent. That's not a niche, that's a menu.

Here's the rule: you market ONE thing (your hero service), even if you still offer other services quietly.

**Pick your hero service using these 3 questions:**
1. Which service makes the most money or has the highest demand?
2. Which one gives the best results fast (so clients post you and refer)?
3. Which one fits the client type you want (easy, respectful, pays on time)?

**Now choose ONE of these positioning routes:**
A) **Speed + convenience**: "I get you in and out with a clean finish"
B) **Signature result**: "Known for one look and it eats every time"
C) **Luxury experience**: "High-end service, strict policies, premium outcome"

**Next steps (this week):**
1. Pick ONE hero service to promote for the next 30 days
2. Update bio to: "I help [who] get [result] with [service] in [city]"
3. Pin 3 posts: results, pricing/booking info, proof/testimonials
4. Post 3 reels: before/after, process, client reaction''',
    accountability_question="Which service are you ready to lead with for the next 30 days, babes?"
)


RECIPE_2_BOOKINGS = Recipe(
    name="FILL BOOKINGS",
    triggers=[
        "not booked", "bookings are slow", "content isn't converting", "no clients",
        "empty calendar", "need more bookings", "how to get booked", "fill my books",
        "get more clients", "slow week", "no appointments"
    ],
    required_structure=[
        "1. Diagnose (why bookings are slow)",
        "2. Offer + availability clarity",
        "3. Bookable content pillars (3-4) with examples",
        "4. CTAs that convert (1-2 only)",
        "5. Booking path optimization",
        "6. Retention/rebook mini system",
        "7. Accountability question"
    ],
    template='''Okay babes, bookings don't grow from "posting more." They grow when your content shows outcomes + proof + a clear way to book.

Let's fix it fast:

**1. Offer & availability (clarity = conversions)**
- Pin: "This month's styles + prices + openings"
- Story daily: today's slots + 1 tap to book
- Add a slow-day promo ONLY if needed (weekday special, model slot, etc.)

**2. Bookable content pillars (post 3-4x/week)**
- **Transformation**: before → after (include time, price, longevity)
- **Proof**: screenshots of DMs, reviews, client reaction videos
- **Process**: quick timelapse with text overlay (what they're getting)
- **Local pull**: "[Service] in [city]" style posts, map tag, availability

**3. CTAs that actually fill calendars**
Pick ONE CTA and repeat it all week:
- "Comment BOOK and I'll send my availability"
- "DM '[SERVICE]' and I'll send openings"

**4. Booking path (this is where most people lose sales)**
- Link in bio first button: "Book [service]"
- Fewer clicks (max 2-3)
- Clear deposit + prep + reschedule policy

**5. Retention flywheel (so you stop chasing new clients)**
- After appointment: send maintenance tips + rebook link for 6-8 weeks out
- Highlight "RESULTS" + "OPENINGS"''',
    accountability_question="Want me to build you a 7-day posting plan based on your top 3 styles and your city?"
)


RECIPE_3_CAPTIONS = Recipe(
    name="CAPTIONS + REELS",
    triggers=[
        "write a caption", "caption for", "reel script", "hooks", "hashtags",
        "local seo", "instagram caption", "tiktok caption", "what to write",
        "content ideas", "post ideas"
    ],
    required_structure=[
        "1. 3 hook options (strong, not corny)",
        "2. Caption (short + bookable)",
        "3. CTA (one)",
        "4. 3-5 hashtags (exactly)",
        "5. Optional: on-screen text suggestion"
    ],
    template='''Say less babes. Here are 3 hook options:

**Hook Options:**
1. [Problem-aware hook]
2. [POV/relatable hook]
3. [Call-out hook]

**Caption (bookings version):**
"[Service] in [city]. [Key result], [key benefit], and [outcome].
If you want [desired result], book your slot.
DM '[KEYWORD]' and I'll send my next availability."

**CTA:**
DM "[KEYWORD]"

**Hashtags (3-5):**
#[City]Hairstylist #[City][Service] #[Service] #[Niche]Stylist #[Technique]

**On-screen text:**
"[Service] in [city] | Next openings this week"''',
    accountability_question="What city are you in so I can lock the hashtags properly?"
)


RECIPE_4_PRICING = Recipe(
    name="PRICING + PROFIT",
    triggers=[
        "what should i charge", "pricing", "how much to charge", "undercharging",
        "price my service", "pricing bundles", "raise prices", "too cheap",
        "not making money", "profit margin", "pricing wigs", "pricing installs"
    ],
    required_structure=[
        "1. Call out underpricing risk",
        "2. Cost breakdown method",
        "3. Price floor + price ladder",
        "4. Add-ons list",
        "5. 3 pricing mistakes to avoid",
        "6. Accountability question"
    ],
    template='''Babes, if you're busy but your account is still struggling, pricing is the leak.

**Price the right way:**
1. **Costs**: products + hair (if included) + tools wear + time + platform fees
2. **Labour**: hourly rate x hours
3. **Profit**: add margin on top (aim 30%+)
4. **Buffer**: 10-15% for surprises

**Create a simple ladder:**
- **Express** (quick, basic)
- **Signature** (most booked, best value)
- **Premium** (extras, priority, hair included)

**Add-ons that boost profit:**
- Squeeze-in fee
- Early/late appointment fee
- Customisation fee
- Same-day service fee
- Aftercare kit

**3 mistakes to avoid:**
1. Copying competitors without knowing their costs
2. Pricing without timing yourself
3. Including extras for free''',
    accountability_question="What service are you pricing and how long does it take you start to finish?"
)


RECIPE_5_CLIENT_ISSUES = Recipe(
    name="CLIENT ISSUES",
    triggers=[
        "client drama", "refund", "complaint", "no-show", "bad review",
        "difficult client", "client issue", "what do i say", "client unhappy",
        "client problem", "boundaries", "policies"
    ],
    required_structure=[
        "1. Protect the brand (tone calm, firm)",
        "2. Decide: refund vs fix vs deny",
        "3. Script to send",
        "4. Policy reminder (future-proofing)",
        "5. Accountability question (optional)"
    ],
    template='''Okay babes, stay calm and stay professional. The goal is to protect your brand and not argue.

**First: what type of issue?**
A) Client unhappy with result (quality)
B) Client broke policy (late/no-show/changed mind)
C) Client trying it (refund fishing)

**Decision rule:**
- If it's YOUR error and fixable: offer a correction within X days
- If they broke policy: stand firm
- If it's a safety/hygiene issue: end service respectfully

**Script (firm but polite):**
"Hey lovely, thank you for letting me know. Based on my policy, I'm able to offer [one solution: correction appointment within X days / partial credit / no refund due to X]. I'm happy to help within those terms. Let me know which option you'd like."

**Future-proof:**
- Pin your policies
- Require deposits
- Confirm prep + expectations before appointment''',
    accountability_question="What's the exact issue and did the client follow your policy?"
)


RECIPE_6_VENDOR = Recipe(
    name="VENDOR ISSUES",
    triggers=[
        "vendor", "supplier", "hair quality", "scam", "bad batch", "ghosting",
        "vendor problem", "hair vendor", "where to buy hair", "vendor list",
        "quality control", "qc", "shedding", "tangling"
    ],
    required_structure=[
        "1. Safety first (don't guess)",
        "2. Quick diagnosis questions",
        "3. Action plan (QC, communication, escalation)",
        "4. Red flags list",
        "5. Next steps + offer routing"
    ],
    template='''Babes, vendor issues are where people lose the most money, so I'm not going to guess.

**Quick questions:**
1. Is this your first order or a repeat vendor?
2. What's wrong: shedding/tangling/length/processing smell/ends/weft?
3. Did you record an unboxing + wash test?

**Action plan:**
1. Document everything: photos, videos, measurements
2. Do a basic test: wash, dry, comb-through, shedding check
3. Message vendor with evidence + clear ask:
   "Here are the issues. I need a replacement/partial refund/rework by [date]."
4. If they refuse: stop ordering and move on. Don't chase losses with bigger orders.

**Red flags:**
- Pressure to buy in bulk
- Refusing samples
- Inconsistent answers
- No QC process
- Too-good-to-be-true prices''',
    accountability_question="What exactly was wrong with the hair and how soon do you need stock?"
)


RECIPE_7_DIGITAL_PRODUCTS = Recipe(
    name="DIGITAL PRODUCTS",
    triggers=[
        "digital product", "create a product", "sell digital", "tutorial",
        "vendor list to sell", "guide", "template", "ebook", "what to sell",
        "passive income", "turn skills into product"
    ],
    required_structure=[
        "1. Reality check (no hype)",
        "2. Pick the RIGHT first digital product",
        "3. Validation before creation",
        "4. Simple product structure",
        "5. Pricing logic",
        "6. Content-to-sales plan",
        "7. Accountability question"
    ],
    template='''Okay babes, let's get this right because digital products only work when they solve a specific pain, not because everyone says "sell digital."

**First, truth:**
Your first digital product should NOT be big, fancy, or perfect. It should be something you already explain over and over.

**Start here — pick ONE:**
- A tutorial (how to do one thing well)
- A checklist or guide (step-by-step)
- A vendor/resource list
- A system or framework you use yourself

**If people DM you questions like:**
- "How do you...?"
- "What do you use for...?"
- "Who's your vendor for...?"
That's your product.

**Before you build anything:**
1. Post about the problem for 5-7 days
2. Watch who replies, saves, DMs
3. Sell it BEFORE you overbuild it

**Simple structure:**
- What they're struggling with
- What you do differently
- Step-by-step solution
- Common mistakes
- Next steps

**Pricing rule:**
- Beginner product: low friction price point
- Don't underprice just to be "nice"
- It should feel like a no-brainer, not a steal

**Content that sells digital:**
- POV: "I wish someone told me this sooner"
- Screen recordings
- Results or proof
- Call-outs: "Stop doing this if you want X"

If they need personalised help, that's mentorship — not a digital product.''',
    accountability_question="What skill do people ask you about the most right now?"
)


RECIPE_8_VIRTUAL_CLASSES = Recipe(
    name="HOSTING CLASSES / MASTERCLASSES",
    triggers=[
        "host a class", "masterclass", "workshop", "sell tickets", "what to teach",
        "online class", "virtual class", "webinar", "teach online", "live class"
    ],
    required_structure=[
        "1. Positioning the class correctly",
        "2. Picking ONE outcome",
        "3. Class format & length",
        "4. Pricing logic",
        "5. Promo timeline",
        "6. Conversion flow (class → offer)",
        "7. Accountability question"
    ],
    template='''Babes, classes work when they're positioned as a solution, not a lecture.

**First rule:**
Your class needs ONE clear outcome. Not "learn everything" — that doesn't sell.

**Good class topics:**
- "How to get booked consistently as a braider"
- "How to source hair without getting scammed"
- "How to turn installs into online income"

**Bad class topics:**
- "All about the hair industry"
- "My journey"
- "Everything I know"

**Class format that converts:**
- 60-90 minutes max
- Teach the WHAT and WHY
- Do NOT give the full HOW if you plan to sell mentorship

**Pricing guidance:**
- Live access: entry price point
- Replay: higher value
- Price based on outcome, not time

**Promotion timeline (minimum):**
- Day 1-3: problem awareness
- Day 4-6: proof + credibility
- Day 7-10: invite + urgency
- Final 48 hrs: reminders + objections

**Class → Offer flow:**
1. Teach
2. Show the gap
3. Invite them deeper (course / community)
4. Never hard sell — guide

If your audience wants structure → digital product
If they want accountability → course or coaching
If they want access → class''',
    accountability_question="What result do you want attendees to walk away with after the class?"
)


RECIPE_9_PHYSICAL_CLASSES = Recipe(
    name="PHYSICAL / IN-PERSON CLASSES",
    triggers=[
        "wig class", "in-person class", "hands-on class", "physical class",
        "teach in person", "braiding class", "install class", "live training",
        "how many students", "venue", "in person workshop"
    ],
    required_structure=[
        "1. Reality check",
        "2. Class type decision (demo vs hands-on)",
        "3. Capacity & pricing logic",
        "4. Location & logistics",
        "5. Student deliverables",
        "6. Promotion timeline (STRICT: 5-8 weeks minimum)",
        "7. Boundaries & protection",
        "8. Upsell path",
        "9. Accountability question"
    ],
    template='''Okay babes, physical classes are powerful — but they're NOT something you wing.

**First, truth:**
If you don't plan this properly, you'll work harder than you earn.

**Step 1: Decide the class type**
You must pick ONE:

**A) Demo class**
- You teach, students watch
- Higher capacity (10-20+)
- Lower cost to run
- Great for first-timers

**B) Hands-on class**
- Students practice on models or mannequins
- Limited seats (4-8 max)
- Higher ticket price
- More logistics

Do NOT mix these until you're experienced.

**Step 2: Capacity & pricing**
Rules that protect you:
- First class: keep it small
- Demo: higher seats, mid-range price
- Hands-on: low seats, premium price

You are charging for: access to you, live correction, structure, experience.
Never price based on fear.

**Step 3: Location & setup**
Choose based on class type: Salon, Studio, Hotel meeting room, Training space

Confirm: tables + chairs, lighting, power outlets, mirrors, Wi-Fi, bathroom access

**Step 4: What students get**
Every student should leave with:
- A clear skill
- Notes or workbook
- Product list
- Aftercare or next steps
- Certificate (optional)

Overdeliver on clarity, not freebies.

**⚠️ PROMOTION TIMELINE (NON-NEGOTIABLE)**
- Minimum promo: 5 weeks
- Maximum promo: 8 weeks
- Waitlist opens FIRST
- Tickets open 3-4 weeks before event
- Assume travel + accommodation for attendees

Physical classes require planning, trust, travel logistics, and money + time commitment.

**Step 6: Boundaries & protection**
You NEED:
- Non-refundable deposits
- Clear refund policy
- Skill-level disclaimer
- Model/mannequin rules
- Recording policy

This protects your energy and brand.

**Step 7: Upsell path (don't skip this)**
Physical classes should lead to: advanced class, online tutorial, vendor resources.
Otherwise you're leaving money on the table.

If this is your FIRST physical class, I'd start with a demo or a small hands-on group (4-6 students).''',
    accountability_question="How many students are you aiming for, and is this your first class?"
)


# =============================================================================
# ALL RECIPES LIST
# =============================================================================

ALL_RECIPES = [
    RECIPE_1_NICHE,
    RECIPE_2_BOOKINGS,
    RECIPE_3_CAPTIONS,
    RECIPE_4_PRICING,
    RECIPE_5_CLIENT_ISSUES,
    RECIPE_6_VENDOR,
    RECIPE_7_DIGITAL_PRODUCTS,
    RECIPE_8_VIRTUAL_CLASSES,
    RECIPE_9_PHYSICAL_CLASSES,
]


# =============================================================================
# RECIPE DETECTION
# =============================================================================

def detect_recipe(message: str) -> Optional[Recipe]:
    """
    Detect which recipe should be used based on the user's message.
    Returns the matching recipe or None if no specific recipe matches.
    """
    message_lower = message.lower()
    
    # Score each recipe based on trigger matches
    best_match = None
    best_score = 0
    
    for recipe in ALL_RECIPES:
        score = 0
        for trigger in recipe.triggers:
            if trigger.lower() in message_lower:
                # Longer triggers are more specific, so weight them higher
                score += len(trigger.split())
        
        if score > best_score:
            best_score = score
            best_match = recipe
    
    # Only return if we have a meaningful match
    if best_score >= 1:
        return best_match
    
    return None


def get_recipe_prompt(recipe: Recipe) -> str:
    """
    Generate the recipe-specific prompt section for the system prompt.
    """
    structure = "\n".join(f"   {item}" for item in recipe.required_structure)
    
    return f"""
## 📋 RECIPE ACTIVATED: {recipe.name}

This question matches the {recipe.name} recipe. You MUST follow this structure:

**Required Structure:**
{structure}

**Template to Follow:**
{recipe.template}

**End with this accountability question:**
"{recipe.accountability_question}"

IMPORTANT: Follow this structure closely. Don't skip sections. Be specific, not generic.
"""


def get_all_recipes_reference() -> str:
    """
    Generate a reference of all recipes for the system prompt.
    """
    recipe_list = []
    for i, recipe in enumerate(ALL_RECIPES, 1):
        triggers = ", ".join(recipe.triggers[:5])
        recipe_list.append(f"{i}. **{recipe.name}**: {triggers}...")
    
    return """
## 📚 RESPONSE RECIPES AVAILABLE

You have 9 structured response recipes. When a question matches one, follow its structure:

""" + "\n".join(recipe_list) + """

When a recipe is activated, follow its required structure exactly. This ensures consistent, high-quality, Tay-coded responses.
"""
