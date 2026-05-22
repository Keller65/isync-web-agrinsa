"use client"

import { useMemo, useEffect, useState, useRef } from "react"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js"
import { usePathname } from "next/navigation"
import { SalesDonutTypes } from "@/types/dashboard"
import axios from "axios"
import { useSession } from "next-auth/react"

ChartJS.register(ArcElement, Tooltip)

export default function SalesDonutCard() {
  const [data, setData] = useState<SalesDonutTypes | null>(null)
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState(20);
  const { data: session } = useSession();
  const token = session?.user.token
  const salesPersonCode = session?.user.salesPersonCode
  const pathname = usePathname()
  const prevTokenRef = useRef<string | null>(null)

  const fetchData = async () => {
    if (!token || !salesPersonCode) return
    
    setLoading(true)
    try {
      const response = await axios.get(`/api-proxy/api/Kpi/monthly/${salesPersonCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }, timeout: 60000
      })
      setData(response.data)
      console.log("KPI de ventas: ", response.data);
    } catch (error) {
      console.error("Error fetching donut data:", error)
    } finally {
      setLoading(false)
    }
  }

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
  }, [token, salesPersonCode, pathname])

  // Calcular porcentaje
  const percentage = useMemo(() => {
    if (!data?.total) return 0
    return Math.min((Number(data.total) / goal) * 100, 100)
  }, [data])

  // Datos para el Doughnut
  const chartData = useMemo(() => ({
    datasets: [
      {
        data: [Number(data?.total) || 0, Math.max(0, goal - (Number(data?.total) || 0))],
        backgroundColor: ["#ef4444", "#f3f3f3"],
        borderWidth: 0,
        cutout: "80%",
        radius: "90%",
      },
    ],
  }), [data])

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { enabled: false } },
    Tooltip: "Ventas Mensuales"
  }

  // Formatear fecha
  const lastUpdated = useMemo(() => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    let hours = now.getHours()
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`
  }, [data])

  return (
    <div className="bg-white border border-gray-100 rounded p-4 flex flex-col justify-center min-h-62.5">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
        Meta mensual {goal}M
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : data ? (
        <>
          <div className="relative w-40 h-40 mx-auto">
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold">{percentage.toFixed(1)}%</span>
              <span className="text-[10px] text-gray-500 text-center px-2">
                {data.currency} {(data.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} de {goal.toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Actualizado: {lastUpdated}
          </p>
        </>
      ) : (
        <div className="text-center py-10 text-gray-500 text-xs">
          No se pudieron cargar los datos de la meta.
        </div>
      )}
    </div>
  )
}
