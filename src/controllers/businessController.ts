// controllers/businessController.ts
import { Request, Response } from 'express';
import { BusinessService, CreateBusinessInput, UpdateBusinessInput } from '../services/services/businessService';
import { validationResult } from 'express-validator';

/**
 * Get a single business
 * GET /api/business
 * Query params: subdominio, subDomain, localId, userId
 */
export const getBusiness = async (req: Request, res: Response) => {
  try {
    const { subdominio, subDomain, localId, userId } = req.query;

    if (!subdominio && !subDomain && !localId && !userId) {
      return res.status(400).json({
        success: false,
        message: 'At least one query parameter is required: subdominio, subDomain, localId, or userId'
      });
    }

    const business = await BusinessService.getBusiness({
      subdominio: subdominio as string,
      subDomain: subDomain as string,
      localId: localId as string,
      userId: userId as string
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (error: any) {
    console.error('Error getting business:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get business locals with filters
 * GET /api/business/locals
 * Query params: departamento, provincia, distrito, acceptsDelivery, acceptsPickup, isActive
 */
export const getBusinessLocal = async (req: Request, res: Response) => {
  try {
    const {
      departamento,
      provincia,
      distrito,
      acceptsDelivery,
      acceptsPickup,
      isActive
    } = req.query;

    const filters = {
      localDepartamento: departamento as string,
      localProvincia: provincia as string,
      localDistrito: distrito as string,
      localAceptaDelivery: acceptsDelivery === 'true',
      localAceptaRecojo: acceptsPickup === 'true',
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const businesses = await BusinessService.getBusinessLocal(filters);

    res.status(200).json({
      success: true,
      data: businesses,
      count: businesses.length
    });
  } catch (error: any) {
    console.error('Error getting business locals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get businesses by owner
 * GET /api/business/owner/businesses
 * Query params: userId (required), page, limit
 * Headers: Authorization (to get userId from token)
 */
export const getBusinesses = async (req: Request, res: Response) => {
  try {
    const { userId, page, limit } = req.query;
    
    // If userId is not in query, try to get it from authenticated user
    let targetUserId = userId as string;
    if (!targetUserId && (req as any).user) {
      targetUserId = (req as any).user.id || (req as any).user._id;
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const result = await BusinessService.getBusinessesByOwner(
      targetUserId,
      {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      }
    );

    res.status(200).json({
      success: true,
      data: result.businesses,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error getting businesses by owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a complete business
 * POST /api/business/v2/create-complete
 */
export const createBusiness = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const businessData = req.body as CreateBusinessInput;

    // Validate business data
    const validation = BusinessService.validateBusinessData(businessData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business data',
        errors: validation.errors
      });
    }

    const business = await BusinessService.createBusiness(businessData);

    res.status(201).json({
      success: true,
      message: 'Business created successfully',
      data: business
    });
  } catch (error: any) {
    console.error('Error creating business:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update business local
 * PATCH /api/business/update
 * Body: business data to update
 * Query params: id, subdominio, subDomain, or localId to identify business
 */
export const updateBusinessLocal = async (req: Request, res: Response) => {
  try {
    const { id, subdominio, subDomain, localId } = req.query;
    const updates = req.body as UpdateBusinessInput;

    if (!id && !subdominio && !subDomain && !localId) {
      return res.status(400).json({
        success: false,
        message: 'At least one identifier is required: id, subdominio, subDomain, or localId'
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }

    let identifier: string;
    let identifierType: 'id' | 'subdominio' | 'subDomain' | 'localId';

    if (id) {
      identifier = id as string;
      identifierType = 'id';
    } else if (subdominio) {
      identifier = subdominio as string;
      identifierType = 'subdominio';
    } else if (subDomain) {
      identifier = subDomain as string;
      identifierType = 'subDomain';
    } else {
      identifier = localId as string;
      identifierType = 'localId';
    }

    const business = await BusinessService.updateBusiness(identifier, updates, identifierType);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      data: business
    });
  } catch (error: any) {
    console.error('Error updating business:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new local (legacy method name)
 * POST /api/business/new-local
 */
export const createLocal = async (req: Request, res: Response) => {
  try {
    const businessData = req.body as CreateBusinessInput;

    // Validate business data
    const validation = BusinessService.validateBusinessData(businessData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business data',
        errors: validation.errors
      });
    }

    const business = await BusinessService.createLocal(businessData);

    res.status(201).json({
      success: true,
      message: 'Local created successfully',
      data: business
    });
  } catch (error: any) {
    console.error('Error creating local:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Additional helper controllers that might be useful

/**
 * Delete business (soft delete)
 * DELETE /api/business/:id
 */
export const deleteBusiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const business = await BusinessService.deleteBusiness(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Business deleted successfully',
      data: business
    });
  } catch (error: any) {
    console.error('Error deleting business:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Toggle business status (open/closed)
 * PATCH /api/business/:id/status
 */
export const toggleBusinessStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estaAbiertoParaDelivery, estaAbiertoParaRecojo } = req.body;

    if (estaAbiertoParaDelivery === undefined && estaAbiertoParaRecojo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one status field is required: estaAbiertoParaDelivery or estaAbiertoParaRecojo'
      });
    }

    const business = await BusinessService.toggleBusinessStatus(id, {
      estaAbiertoParaDelivery,
      estaAbiertoParaRecojo
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Business status updated successfully',
      data: business
    });
  } catch (error: any) {
    console.error('Error updating business status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search businesses
 * GET /api/business/search
 */
export const searchBusinesses = async (req: Request, res: Response) => {
  try {
    const { q, page, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      });
    }

    const result = await BusinessService.searchBusinesses(
      q as string,
      {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      }
    );

    res.status(200).json({
      success: true,
      data: result.businesses,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error searching businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get businesses by location
 * GET /api/business/location
 */
export const getBusinessesByLocation = async (req: Request, res: Response) => {
  try {
    const result = await BusinessService.getBusinessesByLocation(
      departamento as string,
      provincia as string,
      distrito as string,
      {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      }
    );

    res.status(200).json({
      success: true,
      data: result.businesses,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error getting businesses by location:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}