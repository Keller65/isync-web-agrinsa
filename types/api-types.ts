// Tipos para la autenticación
export interface Category {
  code: string;
  name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  appType: string;
}

export interface MenuItemResponse {
  menuCode: string
  menuName: string
  canView: boolean
  sortOrder: number
}

export interface LoginResponse {
  token: string;
  userId: string | number;
  canLoginWeb: boolean;
  canLoginApp: boolean;
  requiresTwoFactor: false;
  requiresTwoFactorSetup: boolean;
  salesPersonCode: number;
  fullName: string;
  u_SerieCot: string;
  u_WhsCode: string;
  qrCodeBase64?: string | null;
  manualKey?: string | null;
  isMasterAdmin?: boolean;
  menus?: MenuItemResponse[];
}

export interface TwoFactorSetupResponse {
  success: boolean;
  message?: string;
  qrCodeBase64?: string;
  manualKey?: string;
}

export interface TwoFactorConfirmResponse {
  success: boolean;
  message?: string;
}

export interface AdminUser {
  userId: number
  username: string
  email: string
  employeeId: number | null
  salesPersonCode: number | null
  fullName: string
  u_WhsCode: string
  u_SerieCot: string
  canLoginWeb: boolean
  canLoginApp: boolean
  isMasterAdmin: boolean
  mustChangePassword: boolean
  twoFactorEnabled: boolean
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  totalCount?: number
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  employeeId: number | null
  salesPersonCode: number | null
  canLoginWeb: boolean
  canLoginApp: boolean
  isMasterAdmin: boolean
}

export interface CreateUserResponse {
  userId: number
}

export interface UpdateUserRequest {
  username: string
  email: string
  fullName: string
  employeeId: number | null
  salesPersonCode: number | null
  canLoginWeb: boolean
  canLoginApp: boolean
  isMasterAdmin: boolean
  isActive: boolean
}