import { Driver, IDriver } from "../models/Driver";
import { Company, ICompany } from "../models/Company";
import { DeliveryZone, IDeliveryZone } from "../models/DeliveryZone";
import { BusinessLocation, IBusinessLocation } from "../models/BusinessLocation";
import logger from "../utils/logger";

export interface IDeliveryService {
  getAllDeliveryData(subDomain: string, localId?: string): Promise<{
    drivers: IDriver[];
    companies: ICompany[];
    deliveryZones: IDeliveryZone[];
    businessLocations: IBusinessLocation[];
  }>;
  getDrivers(subDomain: string, localId?: string, filters?: {
    status?: string;
    available?: boolean;
    company?: string;
    vehicleType?: string;
  }): Promise<IDriver[]>;
  getDriverById(driverId: string, subDomain: string, localId?: string): Promise<IDriver | null>;
  getCompanies(subDomain: string, localId?: string, activeOnly?: boolean): Promise<ICompany[]>;
  getCompanyById(companyId: string, subDomain: string, localId?: string): Promise<ICompany | null>;
  getCompanyWithDrivers(companyId: string, subDomain: string, localId?: string): Promise<ICompany | null>;
  getDriversByCompany(companyId: string, subDomain: string, localId?: string): Promise<IDriver[]>;
  createCompany(companyData: Partial<ICompany>): Promise<ICompany>;
  updateCompany(companyId: string, updateData: Partial<ICompany>): Promise<ICompany | null>;
  deleteCompany(companyId: string): Promise<boolean>;
  getDeliveryZones(subDomain: string, localId?: string): Promise<IDeliveryZone[]>;
  getDeliveryZoneById(zoneId: string, subDomain: string, localId?: string): Promise<IDeliveryZone | null>;
  createDeliveryZone(zoneData: Partial<IDeliveryZone>): Promise<IDeliveryZone>;
  updateDeliveryZone(zoneId: string, updateData: Partial<IDeliveryZone>): Promise<IDeliveryZone | null>;
  deleteDeliveryZone(zoneId: string): Promise<boolean>;
  createDriver(driverData: Partial<IDriver>): Promise<IDriver>;
  updateDriver(driverId: string, updateData: Partial<IDriver>): Promise<IDriver | null>;
  deleteDriver(driverId: string): Promise<boolean>;
  updateDriverLocation(driverId: string, location: {
    latitude: number;
    longitude: number;
  }): Promise<IDriver | null>;
  updateDriverStatus(driverId: string, status: string): Promise<IDriver | null>;
  getAvailableDrivers(subDomain: string, localId?: string): Promise<IDriver[]>;
  assignDriverToOrder(driverId: string, orderId: string): Promise<IDriver | null>;
  completeDelivery(driverId: string, orderId: string): Promise<IDriver | null>;
}

class DeliveryService implements IDeliveryService {
  async getAllDeliveryData(subDomain: string, localId?: string) {
    try {
      const driverQuery: any = { subDomain, isActive: true };
      const deliveryZoneQuery: any = { subDomain, isActive: true };
      const businessLocationQuery: any = { subDomain, isActive: true };

      if (localId) {
        driverQuery.localId = localId;
        deliveryZoneQuery.localId = localId;
        businessLocationQuery.localId = localId;
      }

      const [drivers, companies, deliveryZones, businessLocations] = await Promise.all([
        Driver.find(driverQuery).populate('company'),
        Company.find({ subDomain, isActive: true }),
        DeliveryZone.find(deliveryZoneQuery),
        BusinessLocation.find(businessLocationQuery)
      ]);

      return {
        drivers,
        companies,
        deliveryZones,
        businessLocations
      };
    } catch (error) {
      logger.error('Error getting all delivery data:', error);
      throw error;
    }
  }

  async getDrivers(subDomain: string, localId?: string, filters: {
    status?: string;
    available?: boolean;
    company?: string;
    vehicleType?: string;
  } = {}) {
    try {
      const query: any = { subDomain, isActive: true };

      if (localId) {
        query.localId = localId;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.available !== undefined) {
        query.available = filters.available;
      }

      if (filters.company) {
        query.company = filters.company;
      }

      if (filters.vehicleType) {
        query.vehicleType = filters.vehicleType;
      }

      const drivers = await Driver.find(query)
        .populate('company')
        .sort({ createdAt: -1 });

      return drivers;
    } catch (error) {
      logger.error('Error getting drivers:', error);
      throw error;
    }
  }

