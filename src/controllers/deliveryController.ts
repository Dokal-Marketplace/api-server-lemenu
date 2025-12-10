import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { deliveryService } from "../services/deliveryService"

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;

    const deliveryData = await deliveryService.getAllDeliveryData(subDomain, localId);
    
    res.json({
      type: "1",
      message: "Success",
      data: deliveryData
    });
  } catch (error) {
    logger.error("Error getting all delivery data:", error);
    next(error);
  }
}

export const getDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { driverId, subDomain, localId } = req.params;

    const driver = await deliveryService.getDriverById(driverId, subDomain, localId);
    
    if (!driver) {
      return res.status(404).json({ 
        type: "3", 
        message: "Driver not found",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Success",
      data: driver
    });
  } catch (error) {
    logger.error("Error getting driver:", error);
    next(error);
  }
}

export const getCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const activeOnly = req.query.activeOnly !== 'false';

    const companies = await deliveryService.getCompanies(subDomain, localId, activeOnly);
    
    res.json({
      type: "1",
      message: "Success",
      data: companies
    });
  } catch (error) {
    logger.error("Error getting companies:", error);
    next(error);
  }
}

export const updateDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { driverId, subDomain, localId } = req.params;
    const updateData = req.body;

    // Verify driver belongs to subdomain
    const existingDriver = await deliveryService.getDriverById(driverId, subDomain, localId);
    if (!existingDriver) {
      return res.status(404).json({ 
        type: "3", 
        message: "Driver not found",
        data: null
      });
    }

    const updatedDriver = await deliveryService.updateDriver(driverId, updateData);
    
    res.json({
      type: "1",
      message: "Driver updated successfully",
      data: updatedDriver
    });
  } catch (error) {
    logger.error("Error updating driver:", error);
    next(error);
  }
}

export const deleteDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { driverId, subDomain, localId } = req.params;

    // Verify driver belongs to subdomain
    const existingDriver = await deliveryService.getDriverById(driverId, subDomain, localId);
    if (!existingDriver) {
      return res.status(404).json({ 
        type: "3", 
        message: "Driver not found",
        data: null
      });
    }

    const deleted = await deliveryService.deleteDriver(driverId);
    
    if (!deleted) {
      return res.status(500).json({ 
        type: "500", 
        message: "Failed to delete driver",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Driver deleted successfully",
      data: null
    });
  } catch (error) {
    logger.error("Error deleting driver:", error);
    next(error);
  }
}

export const getDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const { status, available, company, vehicleType } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (available !== undefined) filters.available = available === 'true';
    if (company) filters.company = company as string;
    if (vehicleType) filters.vehicleType = vehicleType as string;

    const drivers = await deliveryService.getDrivers(subDomain, localId, filters);
    
    res.json({
      type: "1",
      message: "Success",
      data: drivers
    });
  } catch (error) {
    logger.error("Error getting drivers:", error);
    next(error);
  }
}

// Additional controller methods for extended functionality

export const createDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const driverData = req.body;

    driverData.subDomain = subDomain;
    driverData.localId = localId;

    const newDriver = await deliveryService.createDriver(driverData);
    
    res.status(201).json({
      type: "1",
      message: "Driver created successfully",
      data: newDriver
    });
  } catch (error) {
    logger.error("Error creating driver:", error);
    next(error);
  }
}

export const updateDriverLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { driverId, subDomain, localId } = req.params;
    const { latitude, longitude } = req.body;

    // Validate presence
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return res.status(400).json({ 
        type: "701", 
        message: "Latitude and longitude are required",
        data: null
      });
    }

    // Validate types
    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ 
        type: "701", 
        message: "Latitude and longitude must be valid numbers",
        data: null
      });
    }

    // Validate ranges
    if (latNum < -90 || latNum > 90) {
      return res.status(400).json({ 
        type: "701", 
        message: "Latitude must be between -90 and 90 degrees",
        data: null
      });
    }

    if (lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ 
        type: "701", 
        message: "Longitude must be between -180 and 180 degrees",
        data: null
      });
    }

    // Verify driver belongs to subdomain
    const existingDriver = await deliveryService.getDriverById(driverId, subDomain, localId);
    if (!existingDriver) {
      return res.status(404).json({ 
        type: "3", 
        message: "Driver not found",
        data: null
      });
    }

    const updatedDriver = await deliveryService.updateDriverLocation(driverId, {
      latitude: latNum,
      longitude: lngNum
    });
    
    res.json({
      type: "1",
      message: "Driver location updated successfully",
      data: updatedDriver
    });
  } catch (error) {
    logger.error("Error updating driver location:", error);
    next(error);
  }
}

