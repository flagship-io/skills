# AB Tasty Go SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship Go SDK for server-side Go applications.

## Prerequisites

Before starting, verify:

- Go 1.18+ installed
- Go modules enabled (`go mod init`)
- Server has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

```bash
go get github.com/flagship-io/flagship-go-sdk/v2
```

**Verify:** Package appears in `go.mod` under `require`.

### Step 2: Initialize SDK

Initialize SDK early in your application entry point:

```go
package main

import (
    flagship "github.com/flagship-io/flagship-go-sdk/v2"
)

func main() {
    // Start SDK with credentials
    fsClient, err := flagship.Start("<ENV_ID>", "<API_KEY>")
    if err != nil {
        log.Fatalf("Failed to start Flagship: %v", err)
    }
    defer fsClient.Dispose()
}
```

**When to initialize:** Before the server starts handling requests, typically in `main()`.

**Optional configuration:**

```go
import (
    flagship "github.com/flagship-io/flagship-go-sdk/v2"
    "github.com/flagship-io/flagship-go-sdk/v2/pkg/config"
    "github.com/flagship-io/flagship-go-sdk/v2/pkg/logging"
)

fsClient, err := flagship.Start("<ENV_ID>", "<API_KEY>",
    flagship.WithDecisionAPI(),
    flagship.WithLogLevel(logging.LogLevelInfo),
    flagship.WithTimeout(2000),
)
```

### Step 3: Create Visitor

Create visitors with unique IDs and context for targeting:

```go
visitor, err := fsClient.NewVisitor("<VISITOR_ID>", true)
if err != nil {
    log.Printf("Error creating visitor: %v", err)
    return
}

visitor.UpdateContext("isVIP", true)
visitor.UpdateContext("country", "NL")
visitor.UpdateContext("plan", "premium")
```

**HTTP handler pattern:**

```go
func createVisitor(fsClient *flagship.FlagshipClient, r *http.Request) (*flagship.Visitor, error) {
    visitorId := r.Header.Get("X-User-ID")
    if visitorId == "" {
        cookie, err := r.Cookie("session_id")
        if err == nil {
            visitorId = cookie.Value
        } else {
            visitorId = "anonymous"
        }
    }

    visitor, err := fsClient.NewVisitor(visitorId, true)
    if err != nil {
        return nil, err
    }

    visitor.UpdateContext("ipAddress", r.RemoteAddr)
    visitor.UpdateContext("userAgent", r.UserAgent())

    return visitor, nil
}
```

### Step 4: Fetch Flags

Before using flags, fetch them from AB Tasty:

```go
err = visitor.FetchFlags()
if err != nil {
    log.Printf("Error fetching flags: %v", err)
}
```

### Step 5: Retrieve Flag Values

Get flag values with defaults:

```go
// Get flag value with default fallback
showVip, err := visitor.GetFlag("displayVipFeature").Value(false)
if err != nil {
    log.Printf("Error getting flag: %v", err)
}

if showVip.(bool) {
    // Enable VIP feature
}
```

**Different flag types:**

```go
welcomeText, _ := visitor.GetFlag("welcome-text").Value("Hello")
apiLimit, _ := visitor.GetFlag("api-limit").Value(100.0)
```

**Important:** `Value()` automatically sends an exposure hit by default.

### Step 6: Track Analytics Hits

Send hits to track user actions:

```go
import "github.com/flagship-io/flagship-go-sdk/v2/pkg/hits"

// Event hit
err = visitor.SendHit(&hits.Event{
    Category: hits.UserEngagement,
    Action:   "click",
    Label:    "vip-feature-button",
    Value:    100,
})

// Page view
err = visitor.SendHit(&hits.Page{
    DocumentLocation: "/checkout",
})

// Screen view
err = visitor.SendHit(&hits.Screen{
    DocumentLocation: "HomeScreen",
})

// Transaction
err = visitor.SendHit(&hits.Transaction{
    TransactionID: "T12345",
    Affiliation:   "Online Store",
    TotalRevenue:  99.99,
    ShippingCosts: 5.0,
    Taxes:         8.5,
    Currency:      "USD",
})
```

## Complete Example

HTTP server integration:

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"

    flagship "github.com/flagship-io/flagship-go-sdk/v2"
    "github.com/flagship-io/flagship-go-sdk/v2/pkg/hits"
)

var fsClient *flagship.FlagshipClient

func main() {
    // Step 1: Start SDK
    var err error
    fsClient, err = flagship.Start(
        os.Getenv("FLAGSHIP_ENV_ID"),
        os.Getenv("FLAGSHIP_API_KEY"),
    )
    if err != nil {
        log.Fatalf("Failed to start Flagship: %v", err)
    }
    defer fsClient.Dispose()

    http.HandleFunc("/", homeHandler)
    http.HandleFunc("/checkout", checkoutHandler)

    fmt.Println("Server running on :3000")
    log.Fatal(http.ListenAndServe(":3000", nil))
}

