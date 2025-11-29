# Category-Based Catalog + WhatsApp Flow Strategy

## 🎯 **Recommended Approach**

Instead of syncing every product variant to Meta Catalog, use a **category-based catalog** where:
- **Meta Catalog** = Product discovery (browsing by category)
- **WhatsApp Flows** = Product customization (size, modifiers, options)

This approach is:
- ✅ Simpler to manage
- ✅ Better UX for customers
- ✅ More scalable
- ✅ Aligned with WhatsApp Commerce best practices

---

## 📊 **Current vs Recommended Architecture**

### ❌ Current: Product-Only Sync
```
Meta Catalog:
├─ Pizza Margherita ($15)
├─ BBQ Chicken ($18)
├─ Coke ($2)
└─ Sprite ($2)

Problems:
- No category organization
- No size selection
- Flat list (hard to browse)
```

### ✅ Recommended: Category-Based with Flows

```
Meta Catalog (Categories as Collections):
├─ 🍕 Pizza
│   ├─ Margherita ($12-20)
│   ├─ BBQ Chicken ($15-23)
│   └─ Pepperoni ($14-22)
├─ 🍖 BBQ
│   ├─ Ribs ($18-30)
│   └─ Wings ($12-18)
└─ 🥤 Drinks
    ├─ Coke ($2-5)
    └─ Sprite ($2-5)

WhatsApp Flow (triggered on product selection):
1. Select product → Opens customization flow
2. Choose size (Small/Medium/Large)
3. Add extras (Cheese, Toppings, etc.)
4. Review order with final price
5. Confirm & checkout
```

---

## 🏗️ **Implementation Strategy**

### 1. **Meta Catalog Structure**

#### Option A: Multiple Catalogs per Category (Recommended) ✅

Create separate catalog for each category:

```typescript
Business {
  fbCatalogIds: {
    "pizza": "694779509943361",
    "bbq": "694779509943362",
    "drinks": "694779509943363"
  }
}
```

**Advantages**:
- ✅ Clean category separation
- ✅ Easy to browse in WhatsApp
- ✅ Independent sync/management
- ✅ Better performance

**WhatsApp Display**:
```
Customer sees:
📋 Browse our menu:
  🍕 Pizza (12 items)
  🍖 BBQ (8 items)
  🥤 Drinks (15 items)
```

#### Option B: Single Catalog with Category Field

Use one catalog with products tagged by category:

```typescript
Product {
  retailer_id: "PROD123",
  name: "Margherita",
  category: "Pizza",  // Used for filtering
  price: 1200
}
```

**Advantages**:
- ✅ Single catalog to manage
- ⚠️ Requires filtering in WhatsApp
- ⚠️ Harder to browse large menus

---

### 2. **Product Sync Logic**

#### Sync Strategy: Base Product Only

```typescript
// catalogSyncService.ts
private static mapProductToCatalogFormat(product: IProduct): CreateProductParams {
  // Get price range from presentations
  const presentations = await Presentation.find({
    productId: product._id,
    isActive: true
  });

  let displayPrice = product.basePrice;
  let priceNote = '';

  if (presentations.length > 0) {
    const prices = presentations.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    displayPrice = minPrice;  // Show lowest price
    priceNote = maxPrice > minPrice
      ? ` ($${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})`
      : '';
  }

  return {
    retailer_id: product.rId,
    name: product.name + priceNote,  // "Pizza Margherita ($12 - $20)"
    description: `${product.description}\n\n📏 Available in multiple sizes\n🎨 Customization available`,
    price: this.convertPriceToCents(displayPrice),  // Lowest price
    currency: 'PEN',
    category: product.category,  // "Pizza", "BBQ", "Drinks"
    image_url: product.imageUrl || placeholder,
    // ... other fields
  };
}
```

**Result in WhatsApp Catalog**:
```
🍕 Pizza Margherita ($12 - $20)
   Available in multiple sizes
   Customization available

   [View Details] → Opens WhatsApp Flow
```

