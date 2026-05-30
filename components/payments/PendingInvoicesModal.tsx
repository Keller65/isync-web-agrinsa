"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { useSession } from "next-auth/react"
import { useInvoiceStore } from "@/lib/store/store.invoice"
import { InvoiceType } from "@/types/orders"
import { FileText, Trash, User, Loader2, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PendingInvoicesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerCode: string
  customerName: string
  onContinue: () => void
}

export function PendingInvoicesModal({
  open,
  onOpenChange,
  customerCode,
  customerName,
  onContinue,
}: PendingInvoicesModalProps) {
  const [invoices, setInvoices] = useState<InvoiceType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceType | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")

  const { data: session } = useSession()
  const token = session?.user?.token ?? null
  const { selectedInvoices, addInvoice, removeInvoice, clearInvoices } = useInvoiceStore()

  const FETCH_URL = `/api-proxy/sap/customers/${customerCode}/open-invoices`

  const fetchInvoices = useCallback(async () => {
    if (!token || !customerCode) return

    setIsLoading(true)
    try {
      const res = await axios.get(FETCH_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setInvoices(res.data || [])
    } catch (err) {
      console.error("Error fetching invoices:", err)
    } finally {
      setIsLoading(false)
    }
  }, [token, customerCode, FETCH_URL])

  useEffect(() => {
    if (open && customerCode) {
      fetchInvoices()
    }
  }, [open, customerCode, fetchInvoices])

  useEffect(() => {
    if (!open) {
      setAmount("")
      setError("")
    }
  }, [open])

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("es-HN", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleSelectInvoice = (invoice: InvoiceType) => {
    setSelectedInvoice(invoice)
    setAmount(invoice.balanceDue.toString())
    setError("")
    setModalVisible(true)
  }

  const handleAccept = () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Ingrese un monto válido.")
      return
    }
    if (numAmount > (selectedInvoice?.balanceDue || 0)) {
      setError("El monto no puede ser mayor al saldo pendiente.")
      return
    }
    if (selectedInvoice) {
      addInvoice(selectedInvoice, numAmount)
      setModalVisible(false)
    }
  }

  const totalAbonado = selectedInvoices.reduce((sum, item) => sum + item.paidAmount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center gap-3">
          <div className="bg-brand-primary size-10 rounded-full flex items-center justify-center">
            <User className="size-5 text-white" />
          </div>
          <div>
            <DialogTitle>{customerName}</DialogTitle>
            <p className="text-sm text-gray-500">{customerCode}</p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay facturas pendientes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const isSelected = selectedInvoices.some(
                  (inv) => inv.docEntry === invoice.docEntry
                )

                return (
                  <div
                    key={invoice.docEntry}
                    onClick={() => handleSelectInvoice(invoice)}
                    className={`p-4 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50 border-2 border-blue-200" : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-brand-primary p-1.5 rounded-lg">
                          <FileText className="size-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900">
                          Nº {invoice.numAtCard}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Check className="size-3" />
                          Seleccionado
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Total factura:</p>
                        <p className="font-semibold text-gray-900">
                          L. {formatCurrency(invoice.docTotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Saldo pendiente:</p>
                        <p className="font-semibold text-red-600">
                          L. {formatCurrency(invoice.balanceDue)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-200 py-2 px-3 rounded-lg">
                        <p className="text-xs text-gray-500">Fecha emisión</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(invoice.docDate)}
                        </p>
                      </div>
                      <div className="flex-1 bg-gray-200 py-2 px-3 rounded-lg">
                        <p className="text-xs text-gray-500">Fecha vencimiento</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(invoice.docDueDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selectedInvoices.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-gray-900">
                Facturas seleccionadas: {selectedInvoices.length}
              </p>
              <p className="font-semibold text-gray-900">
                Total: L. {formatCurrency(totalAbonado)}
              </p>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
              {selectedInvoices.map((inv) => (
                <div
                  key={inv.docEntry}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-gray-400" />
                    <span className="text-sm">{inv.numAtCard}</span>
                    <span className="text-sm text-gray-500">
                      L. {formatCurrency(inv.paidAmount)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeInvoice(inv.docEntry)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash className="size-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            <Button onClick={onContinue} className="w-full gap-2">
              Continuar
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Modal para abonar a factura */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Abonar a Factura</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="border-b pb-4 space-y-2">
                <div className="flex justify-between">
                  <p className="text-gray-600">Total:</p>
                  <p className="font-semibold">
                    L. {formatCurrency(selectedInvoice.docTotal)}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Pendiente:</p>
                  <p className="font-semibold text-red-600">
                    L. {formatCurrency(selectedInvoice.balanceDue)}
                  </p>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Factura: {selectedInvoice.numAtCard}</span>
                  <span>Fecha: {formatDate(selectedInvoice.docDate)}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Monto a pagar
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setError("")
                  }}
                  className="w-full p-3 border rounded-lg text-lg"
                  placeholder="Ingresa el monto a pagar"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setModalVisible(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAccept}>Aceptar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}