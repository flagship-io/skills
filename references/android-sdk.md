# AB Tasty Android SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship Android SDK for native Android applications.

## Prerequisites

Before starting, verify:

- Android SDK API level 21+ (Android 5.0 Lollipop)
- Kotlin 1.5+ or Java 8+
- Device/emulator has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

Add the Flagship SDK dependency to your app-level `build.gradle` (or `build.gradle.kts`):

**Groovy (`build.gradle`):**

```groovy
dependencies {
    implementation 'com.abtasty:flagship:3.+'
}
```

**Kotlin DSL (`build.gradle.kts`):**

```kotlin
dependencies {
    implementation("com.abtasty:flagship:3.+")
}
```

Add the Maven Central repository if not already present in your project-level `build.gradle`:

```groovy
allprojects {
    repositories {
        mavenCentral()
    }
}
```

Then sync your project: File → Sync Project with Gradle Files.

**Verify:** Package resolves and project builds successfully.

### Step 2: Add Permissions

Add internet permission to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### Step 3: Initialize SDK

Initialize SDK early in your application lifecycle, typically in a custom `Application` class:

```kotlin
import com.abtasty.flagship.main.Flagship

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        Flagship.start(
            applicationContext,
            "<ENV_ID>",
            "<API_KEY>"
        )
    }
}
```

Register the application class in `AndroidManifest.xml`:

```xml
<application
    android:name=".MyApplication"
    ...>
```

**Optional configuration:**

```kotlin
import com.abtasty.flagship.main.Flagship
import com.abtasty.flagship.main.FlagshipConfig
import com.abtasty.flagship.utils.LogManager

Flagship.start(
    applicationContext,
    "<ENV_ID>",
    "<API_KEY>",
    FlagshipConfig.DecisionApi()
        .withLogLevel(LogManager.Level.ALL)
        .withTimeout(2000)
)
```

### Step 4: Create Visitor

Create visitors with unique IDs and context for targeting:

```kotlin
val visitor = Flagship.newVisitor(visitorId = "<VISITOR_ID>", consent = true)
    .context(hashMapOf(
        "isVIP" to true,
        "country" to "NL",
        "plan" to "premium"
    ))
    .build()
```

**Using device identifiers:**

```kotlin
import android.provider.Settings

val visitorId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)

val visitor = Flagship.newVisitor(visitorId = visitorId, consent = true)
    .context(hashMapOf(
        "os" to "Android",
        "sdkVersion" to Build.VERSION.SDK_INT,
        "appVersion" to BuildConfig.VERSION_NAME
    ))
    .build()
```

### Step 5: Fetch Flags

Before using flags, fetch them from AB Tasty:

```kotlin
visitor.fetchFlags().invokeOnCompletion {
    // Flags are ready to use
}
```

**Using coroutines:**

```kotlin
import kotlinx.coroutines.launch

lifecycleScope.launch {
    visitor.fetchFlags().join()
    // Flags are ready
}
```

### Step 6: Retrieve Flag Values

Get flag values with defaults:

```kotlin
// Get flag value with default fallback
val showVip = visitor.getFlag("displayVipFeature").value(false)

if (showVip) {
    // Enable VIP feature
}
```

**Different flag types:**

```kotlin
val welcomeText = visitor.getFlag("welcome-text").value("Hello")
val apiLimit = visitor.getFlag("api-limit").value(100)
val config = visitor.getFlag("ui-config").value(JSONObject().put("theme", "light"))
```

**Important:** `value()` automatically sends an exposure hit by default.

### Step 7: Track Analytics Hits

Send hits to track user actions:

```kotlin
import com.abtasty.flagship.hits.*

// Event hit
visitor.sendHit(
    Event(Event.EventCategory.USER_ENGAGEMENT, "click")
        .withEventLabel("vip-feature-button")
        .withEventValue(100)
)

// Page/screen view
visitor.sendHit(
    Screen("HomeScreen")
)

// Transaction
visitor.sendHit(
    Transaction("T12345", "Online Store")
        .withTotalRevenue(99.99f)
        .withShippingCosts(5.0f)
        .withTaxes(8.5f)
        .withCurrency("USD")
)
```