  async getDriverById(driverId: string, subDomain: string, localId?: string) {
    try {
      const query: any = { _id: driverId, subDomain, isActive: true };
      
      if (localId) {
        query.localId = localId;
      }

      const driver = await Driver.findOne(query)
        .populate('company');

      return driver;
    } catch (error) {
      logger.error('Error getting driver by ID:', error);
      throw error;
    }
  }

  async getCompanies(subDomain: string, localId?: string, activeOnly: boolean = true) {
    try {
      const query: any = { subDomain };

      if (activeOnly) {
        query.isActive = true;
      }

      if (localId) {
        query.localId = localId;
      }

      const companies = await Company.find(query).sort({ name: 1 });

      return companies;
    } catch (error) {
      logger.error('Error getting companies:', error);
      throw error;
    }
  }

  async getCompanyById(companyId: string, subDomain: string, localId?: string) {
    try {
      const query: any = { _id: companyId, subDomain, isActive: true };
      
      if (localId) {
        query.localId = localId;
      }

      const company = await Company.findOne(query);

      return company;
    } catch (error) {
      logger.error('Error getting company by ID:', error);
      throw error;
    }
  }

  async getCompanyWithDrivers(companyId: string, subDomain: string, localId?: string) {
    try {
      const query: any = { _id: companyId, subDomain, isActive: true };
      
      if (localId) {
        query.localId = localId;
      }

      const company = await Company.findOne(query).populate({
        path: 'drivers',
        match: { isActive: true },
        select: 'firstName lastName name email phone status available vehicleType'
      });

      return company;
    } catch (error) {
      logger.error('Error getting company with drivers:', error);
      throw error;
    }
  }

  async getDriversByCompany(companyId: string, subDomain: string, localId?: string) {
    try {
      const query: any = { 
        company: companyId, 
        subDomain, 
        isActive: true 
      };
      
      if (localId) {
        query.localId = localId;
      }

      const drivers = await Driver.find(query)
        .populate('company')
        .sort({ firstName: 1, lastName: 1 });

      return drivers;
    } catch (error) {
      logger.error('Error getting drivers by company:', error);
      throw error;
    }
  }

  async getDeliveryZones(subDomain: string, localId?: string) {
    try {
      const query: any = { subDomain, isActive: true };

      if (localId) {
        query.localId = localId;
      }

      const deliveryZones = await DeliveryZone.find(query).sort({ zoneName: 1 });

      return deliveryZones;
    } catch (error) {
      logger.error('Error getting delivery zones:', error);
      throw error;
    }
  }

  async getDeliveryZoneById(zoneId: string, subDomain: string, localId?: string) {
    try {
      const query: any = { _id: zoneId, subDomain, isActive: true };

      if (localId) {
        query.localId = localId;
      }

      const deliveryZone = await DeliveryZone.findOne(query);

      return deliveryZone;
    } catch (error) {
      logger.error('Error getting delivery zone by ID:', error);
      throw error;
    }
  }

  async createDeliveryZone(zoneData: Partial<IDeliveryZone>) {
    try {
      // Validate required fields
      const requiredFields = ['zoneName', 'deliveryCost', 'minimumOrder', 'estimatedTime', 'subDomain', 'localId'];
      for (const field of requiredFields) {
        if (!zoneData[field as keyof IDeliveryZone]) {
          throw new Error(`${field} is required`);
        }
      }

      // Validate coordinates for polygon zones
      if (zoneData.type === 'polygon' && (!zoneData.coordinates || zoneData.coordinates.length < 3)) {
        throw new Error('Polygon zones must have at least 3 coordinate points');
      }

      // Validate coordinate values
      if (zoneData.coordinates) {
        for (const coord of zoneData.coordinates) {
          if (coord.latitude < -90 || coord.latitude > 90) {
            throw new Error('Latitude must be between -90 and 90 degrees');
          }
          if (coord.longitude < -180 || coord.longitude > 180) {
            throw new Error('Longitude must be between -180 and 180 degrees');
          }
        }
      }

      // Set defaults
      const newZoneData = {
        ...zoneData,
        status: zoneData.status || '1',
        type: zoneData.type || 'simple',
        isActive: zoneData.isActive !== undefined ? zoneData.isActive : true,
        allowsFreeDelivery: zoneData.allowsFreeDelivery || false
      };

      const deliveryZone = new DeliveryZone(newZoneData);
      await deliveryZone.save();

      logger.info(`Delivery zone created successfully: ${deliveryZone.zoneName}`, {
        zoneId: deliveryZone._id,
        subDomain: deliveryZone.subDomain,
        localId: deliveryZone.localId
      });

      return deliveryZone;
    } catch (error: any) {
      logger.error('Error creating delivery zone:', error);
      if (error.code === 11000) {
        throw new Error('Delivery zone with this name already exists for this location');
      }
      throw error;
    }
  }

