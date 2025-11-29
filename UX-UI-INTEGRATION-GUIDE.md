# UX/UI Integration Guide - Category-Based Catalog + WhatsApp Flow

## 📱 **Overview**

This document provides UX/UI recommendations and integration guidelines for implementing the category-based catalog strategy with WhatsApp Flows. It covers visual design, user interactions, accessibility, and technical implementation details.

---

## 🎨 **Design Principles**

### 1. **Clarity Over Complexity**
- Show only essential information in catalog
- Use progressive disclosure (details revealed on demand)
- Clear visual hierarchy with categories → products → customization

### 2. **Mobile-First Design**
- WhatsApp is primarily mobile, optimize for small screens
- Large touch targets (minimum 44x44px)
- Readable text without zooming (minimum 14px)

### 3. **Speed & Performance**
- Minimize user steps to complete purchase
- Pre-load common selections
- Instant feedback on interactions

### 4. **Consistency**
- Uniform pricing format (e.g., "$12.00" not "$12")
- Consistent emoji usage across categories
- Standard flow patterns for all products

---

## 🗂️ **Category Organization**

### Visual Category Design

#### Recommended Category Icons
```typescript
const categoryIcons = {
  'pizza': '🍕',
  'bbq': '🍖',
  'burgers': '🍔',
  'pasta': '🍝',
  'salads': '🥗',
  'desserts': '🍰',
  'drinks': '🥤',
  'sides': '🍟',
  'breakfast': '🍳',
  'seafood': '🦞',
  'vegetarian': '🥬',
  'specials': '⭐'
};
```

#### Category Button Layout
```
WhatsApp Message:
┌─────────────────────────────────┐
│ 👋 Welcome to LeMenu!           │
│                                 │
│ 📋 Browse our menu by category: │
│                                 │
│ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ 🍕   │ │ 🍖   │ │ 🥤   │    │
│ │ Pizza│ │ BBQ  │ │Drinks│    │
│ │ (12) │ │ (8)  │ │ (15) │    │
│ └──────┘ └──────┘ └──────┘    │
│                                 │
│ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ 🍰   │ │ 🥗   │ │ 🍔   │    │
│ │Desert│ │Salads│ │Burger│    │
│ │ (6)  │ │ (5)  │ │ (10) │    │
│ └──────┘ └──────┘ └──────┘    │
└─────────────────────────────────┘
```

### Category Metadata
```typescript
interface CategoryDisplay {
  id: string;
  name: string;
  emoji: string;
  description: string;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
}

// Example
const pizzaCategory: CategoryDisplay = {
  id: 'cat:pizza',
  name: 'Pizza',
  emoji: '🍕',
  description: 'Traditional & specialty pizzas',
  productCount: 12,
  sortOrder: 1,
  isActive: true,
  imageUrl: 'https://cdn.example.com/categories/pizza.jpg'
};
```

---

## 🛍️ **Product Catalog Display**

### Product Card Design

#### Layout Structure
```
┌────────────────────────────────────┐
│ [Product Image]                    │
│                                    │
├────────────────────────────────────┤
│ 🍕 Pizza Margherita                │
│ $12.00 - $20.00                    │
│                                    │
│ Classic pizza with fresh mozzarella│
│ tomatoes, and basil                │
│                                    │
│ 📏 Multiple sizes available        │
│ 🎨 Customizable                    │
│                                    │
│ ⭐⭐⭐⭐⭐ (124 reviews)              │
│                                    │
│ ┌────────────────────────────────┐ │
│ │     [Customize & Order]        │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### Product Information Hierarchy

**Priority 1 - Always Show:**
- Product name
- Price range (min - max)
- Primary product image
- "Customize" call-to-action button

**Priority 2 - Show If Available:**
- Short description (1-2 lines max)
- Availability badges (e.g., "Popular", "New", "Spicy")
- Rating & review count

**Priority 3 - Optional:**
- Nutritional info icon
- Allergen warnings
- Preparation time estimate

### Price Display Guidelines

```typescript
interface PriceDisplay {
  format: 'range' | 'single' | 'from';
  minPrice: number;
  maxPrice: number;
  currency: string;
  locale: string;
}

