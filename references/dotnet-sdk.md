# AB Tasty .NET SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship .NET SDK for server-side .NET applications.

## Prerequisites

Before starting, verify:

- .NET 6.0+ (or .NET Framework 4.6.1+)
- NuGet package manager
- Server has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

**NuGet CLI:**

```bash
dotnet add package Flagship.Sdk
```

**Package Manager Console (Visual Studio):**

```powershell
Install-Package Flagship.Sdk
```

**Or add to `.csproj`:**

```xml
<PackageReference Include="Flagship.Sdk" Version="3.*" />
```

**Verify:** Package appears in project dependencies.

### Step 2: Initialize SDK

Initialize SDK early in your application entry point:

```csharp
using Flagship.Main;

// Start SDK with credentials
Fs.Start("<ENV_ID>", "<API_KEY>");
```

**When to initialize:** Before the server starts handling requests, typically in `Program.cs` or `Startup.cs`.

**Optional configuration:**

```csharp
using Flagship.Main;
using Flagship.Config;
using Flagship.Enums;

Fs.Start("<ENV_ID>", "<API_KEY>",
    new DecisionApiConfig()
    {
        LogLevel = LogLevel.INFO,
        Timeout = TimeSpan.FromMilliseconds(2000)
    }
);
```

**ASP.NET Core setup in `Program.cs`:**

```csharp
var builder = WebApplication.CreateBuilder(args);

// Start Flagship SDK
Fs.Start(
    builder.Configuration["Flagship:EnvId"],
    builder.Configuration["Flagship:ApiKey"]
);

var app = builder.Build();
```

### Step 3: Create Visitor

Create visitors with unique IDs and context for targeting:

```csharp
using Flagship.Main;

var context = new Dictionary<string, object>
{
    { "isVIP", true },
    { "country", "NL" },
    { "plan", "premium" }
};

var visitor = Fs.NewVisitor("<VISITOR_ID>", true)
    .WithContext(context)
    .Build();
```

**ASP.NET Core middleware pattern:**

```csharp
app.Use(async (context, next) =>
{
    var visitorId = context.User?.Identity?.Name ?? context.Session.Id;

    var fsContext = new Dictionary<string, object>
    {
        { "ipAddress", context.Connection.RemoteIpAddress?.ToString() ?? "" },
        { "userAgent", context.Request.Headers["User-Agent"].ToString() }
    };

    var visitor = Fs.NewVisitor(visitorId, true)
        .WithContext(fsContext)
        .Build();

    await visitor.FetchFlags();
    context.Items["FsVisitor"] = visitor;

    await next();
});
```

### Step 4: Fetch Flags

Before using flags, fetch them from AB Tasty:

```csharp
await visitor.FetchFlags();
```

**Synchronous alternative:**

```csharp
visitor.FetchFlags().Wait();
```

### Step 5: Retrieve Flag Values

Get flag values with defaults:

```csharp
// Get flag value with default fallback
var showVip = visitor.GetFlag("displayVipFeature").GetValue(false);

if (showVip)
{
    // Enable VIP feature
}
```

**Different flag types:**

```csharp
var welcomeText = visitor.GetFlag("welcome-text").GetValue("Hello");
var apiLimit = visitor.GetFlag("api-limit").GetValue(100);
var config = visitor.GetFlag("ui-config").GetValue(new Dictionary<string, object> { { "theme", "light" } });
```

**Important:** `GetValue()` automatically sends an exposure hit by default.

### Step 6: Track Analytics Hits

Send hits to track user actions:

```csharp
using Flagship.Hit;

// Event hit
await visitor.SendHit(new Event(EventCategory.USER_ENGAGEMENT, "click")
{
    Label = "vip-feature-button",
    Value = 100
});

// Page view
await visitor.SendHit(new Page("https://www.my_domain_com/checkout"));

// Screen view
await visitor.SendHit(new Screen("HomeScreen"));

// Transaction
await visitor.SendHit(new Transaction("T12345", "Online Store")
{
    TotalRevenue = 99.99f,
    ShippingCosts = 5.0f,
    Taxes = 8.5f,
    Currency = "USD"
});
```

## Complete Example

ASP.NET Core Minimal API integration:

