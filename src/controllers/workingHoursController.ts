import { Request, Response, NextFunction } from 'express';
import { WorkingHoursService } from '../services/workingHoursService';
import { validateBusinessParams, validateRequestBody } from './helpers/validateBusinessParams';
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

    // Validate business parameters
    const validation = validateBusinessParams(subDomain, localId);
    if (!validation.valid) {
      return res.status(400).json(validation.error);
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
 * Create working hours for a business location
 * POST /api/v1/business/working-hours/{subDomain}/{localId}
 */
export const createWorkingHours = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const workingHoursData = req.body;

    // Validate business parameters
    const paramValidation = validateBusinessParams(subDomain, localId);
    if (!paramValidation.valid) {
      return res.status(400).json(paramValidation.error);
    }

    // Validate request body
    const bodyValidation = validateRequestBody(workingHoursData);
    if (!bodyValidation.valid) {
      return res.status(400).json({
        type: "701",
        message: "Working hours data is required",
        data: null
      });
    }

    logger.info(`Creating working hours for subDomain: ${subDomain}, localId: ${localId}`);

    const createdWorkingHours = await WorkingHoursService.createWorkingHours(
      subDomain,
      localId,
      workingHoursData
    );

    res.status(201).json({
      type: "1",
      message: "Working hours created successfully",
      data: createdWorkingHours
    });
  } catch (error: any) {
    logger.error('Error creating working hours:', error);
    
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

    // Validate business parameters
    const paramValidation = validateBusinessParams(subDomain, localId);
    if (!paramValidation.valid) {
      return res.status(400).json(paramValidation.error);
    }

    // Validate request body
    const bodyValidation = validateRequestBody(workingHoursData);
    if (!bodyValidation.valid) {
      return res.status(400).json({
        type: "701",
        message: "Working hours data is required",
        data: null
      });
    }

    logger.info(`Updating working hours for subDomain: ${subDomain}, localId: ${localId}`);

    const updatedWorkingHours = await WorkingHoursService.updateWorkingHours(
      subDomain,
      localId,
      workingHoursData
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

