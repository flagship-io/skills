# Decision API Reference

The Decision API provides runtime access to campaigns and feature flags for visitors. Use this when you need to retrieve feature flag values or campaign variations based on visitor context.

## Available Operations

### 1. Get All Campaigns

Retrieve all campaigns (including feature flags) for a visitor with their context.

**When to use:** Get complete campaign information including variations and modifications.

**Required parameters:**

- `visitor_id` (string): Unique identifier for the visitor
- `context` (object): Key-value pairs for visitor targeting
- `trigger_hit` (boolean, optional): Whether to send analytics hit (default: false)

**Example:**

```javascript
{
  visitor_id: "user-123",
  context: {
    isVIP: true,
    country: "US",
    plan: "premium"
  },
  trigger_hit: false
}
```

**Response:** Returns campaigns with variations and modifications for the visitor.

### 2. Get All Feature Flags

Retrieve all feature flags with their values in a simplified key-value format.

**When to use:** Get flag values without full campaign metadata.

**Required parameters:**

- `visitor_id` (string): Unique identifier for the visitor
- `context` (object): Key-value pairs for visitor targeting
- `trigger_hit` (boolean, optional): Whether to send analytics hit (default: false)

**Example:**

```javascript
{
  visitor_id: "user-123",
  context: {
    isVIP: true,
    country: "US"
  },
  trigger_hit: false
}
```

**Response:** Returns simplified key-value pairs of flags:

```json
{
  "welcome-message": "Welcome Premium User!",
  "api-limit": 1000,
  "premium-ui": true
}
```

### 3. Get Specific Campaign

Retrieve a specific campaign by its ID for a visitor.

**When to use:** Get details about a single campaign.

**Required parameters:**

- `visitor_id` (string): Unique identifier for the visitor
- `campaign_id` (string): Unique campaign identifier
- `context` (object): Key-value pairs for visitor targeting
- `trigger_hit` (boolean, optional): Whether to send analytics hit (default: false)

**Example:**

```javascript
{
  visitor_id: "user-123",
  campaign_id: "campaign-456",
  context: {
    isVIP: true
  },
  trigger_hit: false
}
```

### 4. Activate Campaign

Send an activation hit for a campaign to track visitor exposure.

**When to use:** Track when a visitor is exposed to a campaign variation.

**Required parameters:**

- `visitor_id` (string): Unique identifier for the visitor
- `variation_group_id` (string): Unique variation group identifier
- `variation_id` (string): Unique variation identifier

**Example:**

```javascript
{
  visitor_id: "user-123",
  variation_group_id: "vg-789",
  variation_id: "var-012"
}
```

## Visitor Context

The `context` object is crucial for targeting. It contains key-value pairs describing visitor attributes that campaigns use for targeting decisions.

**Common context attributes:**

- User attributes: `userId`, `email`, `isVIP`, `plan`, `role`
- Location: `country`, `region`, `city`, `timezone`
- Device: `platform`, `browser`, `deviceType`
- App state: `version`, `release`, `feature_enabled`
- Behavioral: `loginProvider`, `purchase_count`, `lifetime_value`
- Feature Experimentation & Rollout attributes: `fs_all_users`
- Custom: Any custom attributes relevant to your targeting

**Example context objects:**

```javascript
// Basic user context
{
  country: "US",
  plan: "premium",
  isVIP: true
}

// Release targeting
{
  release: "v2.0.0",
  environment: "production",
  region: "eu-west"
}

// Behavioral targeting
{
  purchase_count: 5,
  lifetime_value: 999.99,
  last_login: "2026-02-01"
}

// All users/visitors targeting (FEAR)
{
  "fs_all_users": true
}
```

## Targeting Decision Flow

1. **Create visitor**: Define visitor_id and context attributes
2. **Fetch campaigns/flags**: Decision API evaluates targeting rules against context
3. **Return variations**: Only campaigns matching targeting criteria return variations
4. **Default values**: Non-matching campaigns return default values

## Best Practices

### Context Design

- **Be specific**: Include all attributes your campaigns target
- **Be consistent**: Use the same attribute names across campaigns
- **Be selective**: Only include relevant attributes for the user's current state
- **Use meaningful IDs**: visitor_id should uniquely identify the user

### Performance

- **Batch requests**: Get all flags at once rather than individual calls
- **Cache wisely**: Cache flag values but respect context changes
- **Use trigger_hit sparingly**: Only set to true when you need analytics tracking

### Error Handling

- **Missing campaigns**: Returns default values if campaign doesn't exist
- **Invalid credentials**: Check Environment ID and API Key
- **Timeout**: Increase timeout or check network connectivity

## Credentials

All Decision API operations require:

- **Environment ID** (`env_id`): Found in AB Tasty account → Settings → Feature Experimentation → Environment settings
- **API Key** (`api_key`): Found in the same location

Store these securely as environment variables, never hardcode in source.

## Use Cases

**Simple feature flag:**

```javascript
// Check if premium UI is enabled
{
  visitor_id: "user-123",
  context: { plan: "premium" },
  trigger_hit: false
}
// Returns: { "premium-ui": true }
```

**Targeted rollout:**

```javascript
// Progressive rollout to v2.0.0 users
{
  visitor_id: "user-456",
  context: {
    release: "v2.0.0",
    region: "eu-west"
  },
  trigger_hit: false
}
```

**A/B test with analytics:**

```javascript
// Get variation and track exposure
{
  visitor_id: "user-789",
  context: { country: "US" },
  trigger_hit: true  // Track this exposure
}
```

## Example Script

A complete, self-contained example script is available in `scripts/call-decision-api.js`.

**Self-contained implementation** using only native Node.js APIs (no external dependencies required).

Demonstrates all Decision API operations:

- Get all campaigns for a visitor
- Get feature flags in key-value format
- Get specific campaign by ID
- Activate campaign with analytics hit
- Context-based targeting examples

**Requirements:** Node.js 14+ (no npm packages needed)

**Usage:**

```bash
export AB_TASTY_ENV_ID="your-env-id"
export AB_TASTY_API_KEY="your-api-key"
node scripts/call-decision-api.js
```

**Features:**

- ✅ Self-contained (uses native Node.js `https` module only)
- ✅ Complete DecisionAPIClient implementation
- ✅ 5 working examples with different use cases
- ✅ Comprehensive error handling with helpful messages
- ✅ Handle edge cases (timeouts, network errors, HTTP errors)
- ✅ Customizable visitor contexts and campaigns
- ✅ Can be run directly or imported as a module

## Related

- For SDK integration: See [nodejs-sdk.md](nodejs-sdk.md)
- For creating campaigns: See [fear-resource-extractor.md](fear-resource-extractor.md)
- For loading campaigns: See [resource-loader.md](resource-loader.md)
