export interface WorkingHourItem {
  horarioAtencionId: string;
  horarioAtencionInicio: string;
  horarioAtencionFin: string;
  horarioAtencionDiaId: string;
  horarioAtencionDiaHorasAnticipacion: string;
}

export interface WorkingHourDay {
  horarioAtencionDiaId: string;
  horarioAtencionDiaEstado: string;
  horarioAtencionDiaDia: string;
  localId: string;
  horarioAtencionDiaTipo: string;
  horarioAtencionList: WorkingHourItem[];
}

export interface UpdateWorkingHoursDto {
  horarioParaDelivery: WorkingHourDay[];
  horarioParaRecojo: WorkingHourDay[];
  horarioParaProgramarPedidos: WorkingHourDay[];
  horarioParaRepartoPedidos: WorkingHourDay[];
}