// Formatting logic
function formatPrice(priceDisplay: PriceDisplay): string {
  const formatter = new Intl.NumberFormat(priceDisplay.locale, {
    style: 'currency',
    currency: priceDisplay.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (priceDisplay.minPrice === priceDisplay.maxPrice) {
    // Single price: "$15.00"
    return formatter.format(priceDisplay.minPrice);
  }

  if (priceDisplay.format === 'from') {
    // From price: "From $12.00"
    return `From ${formatter.format(priceDisplay.minPrice)}`;
  }

  // Price range: "$12.00 - $20.00"
  return `${formatter.format(priceDisplay.minPrice)} - ${formatter.format(priceDisplay.maxPrice)}`;
}

// Examples
formatPrice({ minPrice: 12, maxPrice: 20, currency: 'USD', locale: 'en-US' })
// → "$12.00 - $20.00"

formatPrice({ minPrice: 15, maxPrice: 15, currency: 'PEN', locale: 'es-PE' })
// → "S/ 15.00"

formatPrice({ minPrice: 12, maxPrice: 20, currency: 'USD', locale: 'en-US', format: 'from' })
// → "From $12.00"
```

### Badge System

```typescript
interface ProductBadge {
  type: 'popular' | 'new' | 'sale' | 'vegan' | 'spicy' | 'featured';
  label: string;
  color: string;
  emoji?: string;
}

const badges: Record<string, ProductBadge> = {
  popular: { type: 'popular', label: 'Popular', color: '#FF6B6B', emoji: '🔥' },
  new: { type: 'new', label: 'New', color: '#4ECDC4', emoji: '✨' },
  sale: { type: 'sale', label: 'On Sale', color: '#FFD93D', emoji: '💰' },
  vegan: { type: 'vegan', label: 'Vegan', color: '#6BCB77', emoji: '🌱' },
  spicy: { type: 'spicy', label: 'Spicy', color: '#FF6B6B', emoji: '🌶️' },
  featured: { type: 'featured', label: 'Featured', color: '#A8E6CF', emoji: '⭐' }
};

// Display: "🔥 Popular" or "🌱 Vegan"
```

---

## 🔄 **WhatsApp Flow Design**

### Flow Architecture

```
Product Selection (From Catalog)
        ↓
[Screen 1: Size Selection] ← Always required
        ↓
[Screen 2: Modifiers] ← Show if product has modifiers
        ↓
[Screen 3: Special Instructions] ← Optional, user can skip
        ↓
[Screen 4: Order Summary] ← Always show before confirmation
        ↓
[Order Confirmed] → Return to chat
```

### Screen 1: Size Selection

#### Design Specifications
```json
{
  "screen": "SIZE_SELECTION",
  "title": "Choose Your Size",
  "subtitle": "Pizza Margherita",
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "Image",
        "src": "${product.imageUrl}",
        "alt": "${product.name}",
        "aspectRatio": "16:9",
        "scaleType": "cover"
      },
      {
        "type": "TextHeading",
        "text": "Select Size"
      },
      {
        "type": "RadioButtonsGroup",
        "name": "presentation",
        "required": true,
        "data-source": [
          {
            "id": "pres:small",
            "title": "Small (8\")",
            "description": "Perfect for 1 person",
            "metadata": {
              "price": 12.00,
              "presentationId": "pres:small",
              "size": "small"
            }
          },
          {
            "id": "pres:medium",
            "title": "Medium (12\")",
            "description": "Great for 2-3 people",
            "metadata": {
              "price": 15.00,
              "presentationId": "pres:medium",
              "size": "medium"
            },
            "selected": true
          },
          {
            "id": "pres:large",
            "title": "Large (16\")",
            "description": "Feeds 4-5 people",
            "metadata": {
              "price": 20.00,
              "presentationId": "pres:large",
              "size": "large"
            }
          }
        ]
      },
      {
        "type": "Footer",
        "label": "Next: Add Extras →",
        "on-click-action": {
          "name": "navigate",
          "next": {
            "name": "MODIFIERS_SELECTION"
          }
        }
      }
    ]
  }
}
```

#### Visual Layout
```
┌────────────────────────────────────┐
│ Choose Your Size                   │
│ Pizza Margherita                   │
├────────────────────────────────────┤
│                                    │
│     [Product Image - 16:9]         │
│                                    │
├────────────────────────────────────┤
│ Select Size                        │
│                                    │
│ ○ Small (8")          $12.00      │
│   Perfect for 1 person             │
│                                    │
│ ● Medium (12")        $15.00      │
│   Great for 2-3 people      ✓     │
│                                    │
│ ○ Large (16")         $20.00      │
│   Feeds 4-5 people                 │
│                                    │
├────────────────────────────────────┤
│        [Next: Add Extras →]        │
└────────────────────────────────────┘
```

### Screen 2: Modifiers Selection

#### Multi-Select Modifiers
```json
{
  "screen": "MODIFIERS_SELECTION",
  "title": "Customize Your Pizza",
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "Extra Toppings"
      },
      {
        "type": "TextCaption",
        "text": "Select up to 5 toppings"
      },
      {
        "type": "CheckboxGroup",
        "name": "toppings",
        "max-selected": 5,
        "data-source": [
          {
            "id": "mod:cheese",
            "label": "Extra Cheese",
            "description": "Double mozzarella",
            "metadata": {
              "price": 2.00,
              "modifierId": "mod:cheese"
            }
          },
          {
            "id": "mod:mushrooms",
            "label": "Mushrooms",
            "metadata": {
              "price": 1.50,
              "modifierId": "mod:mushrooms"
            }
          },
          {
            "id": "mod:pepperoni",
            "label": "Pepperoni",
            "metadata": {
              "price": 2.50,
              "modifierId": "mod:pepperoni"
            }
          },
          {
            "id": "mod:olives",
            "label": "Black Olives",
            "metadata": {
              "price": 1.00,
              "modifierId": "mod:olives"
            }
          }
        ]
      },
      {
        "type": "TextHeading",
        "text": "Crust Type"
      },
      {
        "type": "RadioButtonsGroup",
        "name": "crust",
        "required": true,
        "data-source": [
          {
            "id": "crust:thin",
            "title": "Thin Crust",
            "metadata": {
              "price": 0.00,
              "modifierId": "crust:thin"
            },
            "selected": true
          },
          {
            "id": "crust:thick",
            "title": "Thick Crust",
            "metadata": {
              "price": 1.00,
              "modifierId": "crust:thick"
            }
          },
          {
            "id": "crust:stuffed",
            "title": "Stuffed Crust",
            "metadata": {
              "price": 3.00,
              "modifierId": "crust:stuffed"
            }
          }
        ]
      },
      {
        "type": "Footer",
        "label": "Next: Special Instructions →",
        "on-click-action": {
          "name": "navigate",
          "next": {
            "name": "SPECIAL_INSTRUCTIONS"
          }
        }
      }
    ]
  }
}
```

#### Visual Layout
```
┌────────────────────────────────────┐
│ Customize Your Pizza               │
├────────────────────────────────────┤
│ Extra Toppings                     │
│ Select up to 5 toppings            │
│                                    │
│ ☑ Extra Cheese         +$2.00     │
│   Double mozzarella                │
│                                    │
│ ☑ Mushrooms            +$1.50     │
│                                    │
│ ☐ Pepperoni            +$2.50     │
│                                    │
│ ☐ Black Olives         +$1.00     │
│                                    │
├────────────────────────────────────┤
│ Crust Type                         │
│                                    │
│ ● Thin Crust           Included    │
│                                    │
│ ○ Thick Crust          +$1.00     │
│                                    │
│ ○ Stuffed Crust        +$3.00     │
│                                    │
├────────────────────────────────────┤
│   [Next: Special Instructions →]   │
└────────────────────────────────────┘
```

### Screen 3: Special Instructions

```json
{
  "screen": "SPECIAL_INSTRUCTIONS",
  "title": "Special Instructions",
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "Any special requests?"
      },
      {
        "type": "TextCaption",
        "text": "Optional - you can skip this step"
      },
      {
        "type": "TextArea",
        "name": "instructions",
        "label": "Special instructions",
        "placeholder": "E.g., Extra crispy, light sauce, cut into squares...",
        "max-length": 200,
        "required": false
      },
      {
        "type": "Footer",
        "label": "Review Order →",
        "on-click-action": {
          "name": "navigate",
          "next": {
            "name": "ORDER_SUMMARY"
          }
        }
      }
    ]
  }
}
```

### Screen 4: Order Summary

```json
{
  "screen": "ORDER_SUMMARY",
  "title": "Review Your Order",
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "EmbeddedLink",
        "text": "← Edit",
        "on-click-action": {
          "name": "navigate",
          "next": {
            "name": "SIZE_SELECTION"
          }
        }
      },
      {
        "type": "TextHeading",
        "text": "${product.name}"
      },
      {
        "type": "TextBody",
        "text": "Size: ${presentation.name}\n\nExtras:\n${modifiers.map(m => '• ' + m.name + ' (+$' + m.price + ')').join('\n')}\n\nSpecial Instructions:\n${instructions || 'None'}"
      },
      {
        "type": "Divider"
      },
      {
        "type": "TextSubheading",
        "text": "Price Breakdown"
      },
      {
        "type": "TextBody",
        "text": "Base Price:        $${presentation.price}\nExtras:            +$${modifiers.totalPrice}\n─────────────────────\nTotal:             $${order.total}"
      },
      {
        "type": "Footer",
        "label": "✓ Confirm Order - $${order.total}",
        "on-click-action": {
          "name": "complete",
          "payload": {
            "productId": "${product.id}",
            "presentationId": "${presentation.id}",
            "modifiers": "${modifiers}",
            "instructions": "${instructions}",
            "total": "${order.total}"
          }
        }
      }
    ]
  }
}
```

#### Visual Layout
```
┌────────────────────────────────────┐
│ Review Your Order          ← Edit  │
├────────────────────────────────────┤
│ Pizza Margherita                   │
│                                    │
│ Size: Medium (12")                 │
│                                    │
│ Extras:                            │
│ • Extra Cheese (+$2.00)           │
│ • Mushrooms (+$1.50)              │
│                                    │
│ Special Instructions:              │
│ Extra crispy                       │
│                                    │
├────────────────────────────────────┤
│ Price Breakdown                    │
│                                    │
│ Base Price:        $15.00         │
│ Extras:            +$3.50         │
│ ─────────────────────             │
│ Total:             $18.50         │
│                                    │
├────────────────────────────────────┤
│   [✓ Confirm Order - $18.50]       │
└────────────────────────────────────┘
```

---

## 🎯 **User Interaction Patterns**

### 1. **Product Discovery Flow**

```
User Journey Map:

1. Open Chat
   ↓
2. See Welcome Message + Category Buttons
   ↓
3. Tap Category (e.g., "🍕 Pizza")
   ↓
4. View Product List (catalog items)
   ↓
5. Tap Product Card
   ↓
6. WhatsApp Flow Opens (customization)
   ↓
7. Complete Flow Screens
   ↓
8. Confirm Order
   ↓
9. Return to Chat with Confirmation
```

### 2. **Quick Reorder Pattern**

```
User: "I want to order the same as last time"
Bot: "Found your last order:

      Pizza Margherita - Medium
      • Extra Cheese
      • Mushrooms
      Total: $18.50

      [Reorder This] [Customize First]"

If "Reorder This" → Skip flow, create order directly
If "Customize First" → Open flow with pre-filled selections
```

### 3. **Search & Filter Pattern**

```
User: "Do you have vegan options?"
Bot: "Yes! Here are our vegan options:

     🌱 Vegan Pizza
     🌱 Garden Salad
     🌱 Vegetable Pasta

     Tap any item to customize and order."
```

---

## 📊 **Dynamic Pricing Display**

### Real-Time Price Updates

```typescript
interface PriceCalculator {
  calculateTotal(selections: OrderSelections): PriceBreakdown;
}

interface OrderSelections {
  productId: string;
  presentationId: string;
  modifiers: SelectedModifier[];
  quantity: number;
}

interface SelectedModifier {
  modifierId: string;
  optionId: string;
  quantity: number;
  price: number;
}

interface PriceBreakdown {
  basePrice: number;
  modifiersPrice: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  currency: string;
}

class WhatsAppFlowPriceCalculator implements PriceCalculator {
  calculateTotal(selections: OrderSelections): PriceBreakdown {
    // Get presentation price
    const presentation = getPresentationById(selections.presentationId);
    const basePrice = presentation.amountWithDiscount || presentation.price;

    // Calculate modifiers total
    const modifiersPrice = selections.modifiers.reduce(
      (sum, mod) => sum + (mod.price * mod.quantity),
      0
    );

    // Calculate subtotal
    const subtotal = (basePrice + modifiersPrice) * selections.quantity;

    // Calculate tax (example: 10%)
    const tax = subtotal * 0.10;

    // Delivery fee (example: $5 flat fee)
    const deliveryFee = 5.00;

    // Total
    const total = subtotal + tax + deliveryFee;

    return {
      basePrice,
      modifiersPrice,
      subtotal,
      tax,
      deliveryFee,
      total,
      currency: 'USD'
    };
  }
}

// Usage in flow
const priceBreakdown = calculator.calculateTotal({
  productId: 'prod:123',
  presentationId: 'pres:medium',
  modifiers: [
    { modifierId: 'mod:cheese', optionId: 'opt:1', quantity: 1, price: 2.00 },
    { modifierId: 'mod:mushrooms', optionId: 'opt:2', quantity: 1, price: 1.50 }
  ],
  quantity: 1
});

// Display in flow:
// Base Price:     $15.00
// Extras:         +$3.50
// ─────────────────────
// Subtotal:       $18.50
// Tax (10%):      +$1.85
// Delivery:       +$5.00
// ─────────────────────
// Total:          $25.35
```

---

## 🔔 **Notifications & Feedback**

### Order Confirmation Message

```typescript
interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  estimatedTime: number; // minutes
  status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
}

