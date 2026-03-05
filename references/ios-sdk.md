# AB Tasty iOS SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship iOS SDK for native iOS applications.

## Prerequisites

Before starting, verify:

- Xcode 12.0+ installed
- iOS 12.0+ deployment target
- Swift 5.0+
- Device/simulator has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

**Swift Package Manager (recommended):**

In Xcode: File → Add Packages → Enter repository URL:

```
https://github.com/flagship-io/flagship-ios
```

Select the latest version and add `Flagship` to your target.

**CocoaPods:**

Add to your `Podfile`:

```ruby
pod 'FlagShip'
```

Then run:

```bash
pod install
```

**Verify:** `Flagship` module can be imported in your Swift files.

### Step 2: Initialize SDK

Initialize SDK early in your application lifecycle, typically in `AppDelegate` or `@main App`:

```swift
import Flagship

// In AppDelegate
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    Flagship.sharedInstance.start(
        envId: "<ENV_ID>",
        apiKey: "<API_KEY>"
    )

    return true
}
```

**SwiftUI app:**

```swift
import SwiftUI
import Flagship

@main
struct MyApp: App {
    init() {
        Flagship.sharedInstance.start(
            envId: "<ENV_ID>",
            apiKey: "<API_KEY>"
        )
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

**Optional configuration:**

```swift
Flagship.sharedInstance.start(
    envId: "<ENV_ID>",
    apiKey: "<API_KEY>",
    config: FSConfigBuilder()
        .DecisionApi()
        .withLogLevel(.ALL)
        .withTimeout(2000)
        .build()
)
```

### Step 3: Create Visitor

Create visitors with unique IDs and context for targeting:

```swift
let visitor = Flagship.sharedInstance.newVisitor(visitorId: "<VISITOR_ID>", hasConsented: true)
    .withContext(context: [
        "isVIP": true,
        "country": "NL",
        "plan": "premium"
    ])
    .build()
```

**Using device identifiers:**

```swift
import UIKit

let visitorId = UIDevice.current.identifierForVendor?.uuidString ?? "anonymous"

let visitor = Flagship.sharedInstance.newVisitor(visitorId: visitorId, hasConsented: true)
    .withContext(context: [
        "os": "iOS",
        "deviceModel": UIDevice.current.model,
        "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
    ])
    .build()
```

### Step 4: Fetch Flags

Before using flags, fetch them from AB Tasty:

```swift
visitor.fetchFlags {
    // Flags are ready to use
}
```

**Using async/await (iOS 13+):**

```swift
await visitor.fetchFlags()
```

### Step 5: Retrieve Flag Values

Get flag values with defaults:

```swift
// Get flag value with default fallback
let showVip = visitor.getFlag(key: "displayVipFeature").value(defaultValue: false)

if showVip {
    // Enable VIP feature
}
```

**Different flag types:**

```swift
let welcomeText = visitor.getFlag(key: "welcome-text").value(defaultValue: "Hello")
let apiLimit = visitor.getFlag(key: "api-limit").value(defaultValue: 100)
let config = visitor.getFlag(key: "ui-config").value(defaultValue: ["theme": "light"])
```

**Important:** `value()` automatically sends an exposure hit by default.

### Step 6: Track Analytics Hits

Send hits to track user actions:

```swift
// Event hit
visitor.sendHit(FSEvent(
    eventCategory: .User_Engagement,
    eventAction: "click"
))

// Page view
visitor.sendHit(FSPage("https://www.my_domain_com/my_page"))

// Screen view
visitor.sendHit(FSScreen("HomeScreen"))

// Transaction
visitor.sendHit(FSTransaction(
    transactionId: "T12345",
    affiliation: "App Store"
))
```

## Complete Example

UIKit integration:

```swift
import UIKit
import Flagship

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var visitor: FSVisitor?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Step 1: Start SDK
        Flagship.sharedInstance.start(
            envId: "<ENV_ID>",
            apiKey: "<API_KEY>"
        )

        // Step 2: Create visitor
        let visitorId = UIDevice.current.identifierForVendor?.uuidString ?? "anonymous"
        visitor = Flagship.sharedInstance.newVisitor(visitorId: visitorId, hasConsented: true)
            .withContext(context: [
                "isVip": true,
                "country": "NL"
            ])
            .build()

        // Step 3: Fetch flags
        visitor?.fetchFlags {
            // Step 4: Use flags
            let welcomeText = self.visitor?.getFlag(key: "welcome-message").value(defaultValue: "Welcome!") ?? "Welcome!"
            print("Welcome message: \(welcomeText)")
        }

        return true
    }
}

// In a ViewController
class HomeViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        guard let visitor = (UIApplication.shared.delegate as? AppDelegate)?.visitor else { return }

        let showBanner = visitor.getFlag(key: "show-promo-banner").value(defaultValue: false)
        if showBanner {
            displayPromoBanner()
        }

        // Step 5: Track hits
        visitor.sendHit(FSScreen("HomeScreen"))

        visitor.sendHit(FSEvent(
            eventCategory: .Action_Tracking,
            eventAction: "home-viewed"
        ))
    }
}
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```swift
visitor.updateContext([
    "hasCompletedPurchase": true,
    "cartValue": 150.0
])

visitor.fetchFlags {
    // Flags refetched with new context
}
```

### Flag Metadata

Access campaign metadata:

```swift
let flag = visitor.getFlag(key: "my-feature")

print("Value:", flag.value(defaultValue: false))
print("Exists:", flag.exists())
print("Campaign ID:", flag.metadata().campaignId)
print("Variation ID:", flag.metadata().variationId)
```

### Visitor Authentication

Track authenticated users:

```swift
// On login
visitor.authenticate(visitorId: "<AUTHENTICATED_USER_ID>")

// On logout
visitor.unauthenticate()
```

### Hit Types Reference

```swift
// Event
FSEvent(eventCategory: .User_Engagement, eventAction: "click")
// or
FSEvent(eventCategory: .Action_Tracking, eventAction: "add-to-cart")

// Page view (requires valid URL)
FSPage("https://www.my_domain_com/my_page")

// Screen view
FSScreen("HomeScreen")

// Transaction
FSTransaction(transactionId: "T123", affiliation: "Store")
```

## Troubleshooting

**Flags return default values:**

- Ensure `fetchFlags()` callback completed before calling `value()`
- Verify visitor context matches campaign targeting
- Check campaign is active in AB Tasty dashboard

**API timeout errors:**

- Verify Environment ID and API Key correct
- Check internet connectivity
- Increase timeout in SDK config

**GDPR consent errors:**

- `hasConsented` parameter required when creating visitor
- Set based on user consent status

**Context not applied:**

- Set context in `.withContext()` or use `updateContext()`
- Call `fetchFlags()` again after context changes

**Import errors:**

- Verify Swift Package Manager / CocoaPods integration completed
- Clean build folder: Product → Clean Build Folder (⇧⌘K)

## Success Criteria

Installation complete when:

- ✅ Package `Flagship` installed via SPM or CocoaPods
- ✅ SDK initialized with `Flagship.sharedInstance.start()`
- ✅ Visitor created with `newVisitor()`
- ✅ Flags fetched with `fetchFlags()`
- ✅ App launches without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship iOS SDK Docs](https://docs.abtasty.com/server-side/sdks/ios-sdk)
- [Flagship iOS SDK GitHub](https://github.com/flagship-io/flagship-ios)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