---

### 3. **WhatsApp Flow Integration**

When customer selects a product from catalog → Trigger WhatsApp Flow

#### Flow Structure:

```json
{
  "version": "3.0",
  "screens": [
    {
      "id": "SIZE_SELECTION",
      "title": "Choose Size",
      "data": {
        "product_id": "PROD123",
        "product_name": "Pizza Margherita"
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "RadioButtonsGroup",
            "label": "Select Size",
            "name": "size",
            "data-source": [
              { "id": "small", "title": "Small (8\")", "metadata": "price:12.00" },
              { "id": "medium", "title": "Medium (12\")", "metadata": "price:15.00" },
              { "id": "large", "title": "Large (16\")", "metadata": "price:20.00" }
            ],
            "required": true
          }
        ]
      }
    },
    {
      "id": "EXTRAS_SELECTION",
      "title": "Add Extras",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "CheckboxGroup",
            "label": "Toppings",
            "name": "toppings",
            "data-source": [
              { "id": "cheese", "title": "Extra Cheese", "metadata": "price:2.00" },
              { "id": "mushrooms", "title": "Mushrooms", "metadata": "price:1.50" },
              { "id": "pepperoni", "title": "Pepperoni", "metadata": "price:2.50" }
            ]
          }
        ]
      }
    },
    {
      "id": "ORDER_SUMMARY",
      "title": "Review Order",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextBody",
            "text": "${product_name} - ${size}\nExtras: ${toppings}\n\nTotal: $${total_price}"
          },
          {
            "type": "Footer",
            "label": "Confirm Order",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "product_id": "${product_id}",
                "size": "${size}",
                "extras": "${toppings}",
                "total": "${total_price}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

#### Flow Endpoints:

```typescript
// New endpoints needed
POST /api/v1/whatsapp/flow/product-details/:productId
  → Returns presentations & modifiers for flow

POST /api/v1/whatsapp/flow/calculate-price
  → Calculates total based on selections

POST /api/v1/whatsapp/flow/submit-order
  → Creates order from flow data
```

---

## 📋 **Database Schema Updates**

### Update Business Model

```typescript
// src/models/Business.ts
export interface IBusiness {
  // ... existing fields

  // Old (single catalog)
  fbCatalogIds?: string[];

  // New (category-based catalogs)
  fbCatalogMapping?: {
    [categoryId: string]: string;  // categoryId → catalogId
  };

  // Example:
  // fbCatalogMapping: {
  //   "pizza": "694779509943361",
  //   "bbq": "694779509943362",
  //   "drinks": "694779509943363"
  // }
}
```

### Catalog Sync Logic

```typescript
// Sync by category
async syncCategoryToCatalog(categoryId: string, subDomain: string) {
  const category = await Category.findOne({ rId: categoryId });
  const catalogId = await this.getCatalogIdForCategory(categoryId, subDomain);

  // Get all products in this category
  const products = await Product.find({
    categoryId: categoryId,
    subDomain: subDomain,
    isActive: true
  });

  // Sync to category-specific catalog
  for (const product of products) {
    await this.syncProductToCatalog(product, catalogId);
  }
}
```

---

## 🎨 **User Experience Flow**

### Customer Journey:

```
1. Customer opens WhatsApp Business chat
   Bot: "👋 Welcome to LeMenu! Browse our menu:"

2. Show category buttons:
   [🍕 Pizza] [🍖 BBQ] [🥤 Drinks] [🍰 Desserts]

3. Customer taps "🍕 Pizza"
   → Opens Pizza catalog (12 items)

4. Customer selects "Pizza Margherita"
   → Opens WhatsApp Flow for customization

