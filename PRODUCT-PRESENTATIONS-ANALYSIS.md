# Product Presentations & Modifiers vs Meta Catalog - Analysis

## Current Architecture

### 1. **Product Data Model**

```typescript
Product {
  rId: string                    // Unique product ID
  name: string
  basePrice: number              // Base price of product
  presentations: string[]        // Array of Presentation IDs
  modifiers: IModifier[]         // Embedded modifiers
  categoryId: string
  imageUrl?: string
  isActive: boolean
  isAvailable: boolean
  isOutOfStock: boolean
}
```

### 2. **Presentation (Product Variants)**

**Purpose**: Different versions of the same product (sizes, variations)

```typescript
Presentation {
  rId: string                    // Unique presentation ID
  productId: string              // Reference to parent Product
  name: string                   // "Small", "Medium", "Large"
  price: number                  // Variant-specific price
  stock: number
  isAvailable: boolean
  isAvailableForDelivery: boolean
  imageUrl?: string

  // Discount features
  amountWithDiscount: number
  discountValue?: number
  discountType?: 0 | 1          // 0=percentage, 1=fixed
}
```

**Example**: Pizza product with presentations
- Product: "Pizza Margherita" (basePrice: 15.00)
  - Presentation 1: "Small (8\")" (price: 12.00)
  - Presentation 2: "Medium (12\")" (price: 15.00)
  - Presentation 3: "Large (16\")" (price: 20.00)

### 3. **Modifiers (Add-ons/Options)**

**Purpose**: Additional customizations that can be added to products

```typescript
Modifier {
  rId: string
  name: string                   // "Extra Toppings", "Sauce"
  isMultiple: boolean            // Can select multiple?
  minQuantity: number
  maxQuantity: number
  options: [{
    optionId: string
    name: string                 // "Extra Cheese", "Mushrooms"
    price: number                // Additional cost
    stock?: number
    isActive: boolean
  }]
}
```

**Example**: Pizza modifiers
- Modifier 1: "Extra Toppings" (isMultiple: true, max: 5)
  - Option: "Extra Cheese" (+2.00)
  - Option: "Mushrooms" (+1.50)
  - Option: "Pepperoni" (+2.50)
- Modifier 2: "Crust Type" (isMultiple: false, max: 1)
  - Option: "Thin Crust" (+0.00)
  - Option: "Thick Crust" (+1.00)

## Meta/Facebook Catalog Integration

### Current Catalog Sync Behavior

The `catalogSyncService.ts` currently:

```typescript
mapProductToCatalogFormat(product: IProduct): CreateProductParams {
  return {
    retailer_id: product.rId,
    name: product.name,
    price: Math.round(product.basePrice * 100), // Cents
    currency: 'PEN',
    availability: 'in stock',
    image_url: product.imageUrl || placeholder,
    category: product.category,
    brand: 'LeMenu'
  }
}
```

### ⚠️ **Critical Gap: Presentations are NOT Synced**

**Current Issue**:
- Only the base product is synced to Meta Catalog
- Presentations (product variants) are **ignored**
- Meta Catalog shows only one price (basePrice)
- Customers see "Pizza Margherita $15" but not the Small/Medium/Large options

## Facebook Catalog Product Variants

Facebook Catalog supports variants using **Product Groups**:

### Option 1: Separate Products (Current Approach) ❌

**Current behavior**:
```json
{
  "retailer_id": "PROD123",
  "name": "Pizza Margherita",
  "price": 1500  // Only base price
}
```