function formatOrderConfirmation(order: OrderConfirmation): string {
  return `
✅ Order Confirmed!

Order #${order.orderNumber}

${order.items.map(item =>
  `• ${item.name} - ${item.presentation}\n  ${item.modifiers.join(', ')}`
).join('\n\n')}

Total: $${order.total.toFixed(2)}

⏱️ Estimated delivery: ${order.estimatedTime} minutes

Track your order: /order ${order.orderId}
  `.trim();
}

// Example output:
// ✅ Order Confirmed!
//
// Order #1234
//
// • Pizza Margherita - Medium
//   Extra Cheese, Mushrooms
//
// Total: $18.50
//
// ⏱️ Estimated delivery: 30 minutes
//
// Track your order: /order abc123
```

### Order Status Updates

```typescript
const statusMessages = {
  confirmed: {
    emoji: '✅',
    title: 'Order Confirmed',
    message: 'We received your order and are preparing it now.'
  },
  preparing: {
    emoji: '👨‍🍳',
    title: 'Order is Being Prepared',
    message: 'Our chef is working on your delicious meal!'
  },
  out_for_delivery: {
    emoji: '🚗',
    title: 'Out for Delivery',
    message: 'Your order is on the way! Driver: ${driverName}'
  },
  delivered: {
    emoji: '🎉',
    title: 'Order Delivered',
    message: 'Enjoy your meal! Please rate your experience.'
  }
};

