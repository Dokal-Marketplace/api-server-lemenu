import mongoose, { FilterQuery } from "mongoose"
import { Modifier, IModifier, IModifierOption } from "../models/Modifier"

// Simple validators (minimal, no external deps)
function requireString(value: any, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`)
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

// Get all options across all modifiers for a location
export async function getAllOptionsByLocation(subDomain: string, localId: string) {
  requireString(subDomain, "subDomain")
  requireString(localId, "localId")

  const modifiers = await Modifier.find({
    subDomain: subDomain.toLowerCase(),
    localsId: localId,
    isActive: true
  }).lean()

  const allOptions = modifiers.flatMap(modifier => 
    modifier.options.map(option => ({
      ...option,
      modifierId: (modifier._id as any).toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name,
      modifierIsMultiple: modifier.isMultiple,
      modifierMinQuantity: modifier.minQuantity,
      modifierMaxQuantity: modifier.maxQuantity
    }))
  )

  return { options: allOptions }
}

// Get options for a specific modifier
export async function getOptionsByModifier(modifierId: string) {
  requireString(modifierId, "modifierId")

  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  return { 
    options: modifier.options,
    modifier: {
      id: (modifier._id as any).toString(),
      rId: modifier.rId,
      name: modifier.name,
      isMultiple: modifier.isMultiple,
      minQuantity: modifier.minQuantity,
      maxQuantity: modifier.maxQuantity
    }
  }
}

// Get options by modifier rId
export async function getOptionsByModifierRId(modifierRId: string) {
  requireString(modifierRId, "modifierRId")

  const modifier = await Modifier.findOne({ rId: modifierRId })
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  return { 
    options: modifier.options,
    modifier: {
      id: (modifier._id as any).toString(),
      rId: modifier.rId,
      name: modifier.name,
      isMultiple: modifier.isMultiple,
      minQuantity: modifier.minQuantity,
      maxQuantity: modifier.maxQuantity
    }
  }
}

// Get a specific option
export async function getOptionById(modifierId: string, optionId: string) {
  requireString(modifierId, "modifierId")
  requireString(optionId, "optionId")

  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  const option = modifier.options.find(opt => opt.optionId === optionId)
  if (!option) {
    return { error: "Option not found" }
  }

  return { 
    option: {
      ...option,
      modifierId: (modifier._id as any).toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name
    }
  }
}

// Create a new option
export async function createOption(params: {
  modifierId: string
  optionId: string
  name: string
  price: number
  stock?: number
  isActive?: boolean
}) {
  const { modifierId, optionId, name, price, stock, isActive } = params
  
  requireString(modifierId, "modifierId")
  requireString(optionId, "optionId")
  requireString(name, "name")
  requireNumber(price, "price")
  optionalNumber(stock, "stock")
  optionalBoolean(isActive, "isActive")

  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  // Check if optionId already exists in this modifier
  const existingOption = modifier.options.find(opt => opt.optionId === optionId)
  if (existingOption) {
    return { error: "Option ID already exists in this modifier" }
  }

  const newOption: IModifierOption = {
    optionId,
    name,
    price,
    stock: stock ?? undefined,
    isActive: isActive ?? true
  }

  modifier.options.push(newOption)
  await modifier.save()

  return { 
    option: {
      ...newOption,
      modifierId: (modifier._id as any).toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name
    }
  }
}

// Update an option
export async function updateOption(params: {
  modifierId: string
  optionId: string
  updates: {
    newOptionId?: string
    name?: string
    price?: number
    stock?: number
    isActive?: boolean
  }
}) {
  const { modifierId, optionId, updates } = params
  
  requireString(modifierId, "modifierId")
  requireString(optionId, "optionId")

  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  const optionIndex = modifier.options.findIndex(opt => opt.optionId === optionId)
  if (optionIndex === -1) {
    return { error: "Option not found" }
  }

  // Validate updates
  if (updates.newOptionId !== undefined) {
    requireString(updates.newOptionId, "updates.newOptionId")
    // Check if new optionId already exists (excluding current option)
    const existingOption = modifier.options.find((opt, index) => 
      opt.optionId === updates.newOptionId && index !== optionIndex
    )
    if (existingOption) {
      return { error: "Option ID already exists in this modifier" }
    }
  }
  if (updates.name !== undefined) requireString(updates.name, "updates.name")
  if (updates.price !== undefined) requireNumber(updates.price, "updates.price")
  if (updates.stock !== undefined) optionalNumber(updates.stock, "updates.stock")
  if (updates.isActive !== undefined) optionalBoolean(updates.isActive, "updates.isActive")

  const currentOption = modifier.options[optionIndex]
  const updatedOption: IModifierOption = {
    optionId: updates.newOptionId ?? currentOption.optionId,
    name: updates.name ?? currentOption.name,
    price: updates.price ?? currentOption.price,
    stock: updates.stock !== undefined ? updates.stock : currentOption.stock,
    isActive: updates.isActive ?? currentOption.isActive
  }

  modifier.options[optionIndex] = updatedOption
  await modifier.save()

  return { 
    option: {
      ...updatedOption,
      modifierId: (modifier._id as any).toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name
    }
  }
}

// Delete an option
export async function deleteOption(modifierId: string, optionId: string) {
  requireString(modifierId, "modifierId")
  requireString(optionId, "optionId")

  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  const optionIndex = modifier.options.findIndex(opt => opt.optionId === optionId)
  if (optionIndex === -1) {
    return { error: "Option not found" }
  }

  const deletedOption = modifier.options[optionIndex]
  modifier.options.splice(optionIndex, 1)
  await modifier.save()

  return { 
    option: {
      ...deletedOption,
      modifierId: (modifier._id as any).toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name
    }
  }
}

// Batch create options
export async function batchCreateOptions(params: {
  modifierId: string
  options: Array<{
    optionId: string
    name: string
    price: number
    stock?: number
    isActive?: boolean
  }>
}) {
  const { modifierId, options } = params
  
  requireString(modifierId, "modifierId")
  requireArray(options, "options")

  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  const newOptions: IModifierOption[] = []
  for (const [index, option] of options.entries()) {
    requireString(option.optionId, `options[${index}].optionId`)
    requireString(option.name, `options[${index}].name`)
    requireNumber(option.price, `options[${index}].price`)
    optionalNumber(option.stock, `options[${index}].stock`)
    optionalBoolean(option.isActive, `options[${index}].isActive`)

    // Check for duplicate optionIds in the batch
    const duplicateInBatch = newOptions.find(opt => opt.optionId === option.optionId)
    if (duplicateInBatch) {
      throw new Error(`Duplicate optionId '${option.optionId}' in batch`)
    }

    // Check if optionId already exists in modifier
    const existingOption = modifier.options.find(opt => opt.optionId === option.optionId)
    if (existingOption) {
      throw new Error(`Option ID '${option.optionId}' already exists in this modifier`)
    }

    newOptions.push({
      optionId: option.optionId,
      name: option.name,
      price: option.price,
      stock: option.stock ?? undefined,
      isActive: option.isActive ?? true
    })
  }

  modifier.options.push(...newOptions)
  await modifier.save()

  return { 
    options: newOptions.map(option => ({
      ...option,
      modifierId: (modifier._id as any).toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name
    }))
  }
}

// Batch update options
export async function batchUpdateOptions(params: {
  modifierId: string
  options: Array<{
    optionId: string
    name?: string
    price?: number
    stock?: number
    isActive?: boolean
  }>
}) {
  const { modifierId, options } = params
  
  requireString(modifierId, "modifierId")
  requireArray(options, "options")

  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  const updatedOptions: IModifierOption[] = []
  const notFoundOptions: string[] = []

  for (const [index, option] of options.entries()) {
    requireString(option.optionId, `options[${index}].optionId`)
    if (option.name !== undefined) requireString(option.name, `options[${index}].name`)
    if (option.price !== undefined) requireNumber(option.price, `options[${index}].price`)
    if (option.stock !== undefined) optionalNumber(option.stock, `options[${index}].stock`)
    if (option.isActive !== undefined) optionalBoolean(option.isActive, `options[${index}].isActive`)

    const optionIndex = modifier.options.findIndex(opt => opt.optionId === option.optionId)
    if (optionIndex === -1) {
      notFoundOptions.push(option.optionId)
      continue
    }

    const currentOption = modifier.options[optionIndex]
    const updatedOption: IModifierOption = {
      optionId: currentOption.optionId,
      name: option.name ?? currentOption.name,
      price: option.price ?? currentOption.price,
      stock: option.stock !== undefined ? option.stock : currentOption.stock,
      isActive: option.isActive ?? currentOption.isActive
    }

    modifier.options[optionIndex] = updatedOption
    updatedOptions.push(updatedOption)
  }

  await modifier.save()

  return { 
    options: updatedOptions.map(option => ({
      ...option,
      modifierId: (modifier._id as any).toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name
    })),
    updatedCount: updatedOptions.length,
    notFoundOptions
  }
}

// Batch delete options
export async function batchDeleteOptions(params: {
  modifierId: string
  optionIds: string[]
}) {
  const { modifierId, optionIds } = params
  
  requireString(modifierId, "modifierId")
  requireArray(optionIds, "optionIds")

  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  const deletedOptions: IModifierOption[] = []
  const notFoundOptions: string[] = []

  for (const optionId of optionIds) {
    const optionIndex = modifier.options.findIndex(opt => opt.optionId === optionId)
    if (optionIndex === -1) {
      notFoundOptions.push(optionId)
      continue
    }

    const deletedOption = modifier.options[optionIndex]
    modifier.options.splice(optionIndex, 1)
    deletedOptions.push(deletedOption)
  }

  await modifier.save()

  return { 
    options: deletedOptions.map(option => ({
      ...option,
      modifierId: (modifier._id as any).toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name
    })),
    deletedCount: deletedOptions.length,
    notFoundOptions
  }
}

// Search options
export async function searchOptions(params: {
  query: string
  modifierId?: string
  subDomain?: string
  localId?: string
  isActive?: boolean
}) {
  const { query, modifierId, subDomain, localId, isActive } = params
  
  requireString(query, "query")

  const searchQuery: FilterQuery<IModifier> = {
    $text: { $search: query },
    isActive: true
  }

  if (modifierId) {
    if (mongoose.isValidObjectId(modifierId)) {
      searchQuery._id = new mongoose.Types.ObjectId(modifierId)
    } else {
      throw new Error(`Invalid modifierId format: ${modifierId}`)
    }
  }
  if (subDomain) {
    searchQuery.subDomain = subDomain.toLowerCase()
  }
  if (localId) {
    searchQuery.localsId = localId
  }

  const modifiers = await Modifier.find(searchQuery).lean()
  
  // Extract matching options
  const matchingOptions = modifiers.flatMap(modifier => 
    modifier.options
      .filter(option => {
        const matchesQuery = option.name.toLowerCase().includes(query.toLowerCase()) ||
                           option.optionId.toLowerCase().includes(query.toLowerCase())
        const matchesActive = isActive === undefined || option.isActive === isActive
        return matchesQuery && matchesActive
      })
      .map(option => ({
        ...option,
        modifierId: (modifier._id as any).toString(),
        modifierRId: modifier.rId,
        modifierName: modifier.name,
        modifierIsMultiple: modifier.isMultiple,
        modifierMinQuantity: modifier.minQuantity,
        modifierMaxQuantity: modifier.maxQuantity
      }))
  )

  return { options: matchingOptions }
}

// Get options with pagination
export async function getOptionsWithPagination(params: {
  modifierId?: string
  subDomain?: string
  localId?: string
  page?: number | string
  limit?: number | string
  sort?: string
  isActive?: boolean
}) {
  const { modifierId, subDomain, localId, page, limit, sort, isActive } = params

  const query: FilterQuery<IModifier> = { isActive: true }
  
  if (modifierId) {
    if (mongoose.isValidObjectId(modifierId)) {
      query._id = new mongoose.Types.ObjectId(modifierId)
    } else {
      throw new Error(`Invalid modifierId format: ${modifierId}`)
    }
  }
  if (subDomain) {
    query.subDomain = subDomain.toLowerCase()
  }
  if (localId) {
    query.localsId = localId
  }

  const pageNum = Math.max(1, Number(page ?? 1))
  const limitNum = Math.min(100, Math.max(1, Number(limit ?? 20)))
  const skip = (pageNum - 1) * limitNum

  const sortObj: Record<string, 1 | -1> = {}
  if (sort) {
    const parts = String(sort).split(",")
    for (const p of parts) {
      const key = p.replace(/^[-+]/, "")
      const dir: 1 | -1 = p.startsWith("-") ? -1 : 1
      sortObj[key] = dir
    }
  } else {
    sortObj.createdAt = -1
  }

  const modifiers = await Modifier.find(query).sort(sortObj).skip(skip).limit(limitNum).lean()
  
  // Extract all options from the modifiers
  const allOptions = modifiers.flatMap(modifier => 
    modifier.options
      .filter(option => isActive === undefined || option.isActive === isActive)
      .map(option => ({
        ...option,
        modifierId: (modifier._id as any).toString(),
        modifierRId: modifier.rId,
        modifierName: modifier.name,
        modifierIsMultiple: modifier.isMultiple,
        modifierMinQuantity: modifier.minQuantity,
        modifierMaxQuantity: modifier.maxQuantity
      }))
  )

  // Get total count for pagination
  const totalModifiers = await Modifier.countDocuments(query)
  const totalOptions = modifiers.reduce((sum, modifier) => 
    sum + modifier.options.filter(option => isActive === undefined || option.isActive === isActive).length, 0
  )

  const totalPages = Math.ceil(totalOptions / limitNum)

  return { 
    options: allOptions,
    pagination: { 
      page: pageNum, 
      limit: limitNum, 
      total: totalOptions, 
      totalPages 
    }
  }
}
