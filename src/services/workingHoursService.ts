import { WorkingHourDay, UpdateWorkingHoursDto, WorkingHourItem } from '../types/workingHours';
import logger from '../utils/logger';

export class WorkingHoursService {
  /**
   * Get working hours for a business location
   */
  static async getWorkingHours(subDomain: string, localId: string): Promise<{
    deliveryHours: WorkingHourDay[];
    pickupHours: WorkingHourDay[];
    scheduledOrderHours: WorkingHourDay[];
    dispatchHours: WorkingHourDay[];
  }> {
    try {
      logger.info(`Getting working hours for subDomain: ${subDomain}, localId: ${localId}`);

      // For now, return default working hours structure
      // In a real implementation, this would fetch from database
      const defaultWorkingHours = {
        deliveryHours: this.generateDefaultWorkingHours(localId, "1"), // delivery
        pickupHours: this.generateDefaultWorkingHours(localId, "3"), // pickup
        scheduledOrderHours: this.generateDefaultWorkingHours(localId, "2"), // scheduled
        dispatchHours: this.generateDefaultWorkingHours(localId, "4"), // dispatch
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
  ): Promise<{
    deliveryHours: WorkingHourDay[];
    pickupHours: WorkingHourDay[];
    scheduledOrderHours: WorkingHourDay[];
    dispatchHours: WorkingHourDay[];
  }> {
    try {
      logger.info(`Updating working hours for subDomain: ${subDomain}, localId: ${localId}`);

      // Validate the working hours data
      this.validateWorkingHours(workingHours);

      // In a real implementation, this would save to database
      // For now, we'll just return the validated data
      const updatedWorkingHours = {
        deliveryHours: workingHours.deliveryHours || [],
        pickupHours: workingHours.pickupHours || [],
        scheduledOrderHours: workingHours.scheduledOrderHours || [],
        dispatchHours: workingHours.dispatchHours || [],
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
  private static generateDefaultWorkingHours(localId: string, type: string): WorkingHourDay[] {
    const days = [
      { day: "1", name: "Monday" },
      { day: "2", name: "Tuesday" },
      { day: "3", name: "Wednesday" },
      { day: "4", name: "Thursday" },
      { day: "5", name: "Friday" },
      { day: "6", name: "Saturday" },
      { day: "7", name: "Sunday" }
    ];

    return days.map(dayInfo => ({
      id: `${localId}_${type}_${dayInfo.day}`,
      status: "1", // enabled by default
      day: dayInfo.day,
      localId,
      type,
      timeSlots: [
        {
          id: `${localId}_${type}_${dayInfo.day}_1`,
          startTime: "09:00",
          endTime: "17:00",
          dayId: `${localId}_${type}_${dayInfo.day}`,
          anticipationHours: "1"
        }
      ]
    }));
  }

  /**
   * Validate working hours data
   */
  private static validateWorkingHours(workingHours: UpdateWorkingHoursDto): void {
    const requiredFields = ['deliveryHours', 'pickupHours', 'scheduledOrderHours', 'dispatchHours'];
    
    for (const field of requiredFields) {
      if (!(field in workingHours)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate each working hours array
    Object.entries(workingHours).forEach(([key, days]) => {
      if (!Array.isArray(days)) {
        throw new Error(`${key} must be an array`);
      }

      days.forEach((day, index) => {
        this.validateWorkingHourDay(day, `${key}[${index}]`);
      });
    });
  }

  /**
   * Validate a single working hour day
   */
  private static validateWorkingHourDay(day: WorkingHourDay, path: string): void {
    const requiredFields = ['id', 'status', 'day', 'localId', 'type', 'timeSlots'];
    
    for (const field of requiredFields) {
      if (!(field in day)) {
        throw new Error(`Missing required field: ${path}.${field}`);
      }
    }

    // Validate status
    if (!['0', '1'].includes(day.status)) {
      throw new Error(`${path}.status must be "0" or "1"`);
    }

    // Validate day
    if (!['1', '2', '3', '4', '5', '6', '7'].includes(day.day)) {
      throw new Error(`${path}.day must be between "1" and "7"`);
    }

    // Validate type
    if (!['1', '2', '3', '4'].includes(day.type)) {
      throw new Error(`${path}.type must be "1", "2", "3", or "4"`);
    }

    // Validate timeSlots
    if (!Array.isArray(day.timeSlots)) {
      throw new Error(`${path}.timeSlots must be an array`);
    }

    day.timeSlots.forEach((slot, slotIndex) => {
      this.validateWorkingHourItem(slot, `${path}.timeSlots[${slotIndex}]`);
    });
  }

  /**
   * Validate a single working hour item
   */
  private static validateWorkingHourItem(item: WorkingHourItem, path: string): void {
    const requiredFields = ['id', 'startTime', 'endTime', 'dayId', 'anticipationHours'];
    
    for (const field of requiredFields) {
      if (!(field in item)) {
        throw new Error(`Missing required field: ${path}.${field}`);
      }
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(item.startTime)) {
      throw new Error(`${path}.startTime must be in HH:MM format`);
    }
    if (!timeRegex.test(item.endTime)) {
      throw new Error(`${path}.endTime must be in HH:MM format`);
    }

    // Validate that start time is before end time
    const startTime = new Date(`2000-01-01T${item.startTime}:00`);
    const endTime = new Date(`2000-01-01T${item.endTime}:00`);
    
    if (startTime >= endTime) {
      throw new Error(`${path}.startTime must be before endTime`);
    }
  }

  /**
   * Convert legacy format to new format
   */
  static convertFromLegacy(legacyData: any): UpdateWorkingHoursDto {
    return {
      deliveryHours: this.convertDayArrayFromLegacy(legacyData.horarioParaDelivery || []),
      pickupHours: this.convertDayArrayFromLegacy(legacyData.horarioParaRecojo || []),
      scheduledOrderHours: this.convertDayArrayFromLegacy(legacyData.horarioParaProgramarPedidos || []),
      dispatchHours: this.convertDayArrayFromLegacy(legacyData.horarioParaRepartoPedidos || []),
    };
  }

  /**
   * Convert legacy day array to new format
   */
  private static convertDayArrayFromLegacy(legacyDays: any[]): WorkingHourDay[] {
    return legacyDays.map(legacyDay => ({
      id: legacyDay.horarioAtencionDiaId,
      status: legacyDay.horarioAtencionDiaEstado,
      day: legacyDay.horarioAtencionDiaDia,
      localId: legacyDay.localId,
      type: legacyDay.horarioAtencionDiaTipo,
      timeSlots: legacyDay.horarioAtencionList.map((legacyItem: any) => ({
        id: legacyItem.horarioAtencionId,
        startTime: legacyItem.horarioAtencionInicio,
        endTime: legacyItem.horarioAtencionFin,
        dayId: legacyItem.horarioAtencionDiaId,
        anticipationHours: legacyItem.horarioAtencionDiaHorasAnticipacion
      }))
    }));
  }

  /**
   * Convert new format to legacy format
   */
  static convertToLegacy(data: UpdateWorkingHoursDto): any {
    return {
      horarioParaDelivery: this.convertDayArrayToLegacy(data.deliveryHours),
      horarioParaRecojo: this.convertDayArrayToLegacy(data.pickupHours),
      horarioParaProgramarPedidos: this.convertDayArrayToLegacy(data.scheduledOrderHours),
      horarioParaRepartoPedidos: this.convertDayArrayToLegacy(data.dispatchHours),
    };
  }

  /**
   * Convert day array to legacy format
   */
  private static convertDayArrayToLegacy(days: WorkingHourDay[]): any[] {
    return days.map(day => ({
      horarioAtencionDiaId: day.id,
      horarioAtencionDiaEstado: day.status,
      horarioAtencionDiaDia: day.day,
      localId: day.localId,
      horarioAtencionDiaTipo: day.type,
      horarioAtencionList: day.timeSlots.map(item => ({
        horarioAtencionId: item.id,
        horarioAtencionInicio: item.startTime,
        horarioAtencionFin: item.endTime,
        horarioAtencionDiaId: item.dayId,
        horarioAtencionDiaHorasAnticipacion: item.anticipationHours
      }))
    }));
  }
}
