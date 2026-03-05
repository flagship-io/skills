# AB Tasty PHP SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship PHP SDK for server-side PHP applications.

## Prerequisites

Before starting, verify:

- PHP 7.4+ installed
- Composer installed
- Server has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

```bash
composer require flagship-io/flagship-php-sdk
```

**Verify:** Package appears in `composer.json` under `require`.

### Step 2: Initialize SDK

Initialize SDK early in your application entry point:

```php
use Flagship\Flagship;

// Start SDK with credentials
Flagship::start("<ENV_ID>", "<API_KEY>");
```

**When to initialize:** Before handling requests, typically in bootstrap or service provider.

**Optional configuration:**

```php
use Flagship\Flagship;
use Flagship\Enum\FlagshipField;
use Flagship\Config\DecisionApiConfig;

$config = new DecisionApiConfig();
$config->setLogLevel(FlagshipField::LOG_LEVEL_INFO);
$config->setTimeout(2000);

Flagship::start("<ENV_ID>", "<API_KEY>", $config);
```

**Laravel service provider:**

```php
// In AppServiceProvider.php
public function boot()
{
    Flagship::start(
        config('services.flagship.env_id'),
        config('services.flagship.api_key')
    );
}
```

### Step 3: Create Visitor

Create visitors with unique IDs and context for targeting:

```php
$visitor = Flagship::newVisitor("<VISITOR_ID>", true)
    ->withContext([
        "isVIP" => true,
        "country" => "NL",
        "plan" => "premium",
    ])
    ->build();
```

**Using session/request data:**

```php
$visitorId = session_id() ?: uniqid("visitor_");

$visitor = Flagship::newVisitor($visitorId, true)
    ->withContext([
        "email" => $_SESSION['user_email'] ?? null,
        "ipAddress" => $_SERVER['REMOTE_ADDR'],
        "userAgent" => $_SERVER['HTTP_USER_AGENT'],
    ])
    ->build();
```

### Step 4: Fetch Flags

Before using flags, fetch them from AB Tasty:

```php
$visitor->fetchFlags();
```

### Step 5: Retrieve Flag Values

Get flag values with defaults:

```php
// Get flag value with default fallback
$showVip = $visitor->getFlag("displayVipFeature")->getValue(false);

if ($showVip) {
    // Enable VIP feature
}
```

**Different flag types:**

```php
$welcomeText = $visitor->getFlag("welcome-text")->getValue("Hello");
$apiLimit = $visitor->getFlag("api-limit")->getValue(100);
$config = $visitor->getFlag("ui-config")->getValue(["theme" => "light"]);
```

**Important:** `getValue()` automatically sends an exposure hit by default.

### Step 6: Track Analytics Hits

Send hits to track user actions:

```php
use Flagship\Hit\Event;
use Flagship\Hit\Page;
use Flagship\Hit\Screen;
use Flagship\Hit\Transaction;
use Flagship\Enum\EventCategory;

// Event hit
$visitor->sendHit(
    (new Event(EventCategory::USER_ENGAGEMENT, "click"))
        ->setLabel("vip-feature-button")
        ->setValue(100)
);

// Page view
$visitor->sendHit(
    new Page("https://www.my_domain.com/checkout")
);

// Transaction
$visitor->sendHit(
    (new Transaction("T12345", "Online Store"))
        ->setTotalRevenue(99.99)
        ->setShippingCosts(5.0)
        ->setTaxes(8.5)
        ->setCurrency("USD")
);
```

## Complete Example

Standard PHP integration:

```php
<?php
require_once __DIR__ . '/vendor/autoload.php';

use Flagship\Flagship;
use Flagship\Hit\Event;
use Flagship\Hit\Page;
use Flagship\Hit\Transaction;
use Flagship\Enum\EventCategory;

// Step 1: Start SDK
Flagship::start(
    getenv('FLAGSHIP_ENV_ID'),
    getenv('FLAGSHIP_API_KEY')
);

// Step 2: Create visitor
$visitorId = session_id() ?: uniqid("visitor_");
$visitor = Flagship::newVisitor($visitorId, true)
    ->withContext([
        "isVip" => true,
        "country" => "NL",
    ])
    ->build();

// Step 3: Fetch flags
$visitor->fetchFlags();

// Step 4: Use flags
$welcomeText = $visitor->getFlag("welcome-message")->getValue("Welcome!");
$showBanner = $visitor->getFlag("show-promo-banner")->getValue(false);
?>

<!DOCTYPE html>
<html>
<body>
    <h1><?= htmlspecialchars($welcomeText) ?></h1>
    <?php if ($showBanner): ?>
        <div class="promo-banner">Special Offer!</div>
    <?php endif; ?>
</body>
</html>

<?php
// Step 5: Track hits
$visitor->sendHit(new Page("https://www.my_domain.com/home"));

if (isset($_POST['checkout'])) {
    $visitor->sendHit(
        (new Event(EventCategory::ACTION_TRACKING, "checkout-completed"))
    );

    $visitor->sendHit(
        (new Transaction("T12345", "PHP Store"))
            ->setTotalRevenue(99.99)
    );
}
```

