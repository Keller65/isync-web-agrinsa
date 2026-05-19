import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { InvoiceType } from '@/types/orders'

export interface SelectedInvoice extends InvoiceType {
  paidAmount: number
}

interface InvoiceState {
  selectedInvoices: SelectedInvoice[]
  addInvoice: (invoice: InvoiceType, paidAmount: number) => void
  removeInvoice: (docEntry: number) => void
  clearInvoices: () => void
  setPaidAmount: (docEntry: number, amount: number) => void
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      selectedInvoices: [],
      addInvoice: (invoice, paidAmount) =>
        set((state) => {
          const exists = state.selectedInvoices.some((i) => i.docEntry === invoice.docEntry)
          if (exists) return state
          return {
            selectedInvoices: [...state.selectedInvoices, { ...invoice, paidAmount }],
          }
        }),
      removeInvoice: (docEntry) =>
        set((state) => ({
          selectedInvoices: state.selectedInvoices.filter((i) => i.docEntry !== docEntry),
        })),
      clearInvoices: () => set({ selectedInvoices: [] }),
      setPaidAmount: (docEntry, amount) =>
        set((state) => ({
          selectedInvoices: state.selectedInvoices.map((i) =>
            i.docEntry === docEntry ? { ...i, paidAmount: amount } : i
          ),
        })),
    }),
    {
      name: 'isync-invoices',
    }
  )
)