**Problems**:
- ❌ No size/variant selection in WhatsApp
- ❌ Customer confusion (which size is $15?)
- ❌ Lost sales (can't order specific sizes)

### Option 2: Product Variants (Recommended) ✅

**What Facebook Catalog Supports**:
```json
// Parent product group
{
  "retailer_id": "PROD123",
  "name": "Pizza Margherita",
  "item_group_id": "PIZZA_MARG",  // Groups variants
  "price": 1200  // Lowest variant price
}

// Variant 1
{
  "retailer_id": "PROD123-SMALL",
  "name": "Pizza Margherita - Small",
  "item_group_id": "PIZZA_MARG",
  "price": 1200,
  "size": "Small"
}

// Variant 2
{
  "retailer_id": "PROD123-MEDIUM",
  "name": "Pizza Margherita - Medium",
  "item_group_id": "PIZZA_MARG",
  "price": 1500,
  "size": "Medium"
}

// Variant 3
{
  "retailer_id": "PROD123-LARGE",
  "name": "Pizza Margherita - Large",
  "item_group_id": "PIZZA_MARG",
  "price": 2000,
  "size": "Large"
}
```

## Modifiers vs Catalog

### ⚠️ **Facebook Catalog Does NOT Support Custom Modifiers**

Facebook Catalog product fields are **fixed**:
- name, description, price, image_url, category, brand
- **NO support for**: add-ons, toppings, customizations, modifiers

### Current Workaround Options:

#### Option A: Ignore Modifiers (Current) ❌
- Modifiers are **not synced** to catalog
- Order processing handles modifiers separately
- **Problem**: Prices in catalog don't reflect actual order totals

#### Option B: Sync Each Modifier Combination as Product ❌
- Create catalog product for EVERY combination
- Example: Pizza with 5 topping options = 32 combinations
- **Problem**: Catalog explosion, unmanageable

#### Option C: Show Base Price Only (Recommended) ✅
- Sync products with base prices
- Handle modifiers in order flow (not in catalog)
- Display note: "Customization available"
- **Advantage**: Clean catalog, flexible ordering

## Recommendations

### 1. **Sync Presentations as Product Variants** (High Priority) 🔴

**Current State**: ❌ NOT IMPLEMENTED
**Impact**: High - Customer experience, sales

**Implementation**:

```typescript
// In catalogSyncService.ts
async syncProductWithPresentations(product: IProduct) {
  // Get all presentations for this product
  const presentations = await Presentation.find({
    productId: product._id,
    isActive: true
  });

  if (presentations.length > 0) {
    // Sync each presentation as a variant
    for (const presentation of presentations) {
      await MetaCatalogService.createProduct(catalogId, {
        retailer_id: presentation.rId,  // Use presentation rId
        name: `${product.name} - ${presentation.name}`,
        price: Math.round(presentation.price * 100),
        item_group_id: product.rId,  // Group by product
        size: presentation.name,      // Variant attribute
        image_url: presentation.imageUrl || product.imageUrl || placeholder,
        // ... other fields
      });
    }
  } else {
    // No presentations - sync as single product
    await MetaCatalogService.createProduct(catalogId, {
      retailer_id: product.rId,
      name: product.name,
      price: Math.round(product.basePrice * 100),
      // ... other fields
    });
  }
}
```

### 2. **Keep Modifiers Separate** (Current Approach) ✅

**Recommendation**: Continue handling modifiers **outside** the catalog sync

**Rationale**:
- Meta Catalog doesn't support dynamic add-ons
- Modifiers are better handled in order/checkout flow
- More flexible for complex customization

**Where Modifiers Work**:
- WhatsApp order conversations (manual/AI)
- Web ordering interface
- Mobile app

### 3. **Update Sync Logic** (Medium Priority) 🟡

**Current**:
```typescript
// Only syncs product, ignores presentations
syncProductToCatalog(product) {
  // Creates 1 catalog item per product
}
```

**Recommended**:
```typescript
// Syncs product + all presentations
syncProductWithPresentations(product) {
  const presentations = await getPresentations(product);

  if (presentations.length > 0) {
    // Sync as variant group
    for (const presentation of presentations) {
      syncVariant(product, presentation);
    }
  } else {
    // Sync as single product
    syncSimpleProduct(product);
  }
}
```

### 4. **Handle Presentation Lifecycle** (High Priority) 🔴

**Required Changes**:

```typescript
// When presentation is created
createPresentation() → syncPresentationToCatalog()

// When presentation is updated
updatePresentation() → updatePresentationInCatalog()

// When presentation is deleted
deletePresentation() → removePresentationFromCatalog()

// When presentation availability changes
updatePresentationAvailability() → syncAvailabilityToCatalog()
```

## Implementation Plan

### Phase 1: Core Variant Support (Week 1)

- [ ] Add `item_group_id` support to `CreateProductParams`
- [ ] Add `size` field to `CreateProductParams`
- [ ] Update `mapProductToCatalogFormat()` to check for presentations
- [ ] Implement `syncProductWithPresentations()`
- [ ] Test with sample products

### Phase 2: Presentation Lifecycle (Week 2)

- [ ] Add catalog sync to `createPresentation()`
- [ ] Add catalog sync to `updatePresentation()`
- [ ] Add catalog sync to `deletePresentation()`
- [ ] Add availability sync for presentations
- [ ] Test presentation CRUD operations

### Phase 3: Migration & Testing (Week 3)

- [ ] Migrate existing products with presentations
- [ ] Clean up orphaned catalog entries
- [ ] Performance testing (bulk sync)
- [ ] End-to-end testing (WhatsApp orders)

## Data Flow Examples

### Scenario 1: Product with Presentations

**Database**:
```
Product: Pizza Margherita (basePrice: 15.00)
  ├─ Presentation: Small (price: 12.00)
  ├─ Presentation: Medium (price: 15.00)
  └─ Presentation: Large (price: 20.00)
```

**Meta Catalog** (Recommended):
```
Group: PIZZA_MARG
  ├─ PRES123-SMALL:  "Pizza Margherita - Small"  ($12.00)
  ├─ PRES123-MEDIUM: "Pizza Margherita - Medium" ($15.00)
  └─ PRES123-LARGE:  "Pizza Margherita - Large"  ($20.00)
```

**WhatsApp Display**:
```
🍕 Pizza Margherita
   Small   - $12.00
   Medium  - $15.00
   Large   - $20.00
```

### Scenario 2: Product with Modifiers

**Database**:
```
Product: Custom Pizza (basePrice: 15.00)
Modifiers:
  ├─ Extra Toppings (multi-select)
  │   ├─ Extra Cheese (+$2.00)
  │   └─ Mushrooms (+$1.50)
  └─ Crust Type (single-select)
      ├─ Thin Crust (+$0.00)
      └─ Thick Crust (+$1.00)
```

**Meta Catalog**:
```
PROD456: "Custom Pizza" ($15.00)
  ⚠️ Note: Modifiers NOT in catalog
```

**WhatsApp Order Flow**:
```
1. Customer selects "Custom Pizza" from catalog ($15.00)
2. AI/Human agent asks: "What size?"
3. AI/Human agent asks: "Extra toppings?"
4. AI/Human agent asks: "Crust type?"
5. Final price calculated: $15 + $2 + $1 = $18.00
6. Order confirmed with itemized breakdown
```

## Technical Considerations

### Database Queries

**Current** (inefficient):
```typescript
// Syncs product without checking presentations
const product = await Product.findById(productId);
syncToCatalog(product);
```

**Recommended**:
```typescript
// Eager load presentations
const product = await Product.findById(productId);
const presentations = await Presentation.find({
  productId: product._id,
  isActive: true
});
syncWithPresentations(product, presentations);
```

### Batch Sync Performance

**Current**:
- Syncs ~10 products/second
- **Without presentations**: ~100 API calls for 100 products

**With Presentations**:
- Average 3 presentations per product
- **With presentations**: ~400 API calls for 100 products (4x slower)

**Solution**: Use batch operations
```typescript
// Meta Catalog batch API
POST /catalog/items_batch
{
  "item_type": "PRODUCT",
  "requests": [
    { "method": "CREATE", "retailer_id": "...", "data": {...} },
    { "method": "CREATE", "retailer_id": "...", "data": {...} },
    // ... up to 5000 items
  ]
}
```

## Summary

### Current State ❌
- ✅ Products sync to Meta Catalog
- ❌ Presentations **NOT synced** (major gap)
- ✅ Modifiers correctly excluded
- ⚠️ Customers can't select variants in WhatsApp

### Recommended State ✅
- ✅ Products sync to Meta Catalog
- ✅ Presentations sync as **product variants**
- ✅ Modifiers handled in order flow
- ✅ Customers can select sizes/variants

### Key Takeaways

1. **Presentations = Product Variants** → Should be synced to catalog
2. **Modifiers = Order Customization** → Should stay out of catalog
3. **basePrice** → Use lowest presentation price or keep as base
4. **Implementation Priority**: High (affects customer experience)

---

**Next Steps**:
1. Review this analysis
2. Approve presentation sync strategy
3. Implement Phase 1 (variant support)
4. Test with real products
5. Migrate existing data
