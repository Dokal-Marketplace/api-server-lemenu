import { FilterQuery } from "mongoose"
import { Modifier, IModifier } from "../models/Modifier"

// Simple validators (minimal, no external deps)
function requireString(value: any, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`)
}
function optionalString(value: any, field: string) {
  if (value !== undefined && typeof value !== "string") throw new Error(`${field} must be string`)
}
function requireNumber(value: any, field: string) {
  if (typeof value !== "number" || Number.isNaN(value)) throw new Error(`${field} is required and must be number`)
}
function optionalBoolean(value: any, field: string) {
  if (value !== undefined && typeof value !== "boolean") throw new Error(`${field} must be boolean`)
}
function optionalNumber(value: any, field: string) {
  if (value !== undefined && (typeof value !== "number" || Number.isNaN(value))) throw new Error(`${field} must be number`)
}
function requireArray(value: any, field: string) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`)
}

export async function listModifiersByLocation(subDomain: string, localId: string) {
  return Modifier.find({ 
    subDomain: subDomain.toLowerCase(), 
    localsId: localId,
    isActive: true 
  }).lean()
}

export async function listModifiers(filters: {
  subDomain?: string
  localId?: string
  q?: string
  page?: number | string
  limit?: number | string
  sort?: string
  isActive?: boolean
  isMultiple?: boolean
}) {
  const query: FilterQuery<IModifier> = {}
  if (filters.subDomain) (query as any).subDomain = String(filters.subDomain).toLowerCase()
  if (filters.localId) (query as any).localsId = filters.localId
  if (filters.q) (query as any).$text = { $search: filters.q }
  if (filters.isActive !== undefined) (query as any).isActive = filters.isActive
  if (filters.isMultiple !== undefined) (query as any).isMultiple = filters.isMultiple

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
    Modifier.countDocuments(query),
    Modifier.find(query).sort(sort).skip(skip).limit(limit).lean()
  ])

  const totalPages = Math.ceil(total / limit)
  return { items, pagination: { page, limit, total, totalPages } }
}

export async function getModifierById(modifierId: string) {
  return Modifier.findById(modifierId).lean()
}

export async function getModifierByRId(rId: string) {
  return Modifier.findOne({ rId }).lean()
}

