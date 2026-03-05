# Feature Experimentation Resource Extractor

Generates schema-compliant campaign configurations for AB Tasty Feature Experimentation from natural language briefs.

## Purpose

Converts campaign descriptions into structured JSON for the Resource Loader API. Handles projects, campaigns, flags, goals, and targeting keys.

## How It Works

**Input:** Natural language campaign brief
**Output:** Structured JSON with `resources` array
**Next step:** Pass JSON to Resource Loader API

## Resource Types

- **project**: Campaign containers/folders
- **campaign**: A/B tests or feature rollouts with variations
- **flag**: Feature flags (boolean, string, number, json)
- **goal**: Analytics objectives (screenview, click, transaction, custom)
- **targeting-key**: Targeting criteria definitions

## Output Schema

```json
{
  "version": 1,
  "needs_clarification": false,
  "questions": [],
  "resources": [
    {
      "type": "project|campaign|flag|goal|targeting-key",
      "$_ref": "p1|c1|f1|g1|t1",
      "action": "create|update|delete",
      "payload": {
        /* resource-specific fields */
      }
    }
  ]
}
```

**Critical:** Each resource MUST have `type`, `$_ref`, `action`, `payload`.

## Campaign Structure

Campaigns include:

- **Basic info:** name, description, type (always "ab" for Feature Experimentation)
- **Project reference:** `"project_id": "$p1.id"` to link to project
- **Variation groups:** MUST contain exactly 1 variation group
  - **Variations:** At least 1 variation with `reference: true` (control)
  - **Allocations:** Must sum to exactly 100
  - **Modifications:** FLAG type with key-value pairs
  - **Targeting:** Optional targeting rules

## Common Campaign Patterns

### Simple Feature Flag

**Brief:** "Feature flag 'new-ui' for premium users"

**Output includes:**

```json
{
  "type": "campaign",
  "payload": {
    "type": "ab",
    "variation_groups": [
      {
        "variations": [
          { "name": "Original", "reference": true, "allocation": 50 },
          {
            "name": "New UI",
            "reference": false,
            "allocation": 50,
            "modifications": {
              "type": "FLAG",
              "value": { "new-ui": true }
            }
          }
        ]
      }
    ]
  }
}
```

### Progressive Rollout with Targeting

**Brief:** "Roll out 'premium-features' to 30% of users on release v2.0"

**Output includes:**

```json
{
  "type": "campaign",
  "payload": {
    "variation_groups": [
      {
        "variations": [
          { "name": "Original", "reference": true, "allocation": 70 },
          {
            "name": "Premium",
            "reference": false,
            "allocation": 30,
            "modifications": {
              "type": "FLAG",
              "value": { "premium-features": "enabled" }
            }
          }
        ],
        "targeting": {
          "targeting_groups": [
            {
              "targetings": [
                {
                  "operator": "EQUALS",
                  "key": "release",
                  "value": "v2.0"
                }
              ]
            }
          ]
        }
      }
    ]
  }
}
```

### Multiple Resources

**Brief:** "Campaign 'Premium Test' in project 'Q1 Features' with flag 'premium-ui' and goal for page views"

**Output includes:**

```json
{
  "resources": [
    { "type": "project", "$_ref": "p1", "payload": { "name": "Q1 Features" } },
    { "type": "campaign", "$_ref": "c1", "payload": { "project_id": "$p1.id", ... } },
    { "type": "flag", "$_ref": "f1", "payload": { "name": "premium-ui", "type": "boolean" } },
    { "type": "goal", "$_ref": "g1", "payload": { "type": "screenview", "label": "premium_view" } }
  ]
}
```

## Targeting

### Operators

- `EQUALS` / `NOT_EQUALS`
- `STARTS_WITH` / `ENDS_WITH`
- `CONTAINS` / `NOT_CONTAINS`
- `GREATER_THAN` / `LOWER_THAN`
- `GREATER_THAN_OR_EQUALS` / `LOWER_THAN_OR_EQUALS`
- `EXISTS` / `NOT_EXISTS`

### Targeting Structure

```json
{
  "targeting": {
    "targeting_groups": [
      {
        "targetings": [
          { "operator": "EQUALS", "key": "country", "value": "US" },
          { "operator": "EQUALS", "key": "plan", "value": "premium" }
        ]
      }
    ]
  }
}
```

**Rules:**

