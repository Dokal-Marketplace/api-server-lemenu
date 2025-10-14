import { FilterQuery } from "mongoose"
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

export async function createModifierItem(params: {
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

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  // Check if optionId already exists in this modifier
  const existingOption = modifier.options.find(opt => opt.optionId === optionId)
  if (existingOption) {
    return { error: "Option ID already exists in this modifier" }
  }

  // Create new option
  const newOption: IModifierOption = {
    optionId,
    name,
    price,
    stock: stock ?? undefined,
    isActive: isActive ?? true
  }

  // Add option to modifier
  modifier.options.push(newOption)
  await modifier.save()

  return { option: newOption }
}

export async function updateModifierItem(params: {
  modifierId: string
  itemId: string
  updates: {
    optionId?: string
    name?: string
    price?: number
    stock?: number
    isActive?: boolean
  }
}) {
  const { modifierId, itemId, updates } = params
  
  requireString(modifierId, "modifierId")
  requireString(itemId, "itemId")

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  // Find the option to update
  const optionIndex = modifier.options.findIndex(opt => opt.optionId === itemId)
  if (optionIndex === -1) {
    return { error: "Modifier item not found" }
  }

  // Validate updates
  if (updates.optionId !== undefined) {
    requireString(updates.optionId, "updates.optionId")
    // Check if new optionId already exists (excluding current option)
    const existingOption = modifier.options.find((opt, index) => 
      opt.optionId === updates.optionId && index !== optionIndex
    )
    if (existingOption) {
      return { error: "Option ID already exists in this modifier" }
    }
  }
  if (updates.name !== undefined) requireString(updates.name, "updates.name")
  if (updates.price !== undefined) requireNumber(updates.price, "updates.price")
  if (updates.stock !== undefined) optionalNumber(updates.stock, "updates.stock")
  if (updates.isActive !== undefined) optionalBoolean(updates.isActive, "updates.isActive")

  // Update the option
  const currentOption = modifier.options[optionIndex]
  const updatedOption: IModifierOption = {
    optionId: updates.optionId ?? currentOption.optionId,
    name: updates.name ?? currentOption.name,
    price: updates.price ?? currentOption.price,
    stock: updates.stock !== undefined ? updates.stock : currentOption.stock,
    isActive: updates.isActive ?? currentOption.isActive
  }

  modifier.options[optionIndex] = updatedOption
  await modifier.save()

  return { option: updatedOption }
}

export async function deleteModifierItem(params: {
  modifierId: string
  itemId: string
}) {
  const { modifierId, itemId } = params
  
  requireString(modifierId, "modifierId")
  requireString(itemId, "itemId")

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  // Find the option to delete
  const optionIndex = modifier.options.findIndex(opt => opt.optionId === itemId)
  if (optionIndex === -1) {
    return { error: "Modifier item not found" }
  }

  // Remove the option
  const deletedOption = modifier.options[optionIndex]
  modifier.options.splice(optionIndex, 1)
  await modifier.save()

  return { option: deletedOption }
}

export async function getModifierItem(params: {
  modifierId: string
  itemId: string
}) {
  const { modifierId, itemId } = params
  
  requireString(modifierId, "modifierId")
  requireString(itemId, "itemId")

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  // Find the option
  const option = modifier.options.find(opt => opt.optionId === itemId)
  if (!option) {
    return { error: "Modifier item not found" }
  }

  return { option }
}

export async function getAllModifierItems(modifierId: string) {
  requireString(modifierId, "modifierId")

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  return { options: modifier.options }
}

export async function getModifierItemsBySubDomainAndLocal(subDomain: string, localId: string) {
  requireString(subDomain, "subDomain")
  requireString(localId, "localId")

  // Find all modifiers for the location
  const modifiers = await Modifier.find({
    subDomain: subDomain.toLowerCase(),
    localsId: localId,
    isActive: true
  }).lean()

  // Extract all options from all modifiers
  const allOptions = modifiers.flatMap(modifier => 
    modifier.options.map(option => ({
      ...option,
      modifierId: modifier._id.toString(),
      modifierRId: modifier.rId,
      modifierName: modifier.name
    }))
  )

  return { options: allOptions }
}

export async function getModifierItemsByModifierRId(modifierRId: string) {
  requireString(modifierRId, "modifierRId")

  // Find modifier by rId
  const modifier = await Modifier.findOne({ rId: modifierRId })
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  return { options: modifier.options }
}

export async function batchCreateModifierItems(params: {
  modifierId: string
  items: Array<{
    optionId: string
    name: string
    price: number
    stock?: number
    isActive?: boolean
  }>
}) {
  const { modifierId, items } = params
  
  requireString(modifierId, "modifierId")
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("items must be a non-empty array")
  }

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  // Validate all items
  const newOptions: IModifierOption[] = []
  for (const [index, item] of items.entries()) {
    requireString(item.optionId, `items[${index}].optionId`)
    requireString(item.name, `items[${index}].name`)
    requireNumber(item.price, `items[${index}].price`)
    optionalNumber(item.stock, `items[${index}].stock`)
    optionalBoolean(item.isActive, `items[${index}].isActive`)

    // Check for duplicate optionIds in the batch
    const duplicateInBatch = newOptions.find(opt => opt.optionId === item.optionId)
    if (duplicateInBatch) {
      throw new Error(`Duplicate optionId '${item.optionId}' in batch`)
    }

    // Check if optionId already exists in modifier
    const existingOption = modifier.options.find(opt => opt.optionId === item.optionId)
    if (existingOption) {
      throw new Error(`Option ID '${item.optionId}' already exists in this modifier`)
    }

    newOptions.push({
      optionId: item.optionId,
      name: item.name,
      price: item.price,
      stock: item.stock ?? undefined,
      isActive: item.isActive ?? true
    })
  }

  // Add all options to modifier
  modifier.options.push(...newOptions)
  await modifier.save()

  return { options: newOptions }
}

