# AB Tasty Flutter SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship Flutter SDK for cross-platform mobile applications.

## Prerequisites

Before starting, verify:

- Flutter 1.12+ installed
- Dart 2.12+ (null safety)
- iOS 10.0+ / Android API 21+
- Device/emulator has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

Add the Flagship SDK to your `pubspec.yaml`:

```yaml
dependencies:
  flagship: ^4.0.3
```

Then run:

```bash
flutter pub get
```

**Verify:** Package resolves and `flutter pub get` completes without errors.

### Step 2: Initialize SDK

Initialize SDK early in your application lifecycle, typically in `main()` or your root widget:

```dart
import 'package:flagship/flagship.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Start SDK with credentials
  await Flagship.start("<ENV_ID>", "<API_KEY>");

  runApp(MyApp());
}
```

**Optional configuration:**

```dart
import 'package:flagship/flagship.dart';
import 'package:flagship/flagship_config.dart';

await Flagship.start("<ENV_ID>", "<API_KEY>",
  config: ConfigBuilder()
    .withLogLevel(Level.ALL)
    .withTimeout(3000)
    .build()
);
```

### Step 3: Create Visitor

Create visitors with unique IDs and context for targeting:

```dart
var visitor = Flagship.newVisitor(
  visitorId: "<VISITOR_ID>",
  hasConsented: true,
)
  .withContext({
    "isVIP": true,
    "country": "NL",
    "plan": "premium",
  })
  .build();
```

### Step 4: Fetch Flags

Before using flags, fetch them from AB Tasty:

```dart
await visitor.fetchFlags();
```

**Using then:**

```dart
visitor.fetchFlags().then((_) {
  // Flags are ready to use
});
```

### Step 5: Retrieve Flag Values

Get flag values with defaults:

```dart
// Get flag value with default fallback
final showVip = visitor.getFlag("displayVipFeature").value(false);

if (showVip) {
  // Enable VIP feature
}
```

**Different flag types:**

```dart
final welcomeText = visitor.getFlag("welcome-text").value("Hello");
final apiLimit = visitor.getFlag("api-limit").value(100);
final config = visitor.getFlag("ui-config").value({"theme": "light"});
```

**Important:** `value()` automatically sends an exposure hit by default.

### Step 6: Track Analytics Hits

Send hits to track user actions:

```dart
import 'package:flagship/hits.dart';

// Event hit
visitor.sendHit(Event(
  category: EventCategory.User_Engagement,
  action: "click",
  label: "vip-feature-button",
  value: 100,
));

// Screen view
visitor.sendHit(Screen(location: "HomeScreen"));

// Page view
visitor.sendHit(Page(location: "https://example.com/checkout"));

// Transaction
visitor.sendHit(Transaction(
  transactionId: "T12345",
  affiliation: "App Store",
  revenue: 99.99,
  shipping: 5.0,
  tax: 8.5,
  currency: "USD",
));
```

## Complete Example

Full Flutter application:

```dart
import 'package:flutter/material.dart';
import 'package:flagship/flagship.dart';
import 'package:flagship/hits.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Step 1: Start SDK
  await Flagship.start(
    const String.fromEnvironment('FLAGSHIP_ENV_ID'),
    const String.fromEnvironment('FLAGSHIP_API_KEY'),
  );

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String welcomeText = "Welcome!";
  bool showBanner = false;
  late Visitor visitor;

  @override
  void initState() {
    super.initState();
    _initVisitor();
  }

  Future<void> _initVisitor() async {
    // Step 2: Create visitor
    visitor = Flagship.newVisitor(
      visitorId: "user-123",
      hasConsented: true,
    )
      .withContext({
        "isVip": true,
        "country": "NL",
      })
      .build();

    // Step 3: Fetch flags
    await visitor.fetchFlags();

    // Step 4: Use flags
    setState(() {
      welcomeText = visitor.getFlag("welcome-message").value("Welcome!");
      showBanner = visitor.getFlag("show-promo-banner").value(false);
    });

    // Step 5: Track screen view
    visitor.sendHit(Screen(location: "HomeScreen"));
  }

  void _onCheckout() {
    visitor.sendHit(Event(
      category: EventCategory.Action_Tracking,
      action: "checkout-completed",
    ));

    visitor.sendHit(Transaction(
      transactionId: "T12345",
      affiliation: "Flutter App",
      revenue: 99.99,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("AB Tasty Demo")),
      body: Column(
        children: [
          Text(welcomeText, style: TextStyle(fontSize: 24)),
          if (showBanner) PromoBanner(),
          ElevatedButton(
            onPressed: _onCheckout,
            child: Text("Checkout"),
          ),
        ],
      ),
    );
  }
}
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```dart
visitor.updateContextWithMap({
  "hasCompletedPurchase": true,
  "cartValue": 150.0,
});

await visitor.fetchFlags(); // Refetch with new context
```

### Flag Metadata

Access campaign metadata:

```dart
final flag = visitor.getFlag("my-feature");

print("Value: ${flag.value(false)}");
print("Exists: ${flag.exists()}");
print("Campaign ID: ${flag.metadata().campaignId}");
print("Variation ID: ${flag.metadata().variationId}");
```

### Visitor Authentication

Track authenticated users:

```dart
// On login
visitor.authenticate("<AUTHENTICATED_USER_ID>");

// On logout
visitor.unauthenticate();
```

### Hit Types Reference

```dart
// Event
Event(category: EventCategory.User_Engagement, action: "click")
// or
Event(category: EventCategory.Action_Tracking, action: "add-to-cart")

// Screen view
Screen(location: "HomeScreen")

// Page view
Page(location: "https://example.com/page")

// Transaction
Transaction(transactionId: "T123", affiliation: "Store", revenue: 100)

// Item (must be sent after its transaction)
Item(transactionId: "T123", name: "Product", code: "SKU123", price: 50)
```

## Troubleshooting

**Flags return default values:**

- Ensure `await fetchFlags()` completed before calling `value()`
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

**Build errors:**

- Run `flutter clean && flutter pub get`
- Verify minimum iOS/Android platform versions
- Check Dart null safety compatibility

## Success Criteria

Installation complete when:

- ✅ Package `flagship` added to `pubspec.yaml`
- ✅ SDK initialized with `Flagship.start()`
- ✅ Visitor created with `newVisitor()`
- ✅ Flags fetched with `fetchFlags()`
- ✅ App launches without errors on both iOS and Android
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship Flutter SDK Docs](https://docs.abtasty.com/server-side/sdks/flutter-sdk)
- [Flagship Flutter SDK GitHub](https://github.com/flagship-io/flagship-flutter-sdk)
- [Pub.dev Package](https://pub.dev/packages/flagship)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
