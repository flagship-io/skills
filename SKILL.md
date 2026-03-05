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

**Installing AB Tasty SDKs — choose your platform:**

_Server-side:_

- Node.js → See [nodejs-sdk.md](references/nodejs-sdk.md)
- Python → See [python-sdk.md](references/python-sdk.md)
- Java → See [java-sdk.md](references/java-sdk.md)
- Go → See [go-sdk.md](references/go-sdk.md)
- PHP → See [php-sdk.md](references/php-sdk.md)
- .NET → See [dotnet-sdk.md](references/dotnet-sdk.md)

_Client-side / Mobile:_

- React → See [react-sdk.md](references/react-sdk.md)
- Android → See [android-sdk.md](references/android-sdk.md)
- iOS → See [ios-sdk.md](references/ios-sdk.md)
- Flutter → See [flutter-sdk.md](references/flutter-sdk.md)

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

1. Install the SDK for your platform (see SDK Installation section above)
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

_For Feature Experimentation:_

- Account ID (`fear_rca_account_id`)
- Environment ID (`fear_rca_account_environment_id`)
- RCA Token (`fear_rca_token`)

_For Web Experimentation:_

- Account ID (`we_account_id`)
- API Token (`we_token`)

## Reference Files

_APIs & Tooling:_

- [decision-api.md](references/decision-api.md) - Decision API tools for runtime flag retrieval
- [resource-loader.md](references/resource-loader.md) - Resource Loader API for campaign configuration
- [fear-resource-extractor.md](references/fear-resource-extractor.md) - Feature Experimentation campaign generator
- [we-resource-extractor.md](references/we-resource-extractor.md) - Web Experimentation campaign generator

_SDKs:_

- [nodejs-sdk.md](references/nodejs-sdk.md) - Node.js SDK
- [python-sdk.md](references/python-sdk.md) - Python SDK
- [java-sdk.md](references/java-sdk.md) - Java SDK
- [go-sdk.md](references/go-sdk.md) - Go SDK
- [php-sdk.md](references/php-sdk.md) - PHP SDK
- [dotnet-sdk.md](references/dotnet-sdk.md) - .NET SDK
- [react-sdk.md](references/react-sdk.md) - React SDK
- [android-sdk.md](references/android-sdk.md) - Android SDK
- [ios-sdk.md](references/ios-sdk.md) - iOS SDK
- [flutter-sdk.md](references/flutter-sdk.md) - Flutter SDK

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
