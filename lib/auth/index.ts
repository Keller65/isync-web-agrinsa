import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import axios from "axios"
import { LoginRequest, LoginResponse } from "@/types/api-types"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },

  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        username: { label: "Código de Vendedor", type: "number" },
        password: { label: "Contraseña", type: "password" },
      },

      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const payload: LoginRequest = {
            username: credentials.username as string,
            password: credentials.password as string,
            appType: 'WEB'
          }

          const apiHost = process.env.NEXT_PUBLIC_API_HOST
          if (!apiHost) return null

          const response = await axios.post<LoginResponse>(
            `${apiHost}/api/isync/auth/login`,
            payload
          )

          if (response.status === 200 || response.status === 201) {
            const apiData = response.data

            return {
              id: String(apiData.userId),
              userId: Number(apiData.userId),
              requiresTwoFactorSetup: apiData.requiresTwoFactorSetup,
              salesPersonCode: apiData.salesPersonCode,
              token: apiData.token,
              fullName: apiData.fullName,
              u_WhsCode: apiData.u_WhsCode,
              u_SerieCot: apiData.u_SerieCot,
              // qrCodeBase64: apiData.qrCodeBase64 ?? null,
              // manualKey: apiData.manualKey ?? null,
              email: `${apiData.salesPersonCode}@isync.local`,
              isMasterAdmin: apiData.isMasterAdmin ?? false,
              menus: apiData.menus ?? [],
            }
          }
        } catch (error: unknown) {
          const err = error as { response?: { status?: number; data?: unknown }; message?: string }
          console.error("[auth] Login failed:", err.response?.status, err.response?.data ?? err.message)
          return null
        }

        return null
      },
    }),
  ],

  pages: {
    signIn: "/",
  },

  callbacks: {
    async jwt({ token, user, trigger, session: sessionData }) {
      if (user) {
        token.userId = user.userId
        token.salesPersonCode = user.salesPersonCode
        token.token = user.token
        token.fullName = user.fullName
        token.u_WhsCode = user.u_WhsCode
        token.u_SerieCot = user.u_SerieCot
        token.requiresTwoFactorSetup = user.requiresTwoFactorSetup
        // token.qrCodeBase64 = user.qrCodeBase64
        // token.manualKey = user.manualKey
        token.isMasterAdmin = user.isMasterAdmin
        token.menus = user.menus
      }

      if (trigger === "update" && sessionData) {
        Object.assign(token, sessionData)
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.userId = token.userId
        session.user.salesPersonCode = token.salesPersonCode
        session.user.token = token.token
        session.user.fullName = token.fullName
        session.user.name = token.fullName
        session.user.u_WhsCode = token.u_WhsCode
        session.user.u_SerieCot = token.u_SerieCot
        session.user.requiresTwoFactorSetup = token.requiresTwoFactorSetup
        // session.user.qrCodeBase64 = token.qrCodeBase64
        // session.user.manualKey = token.manualKey
        session.user.isMasterAdmin = token.isMasterAdmin
        session.user.menus = token.menus
      }

      return session
    },
  },
})