**Laravel controller example:**

```php
<?php

namespace App\Http\Controllers;

use Flagship\Flagship;
use Flagship\Hit\Event;
use Flagship\Enum\EventCategory;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $visitor = Flagship::newVisitor(
            $request->user()?->id ?? session()->getId(),
            true
        )
            ->withContext([
                "isVip" => $request->user()?->is_vip ?? false,
                "country" => $request->user()?->country,
            ])
            ->build();

        $visitor->fetchFlags();

        $welcomeText = $visitor->getFlag("welcome-message")->getValue("Welcome!");
        $showBanner = $visitor->getFlag("show-promo-banner")->getValue(false);

        return view('home', compact('welcomeText', 'showBanner'));
    }

    public function checkout(Request $request)
    {
        $visitor = Flagship::newVisitor($request->user()->id, true)->build();
        $visitor->fetchFlags();

        $visitor->sendHit(
            new Event(EventCategory::ACTION_TRACKING, "checkout-completed")
        );

        return response()->json(['success' => true]);
    }
}
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```php
$visitor->updateContextCollection([
    "hasCompletedPurchase" => true,
    "cartValue" => 150.0,
]);

$visitor->fetchFlags(); // Refetch with new context
```

### Flag Metadata

Access campaign metadata:

```php
$flag = $visitor->getFlag("my-feature");

echo "Value: " . $flag->getValue(false) . PHP_EOL;
echo "Exists: " . ($flag->exists() ? "true" : "false") . PHP_EOL;
echo "Campaign ID: " . $flag->getMetadata()->getCampaignId() . PHP_EOL;
echo "Variation ID: " . $flag->getMetadata()->getVariationId() . PHP_EOL;
```

### Visitor Authentication

Track authenticated users:

```php
// On login
$visitor->authenticate("<AUTHENTICATED_USER_ID>");

// On logout
$visitor->unauthenticate();
```

### Hit Types Reference

```php
// Event
new Event(EventCategory::USER_ENGAGEMENT, "click")

// Page view
new Page("https://www.my_domain.com/page")

// Screen (SPA/mobile)
new Screen("HomeScreen")

// Transaction
(new Transaction("T123", "Store"))->setTotalRevenue(100)

// Item (product)
(new Item("T123", "Product", "SKU123"))->setItemPrice(50)
```

## Troubleshooting

**Flags return default values:**

- Ensure `fetchFlags()` called before `getValue()`
- Verify visitor context matches campaign targeting
- Check campaign is active in AB Tasty dashboard

**API timeout errors:**

- Verify Environment ID and API Key correct
- Check server internet connectivity
- Increase timeout in SDK config

**GDPR consent errors:**

- Second parameter of `newVisitor()` is consent (boolean)
- Set based on user consent status

**Context not applied:**

- Set context via `withContext()` or `updateContext()`
- Call `fetchFlags()` again after context changes

**Composer errors:**

- Run `composer update flagship-io/flagship-php-sdk`
- Verify PHP version is 7.4+
- Check `ext-json` and `ext-curl` extensions are enabled

## Success Criteria

Installation complete when:

- ✅ Package `flagship-io/flagship-php-sdk` installed via Composer
- ✅ SDK initialized with `Flagship::start()`
- ✅ Visitor created with `newVisitor()`
- ✅ Flags fetched with `fetchFlags()`
- ✅ Application runs without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship PHP SDK Docs](https://docs.abtasty.com/server-side/sdks/php-sdk)
- [Flagship PHP SDK GitHub](https://github.com/flagship-io/flagship-php-sdk)
- [Packagist](https://packagist.org/packages/flagship-io/flagship-php-sdk)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
