import { FilterQuery, Types } from "mongoose"
import { Product, IProduct } from "../models/Product"
import { Category } from "../models/Category"
import { Presentation, IPresentation } from "../models/Presentation"
import { Modifier } from "../models/Modifier"
import logger from "../utils/logger"

// Simple validators (minimal, no external deps)
function requireString(value: any, field: string) {
  logger.log(`🔍 [VALIDATION] requireString - ${field}:`, { value, type: typeof value, isString: typeof value === "string", isTrimmed: typeof value === "string" ? value.trim() : "N/A" });
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`)
}     
function optionalString(value: any, field: string) {
     logger.log(`🔍 [VALIDATION] optionalString - ${field}:`, { value, type: typeof value });
  if (value !== undefined && typeof value !== "string") throw new Error(`${field} must be string`)
}
function requireNumber(value: any, field: string) {
  logger.log(`🔍 [VALIDATION] requireNumber - ${field}:`, { value, type: typeof value, isNumber: typeof value === "number", isNaN: Number.isNaN(value) });
  if (typeof value !== "number" || Number.isNaN(value)) throw new Error(`${field} is required and must be number`)
}
function optionalBoolean(value: any, field: string) {
  logger.log(`🔍 [VALIDATION] optionalBoolean - ${field}:`, { value, type: typeof value, isBoolean: typeof value === "boolean" });
  if (value !== undefined && typeof value !== "boolean") throw new Error(`${field} must be boolean`)
}
function optionalNumber(value: any, field: string) {
  logger.log(`🔍 [VALIDATION] optionalNumber - ${field}:`, { value, type: typeof value, isNumber: typeof value === "number", isNaN: Number.isNaN(value) });
  if (value !== undefined && (typeof value !== "number" || Number.isNaN(value))) throw new Error(`${field} must be number`)
}

export async function listProductsByLocation(subDomain: string, localId: string) {
  return Product.find({ subDomain: subDomain.toLowerCase(), localId }).lean()
}

export async function listProducts(filters: {
  subDomain?: string
  localId?: string
  categoryId?: string
  q?: string
  page?: number | string
  limit?: number | string
  sort?: string
}) {
  const query: FilterQuery<IProduct> = {}
  if (filters.subDomain) (query as any).subDomain = String(filters.subDomain).toLowerCase()
  if (filters.localId) (query as any).localId = filters.localId
  if (filters.categoryId) (query as any).categoryId = filters.categoryId
  if (filters.q) (query as any).$text = { $search: filters.q }

  const page = Math.max(1, Number(filters.page ?? 1))
  const limit = Math.min(100, Math.max(1, Number(filters.limit ?? 20)))
  const skip = (page - 1) * limit
  const sort: Record<string, 1 | -1> = {}
  if (filters.sort) {
    const parts = String(filters.sort).split(",")
    for (const p of parts) {
      const key = p.replace(/^[-+]/, "")
      const dir: 1 | -1 = p.startsWith("-") ? -1 : 1
      sort[key] = dir
    }
  } else {
    sort.createdAt = -1
  }

  const [total, items] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query).sort(sort).skip(skip).limit(limit).lean()
  ])

  const totalPages = Math.ceil(total / limit)
  return { items, pagination: { page, limit, total, totalPages } }
}

export async function getProductById(productId: string) {
  return Product.findById(productId).lean()
}

export async function createProductForLocation(params: {
  subDomain: string
  localId: string
  payload: any
}) {
  const { subDomain, localId, payload } = params

  // Handle both 'price' and 'basePrice' fields (normalize to price)
  const price = payload.price ?? payload.basePrice

  requireString(payload.name, "name")
  requireString(payload.categoryId, "categoryId")
  requireNumber(price, "price")
  optionalString(payload.description, "description")
  optionalString(payload.imageUrl, "imageUrl")
  optionalBoolean(payload.isCombo, "isCombo")
  optionalNumber(payload.preparationTime, "preparationTime")
  optionalBoolean(payload.isFeatured, "isFeatured")
  optionalNumber(payload.sortOrder, "sortOrder")
  const category = await Category.findOne({ rId: payload.categoryId }).lean()
  if (!category) return { error: "Invalid categoryId" as const }

  const product = await Product.create({
    rId: payload.rId || `PROD${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
    name: payload.name,
    description: payload.description,
    categoryId: payload.categoryId,
    category: category.name,
    basePrice: price,
    isCombo: Boolean(payload.isCombo),
    isOutOfStock: false,
    isAvailable: true,
    imageUrl: payload.imageUrl,
    modifiers: Array.isArray(payload.modifiers) ? payload.modifiers : [],
    presentations: Array.isArray(payload.presentations) ? payload.presentations : [],
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    subDomain: subDomain.toLowerCase(),
    localId,
    isActive: true,
    nutritionalInfo: payload.nutritionalInfo,
    allergens: Array.isArray(payload.allergens) ? payload.allergens : [],
    preparationTime: payload.preparationTime ?? 0,
    isFeatured: Boolean(payload.isFeatured),
    sortOrder: payload.sortOrder ?? 0
  })

  return { product }
}

