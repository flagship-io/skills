# AB Tasty Agent Skills

A collection of AI agent skills for integrating with the [AB Tasty](https://www.abtasty.com) platform — covering Feature Experimentation & Rollouts (server-side) and Web Experimentation (client-side).

## What Are Skills?

Skills are modular knowledge packages that extend AI coding agents (such as GitHub Copilot) with domain-specific expertise. Each skill exposes a `SKILL.md` entrypoint and a set of reference documents that guide the agent through complex, multi-step workflows.

## Available Skill

### `abtasty`

Expert guidance for AB Tasty's two main platforms:

| Platform                               | Type        | Description                                            |
| -------------------------------------- | ----------- | ------------------------------------------------------ |
| **Feature Experimentation & Rollouts** | Server-side | Feature flags, rollouts, and server-side A/B tests     |
| **Web Experimentation**                | Client-side | Website A/B tests, personalizations, and modifications |

**Entrypoint:** [SKILL.md](SKILL.md)

## Repository Structure

```
skills/
├── SKILL.md                        # Skill definition and routing logic
├── README.md                       # This file
├── LICENSE.txt
├── references/                     # Detailed reference documents
│   ├── decision-api.md             # Runtime feature flag retrieval (Decision API)
│   ├── resource-loader.md          # Campaign configuration loader
│   ├── fear-resource-extractor.md  # Feature Experimentation campaign generator
│   ├── we-resource-extractor.md    # Web Experimentation campaign generator
│   ├── nodejs-sdk.md               # Node.js SDK installation
│   ├── react-sdk.md                # React SDK installation
│   ├── python-sdk.md               # Python SDK installation
│   ├── java-sdk.md                 # Java SDK installation
│   ├── go-sdk.md                   # Go SDK installation
│   ├── php-sdk.md                  # PHP SDK installation
│   ├── dotnet-sdk.md               # .NET SDK installation
│   ├── android-sdk.md              # Android SDK installation
│   ├── ios-sdk.md                  # iOS SDK installation
│   └── flutter-sdk.md              # Flutter SDK installation
└── scripts/
    └── call-decision-api.js        # Working example for the Decision API
```

## Reference Documents

### SDKs

| File                                        | Platform                | Language / Runtime      |
| ------------------------------------------- | ----------------------- | ----------------------- |
| [nodejs-sdk.md](references/nodejs-sdk.md)   | Feature Experimentation | Node.js                 |
| [react-sdk.md](references/react-sdk.md)     | Feature Experimentation | React / JavaScript      |
| [python-sdk.md](references/python-sdk.md)   | Feature Experimentation | Python 3.7+             |
| [java-sdk.md](references/java-sdk.md)       | Feature Experimentation | Java 8+                 |
| [go-sdk.md](references/go-sdk.md)           | Feature Experimentation | Go 1.18+                |
| [php-sdk.md](references/php-sdk.md)         | Feature Experimentation | PHP 7.4+                |
| [dotnet-sdk.md](references/dotnet-sdk.md)   | Feature Experimentation | .NET 6+                 |
| [android-sdk.md](references/android-sdk.md) | Feature Experimentation | Android (Kotlin / Java) |
| [ios-sdk.md](references/ios-sdk.md)         | Feature Experimentation | iOS (Swift / Obj-C)     |
| [flutter-sdk.md](references/flutter-sdk.md) | Feature Experimentation | Flutter / Dart          |

### APIs & Tooling

| File                                                                | Description                                                             |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [decision-api.md](references/decision-api.md)                       | Retrieve feature flags and campaigns at runtime for a given visitor     |
| [resource-loader.md](references/resource-loader.md)                 | Load and apply campaign configurations via the Resource Loader API      |
| [fear-resource-extractor.md](references/fear-resource-extractor.md) | Generate Feature Experimentation campaign configs from natural language |
| [we-resource-extractor.md](references/we-resource-extractor.md)     | Generate Web Experimentation campaign configs from natural language     |

## Common Workflows

**Install SDK and retrieve feature flags**

1. Follow the SDK guide for your platform (see SDK table above)
2. Use [decision-api.md](references/decision-api.md) to get flags for a visitor
3. Reference [scripts/call-decision-api.js](scripts/call-decision-api.js) for a working example

**Create and deploy a new campaign**

1. Generate a campaign config from a description using [fear-resource-extractor.md](references/fear-resource-extractor.md) (Feature Experimentation) or [we-resource-extractor.md](references/we-resource-extractor.md) (Web Experimentation)
2. Load the resources with [resource-loader.md](references/resource-loader.md)

## Credentials Reference

| Credential                                                                   | Where to find it                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `env_id` / `api_key`                                                         | AB Tasty → Settings → Feature Experimentation → Environment settings |
| `fear_rca_account_id` / `fear_rca_account_environment_id` / `fear_rca_token` | Feature Experimentation account settings                             |
| `we_account_id` / `we_token`                                                 | Web Experimentation account settings                                 |

## License

See [LICENSE.txt](LICENSE.txt).
