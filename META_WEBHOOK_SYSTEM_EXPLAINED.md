# Meta WhatsApp Webhook System - Complete Guide

## Critical Understanding

### ⚠️ Important: subscribed_fields are NOT managed via API

According to [Meta's official documentation](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/manage-webhooks), the **webhook subscription fields cannot be retrieved or managed via the Graph API**.

## Two Separate Concerns

### 1. App Subscription to WABA (via API) ✅

**What it does:** Subscribes your app to receive webhooks from a specific WABA

**Endpoint:** `POST /<WABA_ID>/subscribed_apps`

**Request:**
```bash
curl -X POST 'https://graph.facebook.com/v24.0/<WABA_ID>/subscribed_apps' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

**Response:**
```json
{
  "success": true
}
```

**What this means:** Your app is now subscribed to the WABA and will receive webhooks (if fields are configured in dashboard).

### 2. Webhook Fields Configuration (via Dashboard ONLY) ⚠️

**What it does:** Configures WHICH webhook events you want to receive

**Where to configure:** Facebook App Dashboard > Webhooks > Edit Subscription

**Cannot be done via API!** You must use the dashboard.

**Available fields:**
- `messages` - Messages sent from users and message statuses
- `message_template_status_update` - Template approval/rejection
- `message_template_quality_update` - Template quality score changes
- `message_template_components_update` - Template component changes
- `template_category_update` - Template category changes
- `phone_number_name_update` - Display name verification outcomes
- `phone_number_quality_update` - Phone number throughput level changes
- `account_update` - WABA changes, violations, sharing, deletion
- `account_alerts` - Messaging limit, business profile, OBA status changes
- `account_review_update` - WABA policy review outcomes
- `business_capability_update` - WABA capability changes
- `security` - Security settings changes
- And more...

## API Endpoints

### Subscribe App to WABA

**Purpose:** Tell Meta that your app should receive webhooks for this WABA

```bash
POST /<WABA_ID>/subscribed_apps
```

**What you're saying:** "My app wants to receive webhooks from this WABA"

**Response:**
```json
{
  "success": true
}
```

### Get Subscribed Apps

**Purpose:** See which apps are subscribed to a WABA

```bash
GET /<WABA_ID>/subscribed_apps
```

**Response:**
```json
{
  "data": [
    {
      "whatsapp_business_api_data": {
        "id": "67084...",
        "link": "https://www.facebook.com/games/?app_id=67084...",
        "name": "Jaspers Market"
      }
    }
  ]
}
```

**⚠️ IMPORTANT:** This response does NOT include `subscribed_fields`!

### Unsubscribe from WABA

**Purpose:** Stop receiving webhooks from a WABA

```bash
DELETE /<WABA_ID>/subscribed_apps
```

**Response:**
```json
{
  "success": true
}
```

## Current Implementation in Code

### GET /api/v1/whatsapp/webhooks/subscriptions

**What it does:**
- Calls Meta's `GET /<WABA_ID>/subscribed_apps`
- Returns which apps are subscribed
- **Does NOT return subscribed_fields** (not available from Meta)

**Response Format:**
```json
{
  "type": "1",
  "message": "Webhook subscriptions retrieved successfully",
  "data": {
    "data": [
      {
        "id": "app_id",
        "name": "App Name",
        "link": "https://...",
        "subscribed_fields": null,  // ⚠️ Not available via API!
        "_note": "Webhook fields must be configured in Facebook App Dashboard > Webhooks > Edit Subscription"
      }
    ],
    "_meta": {
      "important": "subscribed_fields are NOT available via this API endpoint",
      "configuration": "Configure webhook fields in Facebook App Dashboard > Webhooks > Edit Subscription",
      "documentation": "https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/manage-webhooks"
    }
  }
}
```

### POST /api/v1/whatsapp/webhooks/subscribe

**What it does:**
- Subscribes your app to a WABA
- **Does NOT configure webhook fields** (must be done in dashboard)

**Current behavior:** Calls `POST /<WABA_ID>/subscribed_apps`

**Limitation:** The `fields` parameter in the current implementation is misleading - it doesn't actually configure the webhook fields in Meta. Those must be configured in the dashboard.

### PUT /api/v1/whatsapp/webhooks/subscriptions

**Current issue:** This endpoint is designed to update `subscribed_fields`, but this is **not possible via Meta's API**.

### DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId

**What it does:** Unsubscribes your app from the WABA

## The Correct Workflow

### Step 1: Configure Webhook Fields in Facebook App Dashboard

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Webhooks** in the left sidebar
4. Click **Edit Subscription**
5. Check the fields you want to subscribe to:
   - ☑️ messages
   - ☑️ message_template_status_update
   - ☑️ phone_number_quality_update
   - ☑️ account_update
   - etc.
6. Enter your callback URL (e.g., `https://api.example.com/api/v1/whatsapp/webhook`)
7. Enter your verify token
8. Click **Verify and Save**

### Step 2: Subscribe Your App to Each WABA (via API)

For each customer WABA you want to monitor:

```bash
curl -X POST 'https://graph.facebook.com/v24.0/{WABA_ID}/subscribed_apps' \
  -H 'Authorization: Bearer {ACCESS_TOKEN}'
```

Or use your API:

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "subDomain": "customer-subdomain",
    "webhookUrl": "https://api.example.com/api/v1/whatsapp/webhook",
    "verifyToken": "your_verify_token",
    "fields": ["messages"]  // ⚠️ This parameter is currently not used by Meta API!
  }'
