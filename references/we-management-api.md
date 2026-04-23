# Web Experimentation Management API

Direct REST API reference for managing the operational lifecycle of existing AB Tasty Web Experimentation campaigns: status transitions, traffic reallocation, targeting updates, QA mode, and metrics attachment.

## Scope

This reference complements [we-resource-extractor.md](we-resource-extractor.md) and [resource-loader.md](resource-loader.md), which focus on **creating** campaigns declaratively. This document covers **post-creation management** via the public REST API (`api.abtasty.com`):

- Status transitions (draft → QA → live → paused → archived)
- Traffic reallocation on running campaigns
- Targeting updates (audiences, URL scopes, display frequency)
- QA mode activation
- Metrics creation and attachment
- Campaign labels / tags

Use this when operating against campaigns that already exist, or when a workflow needs imperative control beyond what the Resource Loader provides.

**Scope note:** Web Experimentation (client-side) only. For Feature Experimentation & Rollouts (server-side), see the Flagship-specific references.

## Authentication

Uses the standard AB Tasty Public API OAuth2 access token.

### Credential setup

1. Generate client credentials at `app2.abtasty.com/settings/public-api`
2. Use the `VSCode Extension` role (full scope for campaign management)
3. Run the OAuth2 `authorization_code` flow (the `client_credentials` grant is **disabled** for this product — you must complete an interactive browser login)
4. The token is valid for ~12 hours; refresh with the `refresh_token` before expiry

### Required headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
User-Agent: abtasty-cli/1.6.0
```

- `Accept` is required even on GET — the API returns `415 Unsupported Media Type` without it
- `User-Agent` matching a recognized client (e.g. `abtasty-cli/1.6.0`) is expected by some endpoints

## Account ID Lookup

```
GET /v1/accounts
```

Response contains `_data[].id` (numeric). This is the ID used in all subsequent paths.

**Note:** The 32-character hex string shown in tag installation UI is `identifier`, not `id`. Do not use it in API paths.

## Status Transitions

Every campaign has a `status` field. The full set of valid values:

```
draft | ready_to_launch | play | pause | in_qa |
analysis | interrupted | scheduled | archive | ended
```

Transition by PATCHing the campaign:

```
PATCH /v1/accounts/{account_id}/tests/{test_id}
{
  "status": "play"
}
```

### Typical lifecycle

```
draft → in_qa → play → pause → analysis → archive
```

- `draft`: being built, not visible to visitors
- `in_qa`: preview only via QA URL parameter
- `play`: live, serving traffic
- `pause`: halted without losing configuration
- `analysis`: ended but kept for reporting
- `archive`: soft-deleted

### Invalid transitions

If you pass an invalid value, the API returns `400` with the full list of accepted values in `error.message`. Use this as an up-to-date spec.

## QA Mode

Activates preview-only mode. Visitors see nothing; developers append `?abtasty=qa` to the URL to preview variations.

```
PATCH /v1/accounts/{account_id}/tests/{test_id}
{
  "status": "in_qa",
  "qa_url_parameter_enabled": true,
  "qa_done": true,
  "user_agent": "ABTastyQA/1.0"
}
```

- `qa_url_parameter_enabled`: must be true for the `?abtasty=qa` override to work
- `user_agent`: optional; restricts QA mode to a specific user agent string

**There is no `qa_ip_allowlist` or per-test QA IP field.** IP-based restrictions must be handled at the application layer or via audience targeting.

## Traffic Allocation

Two levels:

### Test-level (overall traffic percentage entering the test)

```
PATCH /v1/accounts/{account_id}/tests/{test_id}
{
  "traffic": {"value": 100}
}
```

Wrapped in an object with `value` key.

### Variation-level (split within the test)

```
PATCH /v1/accounts/{account_id}/tests/{test_id}/variations/{variation_id}
{
  "traffic": 50
}
```

Flat numeric value (not wrapped). Variation percentages should sum to 100.

**Common mistake:** passing `{"traffic": {"value": N}}` to a variation endpoint returns `400`.

## Targeting Updates

Update URL scopes, audiences, and frequency on a running campaign without rebuilding it.

```
PATCH /v1/accounts/{account_id}/tests/{test_id}
{
  "audience_ids": ["<segment_uuid>", "<trigger_uuid>"],
  "url_scopes": [
    {"value": "/target-path/", "include": true, "condition": 10}
  ],
  "display_frequency_type": "regular",
  "display_frequency_unit": "day",
  "display_frequency_value": 1
}
```

### URL scope conditions

| Value | Meaning |
|-------|---------|
| 1 | IS_EXACTLY |
| 10 | CONTAINS |
| 11 | REGEX |
| 40 | IS |
| 50 | IS_SAVED_PAGE |

### Display frequency types

| Value | Meaning |
|-------|---------|
| `any` | No frequency cap |
| `once` | Show once ever |
| `regular` | Show every N units |
| `once_per_session` | Once per session |

With `regular`, combine with `display_frequency_unit` (`minute` / `hour` / `day` / `week`) and `display_frequency_value`.

### Audiences: segments and triggers

Segments and triggers are the same underlying `audience` resource, distinguished by the `is_segment` flag:

```
GET /v1/accounts/{account_id}/audiences?type=segment
GET /v1/accounts/{account_id}/audiences?type=trigger
```

Both live in the same `audience_ids[]` array on a campaign. The API accepts them mixed.

Creating new audiences:

```
POST /v1/accounts/{account_id}/audiences
```

Supports 30+ condition types: Device, Browser, Geo, Cookie, DataLayer, ScreenSize, and more. The exact schema surfaces via `400` responses on malformed POSTs.

## Metrics

### Create a metric scoped to a test

```
POST /v1/accounts/{account_id}/metrics
{
  "name": "CTA click",
  "test_id": <int>,
  "account_level": false,
  "hidden": false,
  "context": "user_interaction",
  "type": "custom_tracking",
  "value": "{\"event\":\"mousedown\",\"selector\":\"a[href='/signup/']\"}",
  "created_from": "custom_code"
}
```

### Metric types

| Type | Use case |
|------|----------|
| `custom_tracking` | JS event-based (click, scroll, etc.) |
| `action_tracking` | Predefined actions |
| `transaction` | Revenue / transaction-level |
| `widget_tracking` | AB Tasty widget interactions |
| `page_view` | Page views |
| `indicator` | Custom indicator values |

### Limitation: primary/secondary metric assignment

Assigning a metric as the **primary** or **secondary** goal of a campaign (the setting surfaced in the Report tab) is **not available on the public API**. Metrics can be created and listed, but the primary/secondary designation must be set through the AB Tasty UI.

This is the main gap when trying to fully automate campaign setup end-to-end.

## Read/Write Key Asymmetry

Some fields use different keys on write vs read — a common source of confusion:

| PATCH (write) | GET (read) |
|---------------|------------|
| `is_async` | `async` |
| `audience_ids` | `audiences[]` (expanded objects) |

Writing with the read-side key name silently has no effect (the PATCH returns 200 but the field is unchanged).

## Advanced Options

```
PATCH /v1/accounts/{account_id}/tests/{test_id}
{
  "is_async": false,
  "dom_ready": false,
  "mutation_observer": true,
  "statistic_engine": "frequentist",
  "hypothesis_score": 3,
  "sequential_testing": {
    "sequential_testing_mode": "interrupt",
    "sequential_testing_setup": "balanced"
  },
  "labels": ["q2-2026", "pricing-test"]
}
```

- `statistic_engine`: `frequentist` or `bayesian`
- `hypothesis_score`: 1–4
- `sequential_testing_mode`: `interrupt` or `email`
- `sequential_testing_setup`: `balanced`, `high`, or `low`

## Error Responses as Spec

The API returns `400 Bad Request` with the full list of accepted fields or values in `error.message`:

```json
{
  "error": {
    "message": "The option \"xxxx\" does not exist. Defined options are: \"name\", \"url\", \"type\", ..."
  }
}
```

When in doubt, send an intentionally malformed PATCH with an unknown field — the response lists every option the endpoint accepts. This is often faster than hunting through documentation.

## Minimal Example (Python stdlib only)

```python
import json, pathlib, urllib.request

