# AB Tasty Python SDK Installation

Step-by-step installation and configuration of the AB Tasty Flagship Python SDK for server-side Python applications.

## Prerequisites

Before starting, verify:

- Python 3.7+ installed
- pip or pipenv/poetry
- Server has internet access
- AB Tasty credentials (Environment ID and API Key)

**Finding credentials:** AB Tasty account → Settings → Feature Experimentation → Environment settings

## Installation Steps

### Step 1: Install Package

```bash
# pip
pip install flagship

# pipenv
pipenv install flagship

# poetry
poetry add flagship
```

**Verify:** Package installed with `pip show flagship`.

### Step 2: Initialize SDK

Initialize SDK early in your application entry point:

```python
from flagship import Flagship

# Start SDK with credentials
Flagship.start("<ENV_ID>", "<API_KEY>")
```

**When to initialize:** Before the server starts handling requests, typically in main entry point or app factory.

**Optional configuration:**

```python
from flagship import Flagship
from flagship.config import DecisionApi
from flagship.log_level import LogLevel

config = DecisionApi(
    log_level=LogLevel.INFO,
    timeout=3000,
)

Flagship.start("<ENV_ID>", "<API_KEY>", config=config)
```

### Step 3: Create Visitor

Create visitors with unique IDs and context for targeting:

```python
visitor = Flagship.new_visitor(
    visitor_id="<VISITOR_ID>",
    consent=True,
    context={
        "isVIP": True,
        "country": "NL",
        "plan": "premium",
    }
)
```

**Flask middleware pattern:**

```python
from flask import g, request

@app.before_request
def create_visitor():
    g.visitor = Flagship.new_visitor(
        visitor_id=getattr(request, 'user_id', None) or request.cookies.get('session_id', 'anonymous'),
        consent=True,
        context={
            "email": getattr(request, 'user_email', None),
            "ip_address": request.remote_addr,
            "user_agent": request.headers.get("User-Agent"),
        }
    )
    g.visitor.fetch_flags()
```

### Step 4: Fetch Flags

Before using flags, fetch them from AB Tasty:

```python
visitor.fetch_flags()
```

### Step 5: Retrieve Flag Values

Get flag values with defaults:

```python
# Get flag value with default fallback
show_vip = visitor.get_flag("displayVipFeature", False).value()

if show_vip:
    # Enable VIP feature
    pass
```

**Different flag types:**

```python
welcome_text = visitor.get_flag("welcome-text", "Hello").value()
api_limit = visitor.get_flag("api-limit", 100).value()
config = visitor.get_flag("ui-config", {"theme": "light"}).value()
```

**Important:** `value()` automatically sends an exposure hit by default.

### Step 6: Track Analytics Hits

Send hits to track user actions:

```python
from flagship.hits import Event, Page, Screen, Transaction, EventCategory

# Event hit
visitor.send_hit(Event(EventCategory.USER_ENGAGEMENT, "click")
    .with_event_label("vip-feature-button")
    .with_event_value(100))

# Page view
visitor.send_hit(Page("https://www.my_domain_com/checkout"))

# Screen view
visitor.send_hit(Screen("HomeScreen"))

# Transaction
visitor.send_hit(Transaction("T12345", "Online Store")
    .with_total_revenue(99.99)
    .with_shipping_cost(5.0)
    .with_taxes(8.5)
    .with_currency("USD"))
```

## Complete Example

Flask application:

```python
import os
from flask import Flask, request, jsonify, g
from flagship import Flagship
from flagship.hits import Event, Page, Transaction, EventCategory

app = Flask(__name__)

# Step 1: Start SDK
Flagship.start(
    os.environ.get("FLAGSHIP_ENV_ID"),
    os.environ.get("FLAGSHIP_API_KEY")
)

# Step 2: Create visitor middleware
@app.before_request
def before_request():
    g.visitor = Flagship.new_visitor(
        visitor_id=request.cookies.get("user_id", "anonymous"),
        consent=True,
        context={
            "is_vip": request.cookies.get("is_vip", "false") == "true",
            "country": request.headers.get("X-Country", "US"),
        }
    )
    # Step 3: Fetch flags
    g.visitor.fetch_flags()

# Step 4 & 5: Use flags
@app.route("/")
def home():
    welcome_text = g.visitor.get_flag("welcome-message", "Welcome!").value()
    show_banner = g.visitor.get_flag("show-promo-banner", False).value()

    g.visitor.send_hit(Page("https://www.my_domain_com/"))

    return f"""
    <h1>{welcome_text}</h1>
    {"<div class='promo'>Special Offer!</div>" if show_banner else ""}
    """

# Step 6: Track hits
@app.route("/checkout", methods=["POST"])
def checkout():
    g.visitor.send_hit(Event(EventCategory.ACTION_TRACKING, "checkout-completed"))

    g.visitor.send_hit(Transaction("T12345", "Python Store")
        .with_total_revenue(99.99))

    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(port=3000, debug=True)
```

