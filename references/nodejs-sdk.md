# AB Tasty Node.js SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship Node.js SDK for server-side applications.

## Prerequisites

Before starting, verify:

- Node.js 6.0.0+ installed
- NPM 3.0.0+ (or yarn/pnpm)
- Server/device has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

```bash
# npm
npm install @flagship.io/js-sdk

# yarn
yarn add @flagship.io/js-sdk

# pnpm
pnpm add @flagship.io/js-sdk
```

**Verify:** Package appears in `package.json` dependencies.

### Step 2: Initialize SDK

Initialize SDK early in your application entry point:

```javascript
import { Flagship } from "@flagship.io/js-sdk";

// Start SDK with credentials
await Flagship.start("<ENV_ID>", "<API_KEY>");
```

**When to initialize:** Before server starts handling requests, typically in main entry point.

**Optional configuration:**

```javascript
import { Flagship, LogLevel, DecisionMode } from "@flagship.io/js-sdk";

await Flagship.start("<ENV_ID>", "<API_KEY>", {
  logLevel: LogLevel.INFO,
  timeout: 2, // seconds (default: 2, minimum: 0)
  fetchNow: true, // auto-fetch flags on visitor creation (default: true)
  disableCache: false, // enable visitor and hit cache (default: false)
  decisionMode: DecisionMode.DECISION_API, // default mode
});
```

### Step 3: Create Visitor

Create visitors with unique IDs and context for targeting:

```javascript
const fsVisitor = Flagship.newVisitor({
  visitorId: "<VISITOR_ID>", // e.g., req.user?.id || "anonymous"
  hasConsented: true, // Required for GDPR
  context: {
    isVIP: true,
    country: "NL",
    plan: "premium",
    // Add targeting attributes
  },
});
```

**Express.js middleware pattern:**

```javascript
app.use((req, res, next) => {
  req.fsVisitor = Flagship.newVisitor({
    visitorId: req.user?.id || req.sessionID || "anonymous",
    hasConsented: true,
    context: {
      email: req.user?.email,
      ipAddress: req.get("x-forwarded-for") || req.ip,
      userAgent: req.get("user-agent"),
    },
  });
  next();
});
```

### Step 4: Fetch Flags

Before using flags, fetch them from AB Tasty:

```javascript
await fsVisitor.fetchFlags();
```

**Alternative approaches:**

```javascript
// Using promise
fsVisitor.fetchFlags().then(() => {
  // Flags ready
});

// Using event listener
fsVisitor.on("ready", () => {
  // Flags ready
});
```

### Step 5: Retrieve Flag Values

Get flag values with defaults:

```javascript
// Get flag object
const flag = fsVisitor.getFlag("displayVipFeature");

// Get value with default fallback
const showVip = flag.getValue(false);

if (showVip) {
  // Enable VIP feature
}
```

**Different flag types:**

```javascript
const welcomeText = fsVisitor.getFlag("welcome-text").getValue("Hello");
const apiLimit = fsVisitor.getFlag("api-limit").getValue(100);
const config = fsVisitor.getFlag("ui-config").getValue({ theme: "light" });
```

**Important:** `getValue()` automatically sends exposure hit by default.

### Step 6: Track Analytics Hits

Send hits to track user actions:

```javascript
import { HitType, EventCategory } from "@flagship.io/js-sdk";

// Event hit
fsVisitor.sendHit({
  type: HitType.EVENT,
  category: EventCategory.USER_ENGAGEMENT,
  action: "click",
  label: "vip-feature-button",
  value: 100,
});

// Page view
fsVisitor.sendHit({
  type: HitType.PAGE,
  documentLocation: "/checkout",
});

// Transaction
fsVisitor.sendHit({
  type: HitType.TRANSACTION,
  transactionId: "T12345",
  affiliation: "Online Store",
  totalRevenue: 99.99,
  shippingCosts: 5.0,
  taxes: 8.5,
  currency: "USD",
});
```

### Decision Modes

```javascript
import { Flagship, DecisionMode } from "@flagship.io/js-sdk";

// DECISION_API (default): campaign assignment done server-side, one HTTP request per fetchFlags call
await Flagship.start("<ENV_ID>", "<API_KEY>", {
  decisionMode: DecisionMode.DECISION_API,
});

// BUCKETING: downloads all campaign configs once, assignments computed client-side
await Flagship.start("<ENV_ID>", "<API_KEY>", {
  decisionMode: DecisionMode.BUCKETING,
  pollingInterval: 5, // seconds between bucketing file re-downloads (0 = only once at start)
});

// BUCKETING_EDGE: for Edge environments; SDK must be initialized with the bucketing file;
// no automatic batching — Flagship.close() must be called manually
await Flagship.start("<ENV_ID>", "<API_KEY>", {
  decisionMode: DecisionMode.BUCKETING_EDGE,
});
```

### Graceful Shutdown (Node.js)

Always call `close()` before your process exits to flush all pending hits:

```javascript
// In Express / any Node.js app
process.on("SIGTERM", async () => {
  await Flagship.close(); // batches and sends all collected hits
  process.exit(0);
});

// In BUCKETING_EDGE mode this is mandatory
```

## Complete Example

