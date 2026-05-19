import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CustomerType, CustomerAddress } from '@/types/customers'

interface BulkState {
  selectedCustomer: CustomerType | null
  addresses: CustomerAddress[]
  selectedAddress: CustomerAddress | null
  comment: string
  setSelectedCustomer: (customer: CustomerType | null) => void
  setAddresses: (addresses: CustomerAddress[]) => void
  setSelectedAddress: (address: CustomerAddress | null) => void
  setComment: (comment: string) => void
  clear: () => void
}

export const useBulkStore = create<BulkState>()(
  persist(
    (set) => ({
      selectedCustomer: null,
      addresses: [],
      selectedAddress: null,
      comment: '',
      setSelectedCustomer: (customer) => set({
        selectedCustomer: customer,
        addresses: [],
        selectedAddress: null,
      }),
      setAddresses: (addresses) => set({ addresses }),
      setSelectedAddress: (address) => set({ selectedAddress: address }),
      setComment: (comment) => set({ comment }),
      clear: () => set({
        selectedCustomer: null,
        addresses: [],
        selectedAddress: null,
        comment: '',
      }),
    }),
    { name: 'bulk-storage' }
  )
)
