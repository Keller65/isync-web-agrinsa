import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  itemCode: string
  itemName?: string
  itemDescription?: string
  barCode: string
  quantity: number
  priceList?: number
  priceAfterVAT?: number
  unitPriceNoVAT?: number
  basePriceNoVAT?: number
  taxCode: string
  warehouseCode?: string
  suppCatNum?: string
  inStock?: number
}

interface CartState {
  productsInCart: CartItem[]
  open: boolean
  editMode: boolean
  docEntry?: number | string
  setEditMode: (mode: boolean) => void
  setOpen: (cartMode: boolean) => void
  setDocEntry: (docEntry: number | string) => void
  addProduct: (product: CartItem) => void
  updateQuantity: (itemCode: string, quantity: number, unitPrice: number, inStock: number) => void
  removeProduct: (itemCode: string) => void
  clearCart: () => void
  loadCartWithProducts: (products: CartItem[]) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      productsInCart: [],
      editMode: false,
      docEntry: undefined,
      open: false,
      setOpen:  (cartMode) => set({ open: cartMode }),
      setDocEntry: (docEntry) => set({ docEntry }),
      setEditMode: (mode) => set({ editMode: mode }),
      addProduct: (product) =>
        set((state) => ({
          productsInCart: [...state.productsInCart, product]
        })),
      updateQuantity: (itemCode, quantity, unitPrice, inStock) =>
        set((state) => ({
          productsInCart: state.productsInCart.map((p) =>
            p.itemCode === itemCode
              ? {
                  ...p,
                  quantity,
                  unitPriceNoVAT: unitPrice,
                  unitPrice,
                  priceAfterVAT: unitPrice,
                  priceList: unitPrice,
                  inStock: inStock ?? p.inStock,
                }
              : p
          ),
        })),
      removeProduct: (itemCode) =>
        set((state) => ({
          productsInCart: state.productsInCart.filter((p) => p.itemCode !== itemCode),
        })),
      clearCart: () => set({ productsInCart: [] }),
      loadCartWithProducts: (products) => set({ productsInCart: products }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        productsInCart: state.productsInCart,
        editMode: state.editMode,
        docEntry: state.docEntry,
      }),
    }
  )
)