  async updateDeliveryZone(zoneId: string, updateData: Partial<IDeliveryZone>) {
    try {
      // Validate coordinates for polygon zones if provided
      if (updateData.type === 'polygon' && updateData.coordinates && updateData.coordinates.length < 3) {
        throw new Error('Polygon zones must have at least 3 coordinate points');
      }

      // Validate coordinate values if provided
      if (updateData.coordinates) {
        for (const coord of updateData.coordinates) {
          if (coord.latitude < -90 || coord.latitude > 90) {
            throw new Error('Latitude must be between -90 and 90 degrees');
          }
          if (coord.longitude < -180 || coord.longitude > 180) {
            throw new Error('Longitude must be between -180 and 180 degrees');
          }
        }
      }

      const updatedZone = await DeliveryZone.findByIdAndUpdate(
        zoneId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!updatedZone) {
        throw new Error('Delivery zone not found');
      }

      logger.info(`Delivery zone updated successfully: ${updatedZone.zoneName}`, {
        zoneId: updatedZone._id,
        subDomain: updatedZone.subDomain,
        localId: updatedZone.localId
      });

      return updatedZone;
    } catch (error: any) {
      logger.error('Error updating delivery zone:', error);
      if (error.code === 11000) {
        throw new Error('Delivery zone with this name already exists for this location');
      }
      throw error;
    }
  }

  async deleteDeliveryZone(zoneId: string) {
    try {
      const deletedZone = await DeliveryZone.findByIdAndUpdate(
        zoneId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );

      if (!deletedZone) {
        return false;
      }

      logger.info(`Delivery zone soft deleted successfully: ${deletedZone.zoneName}`, {
        zoneId: deletedZone._id,
        subDomain: deletedZone.subDomain,
        localId: deletedZone.localId
      });

      return true;
    } catch (error) {
      logger.error('Error deleting delivery zone:', error);
      throw error;
    }
  }

