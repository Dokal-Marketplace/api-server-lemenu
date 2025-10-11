import { Role } from "../models/Role";
import { BusinessLocation } from "../models/BusinessLocation";
import logger from "../utils/logger";

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
  isDefault?: boolean;
}

export class RoleService {
  /**
   * Create new role
   */
  static async createRole(roleData: CreateRoleData, subDomain: string, localId: string) {
    try {
      // Validate that the local exists and is active
      const local = await BusinessLocation.findOne({
        localId: localId,
        subDomain: subDomain.toLowerCase(),
        isActive: true
      });

      if (!local) {
        throw new Error('Invalid local specified');
      }

      // Check if role name already exists for this subdomain
      const existingRole = await Role.findOne({
        name: roleData.name,
        subDomain: subDomain.toLowerCase()
      });

      if (existingRole) {
        throw new Error('Role with this name already exists');
      }

      const role = await Role.create({
        ...roleData,
        subDomain: subDomain.toLowerCase(),
        isActive: roleData.isActive !== undefined ? roleData.isActive : true,
        isDefault: roleData.isDefault !== undefined ? roleData.isDefault : false
      });

      return await Role.findById(role._id).lean();
    } catch (error) {
      logger.error('Error in RoleService.createRole:', error);
      throw error;
    }
  }

  /**
   * Get roles for a subdomain
   */
  static async getRoles(subDomain: string, localId: string) {
    try {
      // Validate that the local exists and is active
      const local = await BusinessLocation.findOne({
        localId: localId,
        subDomain: subDomain.toLowerCase(),
        isActive: true
      });

      if (!local) {
        throw new Error('Invalid local specified');
      }

      const query: any = { 
        subDomain: subDomain.toLowerCase(), 
        isActive: true 
      };

      // For now, we'll return all roles for the subdomain
      // In the future, you might want to add local-specific role filtering
      // query.applicableLocals = { $in: [localId] };

      const roles = await Role.find(query).sort({ name: 1 }).lean();

      return roles;
    } catch (error) {
      logger.error('Error in RoleService.getRoles:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  static async updateRole(roleId: string, updateData: Partial<CreateRoleData>, subDomain: string, localId: string) {
    try {
      // Validate that the local exists and is active
      const local = await BusinessLocation.findOne({
        localId: localId,
        subDomain: subDomain.toLowerCase(),
        isActive: true
      });

      if (!local) {
        throw new Error('Invalid local specified');
      }

      // Check if role exists
      const existingRole = await Role.findOne({
        _id: roleId,
        subDomain: subDomain.toLowerCase()
      });

      if (!existingRole) {
        throw new Error('Role not found');
      }

      // Check name uniqueness if name is being updated
      if (updateData.name && updateData.name !== existingRole.name) {
        const nameExists = await Role.findOne({
          name: updateData.name,
          subDomain: subDomain.toLowerCase(),
          _id: { $ne: roleId }
        });

        if (nameExists) {
          throw new Error('Role with this name already exists');
        }
      }

      const updatedRole = await Role.findByIdAndUpdate(
        roleId,
        { ...updateData, subDomain: subDomain.toLowerCase() },
        { new: true, runValidators: true }
      ).lean();

      return updatedRole;
    } catch (error) {
      logger.error('Error in RoleService.updateRole:', error);
      throw error;
    }
  }

  /**
   * Delete role (soft delete)
   */
  static async deleteRole(roleId: string, subDomain: string, localId: string) {
    try {
      // Validate that the local exists and is active
      const local = await BusinessLocation.findOne({
        localId: localId,
        subDomain: subDomain.toLowerCase(),
        isActive: true
      });

      if (!local) {
        throw new Error('Invalid local specified');
      }

      const role = await Role.findOne({
        _id: roleId,
        subDomain: subDomain.toLowerCase()
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // Soft delete by setting isActive to false
      await Role.findByIdAndUpdate(roleId, { isActive: false });

      return true;
    } catch (error) {
      logger.error('Error in RoleService.deleteRole:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  static async getRoleById(roleId: string, subDomain: string, localId: string) {
    try {
      // Validate that the local exists and is active
      const local = await BusinessLocation.findOne({
        localId: localId,
        subDomain: subDomain.toLowerCase(),
        isActive: true
      });

      if (!local) {
        throw new Error('Invalid local specified');
      }

      const role = await Role.findOne({
        _id: roleId,
        subDomain: subDomain.toLowerCase(),
        isActive: true
      }).lean();

      if (!role) {
        throw new Error('Role not found');
      }

      return role;
    } catch (error) {
      logger.error('Error in RoleService.getRoleById:', error);
      throw error;
    }
  }
}
