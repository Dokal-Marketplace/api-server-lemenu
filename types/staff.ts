import { BaseEntity, ContactInfo, Status, Schedule } from './common';
import { User, UserRole } from './auth';

export interface StaffMember extends BaseEntity, ContactInfo {
  name: string;
  dni?: string;
  role: StaffRole;
  status: Status;
  assignedLocals: AssignedLocal[];
  permissions: StaffPermission[];
  workingHours: Schedule;
  salary?: SalaryInfo;
  emergencyContact?: EmergencyContact;
  documents?: StaffDocument[];
  performance: StaffPerformance;
  user?: User; // Reference to auth user
}

export interface StaffRole extends UserRole {
  level: 'entry' | 'intermediate' | 'senior' | 'manager';
  department: 'kitchen' | 'service' | 'delivery' | 'management' | 'admin';
}

export interface AssignedLocal {
  localId: string;
  localName: string;
  subDomain: string;
  role: string;
  permissions: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface StaffPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[];
  scope: 'own' | 'local' | 'all';
}

export interface SalaryInfo {
  type: 'hourly' | 'monthly' | 'commission';
  amount: number;
  currency: string;
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly';
  bonuses?: {
    type: string;
    amount: number;
    conditions: string;
  }[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface StaffDocument {
  type: 'id' | 'contract' | 'medical' | 'certification' | 'other';
  name: string;
  url: string;
  uploadDate: string;
  expiryDate?: string;
}

export interface StaffPerformance {
  rating: number; // 1-5
  totalRatings: number;
  punctualityScore: number;
  productivityScore: number;
  customerServiceScore: number;
  lastReviewDate?: string;
  goals: PerformanceGoal[];
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'overdue';
}

export interface WorkShift {
  id: string;
  staffId: string;
  localId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakTime?: number; // minutes
  actualStartTime?: string;
  actualEndTime?: string;
  status: ShiftStatus;
  notes?: string;
}

export type ShiftStatus = 
  | 'scheduled' 
  | 'started' 
  | 'on_break' 
  | 'completed' 
  | 'absent' 
  | 'late';

export interface Attendance {
  id: string;
  staffId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export type AttendanceStatus = 
  | 'present' 
  | 'absent' 
  | 'late' 
  | 'partial' 
  | 'holiday' 
  | 'sick';

export interface StaffFilters {
  status?: Status[];
  role?: string[];
  localId?: string;
  department?: string[];
  search?: string;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  averageRating: number;
  totalAttendance: number;
  absenteeismRate: number;
}

export interface StaffCreateData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  assignedLocals?: string[];
  workingHours?: Schedule;
  salary?: SalaryInfo;
  emergencyContact?: EmergencyContact;
}

export interface StaffUpdateData {
  name?: string;
  phone?: string;
  role?: string;
  status?: Status;
  workingHours?: Schedule;
  salary?: SalaryInfo;
  emergencyContact?: EmergencyContact;
}