## Complete Example

Activity-based integration:

```kotlin
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.abtasty.flagship.main.Flagship
import com.abtasty.flagship.hits.*
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope

// Application class
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Step 1: Start SDK
        Flagship.start(
            applicationContext,
            "<ENV_ID>",
            "<API_KEY>"
        )
    }
}

// Main Activity
class MainActivity : AppCompatActivity() {

    private lateinit var visitor: Visitor

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Step 2: Create visitor
        visitor = Flagship.newVisitor(
            visitorId = "user-123",
            consent = true
        )
        .context(hashMapOf(
            "isVip" to true,
            "country" to "NL"
        ))
        .build()

        // Step 3: Fetch flags
        lifecycleScope.launch {
            visitor.fetchFlags().join()

            // Step 4: Use flags
            val welcomeText = visitor.getFlag("welcome-message").value("Welcome!")
            findViewById<TextView>(R.id.welcomeTextView).text = welcomeText

            val showBanner = visitor.getFlag("show-promo-banner").value(false)
            if (showBanner) {
                showPromoBanner()
            }
        }
    }

    fun onCheckoutClicked() {
        // Step 5: Track hits
        visitor.sendHit(
            Event(Event.EventCategory.ACTION_TRACKING, "checkout-completed")
        )

        visitor.sendHit(
            Transaction("T12345", "Android App")
                .withTotalRevenue(99.99f)
        )
    }
}
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```kotlin
visitor.updateContext(hashMapOf(
    "hasCompletedPurchase" to true,
    "cartValue" to 150.0
))

visitor.fetchFlags().invokeOnCompletion {
    // Flags refetched with new context
}
```

### Flag Metadata

Access campaign metadata:

```kotlin
val flag = visitor.getFlag("my-feature")

println("Value: ${flag.value(false)}")
println("Exists: ${flag.exists()}")
println("Campaign ID: ${flag.metadata().campaignId}")
println("Variation ID: ${flag.metadata().variationId}")
```

### Visitor Authentication

Track authenticated users:

```kotlin
// On login — recommend calling fetchFlags() afterward
visitor.authenticate("<AUTHENTICATED_USER_ID>")

// On logout — recommend calling fetchFlags() afterward
visitor.unAuthenticate()
```

### Hit Types Reference

```kotlin
// Event
Event(Event.EventCategory.USER_ENGAGEMENT, "click")

// Screen
Screen("HomeScreen")

// Transaction (affiliation is required)
Transaction("T123", "Store").withTotalRevenue(100f)

// Item (product)
Item("T123", "Product", "SKU123").withItemPrice(50f)
```

### Visitor.Instance — Single vs Multiple Visitors

Control how the SDK handles the created visitor:

```kotlin
// SINGLE_INSTANCE (default): saved into Flagship singleton, retrieve later with Flagship.getVisitor()
val visitor = Flagship.newVisitor("visitor_uuid", consent = true)
    .build() // Visitor.Instance.SINGLE_INSTANCE by default

val sameVisitor = Flagship.getVisitor() // returns the saved instance

// NEW_INSTANCE: not saved — use when handling multiple visitors simultaneously
val visitor2 = Flagship.newVisitor("visitor_uuid", consent = true,
    instanceType = Visitor.Instance.NEW_INSTANCE)
    .build()
