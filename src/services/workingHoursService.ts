import { WorkingHours, UpdateWorkingHoursDto, BusinessWorkingHours, TimeSlot } from '../types/workingHours';
import logger from '../utils/logger';

export class WorkingHoursService {
  /**
   * Create working hours for a business location
   */
  static async createWorkingHours(
    subDomain: string, 
    localId: string, 
    workingHours: UpdateWorkingHoursDto
  ): Promise<BusinessWorkingHours> {
    try {
      logger.info(`Creating working hours for subDomain: ${subDomain}, localId: ${localId}`);

      // Validate the working hours data
      this.validateWorkingHours(workingHours);

      // In a real implementation, this would save to database
      // For now, we'll just return the validated data
      const createdWorkingHours: BusinessWorkingHours = {
        deliveryHours: workingHours.deliveryHours || {},
        pickupHours: workingHours.pickupHours || {},
        onSiteHours: workingHours.onSiteHours || {},
        scheduledOrderHours: workingHours.scheduledOrderHours || {},
      };

      logger.info(`Working hours created successfully for subDomain: ${subDomain}, localId: ${localId}`);
      return createdWorkingHours;
    } catch (error) {
      logger.error('Error creating working hours:', error);
      throw error;
    }
  }

  /**
   * Get working hours for a business location
   */
  static async getWorkingHours(subDomain: string, localId: string): Promise<BusinessWorkingHours> {
    try {
      logger.info(`Getting working hours for subDomain: ${subDomain}, localId: ${localId}`);

      // For now, return default working hours structure
      // In a real implementation, this would fetch from database
      const defaultWorkingHours: BusinessWorkingHours = {
        deliveryHours: this.generateDefaultWorkingHours(),
        pickupHours: this.generateDefaultWorkingHours(),
        onSiteHours: this.generateDefaultWorkingHours(),
        scheduledOrderHours: this.generateDefaultWorkingHours(),
      };

      return defaultWorkingHours;
    } catch (error) {
      logger.error('Error getting working hours:', error);
      throw error;
    }
  }

  /**
   * Update working hours for a business location
   */
  static async updateWorkingHours(
    subDomain: string, 
    localId: string, 
    workingHours: UpdateWorkingHoursDto
  ): Promise<BusinessWorkingHours> {
    try {
      logger.info(`Updating working hours for subDomain: ${subDomain}, localId: ${localId}`);

      // Validate the working hours data
      this.validateWorkingHours(workingHours);

      // In a real implementation, this would save to database
      // For now, we'll just return the validated data
      const updatedWorkingHours: BusinessWorkingHours = {
        deliveryHours: workingHours.deliveryHours || {},
        pickupHours: workingHours.pickupHours || {},
        onSiteHours: workingHours.onSiteHours || {},
        scheduledOrderHours: workingHours.scheduledOrderHours || {},
      };

      logger.info(`Working hours updated successfully for subDomain: ${subDomain}, localId: ${localId}`);
      return updatedWorkingHours;
    } catch (error) {
      logger.error('Error updating working hours:', error);
      throw error;
    }
  }

  /**
   * Generate default working hours for a location
   */
  private static generateDefaultWorkingHours(): WorkingHours {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    const workingHours: WorkingHours = {};
    
    days.forEach(day => {
      workingHours[day] = [
        {
          start: "09:00",
          end: "17:00"
        }
      ];
    });
    
    return workingHours;
  }

  /**
   * Validate working hours data
   */
  private static validateWorkingHours(workingHours: UpdateWorkingHoursDto): void {
    const requiredFields = ['deliveryHours', 'pickupHours', 'onSiteHours'];
    
    for (const field of requiredFields) {
      if (!(field in workingHours)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate each working hours object
    Object.entries(workingHours).forEach(([key, hours]) => {
      if (hours && typeof hours === 'object') {
        this.validateWorkingHoursObject(hours, key);
      }
    });
  }

  /**
   * Validate a working hours object
   */
  private static validateWorkingHoursObject(hours: WorkingHours, path: string): void {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    Object.entries(hours).forEach(([day, timeSlots]) => {
      if (!validDays.includes(day)) {
        throw new Error(`${path}.${day} is not a valid day name`);
      }
      
      if (timeSlots !== null && !Array.isArray(timeSlots)) {
        throw new Error(`${path}.${day} must be an array or null`);
      }
      
      if (timeSlots) {
        timeSlots.forEach((slot, index) => {
          this.validateTimeSlot(slot, `${path}.${day}[${index}]`);
        });
      }
    });
  }

  /**
   * Validate a time slot
   */
  private static validateTimeSlot(slot: TimeSlot, path: string): void {
    const requiredFields = ['start', 'end'];
    
    for (const field of requiredFields) {
      if (!(field in slot)) {
        throw new Error(`Missing required field: ${path}.${field}`);
      }
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(slot.start)) {
      throw new Error(`${path}.start must be in HH:MM format`);
    }
    if (!timeRegex.test(slot.end)) {
      throw new Error(`${path}.end must be in HH:MM format`);
    }

    // Validate that start time is before end time
    const startTime = new Date(`2000-01-01T${slot.start}:00`);
    const endTime = new Date(`2000-01-01T${slot.end}:00`);
    
    if (startTime >= endTime) {
      throw new Error(`${path}.start must be before end`);
    }
  }

}
