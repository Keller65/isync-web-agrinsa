"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import axios from "axios"
import { Search, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { CustomerType } from "@/types/customers"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Avvvatars from "avvvatars-react"

interface CustomerSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCustomer: (customer: CustomerType) => void
}

const CUSTOMER_PAGE_SIZE = 50

export function CustomerSelectionDialog({
  open,
  onOpenChange,
  onSelectCustomer,
}: CustomerSelectionDialogProps) {
  const [customers, setCustomers] = useState<CustomerType[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerPage, setCustomerPage] = useState(1)
  const [isLastCustomerPage, setIsLastCustomerPage] = useState(false)

  const { data: session } = useSession()
  const token = session?.user?.token
  const salesPersonCode = session?.user?.salesPersonCode
  const customerObserverRef = useRef<IntersectionObserver | null>(null)
  const isLoadingRef = useRef(false)
  const isLastPageRef = useRef(false)
  const searchRef = useRef(customerSearch)

  const API_url = `/api-proxy/api/Customers/by-sales-emp`

  const fetchCustomers = useCallback(
    async (pageToFetch: number, isRefresh = false) => {
      if (!token || !salesPersonCode) return
      if (!isRefresh && isLastPageRef.current) return
      if (isLoadingRef.current) return

      isLoadingRef.current = true
      setIsLoadingCustomers(true)

      try {
        const search = searchRef.current
        const query = search ? `&search=${encodeURIComponent(search)}` : ""
        const res = await axios.get(
          `${API_url}?slpCode=${salesPersonCode}&page=${pageToFetch}&pageSize=${CUSTOMER_PAGE_SIZE}${query}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = res.data?.items ?? res.data ?? []

        if (isRefresh) {
          setCustomers(data)
        } else {
          setCustomers((prev) => [...prev, ...data])
        }

        if (data.length < CUSTOMER_PAGE_SIZE) {
          isLastPageRef.current = true
        }
        setIsLastCustomerPage(isLastPageRef.current)
      } catch (err) {
        console.error("Error fetching customers:", err)
      } finally {
        setIsLoadingCustomers(false)
        isLoadingRef.current = false
      }
    },
    [token, salesPersonCode, API_url]
  )

  useEffect(() => {
    searchRef.current = customerSearch
  }, [customerSearch])

  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      setCustomerPage(1)
      isLastPageRef.current = false
      setIsLastCustomerPage(false)
      fetchCustomers(1, true)
    }, 300)

    return () => clearTimeout(timer)
  }, [open, customerSearch, fetchCustomers])

  useEffect(() => {
    if (!open) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingCustomers && !isLastCustomerPage) {
          fetchCustomers(customerPage, false)
        }
      },
      { threshold: 0.1 }
    )

    customerObserverRef.current = observer

    const sentinelEl = document.getElementById("customer-scroll-sentinel-payments")
    if (sentinelEl) {
      observer.observe(sentinelEl)
    }

    return () => {
      observer.disconnect()
    }
  }, [open, isLoadingCustomers, isLastCustomerPage, customerPage, fetchCustomers])

  const handleSelectCustomer = (customer: CustomerType) => {
    onSelectCustomer(customer)
    onOpenChange(false)
    setCustomerSearch("")
    setCustomers([])
    setCustomerPage(1)
    isLastPageRef.current = false
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setCustomerSearch("")
      setCustomers([])
      setCustomerPage(1)
      isLastPageRef.current = false
    }
  }

  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) =>
          c.cardName.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.cardCode.toLowerCase().includes(customerSearch.toLowerCase())
      )
    : customers

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[85vh] max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="text-2xl font-bold">Seleccionar Cliente</DialogTitle>
          <DialogDescription className="text-sm">
            Busca por nombre o código SAP
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={17}
            />
            <Input
              placeholder="Nombre o código SAP..."
              className="pl-9 h-11 bg-gray-50 border-gray-200 focus:bg-white text-sm transition-all"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div id="customer-list-container" className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoadingCustomers && customers.length === 0 ? (
            <div className="space-y-2 pt-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 animate-pulse"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.cardCode}
                  type="button"
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                >
                  <Avvvatars size={40} value={customer.cardName} style="character" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-900">
                      {customer.cardName}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{customer.cardCode}</p>
                  </div>
                </button>
              ))}

              {filteredCustomers.length === 0 && !isLoadingCustomers && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">
                    Sin resultados para{" "}
                    <span className="font-semibold">{customerSearch}</span>
                  </p>
                </div>
              )}

              <div id="customer-scroll-sentinel-payments" className="h-4" />

              {isLoadingCustomers && customers.length > 0 && (
                <div className="flex items-center justify-center py-3 gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs text-gray-400">Cargando más...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}