// Send update
function sendStatusUpdate(orderId: string, status: OrderStatus) {
  const msg = statusMessages[status];
  return `
${msg.emoji} ${msg.title}

Order #${orderId}
${msg.message}
  `.trim();
}
```

---

## ♿ **Accessibility Considerations**

### 1. **Text Alternatives**

```typescript
// Always provide alt text for images
{
  "type": "Image",
  "src": "https://example.com/pizza.jpg",
  "alt": "Pizza Margherita with fresh mozzarella, tomatoes, and basil on a wood-fired crust"
}
```

### 2. **Clear Labels**

```typescript
// Use descriptive labels, not just icons
{
  "label": "Add to Cart",  // ✅ Good
  "label": "→",            // ❌ Bad
}
```

### 3. **Error Messages**

```typescript
// Provide clear, actionable error messages
{
  "error": "Please select a size before continuing.",  // ✅ Good
  "error": "Invalid selection.",                        // ❌ Bad
}
```

### 4. **Color & Contrast**

```typescript
// Ensure sufficient contrast ratios (WCAG AA: 4.5:1 minimum)
const colors = {
  primary: '#1976D2',      // Blue
  primaryText: '#FFFFFF',  // White - Contrast ratio: 7.32:1 ✅

  success: '#2E7D32',      // Green
  successText: '#FFFFFF',  // White - Contrast ratio: 6.89:1 ✅

  error: '#D32F2F',        // Red
  errorText: '#FFFFFF',    // White - Contrast ratio: 6.93:1 ✅
};
```

---

## 📱 **Platform-Specific Considerations**

### WhatsApp Flow Limitations

#### Character Limits
```typescript
const limits = {
  textHeading: 80,
  textSubheading: 80,
  textBody: 4096,
  textCaption: 4096,
  buttonLabel: 35,
  radioButtonTitle: 30,
  radioButtonDescription: 300,
  checkboxLabel: 30,
  textInputPlaceholder: 100,
  textAreaMaxLength: 1000
};
```

#### Component Restrictions
```typescript
// WhatsApp Flow does NOT support:
// - Custom fonts
// - Custom colors (uses system theme)
// - Animations
// - Video content in forms
// - File uploads
// - Real-time validation

