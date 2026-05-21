import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

export interface MenuItem {
  menuCode: string
  menuName: string
  canView: boolean
  sortOrder: number
}

declare module "next-auth" {
  interface Session {
    user: {
      userId: number
      salesPersonCode: number | string | null 
      token: string
      fullName: string
      u_WhsCode: string
      u_SerieCot: string
      requiresTwoFactorSetup: boolean
      qrCodeBase64?: string | null
      manualKey?: string | null
      expiresAt?: number
      isMasterAdmin: boolean
      menus?: MenuItem[]
    } & DefaultSession["user"]
  }

  interface User {
    userId: number
    salesPersonCode: number | string | null
    token: string
    fullName: string
    u_WhsCode: string
    u_SerieCot: string
    requiresTwoFactorSetup: boolean
    qrCodeBase64?: string | null
    manualKey?: string | null
    isMasterAdmin: boolean
    menus?: MenuItem[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: number
    salesPersonCode: number | string | null
    token: string
    fullName: string
    u_WhsCode: string
    u_SerieCot: string
    requiresTwoFactorSetup: boolean
    qrCodeBase64?: string | null
    manualKey?: string | null
    expiresAt?: number
    isMasterAdmin: boolean
    menus?: MenuItem[]
  }
}