- Multiple targetings in a group = AND condition
- Multiple targeting groups = OR condition

### Examples

**Target premium US users:**

```json
"targeting_groups": [{
  "targetings": [
    { "operator": "EQUALS", "key": "country", "value": "US" },
    { "operator": "EQUALS", "key": "plan", "value": "premium" }
  ]
}]
```

**Target v1.0 OR v2.0 users:**

```json
"targeting_groups": [
  { "targetings": [{ "operator": "EQUALS", "key": "release", "value": "v1.0" }] },
  { "targetings": [{ "operator": "EQUALS", "key": "release", "value": "v2.0" }] }
]
```

## Clarification Handling

When information is missing, extractor sets `needs_clarification: true` and provides questions.

**Example unclear brief:** "Create an AB test with a flag"

**Output:**

```json
{
  "needs_clarification": true,
  "questions": [
    "What should the campaign be named?",
    "What is the flag key and value?",
    "What are the allocation percentages?",
    "Should a new project be created or use existing?"
  ],
  "resources": [
    /* placeholder resources */
  ]
}
```

**Next steps:**

1. Answer all questions
2. Provide complete information
3. Re-run extractor
4. `needs_clarification` will be false

## Flag Types

- **boolean**: true/false values
- **string**: Text values
- **number**: Numeric values
- **json**: Complex objects

**Example:**

```json
{
  "type": "flag",
  "payload": {
    "name": "api-config",
    "type": "json",
    "description": "API configuration",
    "source": "manual"
  }
}
```

## Goal Types

- **screenview**: Page/screen views
- **click**: Click events
- **transaction**: Purchase events
- **custom**: Custom events

**Example:**

```json
{
  "type": "goal",
  "payload": {
    "type": "transaction",
    "label": "premium_purchase",
    "operator": "contains",
    "value": "/checkout/premium"
  }
}
```

## Validation Rules

Before generating JSON, extractor validates:

✅ Each resource has `type`, `$_ref`, `action`, `payload`
✅ Campaign includes required fields (name, description, type, project_id)
✅ Variation groups array contains exactly 1 element
✅ At least one variation has `reference: true`
✅ Allocations sum to exactly 100
✅ Modifications use FLAG type with value object
✅ Targeting uses valid operators
✅ Resources ordered by dependency (project → campaign → flags/goals)

## Best Practices

### Provide Complete Briefs

Include:

- Campaign name and purpose
- Project name or ID
- Flag keys and types
- Variation allocations
- Targeting criteria
- Goal definitions

### Be Specific

- "50/50 split" not "most users"
- "release v2.0" not "new version"
- "premium plan" not "paying users"

### Use Consistent Naming

- Flag keys: lowercase-with-hyphens
- Targeting keys: consistent across campaigns
- Goal labels: descriptive and unique

### Review Before Loading

- Check allocations sum to 100
- Verify targeting operators
- Confirm flag types match usage
- Review resource dependencies

## Example Workflows

### Create Simple Flag

```
Brief: "Feature flag 'dark-mode' default false, 20% get true"
→ Extractor generates JSON with 80/20 split
→ Load with Resource Loader API
→ Flag campaign created
```

### Create Targeted Campaign

```
Brief: "Campaign 'Mobile Feature' in 'Q1' project,
        flag 'mobile-nav' for users with device=mobile, 50/50 split"
→ Extractor generates project, campaign with targeting
→ Load with Resource Loader API
→ Project and campaign created with targeting
```

### Create Complex Setup

```
Brief: "Project 'Premium Features', campaign 'Premium UI',
        flags 'premium-ui' (boolean) and 'ui-theme' (string),
        goal for premium page views, target premium plan users, 30/70 split"
→ Extractor generates complete resource set
→ Load with Resource Loader API
→ All resources created with relationships
```

## Critical Reminders

❌ **Never manually construct JSON** - always use extractor
❌ **Never use shorthand formats** like `{"campaign": {...}}`
❌ **Never guess values** - ask for clarification
✅ **Always validate structure** before loading
✅ **Answer all clarification questions** completely
✅ **Review allocations** sum to 100
✅ **Verify targeting** operators and keys

## Related

- Loading resources: See [resource-loader.md](resource-loader.md)
- Runtime flags: See [decision-api.md](decision-api.md)
- Web campaigns: See [we-resource-extractor.md](we-resource-extractor.md)
