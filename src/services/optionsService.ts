import { FilterQuery, Types } from "mongoose";
import { Options, IOption } from "../models/Options";
import { Modifier } from "../models/Modifier";
import logger from "../utils/logger";

// Validation helpers
function requireString(value: any, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
}

function optionalString(value: any, field: string) {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`${field} must be string`);
  }
}

function requireNumber(value: any, field: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${field} is required and must be number`);
  }
}

function optionalNumber(value: any, field: string) {
  if (value !== undefined && (typeof value !== "number" || Number.isNaN(value))) {
    throw new Error(`${field} must be number`);
  }
}

function optionalBoolean(value: any, field: string) {
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`${field} must be boolean`);
  }
}

export interface CreateOptionParams {
  subDomain: string;
  localId: string;
  payload: {
    rId?: string;
    name: string;
    description?: string;
    price: number;
    stock?: number;
    isActive?: boolean;
    category?: string;
    modifierId?: string;
    imageUrl?: string;
    nutritionalInfo?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
      sugar?: number;
    };
    allergens?: string[];
    tags?: string[];
    sortOrder?: number;
  };
}

export async function createOption(params: CreateOptionParams) {
  try {
    const { subDomain, localId, payload } = params;
    
    // Validate required fields
    requireString(payload.name, "name");
    requireNumber(payload.price, "price");
    optionalString(payload.description, "description");
    optionalString(payload.category, "category");
    optionalString(payload.modifierId, "modifierId");
    optionalString(payload.imageUrl, "imageUrl");
    optionalNumber(payload.stock, "stock");
    optionalBoolean(payload.isActive, "isActive");
    optionalNumber(payload.sortOrder, "sortOrder");

    // Validate modifierId if provided
    if (payload.modifierId) {
      const modifier = await Modifier.findOne({ rId: payload.modifierId }).lean();
      if (!modifier) {
        return { error: "Invalid modifierId" };
      }
    }

    const option = await Options.create({
      rId: payload.rId || `OPT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock,
      isActive: payload.isActive ?? true,
      category: payload.category,
      modifierId: payload.modifierId,
      subDomain: subDomain.toLowerCase(),
      localId,
      imageUrl: payload.imageUrl,
      nutritionalInfo: payload.nutritionalInfo,
      allergens: Array.isArray(payload.allergens) ? payload.allergens : [],
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      sortOrder: payload.sortOrder ?? 0
    });

    logger.info('Option created successfully', { 
      optionId: option._id, 
      rId: option.rId, 
      name: option.name 
    });

    return { option };
  } catch (error) {
    logger.error('Error creating option', { error, params });
    throw error;
  }
}

export interface ListOptionsParams {
  subDomain?: string;
  localId?: string;
  category?: string;
  modifierId?: string;
  isActive?: boolean;
  q?: string;
  page?: number | string;
  limit?: number | string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function listOptions(params: ListOptionsParams) {
  try {
    const query: FilterQuery<IOption> = {};

    if (params.subDomain) {
      (query as any).subDomain = String(params.subDomain).toLowerCase();
    }
    if (params.localId) {
      (query as any).localId = params.localId;
    }
    if (params.category) {
      (query as any).category = params.category;
    }
    if (params.modifierId) {
      (query as any).modifierId = params.modifierId;
    }
    if (params.isActive !== undefined) {
      (query as any).isActive = params.isActive;
    }
    if (params.q) {
      (query as any).$text = { $search: params.q };
    }
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      (query as any).price = {};
      if (params.minPrice !== undefined) (query as any).price.$gte = params.minPrice;
      if (params.maxPrice !== undefined) (query as any).price.$lte = params.maxPrice;
    }

    const page = Math.max(1, Number(params.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit ?? 20)));
    const skip = (page - 1) * limit;

    const sort: Record<string, 1 | -1> = {};
    if (params.sort) {
      const parts = String(params.sort).split(",");
      for (const p of parts) {
        const key = p.replace(/^[-+]/, "");
        const dir: 1 | -1 = p.startsWith("-") ? -1 : 1;
        sort[key] = dir;
      }
    } else {
      sort.sortOrder = 1;
      sort.name = 1;
    }

    const [total, items] = await Promise.all([
      Options.countDocuments(query),
      Options.find(query).sort(sort).skip(skip).limit(limit).lean()
    ]);

    const totalPages = Math.ceil(total / limit);
    return { items, pagination: { page, limit, total, totalPages } };
  } catch (error) {
    logger.error('Error listing options', { error, params });
    throw error;
  }
}

export async function getOptionById(optionId: string) {
  try {
    const option = await Options.findById(optionId).lean();
    if (!option) {
      return { error: "Option not found" };
    }
    return { option };
  } catch (error) {
    logger.error('Error getting option by ID', { error, optionId });
    throw error;
  }
}

