import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import {
  MetaCatalogService,
  CreateCatalogParams,
  UpdateCatalogParams,
  CreateProductParams,
  UpdateProductParams,
  BatchProductOperation,
  AssignUserToCatalogParams,
  CatalogTask,
} from '../services/whatsapp/metaCatalogService';
import { createValidationError, createServerError } from '../utils/whatsappErrors';

/**
 * Extract business context from request
 */
const getBusinessContext = (req: Request): { subDomain: string; localId?: string } => {
  // Priority 1: Query parameters
  if (req.query.subDomain) {
    return {
      subDomain: req.query.subDomain as string,
      localId: req.query.localId as string | undefined,
    };
  }

  // Priority 2: Request body
  if (req.body.subDomain) {
    return {
      subDomain: req.body.subDomain,
      localId: req.body.localId,
    };
  }

  // Priority 3: From authenticated user's business
  const user = (req as any).user;
  if (user && user.business) {
    return {
      subDomain: user.business.subDomain,
      localId: user.business.localId,
    };
  }

  throw createValidationError('Business context (subDomain) is required');
};

/**
 * Get all catalogs owned by the business
 * GET /api/v1/whatsapp/catalogs
 */
export const getCatalogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const result = await MetaCatalogService.getCatalogs(subDomain, localId);

    res.json({
      type: '1',
      message: 'Catalogs retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting catalogs:', error);
    next(createServerError(error.message || 'Failed to get catalogs', error));
  }
};

/**
 * Get a specific catalog by ID
 * GET /api/v1/whatsapp/catalogs/:catalogId
 */
export const getCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.params;

    if (!catalogId) {
      return next(createValidationError('Missing catalogId parameter'));
    }

    const result = await MetaCatalogService.getCatalog(catalogId, subDomain, localId);

    res.json({
      type: '1',
      message: 'Catalog retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting catalog:', error);
    next(createServerError(error.message || 'Failed to get catalog', error));
  }
};

/**
 * Create a new product catalog
 * POST /api/v1/whatsapp/catalogs
 */
export const createCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { name, vertical, defaultImageUrl, fallbackImageUrl } = req.body;

    if (!name) {
      return next(createValidationError('Missing required field: name'));
    }

    const params: CreateCatalogParams = {
      name,
      vertical,
      defaultImageUrl,
      fallbackImageUrl,
    };

    const result = await MetaCatalogService.createCatalog(params, subDomain, localId);

    res.status(201).json({
      type: '1',
      message: 'Catalog created successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error creating catalog:', error);
    next(createServerError(error.message || 'Failed to create catalog', error));
  }
};

/**
 * Update an existing catalog
 * PUT /api/v1/whatsapp/catalogs/:catalogId
 */
export const updateCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.params;
    const { name, defaultImageUrl, fallbackImageUrl } = req.body;

    if (!catalogId) {
      return next(createValidationError('Missing catalogId parameter'));
    }

    const params: UpdateCatalogParams = {
      name,
      defaultImageUrl,
      fallbackImageUrl,
    };

    const result = await MetaCatalogService.updateCatalog(
      catalogId,
      params,
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'Catalog updated successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error updating catalog:', error);
    next(createServerError(error.message || 'Failed to update catalog', error));
  }
};

/**
 * Delete a catalog
 * DELETE /api/v1/whatsapp/catalogs/:catalogId
 */
export const deleteCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.params;
    const { allowDeleteWithLiveProductSet } = req.query;

    if (!catalogId) {
      return next(createValidationError('Missing catalogId parameter'));
    }

    const result = await MetaCatalogService.deleteCatalog(
      catalogId,
      subDomain,
      allowDeleteWithLiveProductSet === 'true',
      localId
    );

    res.json({
      type: '1',
      message: 'Catalog deleted successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error deleting catalog:', error);
    next(createServerError(error.message || 'Failed to delete catalog', error));
  }
};

/**
 * Get all products in a catalog
 * GET /api/v1/whatsapp/catalogs/:catalogId/products
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.params;
    const { limit, after } = req.query;

    if (!catalogId) {
      return next(createValidationError('Missing catalogId parameter'));
    }

    const result = await MetaCatalogService.getProducts(
      catalogId,
      subDomain,
      limit ? parseInt(limit as string) : 100,
      after as string | undefined,
      localId
    );

    res.json({
      type: '1',
      message: 'Products retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting products:', error);
    next(createServerError(error.message || 'Failed to get products', error));
  }
};

/**
 * Get a specific product by retailer_id
 * GET /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId
 */
export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId, retailerId } = req.params;

    if (!catalogId || !retailerId) {
      return next(createValidationError('Missing catalogId or retailerId parameter'));
    }

    const result = await MetaCatalogService.getProduct(
      catalogId,
      retailerId,
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'Product retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting product:', error);
    next(createServerError(error.message || 'Failed to get product', error));
  }
};

