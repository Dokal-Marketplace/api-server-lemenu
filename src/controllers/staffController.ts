import { Request, Response, NextFunction } from "express";
import { validationResult, body } from "express-validator";
import { Integration } from "../models/Integration";
import { StaffService } from "../services/staffService";
import logger from "../utils/logger";

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, localId } = req.params;
    
    if (!subDomain || !localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain and localId are required", 
        data: null 
      });
    }

    const roles = await StaffService.getRoles(subDomain, localId);
    
    return res.json({ type: "1", message: "Roles retrieved successfully", data: roles });
  } catch (error: any) {
    logger.error('Error getting roles:', error);
    next(error);
  }
};

export const validateCreateUserBusiness = [
  body("name").isString().notEmpty(),
  body("userId").isString().notEmpty(),
  body("subDomain").isString().notEmpty(),
  body("businessId").optional().isString(),
  body("role").optional().isString(),
  body("permissions").optional().isArray(),
];

// Staff validation middleware
export const validateCreateStaff = [
  body("name").isString().notEmpty().isLength({ min: 2, max: 100 }),
  body("email").isEmail().normalizeEmail(),
  body("phone").isString().notEmpty().matches(/^[\+]?[0-9\s\-\(\)]{7,15}$/),
  body("password").isString().isLength({ min: 6 }),
  body("role").isString().notEmpty(),
  body("dni").optional().isString().isLength({ max: 20 }),
  body("assignedLocals").optional().isArray(),
  body("assignedLocals.*.localId").optional().isString(),
  body("assignedLocals.*.localName").optional().isString(),
  body("assignedLocals.*.role").optional().isString(),
  body("assignedLocals.*.permissions").optional().isArray(),
  body("workingHours").optional().isObject(),
  body("salary").optional().isObject(),
  body("emergencyContact").optional().isObject(),
  body("emergencyContact.name").optional().isString(),
  body("emergencyContact.relationship").optional().isString(),
  body("emergencyContact.phone").optional().isString(),
  body("emergencyContact.email").optional().isEmail(),
];

export const validateUpdateStaff = [
  body("name").optional().isString().isLength({ min: 2, max: 100 }),
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().isString().matches(/^[\+]?[0-9\s\-\(\)]{7,15}$/),
  body("role").optional().isString(),
  body("dni").optional().isString().isLength({ max: 20 }),
  body("isActive").optional().isBoolean(),
  body("assignedLocals").optional().isArray(),
  body("assignedLocals.*.localId").optional().isString(),
  body("assignedLocals.*.localName").optional().isString(),
  body("assignedLocals.*.role").optional().isString(),
  body("assignedLocals.*.permissions").optional().isArray(),
  body("workingHours").optional().isObject(),
  body("salary").optional().isObject(),
  body("emergencyContact").optional().isObject(),
  body("emergencyContact.name").optional().isString(),
  body("emergencyContact.relationship").optional().isString(),
  body("emergencyContact.phone").optional().isString(),
  body("emergencyContact.email").optional().isEmail(),
];

export const createUserBusiness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ type: "701", message: "Malformed JSON", data: errors.array() });
    }

    const { name, userId, subDomain, businessId, role = "staff", permissions = [] } = req.body as {
      name: string;
      userId: string;
      subDomain: string;
      businessId?: string;
      role?: string;
      permissions?: string[];
    };

    // Create integration document representing the user-business relationship
    const integration = await Integration.create({
      userId,
      businessId: businessId ?? "",
      subDomain,
      name,
      role,
      permissions,
      isActive: true,
      isPrimary: false,
      integrationStatus: "active",
    } as any);

    return res.status(201).json({ type: "1", message: "User-Business relationship created", data: integration });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ type: "3", message: "Relationship already exists", data: null });
    }
    logger.error('Error creating user-business relationship:', error);
    next(error);
  }
};

// Staff Management Functions

export const getStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, localId } = req.params;
    const { role, isActive, search, page = 1, limit = 10 } = req.query;

    if (!subDomain) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain is required", 
        data: null 
      });
    }

    const filters: any = {
      subDomain,
      role: role as string,
      search: search as string,
      page: Number(page) || 1,
      limit: Number(limit) || 10
    };
    if (typeof localId === 'string') filters.localId = localId;
    if (typeof isActive === 'string') filters.isActive = (isActive as string) === 'true';

    const result = await StaffService.getStaff(filters);

    return res.json({ 
      type: "1", 
      message: "Staff retrieved successfully", 
      data: result
    });
  } catch (error: any) {
    logger.error('Error getting staff:', error);
    next(error);
  }
};

export const getStaffById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, staffId, localId } = req.params;

    if (!subDomain || !staffId || !localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain, staffId, and localId are required", 
        data: null 
      });
    }

    const staff = await StaffService.getStaffById(staffId, subDomain, localId);

    return res.json({ 
      type: "1", 
      message: "Staff member retrieved successfully", 
      data: staff 
    });
  } catch (error: any) {
    if (error.message === 'Staff member not found') {
      return res.status(404).json({ 
        type: "3", 
        message: error.message, 
        data: null 
      });
    }
    logger.error('Error getting staff by ID:', error);
    next(error);
  }
};

