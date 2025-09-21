import { BaseEntity, ContactInfo } from './common';

export interface User extends BaseEntity, ContactInfo {
  name: string;
  role: UserRole;
  subDomain?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  preferences?: UserPreferences;
}

export interface UserRole {
  name: 'super_admin' | 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen';
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UserPreferences {
  language: 'en' | 'es' | 'pt';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    orders: boolean;
    payments: boolean;
    system: boolean;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  subDomain: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  phone: string;
  businessName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}