export async function createModifierForLocation(params: {
  subDomain: string
  localId: string
  payload: any
}) {
  const { subDomain, localId, payload } = params
  requireString(payload.name, "name")
  requireArray(payload.options, "options")
  requireNumber(payload.minQuantity, "minQuantity")
  requireNumber(payload.maxQuantity, "maxQuantity")
  optionalBoolean(payload.isMultiple, "isMultiple")
  optionalString(payload.source, "source")
  optionalBoolean(payload.isActive, "isActive")

  // Validate options
  for (const [idx, option] of payload.options.entries()) {
    requireString(option.optionId, `options[${idx}].optionId`)
    requireString(option.name, `options[${idx}].name`)
    requireNumber(option.price, `options[${idx}].price`)
    optionalNumber(option.stock, `options[${idx}].stock`)
    optionalBoolean(option.isActive, `options[${idx}].isActive`)
  }

  // Validate quantity constraints
  if (payload.minQuantity < 0) throw new Error("minQuantity must be >= 0")
  if (payload.maxQuantity < 1) throw new Error("maxQuantity must be >= 1")
  if (payload.maxQuantity < payload.minQuantity) {
    throw new Error("maxQuantity must be >= minQuantity")
  }

  const modifier = await Modifier.create({
    rId: payload.rId || `MOD${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
    name: payload.name,
    isMultiple: Boolean(payload.isMultiple),
    minQuantity: payload.minQuantity,
    maxQuantity: payload.maxQuantity,
    options: payload.options.map((opt: any) => ({
      optionId: opt.optionId,
      name: opt.name,
      price: opt.price,
      stock: opt.stock ?? null,
      isActive: opt.isActive ?? true
    })),
    localsId: [localId],
    subDomain: subDomain.toLowerCase(),
    source: payload.source || "0",
    isActive: payload.isActive ?? true
  })

  return { modifier }
}

export async function updateModifierById(modifierId: string, update: any) {
  // Validate options if provided
  if (update.options) {
    requireArray(update.options, "options")
    for (const [idx, option] of update.options.entries()) {
      requireString(option.optionId, `options[${idx}].optionId`)
      requireString(option.name, `options[${idx}].name`)
      requireNumber(option.price, `options[${idx}].price`)
      optionalNumber(option.stock, `options[${idx}].stock`)
      optionalBoolean(option.isActive, `options[${idx}].isActive`)
    }
  }

  // Validate quantity constraints if provided
  if (update.minQuantity !== undefined && update.minQuantity < 0) {
    throw new Error("minQuantity must be >= 0")
  }
  if (update.maxQuantity !== undefined && update.maxQuantity < 1) {
    throw new Error("maxQuantity must be >= 1")
  }
  if (update.minQuantity !== undefined && update.maxQuantity !== undefined && 
      update.maxQuantity < update.minQuantity) {
    throw new Error("maxQuantity must be >= minQuantity")
  }

  const modifier = await Modifier.findByIdAndUpdate(modifierId, update, { new: true })
  if (!modifier) return { error: "Modifier not found" as const }
  return { modifier }
}

export async function updateModifierByRId(rId: string, update: any) {
  // Validate options if provided
  if (update.options) {
    requireArray(update.options, "options")
    for (const [idx, option] of update.options.entries()) {
      requireString(option.optionId, `options[${idx}].optionId`)
      requireString(option.name, `options[${idx}].name`)
      requireNumber(option.price, `options[${idx}].price`)
      optionalNumber(option.stock, `options[${idx}].stock`)
      optionalBoolean(option.isActive, `options[${idx}].isActive`)
    }
  }

  // Validate quantity constraints if provided
  if (update.minQuantity !== undefined && update.minQuantity < 0) {
    throw new Error("minQuantity must be >= 0")
  }
  if (update.maxQuantity !== undefined && update.maxQuantity < 1) {
    throw new Error("maxQuantity must be >= 1")
  }
  if (update.minQuantity !== undefined && update.maxQuantity !== undefined && 
      update.maxQuantity < update.minQuantity) {
    throw new Error("maxQuantity must be >= minQuantity")
  }

  const modifier = await Modifier.findOneAndUpdate({ rId }, update, { new: true })
  if (!modifier) return { error: "Modifier not found" as const }
  return { modifier }
}

export async function deleteModifierById(modifierId: string) {
  const deleted = await Modifier.findByIdAndDelete(modifierId)
  if (!deleted) return { error: "Modifier not found" as const }
  return { deleted }
}

export async function deleteModifierByRId(rId: string) {
  const deleted = await Modifier.findOneAndDelete({ rId })
  if (!deleted) return { error: "Modifier not found" as const }
  return { deleted }
}

export async function batchDeleteByRids(rIds: string[]) {
  const result = await Modifier.deleteMany({ rId: { $in: rIds } })
  return { deletedCount: result.deletedCount }
}

export async function batchCreateModifiers(params: {
  subDomain: string
  localId: string
  modifiers: any[]
}) {
  const { subDomain, localId, modifiers } = params
  requireArray(modifiers, "modifiers")

  const modifierDocs = modifiers.map((modifier, idx) => {
    requireString(modifier.name, `modifiers[${idx}].name`)
    requireArray(modifier.options, `modifiers[${idx}].options`)
    requireNumber(modifier.minQuantity, `modifiers[${idx}].minQuantity`)
    requireNumber(modifier.maxQuantity, `modifiers[${idx}].maxQuantity`)

    // Validate options
    for (const [optIdx, option] of modifier.options.entries()) {
      requireString(option.optionId, `modifiers[${idx}].options[${optIdx}].optionId`)
      requireString(option.name, `modifiers[${idx}].options[${optIdx}].name`)
      requireNumber(option.price, `modifiers[${idx}].options[${optIdx}].price`)
    }

    // Validate quantity constraints
    if (modifier.minQuantity < 0) throw new Error(`modifiers[${idx}].minQuantity must be >= 0`)
    if (modifier.maxQuantity < 1) throw new Error(`modifiers[${idx}].maxQuantity must be >= 1`)
    if (modifier.maxQuantity < modifier.minQuantity) {
      throw new Error(`modifiers[${idx}].maxQuantity must be >= minQuantity`)
    }

    return {
      rId: modifier.rId || `MOD${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`,
      name: modifier.name,
      isMultiple: Boolean(modifier.isMultiple),
      minQuantity: modifier.minQuantity,
      maxQuantity: modifier.maxQuantity,
      options: modifier.options.map((opt: any) => ({
        optionId: opt.optionId,
        name: opt.name,
        price: opt.price,
        stock: opt.stock ?? null,
        isActive: opt.isActive ?? true
      })),
      localsId: [localId],
      subDomain: subDomain.toLowerCase(),
      source: modifier.source || "0",
      isActive: modifier.isActive ?? true
    }
  })

  const createdModifiers = await Modifier.insertMany(modifierDocs)
  return { modifiers: createdModifiers }
}

export async function batchUpdateModifiers(params: {
  subDomain: string
  localId: string
  modifiers: any[]
}) {
  const { subDomain, localId, modifiers } = params
  requireArray(modifiers, "modifiers")

  const updatePromises = modifiers.map(async (modifier, idx) => {
    requireString(modifier.rId, `modifiers[${idx}].rId`)

    const updateData: any = {}
    if (modifier.name !== undefined) {
      requireString(modifier.name, `modifiers[${idx}].name`)
      updateData.name = modifier.name
    }
    if (modifier.isMultiple !== undefined) {
      optionalBoolean(modifier.isMultiple, `modifiers[${idx}].isMultiple`)
      updateData.isMultiple = modifier.isMultiple
    }
    if (modifier.minQuantity !== undefined) {
      requireNumber(modifier.minQuantity, `modifiers[${idx}].minQuantity`)
      updateData.minQuantity = modifier.minQuantity
    }
    if (modifier.maxQuantity !== undefined) {
      requireNumber(modifier.maxQuantity, `modifiers[${idx}].maxQuantity`)
      updateData.maxQuantity = modifier.maxQuantity
    }
    if (modifier.options !== undefined) {
      requireArray(modifier.options, `modifiers[${idx}].options`)
      for (const [optIdx, option] of modifier.options.entries()) {
        requireString(option.optionId, `modifiers[${idx}].options[${optIdx}].optionId`)
        requireString(option.name, `modifiers[${idx}].options[${optIdx}].name`)
        requireNumber(option.price, `modifiers[${idx}].options[${optIdx}].price`)
      }
      updateData.options = modifier.options.map((opt: any) => ({
        optionId: opt.optionId,
        name: opt.name,
        price: opt.price,
        stock: opt.stock ?? null,
        isActive: opt.isActive ?? true
      }))
    }
    if (modifier.isActive !== undefined) {
      optionalBoolean(modifier.isActive, `modifiers[${idx}].isActive`)
      updateData.isActive = modifier.isActive
    }

    // Validate quantity constraints
    if (updateData.minQuantity !== undefined && updateData.minQuantity < 0) {
      throw new Error(`modifiers[${idx}].minQuantity must be >= 0`)
    }
    if (updateData.maxQuantity !== undefined && updateData.maxQuantity < 1) {
      throw new Error(`modifiers[${idx}].maxQuantity must be >= 1`)
    }
    if (updateData.minQuantity !== undefined && updateData.maxQuantity !== undefined && 
        updateData.maxQuantity < updateData.minQuantity) {
      throw new Error(`modifiers[${idx}].maxQuantity must be >= minQuantity`)
    }

    return Modifier.findOneAndUpdate(
      { rId: modifier.rId, subDomain: subDomain.toLowerCase(), localsId: localId },
      updateData,
      { new: true }
    )
  })

  const updatedModifiers = await Promise.all(updatePromises)
  const successfulUpdates = updatedModifiers.filter(modifier => modifier !== null)
  
  return { 
    modifiers: successfulUpdates,
    updatedCount: successfulUpdates.length,
    totalCount: modifiers.length
  }
}

export async function getModifiersByLocation(subDomain: string, localId: string) {
  return Modifier.find({ 
    subDomain: subDomain.toLowerCase(), 
    localsId: localId,
    isActive: true 
  }).lean()
}

export async function searchModifiers(query: string, subDomain: string, localId?: string) {
  const searchQuery: FilterQuery<IModifier> = {
    $text: { $search: query },
    subDomain: subDomain.toLowerCase(),
    isActive: true
  }
  
  if (localId) {
    searchQuery.localsId = localId
  }

  return Modifier.find(searchQuery).lean()
}