cred = json.loads(
    (pathlib.Path.home() / ".abtasty/credentials/we/USERNAME.json").read_text()
)
HEADERS = {
    "Authorization": f"Bearer {cred['access_token']}",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "abtasty-cli/1.6.0",
}

# Transition to QA mode
body = json.dumps({
    "status": "in_qa",
    "qa_url_parameter_enabled": True,
    "qa_done": True,
}).encode()

req = urllib.request.Request(
    f"https://api.abtasty.com/api/v1/accounts/{ACCOUNT_ID}/tests/{TEST_ID}",
    data=body, headers=HEADERS, method="PATCH",
)
with urllib.request.urlopen(req) as r:
    print(r.status)
```

## Minimal Example (curl)

```bash
ACCESS_TOKEN=$(jq -r .access_token ~/.abtasty/credentials/we/USERNAME.json)

curl -s -X PATCH "https://api.abtasty.com/api/v1/accounts/${ACCOUNT_ID}/tests/${TEST_ID}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "User-Agent: abtasty-cli/1.6.0" \
  -d '{"status":"play"}'
```

## Common Workflows

### Promote a drafted campaign to production

```
1. PATCH status → "in_qa"
2. PATCH qa_url_parameter_enabled → true
3. Verify by appending ?abtasty=qa to target URL
4. AB Tasty UI: assign primary/secondary metrics (not API-exposed)
5. PATCH status → "play"
```

### Emergency pause

```
PATCH /tests/{id}
{"status": "pause"}
```

Campaign stops serving immediately; configuration is preserved for later resume.

### Rebalance traffic mid-flight

```
PATCH /tests/{id}/variations/{v1}  { "traffic": 30 }
PATCH /tests/{id}/variations/{v2}  { "traffic": 70 }
```

No redeploy needed.

### Add a click-tracking metric to a running test

```
POST /metrics
{
  "name": "Checkout CTA",
  "test_id": <running_test_id>,
  "type": "custom_tracking",
  "value": "{\"event\":\"mousedown\",\"selector\":\"button.cta\"}",
  "created_from": "custom_code"
}
```

Then designate as primary goal in the AB Tasty UI (API limitation noted above).

## Troubleshooting

### 401 Unauthorized
Access token expired or invalid. Refresh or re-run OAuth flow.

### 406 Not Acceptable
Missing `Accept: application/json` header.

### 415 Unsupported Media Type
Missing `Accept: application/json` header on a GET request.

### 400 Bad Request
Read the `error.message` field — it lists the full schema accepted by the endpoint.

### PATCH returns 200 but the change didn't stick
Likely writing with the read-side key (e.g. `async` instead of `is_async`). See read/write key asymmetry table above.

## Related

- Creating campaigns declaratively: See [we-resource-extractor.md](we-resource-extractor.md)
- Loading campaign resources: See [resource-loader.md](resource-loader.md)
- Runtime flag retrieval: See [decision-api.md](decision-api.md)