```csharp
using Flagship.Main;
using Flagship.Hit;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Step 1: Start SDK
Fs.Start(
    Environment.GetEnvironmentVariable("FLAGSHIP_ENV_ID"),
    Environment.GetEnvironmentVariable("FLAGSHIP_API_KEY")
);

// Step 2: Visitor middleware
app.Use(async (context, next) =>
{
    var visitorId = context.User?.Identity?.Name ?? Guid.NewGuid().ToString();

    var fsContext = new Dictionary<string, object>
    {
        { "isVip", true },
        { "country", "NL" }
    };

    var visitor = Fs.NewVisitor(visitorId, true)
        .WithContext(fsContext)
        .Build();

    // Step 3: Fetch flags
    await visitor.FetchFlags();
    context.Items["FsVisitor"] = visitor;

    await next();
});

// Step 4 & 5: Use flags
app.MapGet("/", async (HttpContext context) =>
{
    var visitor = context.Items["FsVisitor"] as Flagship.Visitor.Visitor;

    var welcomeText = visitor.GetFlag("welcome-message").GetValue("Welcome!");
    var showBanner = visitor.GetFlag("show-promo-banner").GetValue(false);

    await visitor.SendHit(new Page("https://www.my_domain_com/"));

    return Results.Ok(new { welcome = welcomeText, showBanner });
});

// Step 6: Track hits
app.MapPost("/checkout", async (HttpContext context) =>
{
    var visitor = context.Items["FsVisitor"] as Flagship.Visitor.Visitor;

    await visitor.SendHit(
        new Event(EventCategory.ACTION_TRACKING, "checkout-completed")
    );

    await visitor.SendHit(
        new Transaction("T12345", ".NET Store")
        {
            TotalRevenue = 99.99f
        }
    );

    return Results.Ok(new { success = true });
});

app.Run("http://localhost:3000");
```

**ASP.NET Core MVC controller example:**

```csharp
using Microsoft.AspNetCore.Mvc;
using Flagship.Main;
using Flagship.Hit;

[ApiController]
[Route("[controller]")]
public class HomeController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var visitor = HttpContext.Items["FsVisitor"] as Flagship.Visitor.Visitor;

        var welcomeText = visitor.GetFlag("welcome-message").GetValue("Welcome!");
        var showBanner = visitor.GetFlag("show-promo-banner").GetValue(false);

        await visitor.SendHit(new Page("https://www.my_domain_com/"));

        return Ok(new { welcome = welcomeText, showBanner });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout()
    {
        var visitor = HttpContext.Items["FsVisitor"] as Flagship.Visitor.Visitor;

        await visitor.SendHit(
            new Event(EventCategory.ACTION_TRACKING, "checkout-completed")
        );

        return Ok(new { success = true });
    }
}
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```csharp
visitor.UpdateContext(new Dictionary<string, object>
{
    { "hasCompletedPurchase", true },
    { "cartValue", 150.0 }
});

await visitor.FetchFlags(); // Refetch with new context
```

### Flag Metadata

Access campaign metadata:

```csharp
var flag = visitor.GetFlag("my-feature");

Console.WriteLine($"Value: {flag.GetValue(false)}");
Console.WriteLine($"Exists: {flag.Exists}");
Console.WriteLine($"Campaign ID: {flag.Metadata.CampaignId}");
Console.WriteLine($"Variation ID: {flag.Metadata.VariationId}");
```

### Visitor Authentication

Track authenticated users:

```csharp
// On login
visitor.Authenticate("<AUTHENTICATED_USER_ID>");

// On logout
visitor.Unauthenticate();
```

### Hit Types Reference

```csharp
// Event
new Event(EventCategory.USER_ENGAGEMENT, "click")

// Page view
new Page("https://www.my_domain_com/page")

// Screen (SPA/mobile)
new Screen("HomeScreen")

// Transaction
new Transaction("T123", "Store") { TotalRevenue = 100f }

// Item (product)
new Item("T123", "Product", "SKU123") { Price = 50f }
```

## Troubleshooting

**Flags return default values:**

- Ensure `await FetchFlags()` called before `GetValue()`
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

- Set context via `.WithContext()` or `UpdateContext()`
- Call `FetchFlags()` again after context changes

**NuGet errors:**

- Run `dotnet restore`
- Verify .NET version is 6.0+ (or .NET Framework 4.6.1+)
- Clear NuGet cache: `dotnet nuget locals all --clear`

## Success Criteria

Installation complete when:

- ✅ Package `Flagship.Sdk` installed via NuGet
- ✅ SDK initialized with `Fs.Start()`
- ✅ Visitor created with `NewVisitor()`
- ✅ Flags fetched with `FetchFlags()`
- ✅ Application starts without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship .NET SDK Docs](https://docs.abtasty.com/server-side/sdks/dotnet-sdk)
- [Flagship .NET SDK GitHub](https://github.com/flagship-io/flagship-dotnet-sdk)
- [NuGet Package](https://www.nuget.org/packages/Flagship.Sdk)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