// WhatsApp Flow DOES support:
// - Images (JPEG, PNG)
// - Text formatting (bold, italic via markdown)
// - Radio buttons
// - Checkboxes
// - Text inputs
// - Date pickers
// - Dropdowns
// - Navigation between screens
```

### Meta Catalog Limitations

```typescript
// Meta Catalog does NOT support:
// - Product variants (must create separate products)
// - Custom fields (only predefined fields)
// - Dynamic pricing
// - Stock levels < 1
// - Products without images (must provide placeholder)

// Meta Catalog field limits:
const catalogLimits = {
  productName: 200,
  description: 9000,
  imageUrl: 2048, // URL length
  maxImages: 20,
  category: 750,
  brand: 100
};
```

---

## 🧪 **Testing Checklist**

### User Flow Testing

```markdown
## Size Selection Testing
- [ ] All size options display correctly
- [ ] Prices show in correct format
- [ ] Default selection is pre-selected
- [ ] Radio buttons are mutually exclusive
- [ ] "Next" button is always enabled (size is required)
- [ ] Selected size persists when navigating back

## Modifier Testing
- [ ] Multi-select modifiers allow multiple selections
- [ ] Single-select modifiers allow only one selection
- [ ] Max quantity limits are enforced
- [ ] Prices update dynamically
- [ ] Modifier prices show with "+" prefix (+$2.00)
- [ ] "Skip" option works for optional modifiers