export async function batchUpdateModifierItems(params: {
  modifierId: string
  items: Array<{
    optionId: string
    name?: string
    price?: number
    stock?: number
    isActive?: boolean
  }>
}) {
  const { modifierId, items } = params
  
  requireString(modifierId, "modifierId")
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("items must be a non-empty array")
  }

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  const updatedOptions: IModifierOption[] = []
  const notFoundOptions: string[] = []

  for (const [index, item] of items.entries()) {
    requireString(item.optionId, `items[${index}].optionId`)
    if (item.name !== undefined) requireString(item.name, `items[${index}].name`)
    if (item.price !== undefined) requireNumber(item.price, `items[${index}].price`)
    if (item.stock !== undefined) optionalNumber(item.stock, `items[${index}].stock`)
    if (item.isActive !== undefined) optionalBoolean(item.isActive, `items[${index}].isActive`)

    // Find the option to update
    const optionIndex = modifier.options.findIndex(opt => opt.optionId === item.optionId)
    if (optionIndex === -1) {
      notFoundOptions.push(item.optionId)
      continue
    }

    // Update the option
    const currentOption = modifier.options[optionIndex]
    const updatedOption: IModifierOption = {
      optionId: currentOption.optionId,
      name: item.name ?? currentOption.name,
      price: item.price ?? currentOption.price,
      stock: item.stock !== undefined ? item.stock : currentOption.stock,
      isActive: item.isActive ?? currentOption.isActive
    }

    modifier.options[optionIndex] = updatedOption
    updatedOptions.push(updatedOption)
  }

  await modifier.save()

  return { 
    options: updatedOptions,
    updatedCount: updatedOptions.length,
    notFoundOptions
  }
}

export async function batchDeleteModifierItems(params: {
  modifierId: string
  itemIds: string[]
}) {
  const { modifierId, itemIds } = params
  
  requireString(modifierId, "modifierId")
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new Error("itemIds must be a non-empty array")
  }

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" }
  }

  const deletedOptions: IModifierOption[] = []
  const notFoundOptions: string[] = []

  for (const itemId of itemIds) {
    const optionIndex = modifier.options.findIndex(opt => opt.optionId === itemId)
    if (optionIndex === -1) {
      notFoundOptions.push(itemId)
      continue
    }

    const deletedOption = modifier.options[optionIndex]
    modifier.options.splice(optionIndex, 1)
    deletedOptions.push(deletedOption)
  }

  await modifier.save()

  return { 
    options: deletedOptions,
    deletedCount: deletedOptions.length,
    notFoundOptions
  }
}

export async function searchModifierItems(query: string, modifierId?: string, subDomain?: string, localId?: string) {
  requireString(query, "query")

  const searchQuery: FilterQuery<IModifier> = {
    $text: { $search: query },
    isActive: true
  }

  if (modifierId) {
    searchQuery._id = modifierId
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
      .filter(option => 
        option.name.toLowerCase().includes(query.toLowerCase()) ||
        option.optionId.toLowerCase().includes(query.toLowerCase())
      )
      .map(option => ({
        ...option,
        modifierId: modifier._id.toString(),
        modifierRId: modifier.rId,
        modifierName: modifier.name
      }))
  )

  return { options: matchingOptions }
}