  async createCompany(companyData: Partial<ICompany>) {
    try {
      // Validate required fields
      const requiredFields = ['name', 'taxId', 'subDomain', 'localId'];
      for (const field of requiredFields) {
        if (!companyData[field as keyof ICompany]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Set default values
      const newCompany = new Company({
        ...companyData,
        active: true,
        isActive: true
      });

      const savedCompany = await newCompany.save();
      return savedCompany;
    } catch (error) {
      logger.error('Error creating company:', error);
      throw error;
    }
  }

  async updateCompany(companyId: string, updateData: Partial<ICompany>) {
    try {
      const company = await Company.findByIdAndUpdate(
        companyId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!company) {
        throw new Error('Company not found');
      }

      return company;
    } catch (error) {
      logger.error('Error updating company:', error);
      throw error;
    }
  }

  async deleteCompany(companyId: string) {
    try {
      const result = await Company.findByIdAndUpdate(
        companyId,
        { isActive: false, active: false },
        { new: true }
      );

      return !!result;
    } catch (error) {
      logger.error('Error deleting company:', error);
      throw error;
    }
  }

  async createDriver(driverData: Partial<IDriver>) {
    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'phone', 'email', 'subDomain', 'localId'];
      for (const field of requiredFields) {
        if (!driverData[field as keyof IDriver]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Generate name from firstName and lastName
      if (!driverData.name) {
        driverData.name = `${driverData.firstName} ${driverData.lastName}`;
      }

      // Set default values
      const newDriver = new Driver({
        ...driverData,
        active: true,
        available: true,
        isActive: true,
        status: 'active',
        availability: {
          isAvailable: true,
          workingHours: {},
          maxOrdersPerHour: 5,
          currentOrders: 0
        },
        ratings: {
          average: 0,
          totalRatings: 0
        },
        stats: {
          totalDeliveries: 0,
          successfulDeliveries: 0,
          cancelledDeliveries: 0,
          averageDeliveryTime: 0,
          totalEarnings: 0,
          monthlyEarnings: 0
        }
      });

      const savedDriver = await newDriver.save();
      return savedDriver;
    } catch (error) {
      logger.error('Error creating driver:', error);
      throw error;
    }
  }

  async updateDriver(driverId: string, updateData: Partial<IDriver>) {
    try {
      const driver = await Driver.findByIdAndUpdate(
        driverId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('company');

      if (!driver) {
        throw new Error('Driver not found');
      }

      return driver;
    } catch (error) {
      logger.error('Error updating driver:', error);
      throw error;
    }
  }

  async deleteDriver(driverId: string) {
    try {
      const result = await Driver.findByIdAndUpdate(
        driverId,
        { isActive: false, active: false, available: false, status: 'inactive' },
        { new: true }
      );

      return !!result;
    } catch (error) {
      logger.error('Error deleting driver:', error);
      throw error;
    }
  }

  async updateDriverLocation(driverId: string, location: {
    latitude: number;
    longitude: number;
  }) {
    try {
      const driver = await Driver.findByIdAndUpdate(
        driverId,
        {
          currentLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            lastUpdate: new Date()
          }
        },
        { new: true }
      );

      return driver;
    } catch (error) {
      logger.error('Error updating driver location:', error);
      throw error;
    }
  }

  async updateDriverStatus(driverId: string, status: string) {
    try {
      const validStatuses = ['active', 'inactive', 'suspended', 'on_delivery', 'offline'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      const driver = await Driver.findByIdAndUpdate(
        driverId,
        { 
          status,
          available: status === 'active' || status === 'on_delivery',
          updatedAt: new Date()
        },
        { new: true }
      );

      return driver;
    } catch (error) {
      logger.error('Error updating driver status:', error);
      throw error;
    }
  }

  async getAvailableDrivers(subDomain: string, localId?: string) {
    try {
      const query: any = {
        subDomain,
        isActive: true,
        status: 'active',
        available: true,
        'availability.isAvailable': true
      };

      if (localId) {
        query.localId = localId;
      }

      const drivers = await Driver.find(query)
        .populate('company')
        .sort({ 'ratings.average': -1, 'stats.successfulDeliveries': -1 });

      return drivers;
    } catch (error) {
      logger.error('Error getting available drivers:', error);
      throw error;
    }
  }

  async assignDriverToOrder(driverId: string, orderId: string) {
    try {
      const driver = await Driver.findByIdAndUpdate(
        driverId,
        [
          {
            $set: {
              status: 'on_delivery',
              available: false,
              'availability.currentOrders': { $add: ['$availability.currentOrders', 1] },
              updatedAt: new Date()
            }
          }
        ],
        { new: true }
      );

      if (!driver) {
        throw new Error('Driver not found');
      }

      logger.info(`Driver ${driverId} assigned to order ${orderId}`);
      return driver;
    } catch (error) {
      logger.error('Error assigning driver to order:', error);
      throw error;
    }
  }

  async completeDelivery(driverId: string, orderId: string) {
    try {
      const currentDriver = await Driver.findById(driverId);
      logger.info(`Current driver: ${currentDriver}`);
      if (!currentDriver) {
        throw new Error('Driver not found');
      }
      const driver = await Driver.findByIdAndUpdate(
        driverId,
        [
          {
            $set: {
              status: 'active',
              available: true,
              'availability.currentOrders': {
                $max: [0, { $subtract: ['$availability.currentOrders', 1] }]
              },
              'stats.totalDeliveries': { $add: ['$stats.totalDeliveries', 1] },
              'stats.successfulDeliveries': { $add: ['$stats.successfulDeliveries', 1] },
              updatedAt: new Date()
            }
          }
        ],
        { new: true }
      );

      if (!driver) {
        throw new Error('Driver not found');
      }

      logger.info(`Driver ${driverId} completed delivery for order ${orderId}`);
      return driver;
    } catch (error) {
      logger.error('Error completing delivery:', error);
      throw error;
    }
  }
}

export const deliveryService = new DeliveryService();