export const updateDriverStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { driverId, subDomain, localId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        type: "701", 
        message: "Status is required",
        data: null
      });
    }

    // Verify driver belongs to subdomain
    const existingDriver = await deliveryService.getDriverById(driverId, subDomain, localId);
    if (!existingDriver) {
      return res.status(404).json({ 
        type: "3", 
        message: "Driver not found",
        data: null
      });
    }

    const updatedDriver = await deliveryService.updateDriverStatus(driverId, status);
    
    res.json({
      type: "1",
      message: "Driver status updated successfully",
      data: updatedDriver
    });
  } catch (error) {
    logger.error("Error updating driver status:", error);
    next(error);
  }
}

export const getAvailableDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;

    const drivers = await deliveryService.getAvailableDrivers(subDomain, localId);
    
    res.json({
      type: "1",
      message: "Success",
      data: drivers
    });
  } catch (error) {
    logger.error("Error getting available drivers:", error);
    next(error);
  }
}

export const getDeliveryZones = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;

    const deliveryZones = await deliveryService.getDeliveryZones(subDomain, localId);
    
    res.json({
      type: "1",
      message: "Success",
      data: deliveryZones
    });
  } catch (error) {
    logger.error("Error getting delivery zones:", error);
    next(error);
  }
}

export const getDeliveryZoneById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { zoneId, subDomain, localId } = req.params;

    const deliveryZone = await deliveryService.getDeliveryZoneById(zoneId, subDomain, localId);
    
    if (!deliveryZone) {
      return res.status(404).json({ 
        type: "3", 
        message: "Delivery zone not found",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Success",
      data: deliveryZone
    });
  } catch (error) {
    logger.error("Error getting delivery zone by ID:", error);
    next(error);
  }
}

export const createDeliveryZone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Coordinates:', req.body.coordinates);
    
    const { subDomain, localId } = req.params;
    const zoneData = {
      ...req.body,
      subDomain,
      localId
    };

    const newDeliveryZone = await deliveryService.createDeliveryZone(zoneData);
    
    res.status(201).json({
      type: "1",
      message: "Delivery zone created successfully",
      data: newDeliveryZone
    });
  } catch (error: any) {
    logger.error("Error creating delivery zone:", error);
    
    if (error.message.includes('required') || error.message.includes('must be')) {
      return res.status(400).json({
        type: "701",
        message: error.message,
        data: null
      });
    }
    
    next(error);
  }
}

export const updateDeliveryZone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { zoneId, subDomain, localId } = req.params;
    const updateData = req.body;

    // Verify zone belongs to subdomain
    const existingZone = await deliveryService.getDeliveryZoneById(zoneId, subDomain, localId);
    if (!existingZone) {
      return res.status(404).json({ 
        type: "3", 
        message: "Delivery zone not found",
        data: null
      });
    }

    const updatedZone = await deliveryService.updateDeliveryZone(zoneId, updateData);
    
    res.json({
      type: "1",
      message: "Delivery zone updated successfully",
      data: updatedZone
    });
  } catch (error: any) {
    logger.error("Error updating delivery zone:", error);
    
    if (error.message.includes('required') || error.message.includes('must be')) {
      return res.status(400).json({
        type: "701",
        message: error.message,
        data: null
      });
    }
    
    next(error);
  }
}

export const deleteDeliveryZone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { zoneId, subDomain, localId } = req.params;

    // Verify zone belongs to subdomain
    const existingZone = await deliveryService.getDeliveryZoneById(zoneId, subDomain, localId);
    if (!existingZone) {
      return res.status(404).json({ 
        type: "3", 
        message: "Delivery zone not found",
        data: null
      });
    }

    const success = await deliveryService.deleteDeliveryZone(zoneId);
    
    if (!success) {
      return res.status(500).json({ 
        type: "500", 
        message: "Failed to delete delivery zone",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Delivery zone deleted successfully",
      data: null
    });
  } catch (error) {
    logger.error("Error deleting delivery zone:", error);
    next(error);
  }
}