```

### SDK Status Listener

React to SDK status changes:

```kotlin
Flagship.start(
    getApplication(), "<ENV_ID>", "<API_KEY>",
    FlagshipConfig.DecisionApi()
        .withFlagshipStatusListener { newStatus ->
            when (newStatus) {
                Flagship.FlagshipStatus.INITIALIZED -> println("SDK ready")
                Flagship.FlagshipStatus.PANIC        -> println("Panic mode")
                else -> {}
            }
        }
)
```

### Flag Exposure Callback

Centralize flag exposures to send to third-party tools:

```kotlin
Flagship.start(
    getApplication(), "<ENV_ID>", "<API_KEY>",
    FlagshipConfig.DecisionApi()
        .withOnVisitorExposed { visitorExposed, exposedFlag ->
            // Send to analytics / third-party tool
        }
)
```

### Hit Batching (TrackingManagerConfig)

Configure how hits are batched and cached:

```kotlin
import com.abtasty.flagship.visitor.TrackingManagerConfig
import com.abtasty.flagship.cache.CacheStrategy
import com.abtasty.flagship.cache.ClosingStrategy

Flagship.start(
    getApplication(), "<ENV_ID>", "<API_KEY>",
    FlagshipConfig.DecisionApi()
        .withTrackingManagerConfig(TrackingManagerConfig(
            cachingStrategy = CacheStrategy.PERIODIC_CACHING,
            closingStrategy = ClosingStrategy.BATCH_PENDING_HITS,
            batchTimeInterval = 10000, // ms between batch requests (default: 10000)
            maxPoolSize = 10           // hits in pool before auto-batch (default: 10)
        ))
)
```

`CacheStrategy` values: `CONTINUOUS_CACHING` (cache on every hit — recommended client-side), `PERIODIC_CACHING` (cache at intervals — recommended server-side).

`ClosingStrategy` values: `CACHE_PENDING_HITS` (cache remaining hits on stop), `BATCH_PENDING_HITS` (send remaining hits on stop).

### Flag Status Callbacks (Visitor Builder)

Listen for flag status changes on a per-visitor basis:

```kotlin
val visitor = Flagship.newVisitor("visitor_abcd", consent = true)
    .onFlagStatusChanged(object : OnFlagStatusChanged {
        override fun onFlagStatusChanged(newStatus: FlagStatus) {
            // called every time FlagStatus changes
        }
        override fun onFlagStatusFetchRequired(reason: FetchFlagsRequiredStatusReason) {
            // flags are out of date — call fetchFlags()
        }
        override fun onFlagStatusFetched() {
            // flags have been successfully fetched
        }
    })
    .build()
```

`FlagStatus` values: `NOT_FOUND`, `FETCH_REQUIRED`, `FETCHING`, `PANIC`, `FETCHED`.

### Graceful Shutdown

Stop the SDK and clear all background jobs before your process exits:

```kotlin
// In a coroutine scope
lifecycleScope.launch {
    Flagship.stop()
}
```

## Troubleshooting

**Flags return default values:**

- Ensure `fetchFlags()` completed before calling `value()`
- Verify visitor context matches campaign targeting
- Check campaign is active in AB Tasty dashboard

**API timeout errors:**

- Verify Environment ID and API Key correct
- Check internet connectivity / permissions
- Increase timeout in SDK config

**GDPR consent errors:**

- `hasConsented` parameter required when creating visitor
- Set based on user consent status

**Context not applied:**

- Set context in `.withContext()` or use `updateContext()`
- Call `fetchFlags()` again after context changes

**Build errors:**

- Verify Gradle sync completed successfully
- Check minimum SDK version is 21+
- Ensure `mavenCentral()` is in repositories

## Success Criteria

Installation complete when:

- ✅ Package `com.abtasty:flagship` added to Gradle
- ✅ Internet permission added to manifest
- ✅ SDK initialized with `Flagship.start()`
- ✅ Visitor created with `newVisitor()`
- ✅ Flags fetched with `fetchFlags()`
- ✅ App launches without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship Android SDK Docs](https://docs.abtasty.com/server-side/sdks/android-sdk)
- [Flagship Android SDK GitHub](https://github.com/flagship-io/flagship-android)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
