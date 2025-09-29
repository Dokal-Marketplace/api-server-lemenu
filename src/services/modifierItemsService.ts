import { Modifier } from "../models/Modifier"

// Simple validators
function requireString(value: any, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`)
}

function requireNumber(value: any, field: string) {
  if (typeof value !== "number" || Number.isNaN(value)) throw new Error(`${field} is required and must be number`)
}

function optionalNumber(value: any, field: string) {
  if (value !== undefined && (typeof value !== "number" || Number.isNaN(value))) throw new Error(`${field} must be number`)
}

function optionalBoolean(value: any, field: string) {
  if (value !== undefined && typeof value !== "boolean") throw new Error(`${field} must be boolean`)
}

export async function createModifierItem(data: {
  modifierId: string
  optionId: string
  name: string
  price: number
  stock?: number
  isActive?: boolean
}) {
  const { modifierId, optionId, name, price, stock, isActive = true } = data
  
  requireString(optionId, "optionId")
  requireString(name, "name")
  requireNumber(price, "price")
  optionalNumber(stock, "stock")
  optionalBoolean(isActive, "isActive")

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" as const }
  }

  // Check if optionId already exists
  const existingOption = modifier.options.find(opt => opt.optionId === optionId)
  if (existingOption) {
    return { error: "Option ID already exists in this modifier" as const }
  }

  // Create new option
  const newOption: any = {
    optionId,
    name,
    price,
    stock: stock ?? null,
    isActive
  }

  // Add option to modifier
  modifier.options.push(newOption)
  await modifier.save()

  return { modifier, option: newOption }
}

export async function updateModifierItem(data: {
  modifierId: string
  itemId: string
  updates: {
    name?: string
    price?: number
    stock?: number
    isActive?: boolean
  }
}) {
  const { modifierId, itemId, updates } = data

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" as const }
  }

  // Find the option to update
  const optionIndex = modifier.options.findIndex(opt => opt.optionId === itemId)
  if (optionIndex === -1) {
    return { error: "Modifier item not found" as const }
  }

  // Validate updates
  if (updates.name !== undefined) requireString(updates.name, "name")
  if (updates.price !== undefined) requireNumber(updates.price, "price")
  if (updates.stock !== undefined) optionalNumber(updates.stock, "stock")
  if (updates.isActive !== undefined) optionalBoolean(updates.isActive, "isActive")

  // Update the option
  const option = modifier.options[optionIndex]
  Object.assign(option, updates)
  
  await modifier.save()

  return { modifier, option }
}

export async function deleteModifierItem(data: {
  modifierId: string
  itemId: string
}) {
  const { modifierId, itemId } = data

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" as const }
  }

  // Find the option to delete
  const optionIndex = modifier.options.findIndex(opt => opt.optionId === itemId)
  if (optionIndex === -1) {
    return { error: "Modifier item not found" as const }
  }

  // Remove the option
  const deletedOption = modifier.options.splice(optionIndex, 1)[0]
  await modifier.save()

  return { modifier, deletedOption }
}

export async function getModifierItem(data: {
  modifierId: string
  itemId: string
}) {
  const { modifierId, itemId } = data

  // Check if modifier exists
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" as const }
  }

  // Find the option
  const option = modifier.options.find(opt => opt.optionId === itemId)
  if (!option) {
    return { error: "Modifier item not found" as const }
  }

  return { modifier, option }
}

export async function getAllModifierItems(modifierId: string) {
  const modifier = await Modifier.findById(modifierId)
  if (!modifier) {
    return { error: "Modifier not found" as const }
  }

  return { modifier, options: modifier.options }
}

export async function getModifierItemsBySubDomainAndLocal(subDomain: string, localId: string) {
  const modifiers = await Modifier.find({
    subDomain: subDomain.toLowerCase(),
    localsId: { $in: [localId] },
    isActive: true
  }).lean()

  const allOptions = modifiers.flatMap(modifier => 
    modifier.options.map(option => ({
      ...option,
      modifierId: modifier._id,
      modifierName: modifier.name,
      modifierRId: modifier.rId
    }))
  )

  return { options: allOptions, modifiers }
}