## Price Calculation Testing
- [ ] Base price displays correctly
- [ ] Modifier prices add correctly
- [ ] Quantity multiplies correctly
- [ ] Tax calculation is accurate
- [ ] Delivery fee applies correctly
- [ ] Total matches sum of all components
- [ ] Currency symbol displays correctly
- [ ] Decimal places are consistent (2 digits)

## Order Summary Testing
- [ ] All selections are visible
- [ ] Price breakdown is clear
- [ ] Edit button navigates to correct screen
- [ ] Special instructions display correctly
- [ ] Confirm button shows total price
- [ ] Order data is captured correctly

## Error Handling Testing
- [ ] Network errors show user-friendly message
- [ ] Out-of-stock items are clearly indicated
- [ ] Invalid selections are prevented
- [ ] Required fields enforce validation
- [ ] Timeout errors recover gracefully
```

### Cross-Device Testing

```markdown
## Mobile Devices
- [ ] iOS (iPhone 12+, iOS 15+)
- [ ] Android (Samsung, Pixel, etc., Android 10+)
- [ ] Small screens (iPhone SE)
- [ ] Large screens (iPhone Pro Max)

## WhatsApp Versions
- [ ] Latest WhatsApp version
- [ ] WhatsApp Business app
- [ ] WhatsApp Web (desktop)

## Network Conditions
- [ ] 4G connection
- [ ] 3G connection
- [ ] Poor signal
- [ ] Offline → Online transition
```

---

## 📈 **Analytics & Tracking**

### Key Metrics to Track

```typescript
interface FlowAnalytics {
  // Engagement metrics
  flowStarted: number;
  flowCompleted: number;
  flowAbandoned: number;
  completionRate: number; // completed / started

