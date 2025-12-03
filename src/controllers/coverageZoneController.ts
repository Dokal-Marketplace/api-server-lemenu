import { Request, Response, NextFunction } from "express";
import { DeliveryZone } from "../models/DeliveryZone";
import logger from "../utils/logger";

/**
 * Create complex coverage zone
 * POST /coverage-zone
 * Creates a coverage zone defined by a set of coordinates (polygon)
 */
export const createComplexCoverageZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, coordinates, deliveryFee, subDomain, localId, zoneName, minimumOrder, estimatedTime } = req.body;

    // Validate required fields
    if (!type || type !== 'complex') {
      return res.status(400).json({
        type: "701",
        message: "Type must be 'complex'",
        data: null
      });
    }

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return res.status(400).json({
        type: "701",
        message: "Coordinates array with at least 3 points is required for complex zones",
        data: null
      });
    }

    if (deliveryFee === undefined || deliveryFee === null) {
      return res.status(400).json({
        type: "701",
        message: "Delivery fee is required",
        data: null
      });
    }

    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "701",
        message: "subDomain and localId are required",
        data: null
      });
    }

    // Create the complex coverage zone
    const coverageZone = await DeliveryZone.create({
      zoneName: zoneName || "Coverage Zone",
      deliveryCost: deliveryFee,
      minimumOrder: minimumOrder || 0,
      estimatedTime: estimatedTime || 30,
      allowsFreeDelivery: false,
      coordinates: coordinates,
      localId: localId,
      status: '1',
      type: 'polygon', // Map 'complex' to 'polygon' in the model
      subDomain: subDomain.toLowerCase(),
      isActive: true
    });

    return res.status(201).json({
      type: "1",
      message: "Complex coverage zone created successfully",
      data: coverageZone
    });
  } catch (error: any) {
    logger.error('Error creating complex coverage zone:', error);
    next(error);
  }
};

/**
 * Create simple coverage zone
 * POST /coverage-zone/simple
 * Creates a coverage zone defined by a radius and center point
 */
export const createSimpleCoverageZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, radius, center, deliveryFee, subDomain, localId, zoneName, minimumOrder, estimatedTime } = req.body;

    // Validate required fields
    if (!type || type !== 'simple') {
      return res.status(400).json({
        type: "701",
        message: "Type must be 'simple'",
        data: null
      });
    }

    if (!radius || typeof radius !== 'number') {
      return res.status(400).json({
        type: "701",
        message: "Radius (number) is required for simple zones",
        data: null
      });
    }

    if (!center || typeof center !== 'object' || !center.latitude || !center.longitude) {
      return res.status(400).json({
        type: "701",
        message: "Center point with latitude and longitude is required",
        data: null
      });
    }

    if (deliveryFee === undefined || deliveryFee === null) {
      return res.status(400).json({
        type: "701",
        message: "Delivery fee is required",
        data: null
      });
    }

    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "701",
        message: "subDomain and localId are required",
        data: null
      });
    }

    // For a simple circular zone, we'll store the center and radius
    // The coordinates will be a single point representing the center
    const coverageZone = await DeliveryZone.create({
      zoneName: zoneName || "Simple Coverage Zone",
      deliveryCost: deliveryFee,
      minimumOrder: minimumOrder || 0,
      estimatedTime: estimatedTime || 30,
      allowsFreeDelivery: false,
      coordinates: [center], // Store center point
      localId: localId,
      status: '1',
      type: 'simple',
      subDomain: subDomain.toLowerCase(),
      isActive: true,
      // Note: radius could be stored in a custom field if needed
      // For now, we're using the simple type to indicate radius-based zones
    });

    return res.status(201).json({
      type: "1",
      message: "Simple coverage zone created successfully",
      data: {
        ...coverageZone.toObject(),
        radius: radius // Include radius in response
      }
    });
  } catch (error: any) {
    logger.error('Error creating simple coverage zone:', error);
    next(error);
  }
};
