---
name: abtasty
description: AB Tasty Feature Experimentation & Web Experimentation platform integration. Use this skill when working with AB Tasty feature flags, campaigns, A/B tests, SDK installation, visitor targeting, decision APIs, or campaign configuration for both Feature Experimentation (server-side) and Web Experimentation (client-side). This skill provides tools for retrieving campaigns and flags, installing SDKs, and generating campaign configurations from natural language briefs.
---

# AB Tasty Integration

Expert guidance for AB Tasty's Feature Experimentation & Rollouts (server-side) and Web Experimentation (client-side) platforms.

## Overview

AB Tasty provides two main platforms:

- **Feature Experimentation & Rollouts (FE&R)**: Server-side feature flags and experimentation
- **Web Experimentation (WE)**: Client-side website testing and personalization

This skill helps with SDK installation, decision API integration, and campaign configuration for both platforms.

## Quick Navigation

Choose the appropriate guide based on your task:

### SDK Installation & Integration

**Installing AB Tasty SDKs:**
- Node.js server-side SDK → See [nodejs-sdk.md](references/nodejs-sdk.md)
- Need other SDK platforms (React, JavaScript, etc.) → Request additional documentation

### Decision API (Runtime Feature Flags)

**Retrieving feature flags and campaigns at runtime:**
- Get campaigns or flags for a visitor → See [decision-api.md](references/decision-api.md)
- Understanding visitor context and targeting → See [decision-api.md](references/decision-api.md)
- Activate campaigns or send analytics hits → See [decision-api.md](references/decision-api.md)
- Complete working example → Run `scripts/call-decision-api.js`

### Campaign Configuration (Setup)

**Creating or configuring campaigns:**

**Feature Experimentation campaigns:**
- Create campaigns, flags, goals, targeting from description → See [fear-resource-extractor.md](references/fear-resource-extractor.md)
- Load campaign configurations → See [resource-loader.md](references/resource-loader.md)

**Web Experimentation campaigns:**
- Create A/B tests, variations, modifications from description → See [we-resource-extractor.md](references/we-resource-extractor.md)
- Load web campaign configurations → See [resource-loader.md](references/resource-loader.md)

## Common Workflows

### Workflow 1: Install SDK and Get Feature Flags

1. Install SDK using [nodejs-sdk.md](references/nodejs-sdk.md)
2. Use Decision API to retrieve flags with [decision-api.md](references/decision-api.md)

### Workflow 2: Create and Deploy New Campaign

1. Generate campaign config using [fear-resource-extractor.md](references/fear-resource-extractor.md) or [we-resource-extractor.md](references/we-resource-extractor.md)
2. Load resources using [resource-loader.md](references/resource-loader.md)

### Workflow 3: Test Existing Campaign

1. Get campaign details using [decision-api.md](references/decision-api.md)
2. Verify targeting and variations

## Credentials Required

Different operations require different credentials:

**Decision API** (runtime flags):
- Environment ID (`env_id`)
- API Key (`api_key`)
- Find in: AB Tasty account → Settings → Feature Experimentation → Environment settings

**Resource Loader** (campaign configuration):

*For Feature Experimentation:*
- Account ID (`fear_rca_account_id`)
- Environment ID (`fear_rca_account_environment_id`)
- RCA Token (`fear_rca_token`)

*For Web Experimentation:*
- Account ID (`we_account_id`)
- API Token (`we_token`)

## Reference Files

- [decision-api.md](references/decision-api.md) - Decision API tools for runtime flag retrieval
- [resource-loader.md](references/resource-loader.md) - Resource Loader API for campaign configuration
- [nodejs-sdk.md](references/nodejs-sdk.md) - Node.js SDK installation and setup
- [fear-resource-extractor.md](references/fear-resource-extractor.md) - Feature Experimentation campaign generator
- [we-resource-extractor.md](references/we-resource-extractor.md) - Web Experimentation campaign generator

## When to Use This Skill

Use this skill when the user asks about:

- Installing or configuring AB Tasty SDKs
- Getting feature flags or campaigns for visitors
- Creating A/B tests or feature experiments
- Setting up visitor targeting and context
- Configuring campaign variations and allocations
- Generating campaign configurations from requirements
- Tracking analytics hits or activating campaigns
- AB Tasty Feature Experimentation, Flagship, or Web Experimentation platforms
