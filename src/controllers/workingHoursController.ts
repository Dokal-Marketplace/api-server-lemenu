import { Request, Response, NextFunction } from 'express';
import { WorkingHoursService } from '../services/workingHoursService';
import logger from '../utils/logger';

/**
 * Get working hours for a business location
 * GET /api/v1/business/working-hours/{subDomain}/{localId}
 */
export const getWorkingHours = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;

    // Validate required parameters
    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "701",
        message: "subDomain and localId are required",
        data: null
      });
    }

    // Validate subdomain format
    const subDomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!subDomainRegex.test(subDomain)) {
      return res.status(400).json({
        type: "701",
        message: "Invalid subDomain format",
        data: null
      });
    }

    logger.info(`Getting working hours for subDomain: ${subDomain}, localId: ${localId}`);

    const workingHours = await WorkingHoursService.getWorkingHours(subDomain, localId);

    res.json({
      type: "1",
      message: "Working hours retrieved successfully",
      data: workingHours
    });
  } catch (error: any) {
    logger.error('Error getting working hours:', error);
    next(error);
  }
};

/**
 * Update working hours for a business location
 * PATCH /api/v1/business/working-hours/{subDomain}/{localId}
 */
export const updateWorkingHours = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const workingHoursData = req.body;

    // Validate required parameters
    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "701",
        message: "subDomain and localId are required",
        data: null
      });
    }

    // Validate subdomain format
    const subDomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!subDomainRegex.test(subDomain)) {
      return res.status(400).json({
        type: "701",
        message: "Invalid subDomain format",
        data: null
      });
    }

    // Check if request body is provided
    if (!workingHoursData || Object.keys(workingHoursData).length === 0) {
      return res.status(400).json({
        type: "701",
        message: "Working hours data is required",
        data: null
      });
    }

    logger.info(`Updating working hours for subDomain: ${subDomain}, localId: ${localId}`);

    // Check if the request is in legacy format and convert if needed
    let workingHours: any = workingHoursData;
    if (workingHoursData.horarioParaDelivery || workingHoursData.horarioParaRecojo) {
      logger.info('Converting legacy format to new format');
      workingHours = WorkingHoursService.convertFromLegacy(workingHoursData);
    }

    const updatedWorkingHours = await WorkingHoursService.updateWorkingHours(
      subDomain,
      localId,
      workingHours
    );

    res.json({
      type: "1",
      message: "Working hours updated successfully",
      data: updatedWorkingHours
    });
  } catch (error: any) {
    logger.error('Error updating working hours:', error);
    
    // Handle validation errors
    if (error.message.includes('Missing required field') || 
        error.message.includes('must be') ||
        error.message.includes('Invalid')) {
      return res.status(400).json({
        type: "701",
        message: error.message,
        data: null
      });
    }
    
    next(error);
  }
};

