# Client Implementation Guide - Webhook Configuration UI

## Overview

This guide explains how to update your client application to properly handle Meta's webhook subscription system, which requires manual configuration in the Facebook App Dashboard.

## Key Understanding

**Critical:** Meta's webhook field configuration (which events you receive) CANNOT be managed via API. It must be configured manually in the Facebook App Dashboard.

Your client should:
- ✅ Show subscription status (is the app subscribed to the WABA?)
- ✅ Direct users to Facebook App Dashboard for field configuration
- ❌ NOT try to display `subscribed_fields` from API (they're not available)
- ❌ NOT provide a form to edit webhook fields (API doesn't support it)

## API Response Format

### What Your Client Receives

```javascript
// GET /api/v1/whatsapp/webhooks/subscriptions?subDomain=business-name

{
  "type": "1",
  "message": "Webhook subscriptions retrieved successfully",
  "data": {
    "data": [
      {
        "id": "670841234567890",
        "name": "Your App Name",
        "link": "https://www.facebook.com/games/?app_id=670841234567890",
        "subscribed_fields": null,  // ⚠️ Always null - by design!
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

### What Changed from Before

**Before:**
```javascript
// You might have expected this:
{
  "subscribed_fields": ["messages", "message_template_status_update"]
}
```

**After:**
```javascript
// What you actually get:
{
  "subscribed_fields": null,  // Explicitly null, not an empty array!
  "_note": "Webhook fields must be configured in Facebook App Dashboard"
}
```

## React Implementation Examples

### Example 1: Simple Subscription Status Component

```jsx
import React, { useState, useEffect } from 'react';
import { Alert, AlertCircle, Button, Card, Badge } from '@/components/ui';
import api from '@/services/api';

const WebhookSubscriptionStatus = ({ business }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [business.subDomain]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/whatsapp/webhooks/subscriptions', {
        params: { subDomain: business.subDomain }
      });

      setSubscriptions(response.data.data?.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading webhook status...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <span>Error loading webhooks: {error}</span>
      </Alert>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">No Webhook Subscription</h3>
        <p className="text-gray-600 mb-4">
          Your app is not subscribed to receive webhooks from this WhatsApp Business Account.
        </p>
        <Button onClick={handleSubscribe}>
          Subscribe to Webhooks
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Important notice about field configuration */}
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <div className="ml-2">
          <h4 className="font-semibold">Webhook Configuration Required</h4>
          <p className="text-sm mt-1">
            Your app is subscribed to this WhatsApp Business Account.
            To receive webhook events (messages, templates, etc.), you must
            configure the event fields in your Facebook App Dashboard.
          </p>
          <Button
            variant="link"
            className="mt-2 p-0 h-auto"
            onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
          >
            Configure Webhook Fields in Dashboard →
          </Button>
        </div>
      </Alert>

      {/* Show subscribed apps */}
      {subscriptions.map(subscription => (
        <Card key={subscription.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{subscription.name}</h3>
              <p className="text-sm text-gray-500">App ID: {subscription.id}</p>
            </div>
            <Badge variant="success">Subscribed</Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Status:</span>
              <span className="ml-2">Receiving webhooks</span>
            </div>
            <div>
              <span className="font-medium">Event Fields:</span>
              <span className="ml-2 text-amber-600">
                Configured in Facebook App Dashboard
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(subscription.link, '_blank')}
            >
              View in Meta
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://developers.facebook.com/apps/${subscription.id}/webhooks`, '_blank')}
            >
              Configure Fields
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleUnsubscribe(subscription.id)}
            >
              Unsubscribe
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default WebhookSubscriptionStatus;
```

### Example 2: Configuration Helper Component

```jsx
import React from 'react';
import { Alert, Button, Accordion } from '@/components/ui';
import { ExternalLink, CheckCircle } from 'lucide-react';

const WebhookConfigurationGuide = () => {
  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <h4 className="font-semibold mb-2">Manual Configuration Required</h4>
        <p className="text-sm">
          Webhook event fields cannot be managed through this interface.
          You must configure them manually in the Facebook App Dashboard.
        </p>
      </Alert>

      <Accordion type="single" collapsible>
        <AccordionItem value="instructions">
          <AccordionTrigger>
            How to Configure Webhook Fields
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Go to{' '}
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  Facebook Developers Dashboard
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>Select your app from the list</li>
              <li>Click "Webhooks" in the left sidebar</li>
              <li>Find "WhatsApp Business Account" and click "Edit Subscription"</li>
              <li>
                Check the fields you want to receive:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><code>messages</code> - Incoming customer messages</li>
                  <li><code>message_template_status_update</code> - Template approval/rejection</li>
                  <li><code>account_update</code> - Account policy violations</li>
                  <li><code>phone_number_quality_update</code> - Quality changes</li>
                </ul>
              </li>
              <li>Enter your callback URL (already configured)</li>
              <li>Enter your verify token (already configured)</li>
              <li>Click "Verify and Save"</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="recommended">
          <AccordionTrigger>
            Recommended Webhook Fields
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <div>
                  <strong>messages</strong> - Essential for receiving customer messages
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <div>
                  <strong>message_template_status_update</strong> - Essential for template management
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <strong>account_update</strong> - Recommended for policy violation alerts
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <strong>phone_number_quality_update</strong> - Recommended for quality monitoring
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        variant="primary"
        className="w-full"
        onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
      >
        Open Facebook App Dashboard
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

export default WebhookConfigurationGuide;
```

### Example 3: Complete Webhooks Configuration Page

```jsx
import React, { useState } from 'react';
import WebhookSubscriptionStatus from './WebhookSubscriptionStatus';
import WebhookConfigurationGuide from './WebhookConfigurationGuide';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

const WebhooksConfigPage = ({ business }) => {
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Webhook Configuration</h1>
        <p className="text-gray-600 mt-2">
          Manage WhatsApp webhook subscriptions for {business.businessName}
        </p>
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">Subscription Status</TabsTrigger>
          <TabsTrigger value="configure">Configuration Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <WebhookSubscriptionStatus business={business} />
        </TabsContent>

        <TabsContent value="configure">
          <WebhookConfigurationGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhooksConfigPage;
```

## API Integration Examples

### Subscribe to Webhooks

```javascript
const subscribeToWebhooks = async (subDomain) => {
  try {
    const response = await api.post('/api/v1/whatsapp/webhooks/subscribe', {
      subDomain: subDomain,
      webhookUrl: 'https://your-api.com/api/v1/whatsapp/webhook',
      verifyToken: 'your-verify-token',
      fields: ['messages', 'message_template_status_update']
    });

    if (response.data.type === '1') {
      toast.success('Successfully subscribed to webhooks!');
      toast.info('Remember to configure webhook fields in Facebook App Dashboard');
      return true;
    } else {
      toast.error(response.data.message || 'Subscription failed');
      return false;
    }
  } catch (error) {
    console.error('Subscription error:', error);
    toast.error(error.response?.data?.message || 'Failed to subscribe');
    return false;
  }
};
```

### Unsubscribe from Webhooks

```javascript
const unsubscribeFromWebhooks = async (appId) => {
  try {
    const confirmed = await confirm(
      'Are you sure you want to unsubscribe from webhooks? ' +
      'You will stop receiving WhatsApp events.'
    );

    if (!confirmed) return false;

    const response = await api.delete(
      `/api/v1/whatsapp/webhooks/subscriptions/${appId}`
    );

    if (response.data.type === '1') {
      toast.success('Successfully unsubscribed from webhooks');
      return true;
    } else {
      toast.error(response.data.message || 'Unsubscribe failed');
      return false;
    }
  } catch (error) {
    console.error('Unsubscribe error:', error);
    toast.error(error.response?.data?.message || 'Failed to unsubscribe');
    return false;
  }
};
```

## Handling the Response

### DO ✅

```javascript
// Check if subscribed_fields is null (expected)
if (subscription.subscribed_fields === null) {
  // Show message directing user to dashboard
  return (
    <div>
      <p>Webhook fields must be configured in Facebook App Dashboard</p>
      <Button onClick={openDashboard}>Configure Now</Button>
    </div>
  );
}

// Use the _meta information
const meta = response.data.data._meta;
return (
  <Alert>
    <p>{meta.important}</p>
    <a href={meta.documentation} target="_blank">Learn More</a>
  </Alert>
);
```

### DON'T ❌

```javascript
// DON'T try to display subscribed_fields as an array
{subscription.subscribed_fields?.map(field => (
  <div key={field}>{field}</div>  // ❌ Will fail - subscribed_fields is null!
))}

// DON'T try to edit webhook fields via API
<form onSubmit={updateWebhookFields}>  // ❌ API doesn't support this!
  <CheckboxGroup name="fields" options={webhookFields} />
  <Button type="submit">Update Fields</Button>  // ❌ Won't work!
</form>

// DON'T treat null as an error
if (!subscription.subscribed_fields) {
  return <Error message="Failed to load fields" />;  // ❌ This is expected!
}
```

## User Experience Best Practices

### 1. Clear Communication

**Good:**
> "Your app is subscribed to this WhatsApp Business Account. To configure which events you receive (messages, templates, etc.), visit the Facebook App Dashboard."

**Bad:**
> "No webhook fields configured" (implies something is broken)

### 2. Helpful Actions

Provide direct links:
- Link to Facebook App Dashboard: `https://developers.facebook.com/apps`
- Link to specific app webhooks: `https://developers.facebook.com/apps/{app_id}/webhooks`
- Link to documentation: `https://developers.facebook.com/docs/whatsapp/webhooks`

### 3. Visual Indicators

Use appropriate status indicators:
- ✅ Green badge: "Subscribed" (app is subscribed to WABA)
- ⚠️ Yellow notice: "Configure webhook fields in dashboard"
- ❌ Red error: Only for actual errors (API failures, etc.)

### 4. Progressive Disclosure

```jsx
<Card>
  <CardHeader>
    <Title>Webhook Status</Title>
    <Badge variant="success">Active</Badge>
  </CardHeader>
  <CardContent>
    <p>Your app is subscribed and receiving webhooks.</p>
    <Accordion>
      <AccordionItem value="details">
        <AccordionTrigger>Configuration Details</AccordionTrigger>
        <AccordionContent>
          {/* Show technical details, configuration instructions, etc. */}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </CardContent>
</Card>
```

## Testing Your Implementation

### 1. Check API Response Handling

```javascript
// Test with mock data
const mockResponse = {
  type: "1",
  data: {
    data: [{
      id: "123456",
      name: "Test App",
      link: "https://...",
      subscribed_fields: null,  // ⚠️ Test with null!
      _note: "Webhook fields must be configured in Facebook App Dashboard"
    }],
    _meta: {
      important: "subscribed_fields are NOT available via this API endpoint",
      configuration: "Configure webhook fields in Facebook App Dashboard",
      documentation: "https://developers.facebook.com/..."
    }
  }
};

// Your component should handle this without errors
```

### 2. Verify User Flow

1. User sees subscription status ✅
2. User sees clear message about dashboard configuration ✅
3. User can click to open Facebook App Dashboard ✅
4. User can unsubscribe if needed ✅
5. No confusing error messages about "missing fields" ✅

### 3. Check Console for Errors

```javascript
// Should NOT see these errors:
// ❌ "Cannot read property 'map' of null"
// ❌ "subscribed_fields is undefined"
// ❌ "Failed to load webhook fields"

// Should see:
// ✅ "Webhook subscriptions loaded successfully"
// ✅ "subscribed_fields is null (expected)"
```

## Migration Checklist

If you have existing webhook UI, update it:

- [ ] Remove any code trying to display `subscribed_fields` array
- [ ] Remove any forms for editing webhook fields
- [ ] Add message about Facebook App Dashboard configuration
- [ ] Add links to Facebook App Dashboard
- [ ] Handle `subscribed_fields: null` gracefully (not as an error)
- [ ] Display `_note` and `_meta` information from response
- [ ] Update any documentation or help text
- [ ] Test with real API response
- [ ] Verify no console errors
- [ ] Get user feedback on clarity

## Summary

**Key Points:**
1. ✅ `subscribed_fields` will always be `null` - this is correct behavior
2. ✅ Show subscription status (app is/isn't subscribed to WABA)
3. ✅ Direct users to Facebook App Dashboard for field configuration
4. ❌ Don't try to display or edit webhook fields via your UI
5. ❌ Don't treat `null` subscribed_fields as an error

**Resources:**
- Backend API documentation: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- Meta webhook system explained: [META_WEBHOOK_SYSTEM_EXPLAINED.md](META_WEBHOOK_SYSTEM_EXPLAINED.md)
- Facebook App Dashboard: https://developers.facebook.com/apps

**Status: Ready for Client Implementation** ✅
