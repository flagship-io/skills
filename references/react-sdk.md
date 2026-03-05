# AB Tasty React SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship React SDK for React web applications.

## Prerequisites

Before starting, verify:

- Node.js 12.0.0+ installed
- NPM 6.0.0+ (or yarn/pnpm)
- React 16.8+ (hooks support required)
- Browser/device has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

```bash
# npm
npm install @flagship.io/react-sdk

# yarn
yarn add @flagship.io/react-sdk

# pnpm
pnpm add @flagship.io/react-sdk
```

**Verify:** Package appears in `package.json` dependencies.

### Step 2: Initialize SDK with FlagshipProvider

Wrap your application with `FlagshipProvider` at the root level:

```jsx
import React from "react";
import { FlagshipProvider } from "@flagship.io/react-sdk";

function App() {
  return (
    <FlagshipProvider
      envId="<ENV_ID>"
      apiKey="<API_KEY>"
      visitorData={{
        id: "<VISITOR_ID>",
        hasConsented: true,
        context: {
          isVIP: true,
          country: "NL",
          plan: "premium",
        },
      }}
    >
      <MyApp />
    </FlagshipProvider>
  );
}

export default App;
```

**When to initialize:** At the root component level, wrapping all components that need flag access.

**Optional configuration:**

```jsx
import {
  FlagshipProvider,
  LogLevel,
  DecisionMode,
} from "@flagship.io/react-sdk";

<FlagshipProvider
  envId="<ENV_ID>"
  apiKey="<API_KEY>"
  visitorData={{
    id: "<VISITOR_ID>",
    hasConsented: true,
    context: {
      isVIP: true,
    },
  }}
  logLevel={LogLevel.INFO}
  timeout={2} // seconds (default: 2, minimum: 0)
  fetchNow={true} // auto-fetch flags on visitor creation (default: true)
  decisionMode={DecisionMode.BUCKETING} // DECISION_API (default), BUCKETING, or BUCKETING_EDGE
  fetchFlagsOnBucketingUpdated={false} // Bucketing only: auto-fetchFlags when bucketing file updates
  disableCache={false} // disable visitor + hit cache (default: false)
>
  <MyApp />
</FlagshipProvider>;
```

### Step 3: Use Flags with useFlagship Hook

Access flags in any child component using the `useFlagship` hook:

```jsx
import { useFlagship } from "@flagship.io/react-sdk";

function MyComponent() {
  const fs = useFlagship();

  const showVip = fs.getFlag("displayVipFeature").getValue(false);

  if (showVip) {
    return <VipFeature />;
  }

  return <StandardFeature />;
}
```

### Step 4: Retrieve Flag Values

Get flag values with defaults:

```jsx
import { useFlagship } from "@flagship.io/react-sdk";

function WelcomeBanner() {
  const fs = useFlagship();

  // Get flag value with default fallback
  const welcomeText = fs.getFlag("welcome-text").getValue("Hello");
  const apiLimit = fs.getFlag("api-limit").getValue(100);
  const config = fs.getFlag("ui-config").getValue({ theme: "light" });

  return (
    <div>
      <h1>{welcomeText}</h1>
      <p>API limit: {apiLimit}</p>
    </div>
  );
}
```

**Important:** `getValue()` automatically sends an exposure hit by default.

### Step 5: Track Analytics Hits

Send hits to track user actions:

```jsx
import { useFlagship, HitType, EventCategory } from "@flagship.io/react-sdk";

function CheckoutButton() {
  const fs = useFlagship();

  const handleCheckout = () => {
    // Event hit
    fs.sendHits({
      type: HitType.EVENT,
      category: EventCategory.USER_ENGAGEMENT,
      action: "click",
      label: "checkout-button",
      value: 100,
    });
  };

  return <button onClick={handleCheckout}>Checkout</button>;
}

function ProductPage() {
  const fs = useFlagship();

  useEffect(() => {
    // Page view
    fs.sendHits({
      type: HitType.PAGE,
      documentLocation: window.location.href,
    });
  }, []);

  return <div>Product Details</div>;
}
```

