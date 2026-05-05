"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { useAuthStore } from '@/lib/store'
import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import axios from "axios"

// Definición de tipos
interface VentasData {
  title: string
  Ventas: number
  currency: string
  Cobros: number
  delta: number
  deltaType: "up" | "down"
  deltaLabel: string
  mesVentas: string
  mesCobros: string
}

interface KpiApiResponse {
  ventas: VentasData
}

export default function KPICardApi() {
  const { salesPersonCode, fullName, token } = useAuthStore()
  const pathname = usePathname()
  const prevTokenRef = useRef<string | null>(null)
  const [data, setData] = useState<KpiApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token && salesPersonCode) {
      if (prevTokenRef.current === null && token) {
        prevTokenRef.current = token;
        fetchData();
      } else if (prevTokenRef.current !== token) {
        prevTokenRef.current = token;
        fetchData();
      }
    }

    async function fetchData() {
      if (!salesPersonCode || !token) return

      try {
        setLoading(true)
        const response = await axios.get<KpiApiResponse>(
          `/api-proxy/api/Kpi/sales-vs-collections/${salesPersonCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        setData(response.data)
      } catch (error) {
        console.error("Error cargando KPI:", error)
      } finally {
        setLoading(false)
      }
    }
  }, [salesPersonCode, token, pathname])

  // Estado de carga (Loading skeleton)
  if (loading || !data || !data.ventas) {
    return (
      <div className="bg-white p-6 rounded-2xl w-full border border-gray-100 relative animate-pulse space-y-4">
        <div className="h-6 w-3/4 bg-gray-200 rounded-full" />
        <div className="h-6 w-1/2 bg-gray-200 rounded-full" />
        <div className="h-4 w-full bg-gray-200 rounded-full" />
        <div className="h-4 w-5/6 bg-gray-200 rounded-full" />
      </div>
    )
  }

  const { ventas } = data
  const isDeltaUp = ventas.deltaType === "up"
  const deltaColor = isDeltaUp ? "text-green-500" : "text-red-500"
  const DeltaIcon = isDeltaUp ? ArrowUp : ArrowDown

  return (
    <div className="bg-white p-6 w-full border border-gray-100 relative flex flex-col gap-4">
      {/* Icono indicador */}
      <div className="absolute top-4 right-4">
        <div className={`p-1 rounded-full ${isDeltaUp ? 'bg-green-50' : 'bg-red-50'}`}>
          <DeltaIcon className={`w-6 h-6 ${deltaColor}`} />
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col">
        <p className={`text-sm font-semibold ${deltaColor}`}>
           Ventas: {ventas.Ventas.toLocaleString()} {ventas.currency}
        </p>
        <h3 className="text-xl font-bold text-gray-800 mt-1">
          {fullName || "Usuario"}
        </h3>
      </div>

      {/* Body */}
      <div className="flex justify-between items-end mt-2">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            {ventas.mesVentas} - {ventas.mesCobros}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {ventas.Ventas.toLocaleString()} {ventas.currency}
          </p>
        </div>

        <div className="text-right">
          <p className={`text-lg font-bold flex items-center justify-end gap-1 ${deltaColor}`}>
            {isDeltaUp ? "+" : ""}{ventas.delta}%
          </p>
          <p className={`text-sm font-medium ${deltaColor} opacity-80`}>
            Cobrado: {ventas.Cobros.toLocaleString()} {ventas.currency}
          </p>
        </div>
      </div>
    </div>
  )
}