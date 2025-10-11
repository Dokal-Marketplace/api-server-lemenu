import { Staff } from "../models/Staff";
import { Role } from "../models/Role";
import { BusinessLocation } from "../models/BusinessLocation";
import { IAssignedLocal } from "../models/Staff";
import { RoleService } from "./roleService";
import logger from "../utils/logger";

export interface StaffFilters {
  subDomain: string;
  localId?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateStaffData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  dni?: string;
  assignedLocals?: IAssignedLocal[];
  workingHours?: any;
  salary?: any;
  emergencyContact?: any;
  performance?: any;
  user?: string;
}

export interface UpdateStaffData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  dni?: string;
  isActive?: boolean;
  assignedLocals?: IAssignedLocal[];
  workingHours?: any;
  salary?: any;
  emergencyContact?: any;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  staffByRole: { [role: string]: number };
  staffByLocal: { [localId: string]: number };
}

export class StaffService {
  /**
   * Get staff with filtering and pagination
   */
  static async getStaff(filters: StaffFilters) {
    try {
      const {
        subDomain,
        localId,
        role,
        isActive,
        search,
        page = 1,
        limit = 10
      } = filters;

      const query: any = { subDomain: subDomain.toLowerCase() };

      // Filter by localId if provided
      if (localId) {
        query['assignedLocals.localId'] = localId;
        query['assignedLocals.isActive'] = true;
      }

      // Additional filters
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { dni: { $regex: search, $options: 'i' } }
        ];
      }

      const pageNum = parseInt(page.toString());
      const limitNum = parseInt(limit.toString());
      const skip = (pageNum - 1) * limitNum;

      const [staff, total] = await Promise.all([
        Staff.find(query)
          .select('-password')
          .populate('user', 'email firstName lastName')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Staff.countDocuments(query)
      ]);

