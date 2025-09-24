import { FilterQuery, Types } from "mongoose"
import { Product, IProduct } from "../models/Product"
import { Category } from "../models/Category"
import { Presentation } from "../models/Presentation"
import { Modifier } from "../models/Modifier"

export async function listProductsByLocation(subDomain: string, localId: string) {
  return Product.find({ subDomain: subDomain.toLowerCase(), localId }).lean()
}

export async function listProducts(filters: {
  subDomain?: string
  localId?: string
  categoryId?: string
  q?: string
}) {
  const query: FilterQuery<IProduct> = {}
  if (filters.subDomain) (query as any).subDomain = String(filters.subDomain).toLowerCase()
  if (filters.localId) (query as any).localId = filters.localId
  if (filters.categoryId) (query as any).categoryId = filters.categoryId
  if (filters.q) (query as any).$text = { $search: filters.q }
  return Product.find(query).lean()
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
  const category = await Category.findOne({ rId: payload.categoryId }).lean()
  if (!category) return { error: "Invalid categoryId" as const }

  const product = await Product.create({
    rId: payload.rId || `PROD${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
    name: payload.name,
    description: payload.description,
    categoryId: payload.categoryId,
    category: category.name,
    basePrice: payload.price,
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