/**
 * Create a product in a catalog
 * POST /api/v1/whatsapp/catalogs/:catalogId/products
 */
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.params;
    const {
      retailer_id,
      name,
      description,
      price,
      currency,
      availability,
      condition,
      image_url,
      url,
      brand,
      category,
      additional_image_urls,
    } = req.body;

    if (!catalogId) {
      return next(createValidationError('Missing catalogId parameter'));
    }

    if (!retailer_id || !name || !price || !currency) {
      return next(
        createValidationError('Missing required fields: retailer_id, name, price, currency')
      );
    }

    const params: CreateProductParams = {
      retailer_id,
      name,
      description,
      price: parseFloat(price),
      currency,
      availability,
      condition,
      image_url,
      url,
      brand,
      category,
      additional_image_urls,
    };

    const result = await MetaCatalogService.createProduct(
      catalogId,
      params,
      subDomain,
      localId
    );

    res.status(201).json({
      type: '1',
      message: 'Product created successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error creating product:', error);
    next(createServerError(error.message || 'Failed to create product', error));
  }
};

/**
 * Update a product in a catalog
 * PUT /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId
 */
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId, retailerId } = req.params;
    const {
      name,
      description,
      price,
      currency,
      availability,
      condition,
      image_url,
      url,
      brand,
      category,
      additional_image_urls,
    } = req.body;

    if (!catalogId || !retailerId) {
      return next(createValidationError('Missing catalogId or retailerId parameter'));
    }

    const params: UpdateProductParams = {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      currency,
      availability,
      condition,
      image_url,
      url,
      brand,
      category,
      additional_image_urls,
    };

    const result = await MetaCatalogService.updateProduct(
      catalogId,
      retailerId,
      params,
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'Product updated successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error updating product:', error);
    next(createServerError(error.message || 'Failed to update product', error));
  }
};

/**
 * Delete a product from a catalog
 * DELETE /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId
 */
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId, retailerId } = req.params;

    if (!catalogId || !retailerId) {
      return next(createValidationError('Missing catalogId or retailerId parameter'));
    }

    const result = await MetaCatalogService.deleteProduct(
      catalogId,
      retailerId,
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'Product deleted successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error deleting product:', error);
    next(createServerError(error.message || 'Failed to delete product', error));
  }
};

/**
 * Batch operations on products
 * POST /api/v1/whatsapp/catalogs/:catalogId/products/batch
 */
export const batchProductOperations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.params;
    const { operations } = req.body;

    if (!catalogId) {
      return next(createValidationError('Missing catalogId parameter'));
    }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return next(createValidationError('operations must be a non-empty array'));
    }

    // Validate operations
    for (const op of operations) {
      if (!op.method || !['CREATE', 'UPDATE', 'DELETE'].includes(op.method)) {
        return next(
          createValidationError('Each operation must have a valid method (CREATE, UPDATE, DELETE)')
        );
      }
      if (!op.retailer_id) {
        return next(createValidationError('Each operation must have a retailer_id'));
      }
      if (op.method !== 'DELETE' && !op.data) {
        return next(
          createValidationError('CREATE and UPDATE operations must have data field')
        );
      }
    }

    const result = await MetaCatalogService.batchProductOperations(
      catalogId,
      operations as BatchProductOperation[],
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'Batch operations completed successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error performing batch operations:', error);
    next(createServerError(error.message || 'Failed to perform batch operations', error));
  }
};

/**
 * Assign user to catalog with permissions
 * POST /api/v1/whatsapp/catalogs/:catalogId/users
 */
export const assignUserToCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.params;
    const { userId, tasks } = req.body;

    if (!catalogId) {
      return next(createValidationError('Missing catalogId parameter'));
    }

    if (!userId || !tasks) {
      return next(createValidationError('Missing required fields: userId, tasks'));
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return next(createValidationError('tasks must be a non-empty array'));
    }

    const validTasks: CatalogTask[] = ['MANAGE', 'ADVERTISE', 'MANAGE_AR', 'AA_ANALYZE'];
    for (const task of tasks) {
      if (!validTasks.includes(task)) {
        return next(
          createValidationError(
            `Invalid task: ${task}. Valid tasks are: ${validTasks.join(', ')}`
          )
        );
      }
    }

    const params: AssignUserToCatalogParams = {
      userId,
      tasks,
    };

    const result = await MetaCatalogService.assignUserToCatalog(
      catalogId,
      params,
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'User assigned to catalog successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error assigning user to catalog:', error);
    next(createServerError(error.message || 'Failed to assign user to catalog', error));
  }
};

/**
 * Remove user from catalog
 * DELETE /api/v1/whatsapp/catalogs/:catalogId/users/:userId
 */
export const removeUserFromCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId, userId } = req.params;

    if (!catalogId || !userId) {
      return next(createValidationError('Missing catalogId or userId parameter'));
    }

    const result = await MetaCatalogService.removeUserFromCatalog(
      catalogId,
      userId,
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'User removed from catalog successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error removing user from catalog:', error);
    next(createServerError(error.message || 'Failed to remove user from catalog', error));
  }
};

/**
 * Get all users assigned to a catalog
 * GET /api/v1/whatsapp/catalogs/:catalogId/users
 */
export const getCatalogUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.params;

    if (!catalogId) {
      return next(createValidationError('Missing catalogId parameter'));
    }

    const result = await MetaCatalogService.getCatalogUsers(catalogId, subDomain, localId);

    res.json({
      type: '1',
      message: 'Catalog users retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting catalog users:', error);
    next(createServerError(error.message || 'Failed to get catalog users', error));
  }
};