      return {
        staff,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      logger.error('Error in StaffService.getStaff:', error);
      throw error;
    }
  }

  /**
   * Get staff by ID with subdomain validation
   */
  static async getStaffById(staffId: string, subDomain: string, localId: string) {
    try {
      const query: any = {
        _id: staffId,
        subDomain: subDomain.toLowerCase(),
        'assignedLocals.localId': localId,
        'assignedLocals.isActive': true
      };

      const staff = await Staff.findOne(query)
        .select('-password')
        .populate('user', 'email firstName lastName')
        .lean();

      if (!staff) {
        throw new Error('Staff member not found');
      }

      return staff;
    } catch (error) {
      logger.error('Error in StaffService.getStaffById:', error);
      throw error;
    }
  }

  /**
   * Create new staff member
   */
  static async createStaff(staffData: CreateStaffData, subDomain: string, localId: string) {
    try {
      // Check if email already exists for this subdomain
      const existingStaff = await Staff.findOne({
        email: staffData.email,
        subDomain: subDomain.toLowerCase()
      });

      if (existingStaff) {
        throw new Error('Staff member with this email already exists');
      }

      // Get local name for the assigned local
      const local = await BusinessLocation.findOne({
        localId: localId,
        subDomain: subDomain.toLowerCase(),
        isActive: true
      });

      if (!local) {
        throw new Error('Invalid local specified');
      }

      // Add the local to assignedLocals if not already present
      if (staffData.assignedLocals) {
        const localExists = staffData.assignedLocals.some(al => al.localId === localId);
        if (!localExists) {
          staffData.assignedLocals.push({
            localId,
            localName: local.name,
            subDomain: subDomain.toLowerCase(),
            role: staffData.role,
            permissions: [],
            startDate: new Date(),
            isActive: true
          });
        } else {
          // Update existing assigned local with missing fields
          const existingLocalIndex = staffData.assignedLocals.findIndex(al => al.localId === localId);
          if (existingLocalIndex !== -1) {
            staffData.assignedLocals[existingLocalIndex] = {
              ...staffData.assignedLocals[existingLocalIndex],
              subDomain: subDomain.toLowerCase(),
              startDate: staffData.assignedLocals[existingLocalIndex].startDate || new Date(),
              isActive: staffData.assignedLocals[existingLocalIndex].isActive !== undefined ? staffData.assignedLocals[existingLocalIndex].isActive : true
            };
          }
        }
      } else {
        // If no assignedLocals provided, create the array with the required local
        staffData.assignedLocals = [{
          localId,
          localName: local.name,
          subDomain: subDomain.toLowerCase(),
          role: staffData.role,
          permissions: [],
          startDate: new Date(),
          isActive: true
        }];
      }

      // Validate assigned locals exist
      if (staffData.assignedLocals && staffData.assignedLocals.length > 0) {
        await this.validateAssignedLocals(staffData.assignedLocals, subDomain);
      }

      // Validate role exists
      await this.validateRole(staffData.role, subDomain);

      // Create default performance object if not provided
      const defaultPerformance = {
        rating: 0,
        totalRatings: 0,
        punctualityScore: 0,
        productivityScore: 0,
        customerServiceScore: 0
      };

      const staff = await Staff.create({
        ...staffData,
        subDomain: subDomain.toLowerCase(),
        isActive: true,
        performance: (staffData as any).performance || defaultPerformance
      });

      return await Staff.findById(staff._id)
        .select('-password')
        .populate('user', 'email firstName lastName')
        .lean();
    } catch (error) {
      logger.error('Error in StaffService.createStaff:', error);
      throw error;
    }
  }

  /**
   * Update staff member
   */
  static async updateStaff(staffId: string, updateData: UpdateStaffData, subDomain: string, localId: string) {
    try {
      // Check if staff exists and is assigned to the specified local
      const query: any = {
        _id: staffId,
        subDomain: subDomain.toLowerCase(),
        'assignedLocals.localId': localId,
        'assignedLocals.isActive': true
      };

      const existingStaff = await Staff.findOne(query);

      if (!existingStaff) {
        throw new Error('Staff member not found');
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingStaff.email) {
        const emailExists = await Staff.findOne({
          email: updateData.email,
          subDomain: subDomain.toLowerCase(),
          _id: { $ne: staffId }
        });

        if (emailExists) {
          throw new Error('Staff member with this email already exists');
        }
      }

      // Validate assigned locals if being updated
      if (updateData.assignedLocals && updateData.assignedLocals.length > 0) {
        await this.validateAssignedLocals(updateData.assignedLocals, subDomain);
      }

      // Validate role if being updated
      if (updateData.role) {
        await this.validateRole(updateData.role, subDomain);
      }

      const updatedStaff = await Staff.findByIdAndUpdate(
        staffId,
        { ...updateData, subDomain: subDomain.toLowerCase() },
        { new: true, runValidators: true }
      )
        .select('-password')
        .populate('user', 'email firstName lastName')
        .lean();

      return updatedStaff;
    } catch (error) {
      logger.error('Error in StaffService.updateStaff:', error);
      throw error;
    }
  }

  /**
   * Delete staff member (soft delete)
   */
  static async deleteStaff(staffId: string, subDomain: string, localId: string) {
    try {
      const query: any = {
        _id: staffId,
        subDomain: subDomain.toLowerCase(),
        'assignedLocals.localId': localId,
        'assignedLocals.isActive': true
      };

      const staff = await Staff.findOne(query);

      if (!staff) {
        throw new Error('Staff member not found');
      }

      // Soft delete by setting isActive to false
      await Staff.findByIdAndUpdate(staffId, { isActive: false });

      return true;
    } catch (error) {
      logger.error('Error in StaffService.deleteStaff:', error);
      throw error;
    }
  }

  /**
   * Get staff statistics for a subdomain
   */
  static async getStaffStats(subDomain: string, localId?: string) {
    try {
      const baseQuery: any = { subDomain: subDomain.toLowerCase() };
      
      if (localId) {
        baseQuery['assignedLocals.localId'] = localId;
        baseQuery['assignedLocals.isActive'] = true;
      }

      const [totalStaff, activeStaff, inactiveStaff, staffByRole, staffByLocal] = await Promise.all([
        Staff.countDocuments(baseQuery),
        Staff.countDocuments({ ...baseQuery, isActive: true }),
        Staff.countDocuments({ ...baseQuery, isActive: false }),
        Staff.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        Staff.aggregate([
          { $match: baseQuery },
          { $unwind: '$assignedLocals' },
          { $match: { 'assignedLocals.isActive': true } },
          { $group: { _id: '$assignedLocals.localId', count: { $sum: 1 } } }
        ])
      ]);

      const stats: StaffStats = {
        totalStaff,
        activeStaff,
        inactiveStaff,
        staffByRole: staffByRole.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        staffByLocal: staffByLocal.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };

      return stats;
    } catch (error) {
      logger.error('Error in StaffService.getStaffStats:', error);
      throw error;
    }
  }

  /**
   * Get roles for a subdomain
   */
  static async getRoles(subDomain: string, localId: string) {
    try {
      return await RoleService.getRoles(subDomain, localId);
    } catch (error) {
      logger.error('Error in StaffService.getRoles:', error);
      throw error;
    }
  }

  /**
   * Validate assigned locals exist and are active
   */
  private static async validateAssignedLocals(assignedLocals: IAssignedLocal[], subDomain: string) {
    const localIds = assignedLocals.map(al => al.localId);
    const locals = await BusinessLocation.find({
      localId: { $in: localIds },
      subDomain: subDomain.toLowerCase(),
      isActive: true
    });

    if (locals.length !== localIds.length) {
      throw new Error('One or more assigned locals are invalid or inactive');
    }
  }

  /**
   * Validate role exists and is active
   */
  private static async validateRole(role: string, subDomain: string) {
    const roleExists = await Role.findOne({
      name: role,
      subDomain: subDomain.toLowerCase(),
      isActive: true
    });

    if (!roleExists) {
      throw new Error('Invalid role specified');
    }
  }

  /**
   * Search staff by name, email, or DNI
   */
  static async searchStaff(query: string, subDomain: string, localId?: string) {
    try {
      const searchQuery: any = {
        subDomain: subDomain.toLowerCase(),
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { dni: { $regex: query, $options: 'i' } }
        ]
      };

      if (localId) {
        searchQuery['assignedLocals.localId'] = localId;
        searchQuery['assignedLocals.isActive'] = true;
      }

      const staff = await Staff.find(searchQuery)
        .select('-password')
        .populate('user', 'email firstName lastName')
        .sort({ name: 1 })
        .limit(20)
        .lean();

      return staff;
    } catch (error) {
      logger.error('Error in StaffService.searchStaff:', error);
      throw error;
    }
  }

  /**
   * Get staff performance metrics
   */
  static async getStaffPerformance(staffId: string, subDomain: string, localId: string) {
    try {
      const query: any = {
        _id: staffId,
        subDomain: subDomain.toLowerCase(),
        'assignedLocals.localId': localId,
        'assignedLocals.isActive': true
      };

      const staff = await Staff.findOne(query).select('performance').lean();

      if (!staff) {
        throw new Error('Staff member not found');
      }

      return staff.performance;
    } catch (error) {
      logger.error('Error in StaffService.getStaffPerformance:', error);
      throw error;
    }
  }

  /**
   * Update staff performance
   */
  static async updateStaffPerformance(staffId: string, performanceData: any, subDomain: string, localId: string) {
    try {
      const query: any = {
        _id: staffId,
        subDomain: subDomain.toLowerCase(),
        'assignedLocals.localId': localId,
        'assignedLocals.isActive': true
      };

      const staff = await Staff.findOne(query);

      if (!staff) {
        throw new Error('Staff member not found');
      }

      const updatedStaff = await Staff.findByIdAndUpdate(
        staffId,
        { performance: { ...(staff.performance || {}), ...performanceData } },
        { new: true, runValidators: true }
      ).select('performance').lean();

      return updatedStaff?.performance;
    } catch (error) {
      logger.error('Error in StaffService.updateStaffPerformance:', error);
      throw error;
    }
  }
}