export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const companyData = {
      ...req.body,
      subDomain,
      localId
    };

    const company = await deliveryService.createCompany(companyData);
    
    res.status(201).json({
      type: "1",
      message: "Company created successfully",
      data: company
    });
  } catch (error) {
    logger.error("Error creating company:", error);
    next(error);
  }
}

export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId, subDomain, localId } = req.params;
    const updateData = req.body;
        const existingCompany = await deliveryService.getCompanies(subDomain, localId, false);
        const companyExists = existingCompany.some((c: any) => c._id.toString() === companyId);
        
        if (!companyExists) {
          return res.status(404).json({ 
            type: "3", 
            message: "Company not found",
            data: null
          });
        }
    const company = await deliveryService.updateCompany(companyId, updateData);
    
    res.json({
      type: "1",
      message: "Company updated successfully",
      data: company
    });
  } catch (error) {
    logger.error("Error updating company:", error);
    next(error);
  }
}

export const deleteCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
       const { companyId, subDomain, localId } = req.params;
       const existingCompany = await deliveryService.getCompanies(subDomain, localId, false);
       const companyExists = existingCompany.some((c: any) => c._id.toString() === companyId);
       
       if (!companyExists) {
         return res.status(404).json({ 
           type: "3", 
           message: "Company not found",
           data: null
         });
       }

    const success = await deliveryService.deleteCompany(companyId);
    
    if (success) {
      res.json({
        type: "1",
        message: "Company deleted successfully"
      });
    } else {
      res.status(404).json({
        type: "3",
        message: "Company not found"
      });
    }
  } catch (error) {
    logger.error("Error deleting company:", error);
    next(error);
  }
}

export const getCompanyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId, subDomain, localId } = req.params;

    const company = await deliveryService.getCompanyById(companyId, subDomain, localId);
    
    if (company) {
      res.json({
        type: "1",
        message: "Company retrieved successfully",
        data: company
      });
    } else {
      res.status(404).json({
        type: "3",
        message: "Company not found"
      });
    }
  } catch (error) {
    logger.error("Error getting company by ID:", error);
    next(error);
  }
}

export const getCompanyWithDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId, subDomain, localId } = req.params;

    const company = await deliveryService.getCompanyWithDrivers(companyId, subDomain, localId);
    
    if (company) {
      res.json({
        type: "1",
        message: "Company with drivers retrieved successfully",
        data: company
      });
    } else {
      res.status(404).json({
        type: "3",
        message: "Company not found"
      });
    }
  } catch (error) {
    logger.error("Error getting company with drivers:", error);
    next(error);
  }
}

export const getDriversByCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId, subDomain, localId } = req.params;

    const drivers = await deliveryService.getDriversByCompany(companyId, subDomain, localId);

    res.json({
      type: "1",
      message: "Drivers retrieved successfully",
      data: drivers
    });
  } catch (error) {
    logger.error("Error getting drivers by company:", error);
    next(error);
  }
}

export const calculateDeliveryCost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { restaurantLocation, deliveryLocation, subDomain, localId } = req.body;

    // Validation
    if (!restaurantLocation || !deliveryLocation || !subDomain || !localId) {
      return res.status(400).json({
        type: "701",
        message: "Missing required fields: restaurantLocation, deliveryLocation, subDomain, localId",
        data: null
      });
    }

    if (!restaurantLocation.lat || !restaurantLocation.lng) {
      return res.status(400).json({
        type: "701",
        message: "restaurantLocation must have lat and lng fields",
        data: null
      });
    }

    if (!deliveryLocation.lat || !deliveryLocation.lng) {
      return res.status(400).json({
        type: "701",
        message: "deliveryLocation must have lat and lng fields",
        data: null
      });
    }

    const result = await deliveryService.calculateDeliveryCost({
      restaurantLocation,
      deliveryLocation,
      subDomain,
      localId
    });

    res.json({
      type: "1",
      message: "Success",
      data: result
    });
  } catch (error: any) {
    logger.error("Error calculating delivery cost:", error);

    if (error.message.includes('No delivery zone found')) {
      return res.status(404).json({
        type: "3",
        message: error.message,
        data: null
      });
    }

    next(error);
  }
}