## Complete Example

Full React application:

```jsx
import React, { useEffect } from "react";
import {
  FlagshipProvider,
  useFlagship,
  HitType,
  EventCategory,
} from "@flagship.io/react-sdk";

// Step 1: Root component with FlagshipProvider
function App() {
  return (
    <FlagshipProvider
      envId={process.env.REACT_APP_FLAGSHIP_ENV_ID}
      apiKey={process.env.REACT_APP_FLAGSHIP_API_KEY}
      visitorData={{
        id: getUserId(),
        hasConsented: true,
        context: {
          isVip: user?.isVip || false,
          country: user?.country,
        },
      }}
    >
      <HomePage />
    </FlagshipProvider>
  );
}

// Step 2 & 3: Use flags in components
function HomePage() {
  const fs = useFlagship();

  const welcomeText = fs.getFlag("welcome-message").getValue("Welcome!");
  const showBanner = fs.getFlag("show-promo-banner").getValue(false);

  useEffect(() => {
    fs.sendHits({
      type: HitType.PAGE,
      documentLocation: window.location.href,
    });
  }, []);

  return (
    <div>
      <h1>{welcomeText}</h1>
      {showBanner && <PromoBanner />}
      <CheckoutButton />
    </div>
  );
}

// Step 4: Track hits
function CheckoutButton() {
  const fs = useFlagship();

  const handleClick = () => {
    fs.sendHits({
      type: HitType.EVENT,
      category: EventCategory.ACTION_TRACKING,
      action: "checkout-completed",
    });
  };

  return <button onClick={handleClick}>Checkout</button>;
}

export default App;
```

## Advanced Features

### useFsFlag Hook (Shortcut)

A shortcut hook to quickly get a single flag by key:

```jsx
import { useFsFlag } from "@flagship.io/react-sdk";

function MyComponent() {
  // Returns an IFSFlag object directly — no need to call getFlag()
  const flag = useFsFlag("displayVipFeature");

  const value = flag.getValue(false);
  const exists = flag.exists();

  return <div>{value ? <VipFeature /> : <StandardFeature />}</div>;
}
```

### FlagshipProviderSSR (Next.js 13+)

For Next.js 13+ App Router, use `FlagshipProviderSSR` in a **server component** to pre-fetch flags on the server and eliminate flag flickering:

```jsx
// app/layout.tsx (Server Component — default in Next.js 13+ App Router)
import { FlagshipProviderSSR } from "@flagship.io/react-sdk";

export default function Layout({ children }) {
  return (
    <FlagshipProviderSSR
      envId="YOUR_ENV_ID"
      apiKey="YOUR_API_KEY"
      visitorData={{
        id: "YOUR_VISITOR_ID",
        hasConsented: true,
        context: { key: "value" },
      }}
      fetchNow={true} // default is false for SSR (flags pre-fetched server-side)
      nextFetchConfig={{ revalidate: 20 }} // Next.js cache revalidation in seconds
    >
      {children}
    </FlagshipProviderSSR>
  );
}
```

Key differences from `FlagshipProvider`:

- `fetchNow` defaults to **`false`** (flags are pre-fetched on the server)
- Must be used in a server component context
- After client hydration, behaves like a normal `FlagshipProvider`

### Update Visitor Context

Update context dynamically by changing `visitorData`:

```jsx
function App() {
  const [userContext, setUserContext] = useState({
    isVip: false,
    country: "US",
  });

  return (
    <FlagshipProvider
      envId="<ENV_ID>"
      apiKey="<API_KEY>"
      visitorData={{
        id: "<VISITOR_ID>",
        hasConsented: true,
        context: userContext,
      }}
    >
      <MyApp onContextChange={setUserContext} />
    </FlagshipProvider>
  );
}
```

**Programmatic update:**

```jsx
function MyComponent() {
  const fs = useFlagship();

  const handlePurchase = () => {
    // updateContext automatically re-fetches flags in the React SDK
    fs.updateContext({
      hasCompletedPurchase: true,
      cartValue: 150.0,
    });
  };

  return <button onClick={handlePurchase}>Complete Purchase</button>;
}
```