5. Flow Screen 1: Size Selection
   ○ Small (8") - $12.00
   ○ Medium (12") - $15.00  ← Selected
   ○ Large (16") - $20.00

6. Flow Screen 2: Add Extras
   ☑ Extra Cheese (+$2.00)
   ☑ Mushrooms (+$1.50)
   ☐ Pepperoni (+$2.50)

7. Flow Screen 3: Review
   Pizza Margherita - Medium
   • Extra Cheese
   • Mushrooms

   Total: $18.50

   [Confirm Order]

8. Order confirmed!
   Bot: "✅ Order confirmed! Estimated delivery: 30 mins"
```

---

## 🔄 **Migration Plan**

### Phase 1: Category Catalogs Setup (Week 1)

**Tasks**:
- [ ] Update Business model with `fbCatalogMapping`
- [ ] Create catalogs for each category via Meta API
- [ ] Store catalog IDs in business config
- [ ] Test category-catalog mapping

**Code Changes**:
```typescript
// New service method
async createCategoryBasedCatalogs(subDomain: string) {
  const categories = await Category.find({
    subDomain,
    isActive: true
  });

  const business = await Business.findOne({ subDomain });
  business.fbCatalogMapping = {};

  for (const category of categories) {
    const catalog = await MetaCatalogService.createCatalog({
      name: `${business.name} - ${category.name}`,
      vertical: 'commerce'
    }, subDomain);

    business.fbCatalogMapping[category.rId] = catalog.id;
  }

  await business.save();
}
```

### Phase 2: Update Sync Logic (Week 2)

**Tasks**:
- [ ] Update `mapProductToCatalogFormat()` to include price ranges
- [ ] Update `syncProductToCatalog()` to use category catalog
- [ ] Add presentation price range calculation
- [ ] Update product descriptions with customization notes

**Code Changes**:
```typescript
// catalogSyncService.ts
async syncProductToCatalog(product: IProduct, catalogId?: string) {
  // Get category-specific catalog
  const targetCatalogId = catalogId ||
    await this.getCatalogIdForCategory(product.categoryId, product.subDomain);

  // Get presentations for price range
  const presentations = await Presentation.find({
    productId: product._id,
    isActive: true
  });

  // Map with price range
  const catalogProduct = await this.mapProductWithPriceRange(
    product,
    presentations
  );

  // Sync to category catalog
  await MetaCatalogService.createProduct(targetCatalogId, catalogProduct);
}
```

### Phase 3: WhatsApp Flow Integration (Week 3)

**Tasks**:
- [ ] Design WhatsApp Flow templates
- [ ] Create flow endpoints (product details, price calc)
- [ ] Integrate flow with order system
- [ ] Test end-to-end ordering flow

**New Endpoints**:
```typescript
// src/controllers/whatsappFlowController.ts
export async function getProductFlowData(req, res) {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  const presentations = await Presentation.find({ productId });
  const modifiers = await Modifier.find({
    rId: { $in: product.modifiers }
  });

  res.json({
    product: {
      id: product.rId,
      name: product.name,
      image: product.imageUrl
    },
    sizes: presentations.map(p => ({
      id: p.rId,
      name: p.name,
      price: p.price
    })),
    extras: modifiers.map(m => ({
      id: m.rId,
      name: m.name,
      options: m.options
    }))
  });
}
```

### Phase 4: Testing & Rollout (Week 4)

**Tasks**:
- [ ] Test catalog browsing
- [ ] Test flow customization
- [ ] Test order creation
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Gradual rollout

---

## 📊 **Comparison: Current vs Recommended**

| Aspect | Current (Product Sync) | Recommended (Category + Flow) |
|--------|------------------------|-------------------------------|
| **Catalog Size** | 100 products = 100 items | 100 products = 100 items (same) |
| **With Presentations** | 100 products × 3 sizes = 300 items | 100 products = 100 items ✅ |
| **Organization** | Flat list ❌ | Category-based ✅ |
| **Customization** | Not possible ❌ | WhatsApp Flow ✅ |
| **Price Display** | Single price ⚠️ | Price range ✅ |
| **Sync Complexity** | Medium | Low ✅ |
| **Maintenance** | High (300 items) | Low (100 items) ✅ |
| **Customer UX** | Browse only | Browse + Customize ✅ |
| **Scalability** | Poor (grows exponentially) | Excellent ✅ |

---

## 💡 **Key Benefits**

### 1. **Simpler Catalog Management**
- ❌ Before: 300 catalog items (100 products × 3 presentations)
- ✅ After: 100 catalog items (base products only)
- **70% reduction in catalog complexity**

### 2. **Better Customer Experience**
```
Before:
- "Pizza Margherita Small" $12
- "Pizza Margherita Medium" $15
- "Pizza Margherita Large" $20
→ Confusing, cluttered

After:
- "Pizza Margherita ($12-$20)"
→ Tap to customize size & toppings
→ Clean, intuitive
```

### 3. **Flexible Customization**
- WhatsApp Flows support:
  - Radio buttons (single choice)
  - Checkboxes (multiple choice)
  - Dropdowns (many options)
  - Text input (special instructions)
  - Images (visual selection)

### 4. **Dynamic Pricing**
```typescript
// Calculate price in real-time based on selections
const basePrice = presentation.price;
const extrasPrice = selectedExtras.reduce((sum, e) => sum + e.price, 0);
const total = basePrice + extrasPrice;
```

### 5. **Scalability**
- Adding new products: Just sync base product
- Adding new presentations: No catalog update needed
- Adding new modifiers: Update flow only
- Adding new categories: Create new catalog

---

## 🚀 **Quick Start Implementation**

### Step 1: Test with One Category

```bash
# Create a "Pizza" catalog
POST /api/v1/catalog/create
{
  "name": "My Restaurant - Pizza",
  "subDomain": "my-restaurant",
  "categoryId": "cat:pizza"
}

# Sync all pizza products
POST /api/v1/products/sync-to-catalog/my-restaurant/LOC123
{
  "categoryId": "cat:pizza",
  "catalogId": "694779509943361"
}
```

### Step 2: Create Simple Flow

```javascript
// Minimal flow for size selection
const sizeSelectionFlow = {
  screens: [{
    id: "SIZE",
    title: "Choose Size",
    layout: {
      type: "SingleColumnLayout",
      children: [{
        type: "RadioButtonsGroup",
        name: "size",
        data-source: presentations.map(p => ({
          id: p.rId,
          title: `${p.name} - $${p.price}`,
          metadata: `price:${p.price}`
        }))
      }]
    }
  }]
};
```

### Step 3: Test End-to-End

1. Browse catalog → Select "Pizza"
2. View products → Select "Margherita"
3. Flow opens → Choose "Medium"
4. Confirm → Order created

---

## 🎯 **Recommendation Summary**

**DO THIS** ✅:
1. Organize catalog by categories
2. Sync base products with price ranges
3. Use WhatsApp Flows for customization
4. Keep presentations & modifiers in database only

**DON'T DO THIS** ❌:
1. ~~Sync every presentation as catalog item~~
2. ~~Create 3-5x more catalog items~~
3. ~~Try to encode modifiers in product names~~
4. ~~Manage hundreds of catalog variants~~

---

## 📞 **Next Steps**

1. **Approve this strategy** ✅
2. **Choose implementation approach**:
   - Option A: Multiple catalogs (one per category) - **Recommended**
   - Option B: Single catalog with category filtering
3. **Start with Phase 1**: Create category catalogs
4. **Build simple flow**: Size selection only
5. **Test with real customers**
6. **Iterate and improve**

---

**This approach gives you**:
- ✅ Clean, browsable catalog
- ✅ Full customization via flows
- ✅ Easy maintenance
- ✅ Great UX
- ✅ Scalable architecture

**Ready to implement?** 🚀
