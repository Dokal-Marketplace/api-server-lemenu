import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { WhatsAppFlowService } from '../services/whatsapp/whatsappFlowService';

/**
 * Extract business context from request
 */
const getBusinessContext = (req: Request): { subDomain: string; localId?: string } => {
  // Priority 1: Route parameters
  if (req.params.subDomain) {
    return {
      subDomain: req.params.subDomain,
      localId: req.params.localId
    };
  }

  // Priority 2: Query parameters
  if (req.query.subDomain) {
    return {
      subDomain: req.query.subDomain as string,
      localId: req.query.localId as string | undefined
    };
  }

  // Priority 3: Request body
  if (req.body.subDomain) {
    return {
      subDomain: req.body.subDomain,
      localId: req.body.localId
    };
  }

  throw new Error('Business context (subDomain) is required');
};

/**
 * Get product data for WhatsApp Flow
 * GET /api/v1/whatsapp/flow/product/:productId/:subDomain/:localId?
 */
export const getProductFlowData = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { subDomain, localId } = getBusinessContext(req);

    if (!productId) {
      return res.status(400).json({
        type: 'error',
        message: 'Product ID is required'
      });
    }

    logger.info('Getting product flow data', { productId, subDomain, localId });

    const result = await WhatsAppFlowService.getProductFlowData(
      productId,
      subDomain,
      localId
    );

    if (!result.success) {
      return res.status(404).json({
        type: 'error',
        message: result.error || 'Product not found',
        data: null
      });
    }

    res.json({
      type: 'success',
      message: 'Product flow data retrieved successfully',
      data: result.data
    });
  } catch (error: any) {
    logger.error('Error getting product flow data:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Calculate price for flow selections
 * POST /api/v1/whatsapp/flow/calculate-price/:subDomain/:localId?
 *
 * Body:
 * {
 *   "productId": "prod-123",
 *   "presentationId": "pres-456",
 *   "modifiers": [
 *     { "modifierId": "mod-1", "optionId": "opt-1", "quantity": 1 },
 *     { "modifierId": "mod-2", "optionId": "opt-3", "quantity": 2 }
 *   ],
 *   "quantity": 1
 * }
 */
export const calculatePrice = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { productId, presentationId, modifiers, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        type: 'error',
        message: 'Product ID is required'
      });
    }

    if (!presentationId) {
      return res.status(400).json({
        type: 'error',
        message: 'Presentation ID is required'
      });
    }

    logger.info('Calculating price for flow', {
      productId,
      presentationId,
      modifiersCount: modifiers?.length || 0,
      quantity: quantity || 1
    });

    const result = await WhatsAppFlowService.calculatePrice(
      productId,
      presentationId,
      modifiers || [],
      quantity || 1,
      subDomain,
      localId
    );

    if (!result.success) {
      return res.status(400).json({
        type: 'error',
        message: result.error || 'Failed to calculate price',
        data: null
      });
    }

    res.json({
      type: 'success',
      message: 'Price calculated successfully',
      data: result.data
    });
  } catch (error: any) {
    logger.error('Error calculating price:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Generate WhatsApp Flow template for a product
 * GET /api/v1/whatsapp/flow/template/:productId/:subDomain/:localId?
 */
export const generateFlowTemplate = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { subDomain, localId } = getBusinessContext(req);

    if (!productId) {
      return res.status(400).json({
        type: 'error',
        message: 'Product ID is required'
      });
    }

    logger.info('Generating flow template', { productId, subDomain, localId });

    const result = await WhatsAppFlowService.generateFlowTemplate(
      productId,
      subDomain,
      localId
    );

    if (!result.success) {
      return res.status(400).json({
        type: 'error',
        message: result.error || 'Failed to generate flow template',
        data: null
      });
    }

    res.json({
      type: 'success',
      message: 'Flow template generated successfully',
      data: {
        flowJson: result.flowJson
      }
    });
  } catch (error: any) {
    logger.error('Error generating flow template:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Handle WhatsApp Flow submission (order creation)
 * POST /api/v1/whatsapp/flow/submit-order/:subDomain/:localId?
 *
 * Body:
 * {
 *   "productId": "prod-123",
 *   "presentationId": "pres-456",
 *   "modifiers": [
 *     { "modifierId": "mod-1", "optionId": "opt-1", "quantity": 1 }
 *   ],
 *   "specialInstructions": "No onions please",
 *   "quantity": 2,
 *   "customerPhone": "+1234567890",
 *   "customerName": "John Doe"
 * }
 */
export const submitFlowOrder = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const {
      productId,
      presentationId,
      modifiers,
      specialInstructions,
      quantity,
      customerPhone,
      customerName
    } = req.body;

    // Validate submission
    const validation = WhatsAppFlowService.validateFlowSubmission({
      productId,
      presentationId,
      modifiers,
      specialInstructions,
      quantity
    });

    if (!validation.valid) {
      return res.status(400).json({
        type: 'error',
        message: validation.error || 'Invalid submission data'
      });
    }

    logger.info('Processing flow order submission', {
      productId,
      presentationId,
      quantity: quantity || 1,
      subDomain,
      localId
    });

    // Calculate final price
    const priceResult = await WhatsAppFlowService.calculatePrice(
      productId,
      presentationId,
      modifiers || [],
      quantity || 1,
      subDomain,
      localId
    );

    if (!priceResult.success) {
      return res.status(400).json({
        type: 'error',
        message: priceResult.error || 'Failed to calculate order price'
      });
    }

    // TODO: Integrate with order service to create actual order
    // This will be implemented when integrating with the existing order system
    // For now, return the validated order data

    const orderData = {
      productId,
      presentationId,
      modifiers: modifiers || [],
      specialInstructions: specialInstructions || '',
      quantity: quantity || 1,
      customerPhone,
      customerName,
      pricing: priceResult.data,
      subDomain,
      localId,
      source: 'whatsapp_flow',
      status: 'pending'
    };

    logger.info('Flow order validated and ready for creation', {
      total: priceResult.data?.total,
      productId
    });

    res.json({
      type: 'success',
      message: 'Order submitted successfully',
      data: {
        order: orderData,
        pricing: priceResult.data
      }
    });
  } catch (error: any) {
    logger.error('Error submitting flow order:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Deploy flow to Meta for a product
 * POST /api/v1/whatsapp/flow/deploy/:productId/:subDomain/:localId?
 */
export const deployFlow = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { subDomain, localId } = getBusinessContext(req);
    const { forceUpdate } = req.body;

    if (!productId) {
      return res.status(400).json({
        type: 'error',
        message: 'Product ID is required'
      });
    }

    logger.info('Deploying flow to Meta', { productId, subDomain, localId, forceUpdate });

    const result = await WhatsAppFlowService.deployFlowToMeta(
      productId,
      subDomain,
      localId,
      forceUpdate || false
    );

    if (!result.success) {
      return res.status(400).json({
        type: 'error',
        message: result.error || 'Failed to deploy flow',
        data: null
      });
    }

    res.json({
      type: 'success',
      message: `Flow ${result.action} successfully`,
      data: {
        flowId: result.flowId,
        action: result.action
      }
    });
  } catch (error: any) {
    logger.error('Error deploying flow:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Delete flow from Meta for a product
 * DELETE /api/v1/whatsapp/flow/deploy/:productId/:subDomain
 */
export const deleteFlow = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { subDomain } = getBusinessContext(req);

    if (!productId) {
      return res.status(400).json({
        type: 'error',
        message: 'Product ID is required'
      });
    }

    logger.info('Deleting flow from Meta', { productId, subDomain });

    const result = await WhatsAppFlowService.deleteFlowFromMeta(productId, subDomain);

    if (!result.success) {
      return res.status(400).json({
        type: 'error',
        message: result.error || 'Failed to delete flow',
        data: null
      });
    }

    res.json({
      type: 'success',
      message: 'Flow deleted successfully',
      data: null
    });
  } catch (error: any) {
    logger.error('Error deleting flow:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Deploy flows for all products in a category
 * POST /api/v1/whatsapp/flow/deploy-category/:categoryId/:subDomain/:localId?
 */
export const deployFlowsForCategory = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { categoryId } = req.params;
    const { subDomain, localId } = getBusinessContext(req);

    if (!categoryId) {
      return res.status(400).json({
        type: 'error',
        message: 'Category ID is required'
      });
    }

    logger.info('Deploying flows for category', { categoryId, subDomain, localId });

    const result = await WhatsAppFlowService.deployFlowsForCategory(
      categoryId,
      subDomain,
      localId
    );

    res.json({
      type: result.success ? 'success' : 'partial',
      message: result.success
        ? `Successfully deployed ${result.deployed} flows`
        : `Deployed ${result.deployed} flows with ${result.failed} failures`,
      data: {
        deployed: result.deployed,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        errors: result.errors
      }
    });
  } catch (error: any) {
    logger.error('Error deploying category flows:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get flow ID for a product
 * GET /api/v1/whatsapp/flow/flow-id/:productId/:subDomain
 */
export const getFlowId = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { subDomain } = getBusinessContext(req);

    if (!productId) {
      return res.status(400).json({
        type: 'error',
        message: 'Product ID is required'
      });
    }

    const flowId = await WhatsAppFlowService.getFlowIdForProduct(productId, subDomain);

    res.json({
      type: 'success',
      message: flowId ? 'Flow ID retrieved' : 'No flow found for product',
      data: {
        flowId,
        hasFlow: !!flowId
      }
    });
  } catch (error: any) {
    logger.error('Error getting flow ID:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