Express.js integration:

```javascript
import express from "express";
import { Flagship, HitType, EventCategory } from "@flagship.io/js-sdk";

const app = express();

// Step 1: Start SDK
await Flagship.start(process.env.FLAGSHIP_ENV_ID, process.env.FLAGSHIP_API_KEY);

// Step 2: Create visitor middleware
app.use(async (req, res, next) => {
  req.fsVisitor = Flagship.newVisitor({
    visitorId: req.user?.id || "anonymous",
    hasConsented: true,
    context: {
      isVip: req.user?.isVip || false,
      country: req.user?.country,
    },
  });

  // Step 3: Fetch flags
  await req.fsVisitor.fetchFlags();
  next();
});

// Step 4 & 5: Use flags
app.get("/", async (req, res) => {
  const welcomeFlag = req.fsVisitor.getFlag("welcome-message");
  const welcomeText = welcomeFlag.getValue("Welcome!");
  res.send(`<h1>${welcomeText}</h1>`);
});

// Step 6: Track hits
app.post("/checkout", async (req, res) => {
  await req.fsVisitor.sendHit({
    type: HitType.EVENT,
    category: EventCategory.ACTION_TRACKING,
    action: "checkout-completed",
  });
  res.json({ success: true });
});

app.listen(3000, () => console.log("Server running"));
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```javascript
fsVisitor.updateContext({
  hasCompletedPurchase: true,
  cartValue: 150.0,
});

await fsVisitor.fetchFlags(); // Refetch with new context
```

### Flag Metadata

Access campaign metadata:

```javascript
const flag = fsVisitor.getFlag("my-feature");

console.log("Value:", flag.getValue(false));
console.log("Exists:", flag.exists());
console.log("Campaign ID:", flag.metadata.campaignId);
console.log("Variation ID:", flag.metadata.variationId);
```

### Visitor Authentication

Track authenticated users:

```javascript
// On login
fsVisitor.authenticate("<AUTHENTICATED_USER_ID>");
await fsVisitor.fetchFlags(); // recommended after authenticate

// On logout
fsVisitor.unauthenticate();
await fsVisitor.fetchFlags(); // recommended after unauthenticate
```

### Clear Visitor Context

```javascript
// Clear all context keys
fsVisitor.clearContext();
await fsVisitor.fetchFlags(); // refetch after clearing context
```

### Get All Flags

Retrieve the full collection of flags fetched for a visitor:

```javascript
const flags = fsVisitor.getFlags(); // returns IFSFlagCollection

console.log("Total flags:", flags.size);

// Iterate
flags.forEach((flag, key) => {
  console.log(key, flag.getValue(null));
});

// Check if a flag key exists
console.log(flags.has("my-feature"));

// Expose all flags at once
await flags.exposeAll();
```

### Expose a Flag Manually

By default `getValue()` sends an exposure hit. To separate retrieval from exposure:

```javascript
const flag = fsVisitor.getFlag("displayVipFeature");

// Get value WITHOUT sending exposure
const value = flag.getValue(false, false);

// Later, when the visitor actually sees the feature:
await flag.visitorExposed();
```

### Hit Types Reference

```javascript
// Event
{ type: HitType.EVENT, category: EventCategory.USER_ENGAGEMENT, action: "click" }

// Page view
{ type: HitType.PAGE, documentLocation: "/page" }

// Screen (SPA/mobile)
{ type: HitType.SCREEN, documentLocation: "HomeScreen" }

// Transaction (affiliation is required)
{ type: HitType.TRANSACTION, transactionId: "T123", affiliation: "Store", totalRevenue: 100 }

// Item (product)
{ type: HitType.ITEM, transactionId: "T123", productName: "Product", itemPrice: 50 }
```

### Send Multiple Hits at Once

```javascript
import { HitType, EventCategory } from "@flagship.io/js-sdk";

// sendHits (plural) accepts an array
await fsVisitor.sendHits([
  { type: HitType.PAGE, documentLocation: "/checkout" },
  {
    type: HitType.EVENT,
    category: EventCategory.ACTION_TRACKING,
    action: "checkout",
  },
]);
```

## Troubleshooting

**Flags return default values:**

- Ensure `await fetchFlags()` called before `getValue()`
- Verify visitor context matches campaign targeting
- Check campaign is active in AB Tasty dashboard

**API timeout errors:**

- Verify Environment ID and API Key correct
- Check internet connectivity
- Increase timeout in SDK config

**GDPR consent errors:**

- `hasConsented` field required when creating visitor
- Set based on user consent status

**Context not applied:**

- Set context in `newVisitor()` or use `updateContext()`
- Call `fetchFlags()` again after context changes

## Success Criteria

Installation complete when:

- ✅ Package `@flagship.io/js-sdk` installed
- ✅ SDK initialized with `Flagship.start()`
- ✅ Visitor created with `newVisitor()`
- ✅ Flags fetched with `fetchFlags()`
- ✅ Server starts without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship Node.js SDK Docs](https://docs.abtasty.com/server-side/sdks/js-sdk/js-reference)
- [Flagship TypeScript SDK GitHub](https://github.com/flagship-io/flagship-ts-sdk)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