export async function getOptionByRId(rId: string) {
  try {
    const option = await Options.findOne({ rId }).lean();
    if (!option) {
      return { error: "Option not found" };
    }
    return { option };
  } catch (error) {
    logger.error('Error getting option by rId', { error, rId });
    throw error;
  }
}

export async function updateOptionById(optionId: string, update: any) {
  try {
    // Validate modifierId if provided
    if (update.modifierId) {
      const modifier = await Modifier.findOne({ rId: update.modifierId }).lean();
      if (!modifier) {
        return { error: "Invalid modifierId" };
      }
    }

    const option = await Options.findByIdAndUpdate(optionId, update, { new: true });
    if (!option) {
      return { error: "Option not found" };
    }

    logger.info('Option updated successfully', { 
      optionId: option._id, 
      rId: option.rId, 
      name: option.name 
    });

    return { option };
  } catch (error) {
    logger.error('Error updating option', { error, optionId, update });
    throw error;
  }
}

export async function deleteOptionById(optionId: string) {
  try {
    const option = await Options.findByIdAndDelete(optionId);
    if (!option) {
      return { error: "Option not found" };
    }

    logger.info('Option deleted successfully', { 
      optionId: option._id, 
      rId: option.rId, 
      name: option.name 
    });

    return { deleted: option };
  } catch (error) {
    logger.error('Error deleting option', { error, optionId });
    throw error;
  }
}

export async function batchDeleteOptionsByRIds(rIds: string[]) {
  try {
    const result = await Options.deleteMany({ rId: { $in: rIds } });
    
    logger.info('Options batch deleted', { 
      deletedCount: result.deletedCount, 
      rIds 
    });

    return { deletedCount: result.deletedCount };
  } catch (error) {
    logger.error('Error batch deleting options', { error, rIds });
    throw error;
  }
}

export async function toggleOptionActive(optionId: string) {
  try {
    const option = await Options.findById(optionId);
    if (!option) {
      return { error: "Option not found" };
    }

    option.isActive = !option.isActive;
    await option.save();

    logger.info('Option active status toggled', { 
      optionId: option._id, 
      rId: option.rId, 
      isActive: option.isActive 
    });

    return { option };
  } catch (error) {
    logger.error('Error toggling option active status', { error, optionId });
    throw error;
  }
}

export async function updateOptionStock(optionId: string, stock: number) {
  try {
    if (typeof stock !== "number" || stock < 0) {
      return { error: "Stock must be a non-negative number" };
    }

    const option = await Options.findByIdAndUpdate(
      optionId, 
      { stock }, 
      { new: true }
    );
    
    if (!option) {
      return { error: "Option not found" };
    }

    logger.info('Option stock updated', { 
      optionId: option._id, 
      rId: option.rId, 
      stock: option.stock 
    });

    return { option };
  } catch (error) {
    logger.error('Error updating option stock', { error, optionId, stock });
    throw error;
  }
}

export async function getOptionsByCategory(category: string, subDomain?: string, localId?: string) {
  try {
    const query: FilterQuery<IOption> = { category, isActive: true };
    if (subDomain) (query as any).subDomain = subDomain.toLowerCase();
    if (localId) (query as any).localId = localId;

    const options = await Options.find(query).sort({ sortOrder: 1, name: 1 }).lean();
    return { options };
  } catch (error) {
    logger.error('Error getting options by category', { error, category, subDomain, localId });
    throw error;
  }
}

export async function getOptionsByModifier(modifierId: string) {
  try {
    const options = await Options.find({ modifierId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return { options };
  } catch (error) {
    logger.error('Error getting options by modifier', { error, modifierId });
    throw error;
  }
}

export async function createMultipleOptions(params: {
  subDomain: string;
  localId: string;
  options: CreateOptionParams['payload'][];
}) {
  try {
    const { subDomain, localId, options } = params;

    if (!Array.isArray(options) || options.length === 0) {
      return { error: "Options array is required and must not be empty" };
    }

    const createdOptions = [];
    const errors = [];

    for (let i = 0; i < options.length; i++) {
      try {
        const result = await createOption({
          subDomain,
          localId,
          payload: options[i]
        });

        if (result.error) {
          errors.push({ index: i, error: result.error });
        } else {
          createdOptions.push(result.option);
        }
      } catch (error) {
        errors.push({ index: i, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    logger.info('Multiple options creation completed', { 
      created: createdOptions.length, 
      errors: errors.length 
    });

    return { 
      options: createdOptions, 
      errors: errors.length > 0 ? errors : undefined 
    };
  } catch (error) {
    logger.error('Error creating multiple options', { error, params });
    throw error;
  }
}