export const createStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ type: "701", message: "Validation errors", data: errors.array() });
    }

    const { subDomain, localId } = req.params;
    const staffData = req.body;

    if (!subDomain || !localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain and localId are required", 
        data: null 
      });
    }

    const createdStaff = await StaffService.createStaff(staffData, subDomain, localId);

    return res.status(201).json({ 
      type: "1", 
      message: "Staff member created successfully", 
      data: createdStaff 
    });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ type: "3", message: error.message, data: null });
    }
    if (error.message.includes('invalid')) {
      return res.status(400).json({ type: "701", message: error.message, data: null });
    }
    if (error.code === 11000) {
      return res.status(409).json({ type: "3", message: "Staff member already exists", data: null });
    }
    logger.error('Error creating staff:', error);
    next(error);
  }
};

export const updateStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ type: "701", message: "Validation errors", data: errors.array() });
    }

    const { subDomain, staffId, localId } = req.params;
    const updateData = req.body;

    if (!subDomain || !staffId || !localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain, staffId, and localId are required", 
        data: null 
      });
    }

    const updatedStaff = await StaffService.updateStaff(staffId, updateData, subDomain, localId);

    return res.json({ 
      type: "1", 
      message: "Staff member updated successfully", 
      data: updatedStaff 
    });
  } catch (error: any) {
    if (error.message === 'Staff member not found') {
      return res.status(404).json({ 
        type: "3", 
        message: error.message, 
        data: null 
      });
    }
    if (error.message.includes('already exists')) {
      return res.status(409).json({ type: "3", message: error.message, data: null });
    }
    if (error.message.includes('invalid')) {
      return res.status(400).json({ type: "701", message: error.message, data: null });
    }
    logger.error('Error updating staff:', error);
    next(error);
  }
};

export const deleteStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, staffId, localId } = req.params;

    if (!subDomain || !staffId || !localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain, staffId, and localId are required", 
        data: null 
      });
    }

    await StaffService.deleteStaff(staffId, subDomain, localId);

    return res.json({ 
      type: "1", 
      message: "Staff member deleted successfully", 
      data: null 
    });
  } catch (error: any) {
    if (error.message === 'Staff member not found') {
      return res.status(404).json({ 
        type: "3", 
        message: error.message, 
        data: null 
      });
    }
    logger.error('Error deleting staff:', error);
    next(error);
  }
};

export const getStaffByLocal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, localId } = req.params;
    const { role, isActive, search } = req.query;

    if (!subDomain || !localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain and localId are required", 
        data: null 
      });
    }

    const filters: any = {
      subDomain,
      localId: localId as string,
      role: role as string,
      search: search as string
    };
    if (typeof isActive === 'string') {
      filters.isActive = (isActive as string) === 'true';
    }

    const result = await StaffService.getStaff(filters);

    return res.json({ 
      type: "1", 
      message: "Staff for local retrieved successfully", 
      data: result.staff
    });
  } catch (error: any) {
    logger.error('Error getting staff by local:', error);
    next(error);
  }
};

export const getStaffStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, localId } = req.params;

    if (!subDomain) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain is required", 
        data: null 
      });
    }

    const stats = await StaffService.getStaffStats(subDomain, localId);

    return res.json({ 
      type: "1", 
      message: "Staff statistics retrieved successfully", 
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting staff stats:', error);
    next(error);
  }
};

export const searchStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, localId } = req.params;
    const { q } = req.query;

    if (!subDomain || !q) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain and search query (q) are required", 
        data: null 
      });
    }

    const localIdParam = typeof localId === 'string' ? localId : undefined;
    const staff = await StaffService.searchStaff(q as string, subDomain, localIdParam);
    return res.json({ 
      type: "1", 
      message: "Staff search completed successfully", 
      data: staff
    });
  } catch (error: any) {
    logger.error('Error searching staff:', error);
    next(error);
  }
};

export const getStaffPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, staffId, localId } = req.params;

    if (!subDomain || !staffId || !localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain, staffId, and localId are required", 
        data: null 
      });
    }

    const performance = await StaffService.getStaffPerformance(staffId, subDomain, localId);

    return res.json({ 
      type: "1", 
      message: "Staff performance retrieved successfully", 
      data: performance
    });
  } catch (error: any) {
    if (error.message === 'Staff member not found') {
      return res.status(404).json({ 
        type: "3", 
        message: error.message, 
        data: null 
      });
    }
    logger.error('Error getting staff performance:', error);
    next(error);
  }
};

export const updateStaffPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subDomain, staffId, localId } = req.params;
    const performanceData = req.body;

    if (!subDomain || !staffId || !localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "subDomain, staffId, and localId are required", 
        data: null 
      });
    }

    const updatedPerformance = await StaffService.updateStaffPerformance(staffId, performanceData, subDomain, localId);

    return res.json({ 
      type: "1", 
      message: "Staff performance updated successfully", 
      data: updatedPerformance
    });
  } catch (error: any) {
    if (error.message === 'Staff member not found') {
      return res.status(404).json({ 
        type: "3", 
        message: error.message, 
        data: null 
      });
    }
    logger.error('Error updating staff performance:', error);
    next(error);
  }
};