// Step 2, 3, 4 & 5: Create visitor, fetch flags, and use them
func homeHandler(w http.ResponseWriter, r *http.Request) {
    // Create visitor
    visitor, err := fsClient.NewVisitor("user-123", true)
    if err != nil {
        http.Error(w, "Visitor error", 500)
        return
    }

    visitor.UpdateContext("isVip", true)
    visitor.UpdateContext("country", "NL")

    // Fetch flags
    if err := visitor.FetchFlags(); err != nil {
        log.Printf("Error fetching flags: %v", err)
    }

    // Use flags
    welcomeText, _ := visitor.GetFlag("welcome-message").Value("Welcome!")
    showBanner, _ := visitor.GetFlag("show-promo-banner").Value(false)

    // Track page view
    visitor.SendHit(&hits.Page{DocumentLocation: "/"})

    response := map[string]interface{}{
        "welcome":    welcomeText,
        "showBanner": showBanner,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

// Step 6: Track hits
func checkoutHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", 405)
        return
    }

    visitor, err := fsClient.NewVisitor("user-123", true)
    if err != nil {
        http.Error(w, "Visitor error", 500)
        return
    }

    if err := visitor.FetchFlags(); err != nil {
        log.Printf("Error fetching flags: %v", err)
    }

    visitor.SendHit(&hits.Event{
        Category: hits.ActionTracking,
        Action:   "checkout-completed",
    })

    visitor.SendHit(&hits.Transaction{
        TransactionID: "T12345",
        Affiliation:   "Go Store",
        TotalRevenue:  99.99,
    })

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
```

**Gin framework integration:**

```go
package main

import (
    "log"
    "os"

    "github.com/gin-gonic/gin"
    flagship "github.com/flagship-io/flagship-go-sdk/v2"
    "github.com/flagship-io/flagship-go-sdk/v2/pkg/hits"
)

var fsClient *flagship.FlagshipClient

func main() {
    var err error
    fsClient, err = flagship.Start(
        os.Getenv("FLAGSHIP_ENV_ID"),
        os.Getenv("FLAGSHIP_API_KEY"),
    )
    if err != nil {
        log.Fatal(err)
    }
    defer fsClient.Dispose()

    r := gin.Default()

    // Middleware
    r.Use(func(c *gin.Context) {
        visitorId := c.GetHeader("X-User-ID")
        if visitorId == "" {
            visitorId = "anonymous"
        }

        visitor, err := fsClient.NewVisitor(visitorId, true)
        if err != nil {
            c.AbortWithStatus(500)
            return
        }

        visitor.UpdateContext("userAgent", c.Request.UserAgent())
        visitor.FetchFlags()

        c.Set("fsVisitor", visitor)
        c.Next()
    })

    r.GET("/", func(c *gin.Context) {
        visitor := c.MustGet("fsVisitor").(*flagship.Visitor)
        welcomeText, _ := visitor.GetFlag("welcome-message").Value("Welcome!")
        c.JSON(200, gin.H{"welcome": welcomeText})
    })

    r.POST("/checkout", func(c *gin.Context) {
        visitor := c.MustGet("fsVisitor").(*flagship.Visitor)
        visitor.SendHit(&hits.Event{
            Category: hits.ActionTracking,
            Action:   "checkout-completed",
        })
        c.JSON(200, gin.H{"success": true})
    })

    r.Run(":3000")
}
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```go
visitor.UpdateContext("hasCompletedPurchase", true)
visitor.UpdateContext("cartValue", 150.0)

err = visitor.FetchFlags() // Refetch with new context
```

### Flag Metadata

Access campaign metadata:

```go
flag := visitor.GetFlag("my-feature")

value, _ := flag.Value(false)
fmt.Println("Value:", value)
fmt.Println("Exists:", flag.Exists())

metadata := flag.Metadata()
fmt.Println("Campaign ID:", metadata.CampaignID)
fmt.Println("Variation ID:", metadata.VariationID)
```

### Visitor Authentication

Track authenticated users:

```go
// On login
visitor.Authenticate("<AUTHENTICATED_USER_ID>")

// On logout
visitor.Unauthenticate()
```

### Hit Types Reference

```go
// Event
&hits.Event{Category: hits.UserEngagement, Action: "click"}

// Page view
&hits.Page{DocumentLocation: "/page"}

// Screen
&hits.Screen{DocumentLocation: "HomeScreen"}

// Transaction
&hits.Transaction{TransactionID: "T123", Affiliation: "Store", TotalRevenue: 100}

// Item (product)
&hits.Item{TransactionID: "T123", ProductName: "Product", ProductSKU: "SKU123", ItemPrice: 50}
```

## Troubleshooting

**Flags return default values:**

- Ensure `FetchFlags()` called before `Value()`
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

- Set context via `UpdateContext()` before `FetchFlags()`
- Call `FetchFlags()` again after context changes

**Module errors:**

- Run `go mod tidy` to resolve dependencies
- Verify Go version is 1.18+
- Check `GOPATH` and `GOMODULE` settings

## Success Criteria

Installation complete when:

- ✅ Package `github.com/flagship-io/flagship-go-sdk/v2` installed
- ✅ SDK initialized with `flagship.Start()`
- ✅ Visitor created with `NewVisitor()`
- ✅ Flags fetched with `FetchFlags()`
- ✅ Server starts without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship Go SDK Docs](https://docs.abtasty.com/server-side/sdks/go-sdk)
- [Flagship Go SDK GitHub](https://github.com/flagship-io/flagship-go-sdk)
- [Go Packages](https://pkg.go.dev/github.com/flagship-io/flagship-go-sdk/v2)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
