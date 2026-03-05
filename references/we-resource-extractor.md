# Web Experimentation Resource Extractor

Generates schema-compliant campaign configurations for AB Tasty Web Experimentation from natural language briefs.

## Purpose

Converts client-side A/B test descriptions into structured JSON for the Resource Loader API. Handles campaigns, variations, and modifications for website experiments.

## How It Works

**Input:** Natural language campaign brief
**Output:** Structured JSON with `resources` array
**Next step:** Pass JSON to Resource Loader API

## Resource Types

- **campaign**: A/B tests or personalizations
- **variation**: Test variations with traffic allocation
- **modification**: Element-level changes (text, HTML, CSS, JS)

## Output Schema

```json
{
  "needs_clarification": false,
  "questions": [],
  "resources": [
    {
      "type": "campaign",
      "$_ref": "c1",
      "action": "create",
      "payload": {
        "name": "Campaign Name",
        "url": "https://example.com",
        "campaign_targeting": {
          /* targeting rules */
        }
      },
      "resources": [
        {
          "type": "variation",
          "$_ref": "v1",
          "action": "create",
          "payload": {
            /* variation config */
          },
          "resources": [
            {
              "type": "modification",
              "$_ref": "m1",
              "action": "create",
              "payload": {
                /* modification config */
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**Critical:** Resources can be nested (variations under campaigns, modifications under variations).

## Campaign Structure

Campaigns require:

- **name**: Campaign name
- **description**: Campaign description
- **url**: Full URL (must include scheme: https://)
- **type**: "ab" | "multipage" | "multivariate" | "mastersegment" | "byapi"
- **labels**: Array of labels/tags
- **code**: Global JavaScript (runs for all variations)
- **source_code**: Original page source reference
- **campaign_targeting**: Targeting rules

### Campaign Targeting

```json
{
  "campaign_targeting": {
    "url_scopes": [
      {
        "condition": "IS|STARTS_WITH|ENDS_WITH|CONTAINS|IS_REGULAR_EXPRESSION",
        "value": "URL pattern"
      }
    ],
    "selector_scopes": [
      {
        "condition": "IS_SELECTOR_ID|IS_SELECTOR_CLASS|IS_SELECTOR_CUSTOM|...",
        "value": "selector"
      }
    ],
    "code_scope": { "value": "JavaScript to run when targeting matches" },
    "element_appears_after_page_load": false,
    "targeting_frequency": {
      "type": "regular|once_per_session|once",
      "unit": "minute|hour|day|week|session",
      "value": 1
    },
    "triggers_ids": []
  }
}
```

## Targeting Patterns

### URL Scopes

**Exact URL:**

```json
{ "condition": "IS", "value": "https://example.com/page" }
```

**All pages under path:**

```json
{ "condition": "STARTS_WITH", "value": "https://example.com/products/" }
```

**Pages ending with:**

```json
{ "condition": "ENDS_WITH", "value": "/checkout" }
```

**Contains fragment:**

```json
{ "condition": "CONTAINS", "value": "/pricing" }
```

**Regex pattern:**

```json
{ "condition": "IS_REGULAR_EXPRESSION", "value": "^https://.*\\.example\\.com" }
```

### Selector Scopes

**Element with ID:**

```json
{ "condition": "IS_SELECTOR_ID", "value": "hero" }
```

**Elements with class:**

```json
{ "condition": "IS_SELECTOR_CLASS", "value": ".promo" }
```

**Custom selector:**

```json
{ "condition": "IS_SELECTOR_CUSTOM", "value": "div[data-test='banner']" }
```

**Exclude selector:**

```json
{ "condition": "IS_NOT_SELECTOR_CLASS", "value": ".admin" }
```

### Targeting Frequency

**Once per session:**

```json
{ "type": "once_per_session" }
```

**Every N days:**

```json
{ "type": "regular", "unit": "day", "value": 7 }
```

**Every N hours:**

```json
{ "type": "regular", "unit": "hour", "value": 24 }
```

**Once ever:**

```json
{ "type": "once" }
```

## Variations

Each variation requires:

- **name**: Variation name
- **traffic**: Traffic percentage (0-100)
- **code**: JavaScript and/or CSS code

**Structure:**

```json
{
  "type": "variation",
  "$_ref": "v1",
  "action": "create",
  "payload": {
    "name": "Variation A",
    "description": "Description",
    "traffic": 50,
    "code": {
      "js": "console.log('Variation A');",
      "css": "body { background: #fff; }"
    }
  }
}
```

**Rules:**

- Traffic across all variations should sum to ≤100
- At least one of `js` or `css` must be present
- Original/control variation typically has minimal or no code

## Modifications

Element-level changes within variations:

**Types:**

- **text**: Replace text content
- **html**: Replace HTML
- **attribute**: Change attributes
- **js**: Run JavaScript
- **css**: Apply CSS

**Structure:**

```json
{
  "type": "modification",
  "$_ref": "m1",
  "action": "create",
  "payload": {
    "name": "Change CTA text",
    "selector": "#cta-button",
    "type": "text",
    "code": "Buy Now!"
  }
}
```

### Modification Examples

**Replace text:**

```json
{
  "selector": ".hero h1",
  "type": "text",
  "code": "New Headline Text"
}
```

**Inject HTML:**

```json
{
  "selector": ".banner",
  "type": "html",
  "code": "<div class='promo'>Sale!</div>"
}
```

**Change attribute:**

```json
{
  "selector": "img.hero",
  "type": "attribute",
  "code": "src=https://example.com/new-image.jpg"
}
```

**Run JavaScript:**

```json
{
  "selector": ".product",
  "type": "js",
  "code": "document.querySelector('.price').style.color = 'red';"
}
```

**Apply CSS:**

```json
{
  "selector": ".container",
  "type": "css",
  "code": "max-width: 1200px; margin: auto;"
}
```

## Common Campaign Patterns

### Simple A/B Test

**Brief:** "Test headline on homepage, 50/50 split"

**Output:**

```json
{
  "resources": [
    {
      "type": "campaign",
      "payload": {
        "name": "Homepage Headline Test",
        "url": "https://example.com",
        "campaign_targeting": {
          "url_scopes": [{ "condition": "IS", "value": "https://example.com" }],
          "selector_scopes": [
            { "condition": "IS_SELECTOR_CLASS", "value": "h1" }
          ]
        }
      },
      "resources": [
        {
          "type": "variation",
          "payload": { "name": "Original", "traffic": 50, "code": {} }
        },
        {
          "type": "variation",
          "payload": {
            "name": "New Headline",
            "traffic": 50,
            "code": { "js": "..." }
          },
          "resources": [
            {
              "type": "modification",
              "payload": {
                "selector": "h1",
                "type": "text",
                "code": "New Headline"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Multi-variation Test

**Brief:** "Test 3 CTA colors on product pages, equal split"

**Output includes:**

```json
{
  "resources": [
    { "name": "Original", "traffic": 25 },
    {
      "name": "Red CTA",
      "traffic": 25,
      "code": { "css": "button { background: red; }" }
    },
    {
      "name": "Blue CTA",
      "traffic": 25,
      "code": { "css": "button { background: blue; }" }
    },
    {
      "name": "Green CTA",
      "traffic": 25,
      "code": { "css": "button { background: green; }" }
    }
  ]
}
```

### Targeted Test

**Brief:** "A/B test pricing page header, only /pricing URLs, show once per session"

**Output includes:**

```json
{
  "campaign_targeting": {
    "url_scopes": [{ "condition": "CONTAINS", "value": "/pricing" }],
    "targeting_frequency": { "type": "once_per_session" }
  }
}
```

## Clarification Handling

When critical information is missing, extractor asks questions.

**Example unclear brief:** "Test CTA on homepage"

**Output:**

```json
{
  "needs_clarification": true,
  "questions": [
    "What is the full URL of the homepage?",
    "What is the selector for the CTA element?",
    "What traffic split do you want? (e.g., 50/50)",
    "What changes should be made to the CTA? (text, color, etc.)"
  ],
  "resources": [
    /* placeholder resources */
  ]
}
```

## Validation Rules

Extractor validates:

✅ Each resource has `type`, `$_ref`, `action`, `payload`
✅ Campaign has required fields (name, url, type, targeting)
✅ URL is absolute with scheme (https://)
✅ URL scopes has ≥1 entry
✅ Selector scopes has ≥1 entry
✅ Variations have name, traffic, and code (js or css)
✅ Traffic percentages are 0-100
✅ Targeting frequency is valid
✅ Modification types are valid

## Best Practices

### Provide Complete Briefs

- Full URL with scheme
- Specific selectors (ID, class, or custom)
- Traffic splits (percentages or "equal")
- Clear description of changes
- Targeting frequency if relevant

### Be Specific

- "ID #hero-button" not "the button"
- "50/50 split" not "half and half"
- "https://example.com/page" not "example.com"
- "Change text to 'Buy Now'" not "change CTA"

### Use Meaningful Names

- Campaign: "Q4 Pricing Test" not "Test 1"
- Variation: "Red CTA" not "Variation A"
- Modification: "Hero text change" not "Mod 1"

### Structure Selectors

- Prefer IDs: `#hero-section`
- Use classes: `.cta-button`
- Be specific: `.product-page .pricing .btn-primary`
- Test selectors in browser console first

## Example Workflows

### Simple Text Change

```
Brief: "Change h1 on https://example.com from 'Welcome' to 'Hello', 50/50"
→ Extractor generates campaign with 2 variations
→ Variation 1: Original (50%)
→ Variation 2: Text modification (50%)
→ Load with Resource Loader
```

### Image Swap Test

```
Brief: "Test hero image on /products,
        swap img#hero src, 3 versions, equal split"
→ Extractor generates 3 variations with attribute modifications
→ Each variation changes img src to different URL
→ Load with Resource Loader
```

### Multi-element Test

```
Brief: "On /landing page, test:
        - Headline text
        - CTA button color
        - Banner image
        40/60 split, show once per week"
→ Extractor generates campaign with targeting
→ Variation with 3 modifications (text, CSS, attribute)
→ Targeting frequency: once per week
→ Load with Resource Loader
```

## Critical Reminders

❌ **Never manually construct JSON** - use extractor
❌ **Never omit URL scheme** - must be https:// or http://
❌ **Never guess selectors** - ask for clarification
❌ **Never exceed 100% traffic** - allocations should sum to ≤100
✅ **Always provide full URLs** with scheme
✅ **Use valid selectors** (test in browser first)
✅ **Specify clear traffic splits**
✅ **Include code** (js or css) for variations

## Placeholders Used

When information is missing, extractor uses safe placeholders:

- **URL:** `"about:blank"` (asks for real URL)
- **Selector:** `"body"` (asks for specific selector)
- **Code:** `""` (asks for JavaScript/CSS)
- **Traffic:** `0` (asks for percentage)

These maintain JSON validity while signaling missing information.

## Related

- Loading resources: See [resource-loader.md](resource-loader.md)
- Server-side campaigns: See [fear-resource-extractor.md](fear-resource-extractor.md)
- Runtime flags: See [decision-api.md](decision-api.md)
