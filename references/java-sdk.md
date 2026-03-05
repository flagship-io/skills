# AB Tasty Java SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship Java SDK for server-side Java applications.

## Prerequisites

Before starting, verify:

- Java 8+ (JDK) installed
- Maven 3.0+ or Gradle 5.0+
- Server has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

**Maven:**

Add to your `pom.xml`:

```xml
<dependency>
    <groupId>com.abtasty</groupId>
    <artifactId>flagship-java</artifactId>
    <version>3.+</version>
</dependency>
```

**Gradle (Groovy):**

```groovy
dependencies {
    implementation 'com.abtasty:flagship-java:3.+'
}
```

**Gradle (Kotlin DSL):**

```kotlin
dependencies {
    implementation("com.abtasty:flagship-java:3.+")
}
```

**Verify:** Run `mvn dependency:resolve` or Gradle sync successfully.

### Step 2: Initialize SDK

Initialize SDK early in your application entry point:

```java
import com.abtasty.flagship.main.Flagship;

// Start SDK with credentials
Flagship.start("<ENV_ID>", "<API_KEY>");
```

**When to initialize:** Before the server starts handling requests, typically in `main()` or application startup.

**Optional configuration:**

```java
import com.abtasty.flagship.main.Flagship;
import com.abtasty.flagship.main.FlagshipConfig;

Flagship.start("<ENV_ID>", "<API_KEY>",
    new FlagshipConfig.DecisionApi()
        .withLogLevel(LogManager.Level.ALL)
        .withTimeout(2000)
);
```

### Step 3: Create Visitor

Create visitors with unique IDs and context for targeting:

```java
import com.abtasty.flagship.visitor.Visitor;
import java.util.HashMap;

HashMap<String, Object> context = new HashMap<>();
context.put("isVIP", true);
context.put("country", "NL");
context.put("plan", "premium");

Visitor visitor = Flagship.newVisitor("<VISITOR_ID>")
    .context(context)
    .hasConsented(true)
    .build();
```

**Spring Boot controller pattern:**

```java
@RestController
public class HomeController {

    @GetMapping("/")
    public String home(HttpServletRequest request) {
        String visitorId = request.getSession().getId();

        HashMap<String, Object> context = new HashMap<>();
        context.put("ipAddress", request.getRemoteAddr());
        context.put("userAgent", request.getHeader("User-Agent"));

        Visitor visitor = Flagship.newVisitor(visitorId)
            .context(context)
            .hasConsented(true)
            .build();

        visitor.fetchFlags();
        // Use flags...
    }
}
```

### Step 4: Fetch Flags

Before using flags, fetch them from AB Tasty:

```java
visitor.fetchFlags();
```

**Using CompletableFuture:**

```java
visitor.fetchFlags().whenComplete((result, error) -> {
    if (error == null) {
        // Flags ready
    }
});
```

### Step 5: Retrieve Flag Values

Get flag values with defaults:

```java
// Get flag value with default fallback
boolean showVip = visitor.getFlag("displayVipFeature", false).value();

if (showVip) {
    // Enable VIP feature
}
```

**Different flag types:**

```java
String welcomeText = visitor.getFlag("welcome-text", "Hello").value();
int apiLimit = visitor.getFlag("api-limit", 100).value();
JSONObject config = visitor.getFlag("ui-config", new JSONObject().put("theme", "light")).value();
```

**Important:** `value()` automatically sends an exposure hit by default.

### Step 6: Track Analytics Hits

Send hits to track user actions:

```java
import com.abtasty.flagship.hits.*;

// Event hit
visitor.sendHit(new Event(Event.EventCategory.USER_ENGAGEMENT, "click")
    .withEventLabel("vip-feature-button")
    .withEventValue(100)
);

// Page view
visitor.sendHit(new Page("https://www.my_domain_com/checkout"));

// Screen view
visitor.sendHit(new Screen("HomeScreen"));

// Transaction
visitor.sendHit(new Transaction("T12345", "Online Store")
    .withTotalRevenue(99.99f)
    .withShippingCosts(5.0f)
    .withTaxes(8.5f)
    .withCurrency("USD")
);
```

## Complete Example

Spring Boot integration:

```java
import com.abtasty.flagship.main.Flagship;
import com.abtasty.flagship.visitor.Visitor;
import com.abtasty.flagship.hits.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
@RestController
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    // Step 1: Start SDK
    @PostConstruct
    public void init() {
        Flagship.start(
            System.getenv("FLAGSHIP_ENV_ID"),
            System.getenv("FLAGSHIP_API_KEY")
        );
    }

    // Step 2 & 3: Create visitor and fetch flags
    private Visitor createVisitor(HttpServletRequest request) {
        HashMap<String, Object> context = new HashMap<>();
        context.put("isVip", true);
        context.put("country", "NL");

        Visitor visitor = Flagship.newVisitor(
            request.getSession().getId()
        )
        .context(context)
        .hasConsented(true)
        .build();

        visitor.fetchFlags();
        return visitor;
    }

    // Step 4 & 5: Use flags
    @GetMapping("/")
    public Map<String, Object> home(HttpServletRequest request) {
        Visitor visitor = createVisitor(request);

        String welcomeText = visitor.getFlag("welcome-message", "Welcome!").value();
        boolean showBanner = visitor.getFlag("show-promo-banner", false).value();

        visitor.sendHit(new Page("https://www.my_domain_com/"));

        Map<String, Object> response = new HashMap<>();
        response.put("welcome", welcomeText);
        response.put("showBanner", showBanner);
        return response;
    }

    // Step 6: Track hits
    @PostMapping("/checkout")
    public Map<String, Object> checkout(HttpServletRequest request) {
        Visitor visitor = createVisitor(request);

        visitor.sendHit(
            new Event(Event.EventCategory.ACTION_TRACKING, "checkout-completed")
        );

        visitor.sendHit(
            new Transaction("T12345", "Java Store")
                .withTotalRevenue(99.99f)
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return response;
    }
}
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```java
HashMap<String, Object> newContext = new HashMap<>();
newContext.put("hasCompletedPurchase", true);
newContext.put("cartValue", 150.0);

visitor.updateContext(newContext);
visitor.fetchFlags(); // Refetch with new context
```

### Flag Metadata

Access campaign metadata:

```java
Flag<Boolean> flag = visitor.getFlag("my-feature", false);

System.out.println("Value: " + flag.value());
System.out.println("Exists: " + flag.exists());
System.out.println("Campaign ID: " + flag.metadata().getCampaignId());
System.out.println("Variation ID: " + flag.metadata().getVariationId());
```

### Visitor Authentication

Track authenticated users:

```java
// On login
visitor.authenticate("<AUTHENTICATED_USER_ID>");

// On logout
visitor.unauthenticate();
```

### Hit Types Reference

```java
// Event
new Event(Event.EventCategory.USER_ENGAGEMENT, "click")

// Page view
new Page("https://www.my_domain_com/page")

// Screen (SPA/mobile)
new Screen("HomeScreen")

// Transaction
new Transaction("T123", "Store").withTotalRevenue(100f)

// Item (must be sent after its transaction)
new Item("T123", "Product", "SKU123").withItemPrice(50f)
```

## Troubleshooting

**Flags return default values:**

- Ensure `fetchFlags()` called before `value()`
- Verify visitor context matches campaign targeting
- Check campaign is active in AB Tasty dashboard

**API timeout errors:**

- Verify Environment ID and API Key correct
- Check server internet connectivity
- Increase timeout in SDK config

**GDPR consent errors:**

- Consent boolean required when creating visitor
- Set based on user consent status

**Context not applied:**

- Set context via `.withContext()` or `updateContext()`
- Call `fetchFlags()` again after context changes

**Maven/Gradle errors:**

- Verify `mavenCentral()` repository is configured
- Run `mvn clean install` or `gradle build --refresh-dependencies`
- Check Java version is 8+

## Success Criteria

Installation complete when:

- ✅ Package `com.abtasty:flagship-java` added to build file
- ✅ SDK initialized with `Flagship.start()`
- ✅ Visitor created with `newVisitor()`
- ✅ Flags fetched with `fetchFlags()`
- ✅ Application starts without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship Java SDK Docs](https://docs.abtasty.com/server-side/sdks/java-sdk)
- [Flagship Java SDK GitHub](https://github.com/flagship-io/flagship-java)
- [Maven Central](https://search.maven.org/search?q=g:com.abtasty%20a:flagship-java)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
