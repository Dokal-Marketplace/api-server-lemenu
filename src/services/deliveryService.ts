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
  createCompany(companyData: Partial<ICompany>): Promise<ICompany>;
  updateCompany(companyId: string, updateData: Partial<ICompany>): Promise<ICompany | null>;
  deleteCompany(companyId: string): Promise<boolean>;
  getDeliveryZones(subDomain: string, localId?: string): Promise<IDeliveryZone[]>;
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
        deliveryZoneQuery.coberturaLocalId = localId;
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

  async getDeliveryZones(subDomain: string, localId?: string) {
    try {
      const query: any = { subDomain, isActive: true };

      if (localId) {
        query.coberturaLocalId = localId;
      }

      const deliveryZones = await DeliveryZone.find(query).sort({ coberturaLocalNombre: 1 });

      return deliveryZones;
    } catch (error) {
      logger.error('Error getting delivery zones:', error);
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