**Django integration:**

```python
# settings.py
from flagship import Flagship

Flagship.start(
    os.environ.get("FLAGSHIP_ENV_ID"),
    os.environ.get("FLAGSHIP_API_KEY")
)

# middleware.py
from flagship import Flagship

class FlagshipMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.fs_visitor = Flagship.new_visitor(
            visitor_id=str(request.user.id) if request.user.is_authenticated else request.session.session_key or "anonymous",
            consent=True,
            context={
                "is_vip": getattr(request.user, 'is_vip', False),
                "country": request.META.get('HTTP_X_COUNTRY', 'US'),
            }
        )
        request.fs_visitor.fetch_flags()
        return self.get_response(request)

# views.py
def home(request):
    welcome = request.fs_visitor.get_flag("welcome-message", "Welcome!").value()
    return render(request, "home.html", {"welcome": welcome})
```

## Advanced Features

### Update Visitor Context

Update context dynamically:

```python
visitor.update_context({
    "has_completed_purchase": True,
    "cart_value": 150.0,
})

visitor.fetch_flags()  # Refetch with new context
```

### Flag Metadata

Access campaign metadata:

```python
flag = visitor.get_flag("my-feature", False)

print(f"Value: {flag.value()}")
print(f"Exists: {flag.exists()}")
print(f"Campaign ID: {flag.metadata().campaign_id}")
print(f"Variation ID: {flag.metadata().variation_id}")
```

### Visitor Authentication

Track authenticated users:

```python
# On login
visitor.authenticate("<AUTHENTICATED_USER_ID>")

# On logout
visitor.unauthenticate()
```

### Hit Types Reference

```python
# Event
Event(EventCategory.USER_ENGAGEMENT, "click")
# or with label/value
Event(EventCategory.ACTION_TRACKING, "add-to-cart").with_event_label("label").with_event_value(1)

# Page view (requires valid URL)
Page("https://www.my_domain_com/page")

# Screen (SPA/mobile)
Screen("HomeScreen")

# Transaction
Transaction("T123", "Store").with_total_revenue(100)

# Item (must be sent after its transaction)
Item("T123", "Product", "SKU123").with_price(50)
```

## Troubleshooting

**Flags return default values:**

- Ensure `fetch_flags()` called before `value()`
- Verify visitor context matches campaign targeting
- Check campaign is active in AB Tasty dashboard

**API timeout errors:**

- Verify Environment ID and API Key correct
- Check server internet connectivity
- Increase timeout in SDK config

**GDPR consent errors:**

- `has_consented` parameter required when creating visitor
- Set based on user consent status

**Context not applied:**

- Set context in `new_visitor()` or use `update_context()`
- Call `fetch_flags()` again after context changes

**Import errors:**

- Verify `pip install flagship` completed
- Check Python version is 3.7+
- Ensure virtual environment activated

## Success Criteria

Installation complete when:

- ✅ Package `flagship` installed via pip
- ✅ SDK initialized with `Flagship.start()`
- ✅ Visitor created with `new_visitor()`
- ✅ Flags fetched with `fetch_flags()`
- ✅ Server starts without errors
- ✅ Flag values retrieved successfully
- ✅ Hits sent to analytics

## Resources

- [Flagship Python SDK Docs](https://docs.abtasty.com/server-side/sdks/python-sdk)
- [Flagship Python SDK GitHub](https://github.com/flagship-io/flagship-python-sdk)
- [PyPI Package](https://pypi.org/project/flagship/)
- [Developer Portal](https://docs.developers.flagship.io/)

## Related

- For runtime flag retrieval: See [decision-api.md](decision-api.md)
- For campaign creation: See [fear-resource-extractor.md](fear-resource-extractor.md)