```

### Step 3: Verify Webhook is Working

Send a test message to your WhatsApp number. You should receive a webhook at your callback URL.

## What Your Client Should Show

Instead of trying to display `subscribed_fields` (which aren't available), your client should:

### Option 1: Show Subscription Status Only

```javascript
// WebhooksConfig.jsx
const webhooks = response?.data?.data || [];

if (webhooks.length === 0) {
  return <Alert>No apps subscribed to this WABA</Alert>;
}

return webhooks.map(webhook => (
  <Card key={webhook.id}>
    <CardHeader>
      <Title>{webhook.name}</Title>
      <Badge>Subscribed</Badge>
    </CardHeader>
    <CardContent>
      <p>App ID: {webhook.id}</p>
      <p>Link: {webhook.link}</p>
      <Alert variant="info">
        Webhook fields are configured in Facebook App Dashboard.
        <Button onClick={() => window.open('https://developers.facebook.com/apps/' + webhook.id + '/webhooks', '_blank')}>
          Configure Fields →
        </Button>
      </Alert>
    </CardContent>
  </Card>
));
```

### Option 2: Link to Dashboard for Configuration

```javascript
<Alert variant="warning">
  <AlertTitle>Webhook Fields Configuration</AlertTitle>
  <AlertDescription>
    Webhook event fields cannot be managed via API.
    Configure them in your Facebook App Dashboard.
  </AlertDescription>
  <Button
    variant="primary"
    onClick={() => window.open(response.data._meta.documentation, '_blank')}
  >
    View Documentation
  </Button>
  <Button
    variant="secondary"
    onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
  >
    Open App Dashboard
  </Button>
</Alert>
```

## Recommended Code Changes

### Remove Misleading Endpoints

Since webhook fields cannot be managed via API, consider:

1. **Keep:** `GET /webhooks/subscriptions` - Shows which apps are subscribed
2. **Keep:** `POST /webhooks/subscribe` - Subscribe app to WABA (but remove `fields` parameter)
3. **Remove or deprecate:** `PUT /webhooks/subscriptions` - Cannot update fields via API
4. **Keep:** `DELETE /webhooks/subscriptions/:appId` - Unsubscribe from WABA

### Update POST Subscribe Endpoint

Remove the `fields` parameter since it doesn't do anything:

```typescript
// Before (misleading)
{
  webhookUrl: string,
  verifyToken: string,
  fields: string[]  // ❌ Not actually used by Meta API!
}

// After (correct)
{
  // Note: Webhook fields must be configured in App Dashboard
  // This endpoint only subscribes the app to the WABA
}
```

## Summary

### ✅ What the API CAN do:
- Subscribe your app to a WABA (`POST /subscribed_apps`)
- Check if your app is subscribed (`GET /subscribed_apps`)
- Unsubscribe from a WABA (`DELETE /subscribed_apps`)

### ❌ What the API CANNOT do:
- Get list of subscribed webhook fields
- Configure which webhook fields to subscribe to
- Update webhook field subscriptions

### 📝 What you MUST do manually:
- Configure webhook fields in Facebook App Dashboard > Webhooks > Edit Subscription
- Set callback URL in dashboard
- Set verify token in dashboard

## Sources

- [Managing Webhooks - Meta for Developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/manage-webhooks)
- [Webhooks Overview - Meta for Developers](https://developers.facebook.com/docs/graph-api/webhooks)
- [WhatsApp Business Platform Webhooks](https://developers.facebook.com/docs/whatsapp/webhooks)

## Client Implementation Example

```javascript
// WebhooksConfig.jsx
const WebhooksConfig = () => {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const response = await api.get('/api/v1/whatsapp/webhooks/subscriptions', {
      params: { subDomain: currentBusiness.subDomain }
    });

    setSubscriptions(response.data.data?.data || []);
  };

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        title="No Webhook Subscriptions"
        description="Your app is not subscribed to receive webhooks from this WABA"
        action={
          <Button onClick={() => subscribeToWebhooks()}>
            Subscribe Now
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Webhook Configuration</AlertTitle>
        <AlertDescription>
          Your app is subscribed to this WABA. Webhook event fields are configured in your Facebook App Dashboard.
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            Configure fields →
          </a>
        </AlertDescription>
      </Alert>

      {subscriptions.map(sub => (
        <Card key={sub.id}>
          <CardHeader>
            <CardTitle>{sub.name}</CardTitle>
            <Badge variant="success">Active</Badge>
          </CardHeader>
          <CardContent>
            <dl>
              <dt>App ID</dt>
              <dd>{sub.id}</dd>
              <dt>Status</dt>
              <dd>Subscribed to WABA webhooks</dd>
            </dl>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => window.open(sub.link, '_blank')}
            >
              View in Meta
            </Button>
            <Button
              variant="destructive"
              onClick={() => unsubscribe(sub.id)}
            >
              Unsubscribe
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
```

**Bottom line:** The `subscribed_fields` you're looking for don't exist in the API response because Meta doesn't expose them via API. They must be configured in the Facebook App Dashboard's Webhooks settings.