  // Screen-level metrics
  screenViews: Record<string, number>;
  screenDropoff: Record<string, number>;
  avgTimePerScreen: Record<string, number>; // seconds

  // Selection metrics
  popularSizes: Record<string, number>;
  popularModifiers: Record<string, number>;
  avgModifiersPerOrder: number;
  avgOrderValue: number;

  // Error metrics
  errorsByType: Record<string, number>;
  errorsByScreen: Record<string, number>;
}

// Track flow events
function trackFlowEvent(event: FlowEvent) {
  // Send to analytics service
  analytics.track({
    event: event.type,
    properties: {
      flowId: event.flowId,
      screenId: event.screenId,
      productId: event.productId,
      timestamp: new Date(),
      userId: event.userId,
      sessionId: event.sessionId
    }
  });
}

// Example events to track
trackFlowEvent({ type: 'flow_started', flowId: 'pizza-customization', productId: 'prod:123' });
trackFlowEvent({ type: 'screen_viewed', screenId: 'SIZE_SELECTION' });
trackFlowEvent({ type: 'size_selected', sizeId: 'medium' });
trackFlowEvent({ type: 'modifier_added', modifierId: 'mod:cheese' });
trackFlowEvent({ type: 'flow_completed', total: 18.50 });
trackFlowEvent({ type: 'flow_abandoned', screenId: 'MODIFIERS_SELECTION' });
```

---

## 🎨 **Visual Design Tokens**

### Typography

```typescript
const typography = {
  heading1: {
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '32px',
    letterSpacing: '-0.5px'
  },
  heading2: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '28px'
  },
  body: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '24px'
  },
  caption: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '20px',
    color: '#6B7280'
  },
  price: {
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '24px',
    color: '#059669'
  }
};
```

### Spacing

```typescript
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

// Usage
const productCard = {
  padding: spacing.md,          // 16px
  gap: spacing.sm,              // 8px between elements
  imageMarginBottom: spacing.md // 16px
};
```

### Colors (Meta Theme Compatible)

```typescript
// Note: WhatsApp Flows use system colors, these are for catalog images/descriptions
const colors = {
  // Brand colors
  primary: '#25D366',      // WhatsApp green
  primaryDark: '#128C7E',  // WhatsApp dark green

  // Semantic colors
  success: '#059669',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',

  // Neutral colors
  black: '#000000',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  white: '#FFFFFF',

  // Background colors
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#ECE5DD', // WhatsApp chat background
};
```

---

## 🚀 **Implementation Priorities**

### Phase 1: Core Flow (Week 1-2)
```markdown
Priority 1 - Must Have:
- [ ] Size selection screen
- [ ] Basic modifier selection (checkboxes/radio)
- [ ] Order summary screen
- [ ] Price calculation
- [ ] Order confirmation

Priority 2 - Should Have:
- [ ] Product images in flow
- [ ] Price breakdown display
- [ ] Edit functionality from summary

Priority 3 - Nice to Have:
- [ ] Special instructions field
- [ ] Popular items badges
- [ ] Estimated delivery time
```

### Phase 2: Enhanced UX (Week 3)
```markdown
- [ ] Category icons and organization
- [ ] Product badges (Popular, New, etc.)
- [ ] Quick reorder functionality
- [ ] Search and filter
- [ ] Out-of-stock indicators
```

### Phase 3: Advanced Features (Week 4+)
```markdown
- [ ] Saved preferences
- [ ] Favorites/wishlists
- [ ] Nutritional information
- [ ] Allergen warnings
- [ ] Reviews and ratings
- [ ] Combo deals and discounts
```

---

## 📞 **Support & Error Scenarios**

### Common Error Scenarios

```typescript
const errorScenarios = {
  'product_unavailable': {
    message: '😔 Sorry, this item is currently unavailable. Would you like to see similar items?',
    actions: ['Show Alternatives', 'Back to Menu']
  },

  'modifier_out_of_stock': {
    message: '⚠️ ${modifierName} is currently out of stock. Continue without it?',
    actions: ['Continue', 'Choose Different Item']
  },

  'flow_timeout': {
    message: '⏱️ Your session expired. Would you like to start over?',
    actions: ['Start Over', 'Cancel']
  },

  'payment_failed': {
    message: '❌ Payment failed. Please try again or use a different payment method.',
    actions: ['Retry Payment', 'Change Method', 'Contact Support']
  },

  'delivery_unavailable': {
    message: '📍 Sorry, we don\'t deliver to your area yet. Try pickup instead?',
    actions: ['Switch to Pickup', 'Enter New Address']
  }
};
```

### Customer Support Quick Actions

```markdown
Common User Questions:

"How do I change my order?"
→ "If your order hasn't started cooking yet, I can help you modify it. What would you like to change?"

"Where is my order?"
→ "Let me check... Your order #${orderId} is ${status}. ${estimatedTime}"

"I have dietary restrictions"
→ "I can help you find options! What dietary needs do you have? (vegan, gluten-free, etc.)"

"Do you have deals?"
→ "Yes! Current promotions: [List active deals]"
```

---

## ✅ **Pre-Launch Checklist**

### Technical Readiness
```markdown
- [ ] All API endpoints tested and working
- [ ] WhatsApp Flow JSON validated
- [ ] Meta Catalog synced correctly
- [ ] Database indexes optimized
- [ ] Error handling implemented
- [ ] Logging and monitoring set up
- [ ] Load testing completed
- [ ] Security audit passed
```

### Content Readiness
```markdown
- [ ] All product images uploaded (min 800x600px)
- [ ] Product descriptions written (clear, concise)
- [ ] Category icons selected
- [ ] Price ranges calculated correctly
- [ ] Modifier options defined
- [ ] Badge criteria established
- [ ] Special instructions template created
```

### UX Readiness
```markdown
- [ ] User flows tested on real devices
- [ ] Typography and spacing verified
- [ ] Accessibility requirements met
- [ ] Error messages user-friendly
- [ ] Loading states implemented
- [ ] Success confirmations clear
- [ ] Help/support easily accessible
```

### Business Readiness
```markdown
- [ ] Staff trained on new system
- [ ] Order fulfillment process updated
- [ ] Kitchen display system integrated
- [ ] Customer support scripts prepared
- [ ] FAQ documentation created
- [ ] Rollback plan established
```

---

## 🎯 **Success Metrics**

### Define Success Criteria

```typescript
interface SuccessMetrics {
  // Conversion metrics
  catalogViewToFlowStart: number;     // Target: >60%
  flowStartToCompletion: number;      // Target: >80%
  overallConversionRate: number;      // Target: >50%

  // Engagement metrics
  avgItemsPerOrder: number;           // Target: 2.5+
  avgOrderValue: number;              // Target: $25+
  repeatCustomerRate: number;         // Target: >40%

  // Performance metrics
  avgFlowCompletionTime: number;      // Target: <2 minutes
  errorRate: number;                  // Target: <2%
  flowAbandonmentRate: number;        // Target: <20%

  // Customer satisfaction
  orderAccuracy: number;              // Target: >95%
  customerRating: number;             // Target: 4.5+/5
  supportTicketsPerOrder: number;     // Target: <0.1
}
```

---

## 📚 **Additional Resources**

### WhatsApp Flow Documentation
- [WhatsApp Flows Overview](https://developers.facebook.com/docs/whatsapp/flows)
- [Flow JSON Schema](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson)
- [Flow Components](https://developers.facebook.com/docs/whatsapp/flows/reference/components)
- [Flow Best Practices](https://developers.facebook.com/docs/whatsapp/flows/guides/best-practices)

### Meta Catalog Documentation
- [Commerce Manager](https://business.facebook.com/commerce)
- [Catalog API](https://developers.facebook.com/docs/marketing-api/catalog)
- [Product Feed Specifications](https://developers.facebook.com/docs/marketing-api/catalog/reference)

### Design Resources
- [Material Design Guidelines](https://material.io/design)
- [WhatsApp Design Resources](https://www.whatsapp.com/design)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**This UX/UI guide provides the foundation for implementing a user-friendly, accessible, and conversion-optimized category-based catalog with WhatsApp Flow integration.**

**Next Steps**: Review this guide with your design and development teams, then proceed with Phase 1 implementation.