export async function createProductWithPresentations(params: {
  subDomain: string
  localId: string
  product: any
  presentations: any[]
}) {
  const { subDomain, localId, product, presentations } = params
  requireString(product.name, "product.name")
  requireString(product.categoryId, "product.categoryId")
  requireNumber(product.price, "product.price")
  if (!Array.isArray(presentations) || presentations.length === 0) throw new Error("presentations must be a non-empty array")
  for (const [idx, p] of presentations.entries()) {
    requireString(p.name, `presentations[${idx}].name`)
    requireNumber(p.price, `presentations[${idx}].price`)
    optionalNumber(p.stock, `presentations[${idx}].stock`)
    optionalBoolean(p.isAvailableForDelivery, `presentations[${idx}].isAvailableForDelivery`)
  }
  const category = await Category.findOne({ rId: product.categoryId }).lean()
  if (!category) return { error: "Invalid categoryId" as const }

  const createdProduct = await Product.create({
    rId: product.rId || `PROD${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    category: category.name,
    basePrice: product.price,
    isCombo: Boolean(product.isCombo),
    isOutOfStock: false,
    isAvailable: true,
    imageUrl: product.imageUrl,
    modifiers: Array.isArray(product.modifiers) ? product.modifiers : [],
    presentations: [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    subDomain: subDomain.toLowerCase(),
    localId,
    isActive: true,
    nutritionalInfo: product.nutritionalInfo,
    allergens: Array.isArray(product.allergens) ? product.allergens : [],
    preparationTime: product.preparationTime ?? 0,
    isFeatured: Boolean(product.isFeatured),
    sortOrder: product.sortOrder ?? 0
  })

  const productId: string = (createdProduct._id as unknown as Types.ObjectId).toString()

  const presentationDocs = await Presentation.insertMany(
    presentations.map((p) => ({
      rId: p.rId || `PRES${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
      productId,
      name: p.name,
      price: p.price,
      description: p.description,
      isAvailableForDelivery: p.isAvailableForDelivery ?? true,
      stock: p.stock ?? 0,
      imageUrl: p.imageUrl,
      isPromotion: p.isPromotion ?? false,
      servingSize: p.servingSize,
      amountWithDiscount: p.amountWithDiscount ?? p.price,
      discountValue: p.discountValue,
      discountType: p.discountType,
      subDomain: subDomain.toLowerCase(),
      localId,
      isActive: p.isActive ?? true
    }))
  )

  createdProduct.presentations = presentationDocs.map((d) => (d._id as unknown as Types.ObjectId).toString())
  await createdProduct.save()

  return { product: createdProduct, presentations: presentationDocs }
}

export async function updateProductById(productId: string, update: any) {
  if (update.price !== undefined) {
    update.basePrice = update.price
    delete update.price
  }
  if (update.categoryId) {
    const category = await Category.findOne({ rId: update.categoryId }).lean()
    if (!category) return { error: "Invalid categoryId" as const }
    update.category = category.name
  }
  const product = await Product.findByIdAndUpdate(productId, update, { new: true })
  return { product }
}

export async function deleteProductById(productId: string) {
  const deleted = await Product.findByIdAndDelete(productId)
  return { deleted }
}

