"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { useAuthStore } from '@/lib/store'
import { usePathname } from "next/navigation"
import { Payment } from '@/types/payments'
import {
  FileText,
  CalendarDots,
  CreditCard,
  Coins,
  ArrowClockwise,
  Plus,
} from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Avvvatars from "avvvatars-react"
import Link from "next/link"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { token, salesPersonCode } = useAuthStore()
  const pathname = usePathname()
  const prevTokenRef = useRef<string | null>(null)

  const fetchPayments = async () => {
    if (!token || !salesPersonCode) return

    setIsLoading(true)
    try {
      const { data } = await axios.get(
        `/api-proxy/api/Payments/received/${salesPersonCode}?page=1&pageSize=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setPayments(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token && salesPersonCode) {
      if (prevTokenRef.current === null && token) {
        prevTokenRef.current = token;
        fetchPayments();
      } else if (prevTokenRef.current !== token) {
        prevTokenRef.current = token;
        fetchPayments();
      }
    }
  }, [token, salesPersonCode, pathname])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pagos recibidos
          </h2>
          <p className="text-sm text-gray-500">
            Historial reciente de transacciones
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            disabled={isLoading}
            className="gap-2"
          >
            <ArrowClockwise size={16} />
            Actualizar
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <Plus size={16} />
            Realizar pago
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-gray-200 space-y-4"
            >
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}

        {!isLoading &&
          payments.map((item) => (
            <Link
              key={item.docEntry}
              href={`/dashboard/payments/${item.docEntry}`}
              className="bg-white rounded-2xl p-5 border border-gray-200 block hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={22} className="text-gray-700" />
                  <p className="text-sm text-gray-600">
                    Pago{" "}
                    <span className="font-semibold text-gray-900">
                      #{item.docNum}
                    </span>
                  </p>
                </div>

                <span className="text-xs font-medium bg-brand-primary text-white px-3 py-1 rounded-full">
                  Recibido
                </span>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="bg-gray-100 size-10 rounded-full overflow-hidden shrink-0">
                  <Avvvatars value={item.cardName} size={40} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {item.cardName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-2">
                  <div className="bg-gray-100 p-1.5 rounded-full">
                    <CalendarDots size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 leading-none">
                      Fecha
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(item.docDate).toLocaleDateString("es-HN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="bg-gray-100 p-1.5 rounded-full">
                    <Coins size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 leading-none">
                      Total
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      L.{" "}
                      {item.total.toLocaleString("es-HN", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CreditCard size={14} />
                {item.paymentMeans}
              </div>
            </Link>
          ))}
      </div>

      {!isLoading && payments.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <p className="text-sm">No hay pagos registrados</p>
          <p className="text-xs">
            Los pagos aparecerán aquí automáticamente
          </p>
        </div>
      )}
    </div>
  )
}