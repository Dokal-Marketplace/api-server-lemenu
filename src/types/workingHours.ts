export interface WorkingHourItem {
  id: string;
  startTime: string;
  endTime: string;
  dayId: string;
  anticipationHours: string;
}

export interface WorkingHourDay {
  id: string;
  status: string; // "1" for enabled, "0" for disabled
  day: string; // Day number: "1"=Monday, "2"=Tuesday, etc.
  localId: string;
  type: string; // Schedule type: "1"=delivery, "2"=scheduled, "3"=pickup, "4"=dispatch
  timeSlots: WorkingHourItem[];
}

export interface UpdateWorkingHoursDto {
  deliveryHours: WorkingHourDay[];
  pickupHours: WorkingHourDay[];
  scheduledOrderHours: WorkingHourDay[];
  dispatchHours: WorkingHourDay[];
}

// Legacy interfaces for backward compatibility
export interface WorkingHourItemLegacy {
  horarioAtencionId: string;
  horarioAtencionInicio: string;
  horarioAtencionFin: string;
  horarioAtencionDiaId: string;
  horarioAtencionDiaHorasAnticipacion: string;
}