export async function batchDeleteByRids(rIds: string[]) {
  const result = await Product.deleteMany({ rId: { $in: rIds } })
  return { deletedCount: result.deletedCount }
}

export async function convertProductToModifier(productId: string) {
  const product = await Product.findById(productId)
  if (!product) return { error: "Product not found" as const }
  const options = (product.modifiers || []).map(m => ({ optionId: m.id, name: m.name, price: m.price, isActive: m.isActive }))
  const modifier = await Modifier.create({
    rId: `MOD${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
    name: product.name,
    isMultiple: false,
    minQuantity: 0,
    maxQuantity: Math.max(1, options.length || 1),
    options,
    localsId: [product.localId],
    subDomain: product.subDomain,
    source: "0",
    isActive: true
  })
  return { modifier }
}


// Presentation functions
export async function listPresentationsByLocation(subDomain: string, localId: string) {
  return Presentation.find({ subDomain: subDomain.toLowerCase(), localId }).lean()
}

export async function listPresentations(filters: {
  subDomain?: string
  localId?: string
  productId?: string
  q?: string
  page?: number | string
  limit?: number | string
  sort?: string
  isActive?: boolean
  isAvailableForDelivery?: boolean
  isAvailable?: boolean
}) {
  const query: FilterQuery<IPresentation> = {}
  if (filters.subDomain) (query as any).subDomain = String(filters.subDomain).toLowerCase()
  if (filters.localId) (query as any).localId = filters.localId
  if (filters.productId) (query as any).productId = filters.productId
  if (filters.q) (query as any).$text = { $search: filters.q }
  if (filters.isActive !== undefined) (query as any).isActive = filters.isActive
  if (filters.isAvailableForDelivery !== undefined) (query as any).isAvailableForDelivery = filters.isAvailableForDelivery
  if (filters.isAvailable !== undefined) (query as any).isAvailable = filters.isAvailable

  const page = Math.max(1, Number(filters.page ?? 1))
  const limit = Math.min(100, Math.max(1, Number(filters.limit ?? 20)))
  const skip = (page - 1) * limit
  const sort: Record<string, 1 | -1> = {}
  if (filters.sort) {
    const parts = String(filters.sort).split(",")
    for (const p of parts) {
      const key = p.replace(/^[-+]/, "")
      const dir: 1 | -1 = p.startsWith("-") ? -1 : 1
      sort[key] = dir
    }
  } else {
    sort.createdAt = -1
  }

  const [total, items] = await Promise.all([
    Presentation.countDocuments(query),
    Presentation.find(query).sort(sort).skip(skip).limit(limit).lean()
  ])

  const totalPages = Math.ceil(total / limit)
  return { items, pagination: { page, limit, total, totalPages } }
}

export async function getPresentationById(presentationId: string) {
  return Presentation.findById(presentationId).lean()
}

export async function getPresentationsByProduct(productId: string) {
  const presentations = await Presentation.find({ productId }).lean()
  
  // Ensure isAvailable field exists for backward compatibility
  return presentations.map(presentation => ({
    ...presentation,
    isAvailable: presentation.isAvailable ?? true
  }))
}

export async function createPresentation(params: {
  subDomain: string
  localId: string
  productId: string
  payload: any
}) {
  console.log('🔧 [CREATE PRESENTATION SERVICE] Starting with params:', {
    subDomain: params.subDomain,
    localId: params.localId,
    productId: params.productId,
    payload: params.payload
  });

  const { subDomain, localId, productId, payload } = params
  
  try {
    console.log('✅ [CREATE PRESENTATION SERVICE] Validating input fields...');
    requireString(payload.name, "name")
    requireNumber(payload.price, "price")
    optionalString(payload.description, "description")
    optionalString(payload.imageUrl, "imageUrl")
    optionalBoolean(payload.isAvailableForDelivery, "isAvailableForDelivery")
    optionalBoolean(payload.isAvailable, "isAvailable")
    optionalNumber(payload.stock, "stock")
    optionalBoolean(payload.isPromotion, "isPromotion")
    optionalNumber(payload.servingSize, "servingSize")
    optionalNumber(payload.discountValue, "discountValue")
    optionalNumber(payload.discountType, "discountType")
    optionalBoolean(payload.isActive, "isActive")
    console.log('✅ [CREATE PRESENTATION SERVICE] Input validation passed');

    // Verify product exists
    console.log('🔍 [CREATE PRESENTATION SERVICE] Looking for product:', productId);
    const product = await Product.findById(productId).lean()
    if (!product) {
      console.log('❌ [CREATE PRESENTATION SERVICE] Product not found:', productId);
      return { error: "Product not found" as const }
    }
    console.log('✅ [CREATE PRESENTATION SERVICE] Product found:', product.name);

    const presentationData = {
      rId: payload.rId || `PRES${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
      productId,
      name: payload.name,
      price: payload.price,
      description: payload.description,
      isAvailableForDelivery: payload.isAvailableForDelivery ?? true,
      isAvailable: payload.isAvailable ?? true,
      stock: payload.stock ?? 0,
      imageUrl: payload.imageUrl,
      isPromotion: payload.isPromotion ?? false,
      servingSize: payload.servingSize,
      amountWithDiscount: payload.amountWithDiscount ?? payload.price,
      discountValue: payload.discountValue,
      discountType: payload.discountType ?? 0,
      subDomain: subDomain.toLowerCase(),
      localId,
      isActive: payload.isActive ?? true
    };

    console.log('📝 [CREATE PRESENTATION SERVICE] Creating presentation with data:', JSON.stringify(presentationData, null, 2));

    const presentation = await Presentation.create(presentationData)
    console.log('✅ [CREATE PRESENTATION SERVICE] Presentation created successfully:', presentation._id);

    // Add presentation to product's presentations array
    console.log('🔄 [CREATE PRESENTATION SERVICE] Adding presentation to product...');
    await Product.findByIdAndUpdate(productId, {
      $addToSet: { presentations: (presentation._id as Types.ObjectId).toString() }
    })
    console.log('✅ [CREATE PRESENTATION SERVICE] Presentation added to product successfully');

    return { presentation }
  } catch (error) {
    console.error('💥 [CREATE PRESENTATION SERVICE] Error occurred:', error);
    console.error('💥 [CREATE PRESENTATION SERVICE] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 [CREATE PRESENTATION SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

export async function updatePresentationById(presentationId: string, update: any) {
  const presentation = await Presentation.findByIdAndUpdate(presentationId, update, { new: true })
  if (!presentation) return { error: "Presentation not found" as const }
  return { presentation }
}

export async function deletePresentationById(presentationId: string) {
  const presentation = await Presentation.findById(presentationId)
  if (!presentation) return { error: "Presentation not found" as const }

  // Remove presentation from product's presentations array
  await Product.findByIdAndUpdate(presentation.productId, {
    $pull: { presentations: presentationId }
  })

  const deleted = await Presentation.findByIdAndDelete(presentationId)
  return { deleted }
}

export async function batchDeletePresentationsByRids(rIds: string[]) {
  const presentations = await Presentation.find({ rId: { $in: rIds } })
  const productIds = presentations.map(p => p.productId)

  // Remove presentations from products' presentations arrays
  await Product.updateMany(
    { _id: { $in: productIds } },
    { $pull: { presentations: { $in: presentations.map(p => (p._id as Types.ObjectId).toString()) } } }
  )

  const result = await Presentation.deleteMany({ rId: { $in: rIds } })
  return { deletedCount: result.deletedCount }
}

export async function getPresentationsLikeProduct(productId: string, subDomain: string, localId: string) {
  const product = await Product.findById(productId).lean()
  if (!product) return { error: "Product not found" as const }

  // Find presentations from products in the same category
  const similarProducts = await Product.find({
    categoryId: product.categoryId,
    subDomain: subDomain.toLowerCase(),
    localId,
    _id: { $ne: productId },
    isActive: true
  }).select('_id').lean()

  const similarProductIds = similarProducts.map(p => p._id.toString())
  
  const presentations = await Presentation.find({
    productId: { $in: similarProductIds },
    isActive: true
  }).lean()

  return { presentations }
}