> **Note:** In the React SDK, `updateContext`, `authenticate`, and `unauthenticate` all automatically trigger a `fetchFlags` call. No manual call is needed.

### Flag Metadata

Access campaign metadata:

```jsx
function MyComponent() {
  const fs = useFlagship();

  const flag = fs.getFlag("my-feature");

  console.log("Value:", flag.getValue(false));
  console.log("Exists:", flag.exists());
  console.log("Campaign ID:", flag.metadata.campaignId);
  console.log("Variation ID:", flag.metadata.variationId);

  return <div>Feature enabled: {String(flag.getValue(false))}</div>;
}
```

### Visitor Authentication

Track authenticated users:

```jsx
function AuthHandler() {
  const fs = useFlagship();

  const handleLogin = (userId) => {
    fs.authenticate(userId);
  };

  const handleLogout = () => {
    fs.unauthenticate();
  };

  return (
    <div>
      <button onClick={() => handleLogin("user-123")}>Login</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### Status Handling

React to SDK status changes using `sdkStatus` from the hook:

```jsx
import { useFlagship, FSSdkStatus } from "@flagship.io/react-sdk";

function MyComponent() {
  const fs = useFlagship();

  if (fs.sdkStatus !== FSSdkStatus.SDK_INITIALIZED) {
    return <LoadingSpinner />;
  }

  const flag = fs.getFlag("my-feature").getValue(false);
  return <div>{flag ? "Enabled" : "Disabled"}</div>;
}
```

Available `FSSdkStatus` values: `SDK_NOT_INITIALIZED` (0), `SDK_INITIALIZING` (1), `SDK_PANIC` (2), `SDK_INITIALIZED` (3).

### Hit Types Reference

```jsx
// Event
{ type: HitType.EVENT, category: EventCategory.USER_ENGAGEMENT, action: "click" }

// Page view
{ type: HitType.PAGE, documentLocation: "https://example.com/page" }

// Screen (SPA)
{ type: HitType.SCREEN, documentLocation: "HomeScreen" }

// Transaction (affiliation is required)
{ type: HitType.TRANSACTION, transactionId: "T123", affiliation: "Store", totalRevenue: 100 }

// Item (product)
{ type: HitType.ITEM, transactionId: "T123", productName: "Product", productSku: "SKU123", itemPrice: 50 }

// Send multiple hits at once
fs.sendHits([
  { type: HitType.PAGE, documentLocation: "/checkout" },
  { type: HitType.EVENT, category: EventCategory.ACTION_TRACKING, action: "checkout" },
]);
```

## Troubleshooting

**Flags return default values:**

- Ensure `FlagshipProvider` wraps the component tree
- Verify `visitorData` with correct context is set
- Check campaign is active in AB Tasty dashboard

**Hook errors:**

- `useFlagship` must be called inside `FlagshipProvider`
- Ensure React 16.8+ for hooks support

**API timeout errors:**

- Verify Environment ID and API Key correct
- Check internet connectivity
- Increase timeout in provider config

**GDPR consent errors:**

- `hasConsented` field required in `visitorData`
- Set based on user consent status

**Context not applied:**

- Update `visitorData.context` in `FlagshipProvider`
- Or use `fs.updateContext()` followed by `fs.fetchFlags()`

**Re-rendering issues:**

- Flag values update triggers re-renders automatically
- Use `React.memo()` for performance-sensitive components

## Success Criteria

Installation complete when:

- ✅ Package `@flagship.io/react-sdk` installed
- ✅ `FlagshipProvider` wraps root component
- ✅ Visitor data configured with context
- ✅ Flags retrieved via `useFlagship()` hook
- ✅ App renders without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship React SDK Docs](https://docs.abtasty.com/server-side/sdks/react-sdk)
- [Flagship React SDK GitHub](https://github.com/flagship-io/flagship-react-sdk)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
