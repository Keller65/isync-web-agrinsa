'use client'

import axios from 'axios'
import { useEffect, useState, useRef, useCallback } from 'react'

function formatPrice(price: number) {
  const [intPart, decPart = ''] = price.toFixed(4).split('.')
  const withCommas = parseInt(intPart).toLocaleString('es-HN')
  return { intPart: withCommas, decPart }
}

function formatNumber(num: number): string {
  return num.toLocaleString('es-HN')
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Input } from '@/components/ui/input'
import { useCustomerStore } from '@/lib/store/store.customer'
import { useCartStore } from '@/lib/store/store.cart'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table'
import { Product } from '@/types/products'
import Image from 'next/image'
import { BackButton } from '@/components/ui/back-button'
import { MagnifyingGlass, SealPercent, Tag, Funnel, ChartPieSliceIcon, CircleNotch, FileText, Hash, Calendar, Cube, TagSimple, Money, Receipt, ShoppingCart } from '@phosphor-icons/react'
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useSettingsStore } from '@/lib/store/store.general'
import { logClient } from '@/lib/logger/logger.client'
import { useSession } from 'next-auth/react'

interface SubCategory {
  name: string
}

interface Category {
  code: string
  name: string
  subCategories?: SubCategory[]
}

interface ProductFilters {
  subCategory: string | null,
  inStock: boolean,
}

interface ItemAnalytics {
  docType: string
  docEntry: number
  docNum: number
  docDate: string
  lineNum: number
  itemCode: string
  quantity: number
  netBeforeDiscount: number
  discountPercent: number
  netAfterDiscount: number
  grossAfterDiscount: number
  taxCode: string
  vatPercent: number
}

function ProductList({ endpoint, groupCode = 0, filters }: { endpoint: string, groupCode?: string | number, filters?: ProductFilters }) {
  const { data: session } = useSession()
  const token = session?.user.token
  const fullName = session?.user.fullName
  const { selectedCustomer } = useCustomerStore()
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)

  const filteredProducts = products

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !hasMore || loading) return

      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1)
        }
      })

      observer.current.observe(node)
    },
    [hasMore, loading]
  )

  const fetchProducts = useCallback(async () => {
    if (!token || !hasMore || loading) return

    setLoading(true)

    try {
      const cardCode = selectedCustomer?.cardCode ?? '205'
      const priceList = selectedCustomer?.priceListNum ?? 1

      const res = await axios.get(
        `/api-proxy${endpoint}`,
        {
          params: {
            cardCode,
            priceList,
            groupCode,
            page,
            pageSize: 20,
            search: filters?.subCategory || undefined,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const newItems: Product[] = res.data?.items ?? res.data ?? []

      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setProducts(prev => {
          const combined = [...prev, ...newItems]
          return Array.from(new Map(combined.map(p => [p.itemCode, p])).values())
        })
        setHasMore(newItems.length === 20)
      }
    } catch (err: any) {
      logClient({
        level: 'ERROR',
        category: 'PEDIDO',
        endpoint: `/api-proxy${endpoint}`,
        errorCode: err.response?.status,
        message: err.response?.data?.message || err.response?.data?.error || 'Error al cargar productos',
        responseBody: err.response?.data,
        pageUrl: '/dashboard/orders/shop',
        userId: fullName ?? undefined,
      });
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [token, page, selectedCustomer, hasMore, endpoint, groupCode, filters, fullName])

  /* Reset al cambiar cliente o categoría */
  useEffect(() => {
    setProducts([])
    setPage(1)
    setHasMore(true)
  }, [selectedCustomer?.cardCode, groupCode])

  useEffect(() => {
    fetchProducts()
  }, [page, fetchProducts])

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-2 md:gap-5">
        {filteredProducts.map((product, i) => {
          const isLast = i === filteredProducts.length - 1

          return (
            <div
              key={product.itemCode}
              ref={isLast ? lastItemRef : undefined}
              className="flex"
            >
              <ProductCard product={product} />
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!hasMore && filteredProducts.length > 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No hay más productos disponibles.
        </p>
      )}

      {!loading && products.length === 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No se encontraron productos.
        </p>
      )}

      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No hay productos que coincidan con los filtros.
        </p>
      )}
    </div>
  )
}

function SearchedProducts({ searchTerm, filters }: { searchTerm: string, filters?: ProductFilters }) {
  const { data: session } = useSession()
  const token = session?.user.token
  const fullName = session?.user.fullName
  const { selectedCustomer } = useCustomerStore()
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const filteredProducts = products
  const observer = useRef<IntersectionObserver | null>(null)

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !hasMore || loading) return

      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1)
        }
      })

      observer.current.observe(node)
    },
    [hasMore, loading]
  )

  const fetchProducts = useCallback(async () => {
    if (!token || !hasMore || loading) return

    setLoading(true)

    try {
      const cardCode = selectedCustomer?.cardCode ?? '205'
      const priceList = selectedCustomer?.priceListNum ?? 1

      const combinedSearch = filters?.subCategory
        ? `${searchTerm} ${filters.subCategory}`.trim()
        : searchTerm

      const res = await axios.get(
        `/api-proxy/api/Catalog/products/search`,
        {
          params: {
            search: combinedSearch,
            cardCode,
            priceList,
            groupCode: 0,
            page,
            pageSize: 20,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const newItems: Product[] = res.data?.items ?? res.data ?? []

      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setProducts(prev => {
          const combined = [...prev, ...newItems]
          return Array.from(new Map(combined.map(p => [p.itemCode, p])).values())
        })
        setHasMore(newItems.length === 20)
      }
    } catch (err: any) {
      logClient({
        level: 'ERROR',
        category: 'PEDIDO',
        endpoint: '/api-proxy/api/Catalog/products/search',
        errorCode: err.response?.status,
        message: err.response?.data?.message || err.response?.data?.error || `Error al buscar productos: "${searchTerm}"`,
        responseBody: err.response?.data,
        pageUrl: '/dashboard/orders/shop',
        userId: fullName ?? undefined,
      });
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [token, page, selectedCustomer, hasMore, searchTerm, filters, fullName])

  /* Reset al cambiar cliente o término de búsqueda */
  useEffect(() => {
    setProducts([])
    setPage(1)
    setHasMore(true)
  }, [selectedCustomer?.cardCode, searchTerm])

  useEffect(() => {
    fetchProducts()
  }, [page, fetchProducts])

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-3 md:gap-5">
        {filteredProducts.map((product, i) => {
          const isLast = i === filteredProducts.length - 1

          return (
            <div
              key={product.itemCode}
              ref={isLast ? lastItemRef : undefined}
              className="flex"
            >
              <ProductCard product={product} />
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!hasMore && filteredProducts.length > 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No hay más productos disponibles.
        </p>
      )}

      {!loading && products.length === 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No se encontraron productos para "{searchTerm}".
        </p>
      )}

      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No hay productos que coincidan con los filtros.
        </p>
      )}
    </div>
  )
}

function DiscountedProducts({ filters }: { filters?: ProductFilters }) {
  return <ProductList endpoint="/api/Catalog/products/discounted-by-customer" groupCode={0} filters={filters} />
}

function CategoryProducts({ groupCode, filters }: { groupCode: string, filters?: ProductFilters }) {
  return <ProductList endpoint="/api/Catalog/products/search" groupCode={groupCode} filters={filters} />
}

function ProductCard({ product }: { product: Product }) {
  const { addProduct, updateQuantity, productsInCart } = useCartStore()
  const { selectedCustomer } = useCustomerStore()
  const { data: session } = useSession()
  const token = session?.user.token
  const fullName = session?.user.fullName
  const [quantity, setQuantity] = useState(1)
  const [open, setOpen] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<ItemAnalytics[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [alertInfo, setAlertInfo] = useState<{ title: string; description: string; onConfirm?: () => void; showCancel?: boolean } | null>(null);

  const [editablePrice, setEditablePrice] = useState(product.price)
  const [editablePriceText, setEditablePriceText] = useState(product.price.toFixed(4))
  const [isPriceValid, setIsPriceValid] = useState(true)
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false)
  const [applyTierDiscounts, setApplyTierDiscounts] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const { productsWithImage } = useSettingsStore()

  const tier = product.tiers?.[0]
  const finalPrice = tier ? tier.price : product.price
  const isFletes = product.itemName?.toUpperCase().includes('FLETES')
  const isGroup120 = product.groupCode === '120'
  const canEditPrice = isFletes || isGroup120 || product.priceListNum !== 11

  const fetchAnalytics = useCallback(async () => {
    if (!token || !selectedCustomer) return

    setLoadingAnalytics(true)
    try {
      const res = await axios.get<ItemAnalytics[]>(
        `/api-proxy/api/Kpi/item-last-moves?cardCode=${selectedCustomer.cardCode}&itemCode=${product.itemCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      setAnalyticsData(res.data)
    } catch (err: any) {
      logClient({
        level: 'ERROR',
        category: 'ANALITICAS',
        endpoint: `/api-proxy/api/Kpi/item-last-moves`,
        errorCode: err.response?.status,
        message: err.response?.data?.message || err.response?.data?.error || `Error al cargar analíticas del producto ${product.itemCode}`,
        responseBody: err.response?.data,
        pageUrl: '/dashboard/orders/shop',
        userId: fullName ?? undefined,
      });
    } finally {
      setLoadingAnalytics(false)
    }
  }, [token, selectedCustomer, product.itemCode, fullName])

  useEffect(() => {
    if (open && analyticsData.length === 0) {
      fetchAnalytics()
    }
  }, [open, fetchAnalytics])

  useEffect(() => {
    if (isPriceManuallyEdited) return

    let newUnitPrice
    if (applyTierDiscounts && product.tiers && product.tiers.length > 0) {
      const applicableTier = [...product.tiers]
        .filter(t => quantity >= t.qty)
        .sort((a, b) => b.qty - a.qty)[0]
      newUnitPrice = applicableTier ? applicableTier.price : product.price
    } else {
      newUnitPrice = product.price
    }

    setEditablePrice(newUnitPrice)
    setEditablePriceText(newUnitPrice.toFixed(4))
    setIsPriceValid(true)
  }, [quantity, applyTierDiscounts, product, isPriceManuallyEdited])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPriceManuallyEdited(true)
    const text = e.target.value
    const cleanedText = text.replace(/[^0-9.]/g, '')
    const parts = cleanedText.split('.')
    let finalValueText = cleanedText
    if (parts.length > 2) {
      finalValueText = parts.slice(0, 2).join('.')
    }
    setEditablePriceText(finalValueText)
    const parsedValue = parseFloat(finalValueText)
    if (!isNaN(parsedValue)) {
      setEditablePrice(parsedValue)
    } else {
      setEditablePrice(0)
    }
  }

  const handlePriceBlur = () => {
    let finalValue = parseFloat(editablePriceText)
    if (isNaN(finalValue)) {
      finalValue = product.price
    } else {
      finalValue = parseFloat(finalValue.toFixed(4))
    }
    setEditablePrice(finalValue)
    setEditablePriceText(finalValue.toFixed(4))

    const applicableTier = product.tiers
      ?.filter(t => quantity >= t.qty)
      .sort((a, b) => b.qty - a.qty)[0]

    const minimumAllowedPrice = (applyTierDiscounts && applicableTier)
      ? applicableTier.price
      : product.price

    setIsPriceValid(discountPercent > 0 || finalValue >= minimumAllowedPrice)
  }

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const validated = isNaN(value) ? 0 : Math.min(Math.max(value, 0), 5)
    setDiscountPercent(validated)
    const newPrice = product.price * (1 - validated / 100)
    setEditablePrice(newPrice)
    setEditablePriceText(newPrice.toFixed(4))
    setIsPriceValid(validated > 0 || newPrice >= product.price)
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    const cleanedText = text.replace(/[^0-9]/g, '')

    if (cleanedText === '') {
      setQuantity(0)
    } else {
      const newQuantity = parseInt(cleanedText, 10)
      setQuantity(Math.max(0, isNaN(newQuantity) ? 0 : newQuantity))
    }
  }

  const handleAddToCart = useCallback(() => {
    const finalUnitPrice = editablePrice

    if (!product || quantity <= 0 || !isPriceValid || finalUnitPrice <= 0) {
      setAlertInfo({
        title: 'Datos inválidos',
        description: 'Verifica la cantidad y el precio.',
        showCancel: false,
      })
      return
    }

    const itemInCart = productsInCart.find(
      p => p.itemCode === product.itemCode
    )

    const cartItem = {
      itemCode: product.itemCode,
      itemName: product.itemName,
      barCode: product.barCode ?? product.itemCode,
      quantity,
      priceList: product.price,        // PRECIO BASE REAL
      priceAfterVAT: finalUnitPrice,   // PRECIO FINAL (con descuento)
      unitPrice: finalUnitPrice,
      taxCode: product.taxType,
      suppCatNum: product.suppCatNum,
    }

    if (itemInCart) {
      setAlertInfo({
        title: 'Producto ya en el carrito',
        description: `${product.itemName} ya está en el carrito. ¿Actualizar?`,
        showCancel: true,
        onConfirm: () => {
          updateQuantity(
            product.itemCode,
            quantity,
            finalUnitPrice,
            product.inStock
          )
          setOpen(false)
        },
      })
    } else {
      logClient({
        level: 'INFO',
        category: 'PEDIDO',
        endpoint: '/api-proxy/api/Catalog/products/search',
        message: `Producto agregado al carrito: ${product.itemName} (${product.itemCode}) x${quantity}`,
        payload: cartItem,
        pageUrl: '/dashboard/orders/shop',
        userId: fullName ?? undefined,
      });
      addProduct(cartItem)
      setOpen(false)
    }
  }, [product, quantity, editablePrice, isPriceValid, productsInCart, addProduct, updateQuantity,])

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <section
            style={{ paddingTop: productsWithImage ? 0 : 40 }}
            className="cursor-pointer relative flex flex-col w-full bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-white/[0.07] transition-all duration-300 group overflow-hidden"
          >
            {productsWithImage !== false ? (
              <div className="h-44 bg-linear-to-b from-gray-50 to-white dark:from-dark-raised dark:to-dark-card rounded-t-2xl flex items-center justify-center overflow-hidden p-3">
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src="https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/100000.jpg"
                    alt={product.itemName}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                    height={400}
                    width={400}
                  />
                </div>
              </div>
            ) : null}

            {product.hasDiscount && (
              <div className="absolute top-0 right-0">
                <div className={`px-3 py-1.5 rounded-bl-xl text-white text-xs font-bold ${product.pricingSource === "GeneralSpecialPrice"
                  ? 'bg-linear-to-r from-red-500 to-red-600'
                  : 'bg-linear-to-r from-emerald-500 to-emerald-600'
                  }`}>
                  <div className="flex items-center gap-1">
                    <SealPercent weight="fill" size={14} />
                    <span>Cotizacion</span>
                  </div>
                </div>
              </div>
            )}

            {product.inStock <= 0 && (
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded-full">
                  SIN STOCK
                </span>
              </div>
            )}

            {product.inStock > 0 && product.inStock <= 10 && (
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                  ¡Últimas {formatNumber(product.inStock)}!
                </span>
              </div>
            )}

            <div className="p-4 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-dark-text-primary line-clamp-2 leading-tight flex-1">
                  {product.itemName}
                </h3>
              </div>

              <div className="flex flex-row items-start justify-between text-xs">
                <div className="flex flex-col gap-2">
                  <p className="text-gray-500 dark:text-dark-text-muted font-medium">
                    SKU:{" "}
                    <span className="bg-gray-200 dark:bg-dark-raised text-gray-500 dark:text-dark-text-muted px-2 py-0.5 rounded-full">
                      {product.suppCatNum}
                    </span>
                  </p>
                  <p className="text-gray-500 dark:text-dark-text-muted font-medium">
                    Código:{" "}
                    <span className="bg-gray-200 dark:bg-dark-raised text-gray-500 dark:text-dark-text-muted px-2 py-0.5 rounded-full">
                      {product.itemCode}
                    </span>
                  </p>
                </div>
                <span className="bg-gray-100 dark:bg-dark-raised text-gray-600 dark:text-dark-text-muted px-2 py-0.5 rounded-md font-medium text-[10px]">
                  {product.salesUnit}
                </span>
              </div>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-black text-brand-primary dark:text-dark-text-primary flex items-baseline">
                  L.{formatPrice(finalPrice).intPart}
                  <span className="text-xs font-bold">.{formatPrice(finalPrice).decPart}</span>
                </span>
                {tier && (
                  <span className="text-xs text-gray-400 dark:text-dark-text-disabled line-through">
                    L.{formatPrice(product.price).intPart}
                    <span className="text-[10px]">.{formatPrice(product.price).decPart}</span>
                  </span>
                )}
              </div>

              <div className="pt-2">
                <Button className="w-full text-sm rounded-full font-semibold py-2.5 transition-all duration-200 bg-brand-primary hover:bg-brand-primary/90 text-white">
                  Ver Detalles
                </Button>
              </div>
            </div>
          </section>
        </DialogTrigger>

        {/* Dialog */}
        <DialogContent className="w-full max-w-full sm:max-w-[96vw] p-0 overflow-hidden flex flex-col h-dvh sm:h-auto sm:max-h-[96vh] rounded-none sm:rounded-lg dark:bg-dark-card dark:border-white/[0.07]">
          <DialogHeader className="px-4 sm:px-6 pt-4 pb-0">
            <DialogTitle className="text-base sm:text-xl font-bold leading-snug dark:text-dark-text-primary">
              {product.itemName}
            </DialogTitle>
            <section className="flex flex-wrap gap-x-6 gap-y-1">
              {[
                { label: "Código", value: product.itemCode },
                { label: "SKU", value: product.suppCatNum },
                { label: "Unidad", value: `${product.salesUnit || 'N/A'} x ${product.salesItemsPerUnit}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-row items-center gap-2">
                  <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase">{label}:</p>
                  <p className="text-sm font-medium dark:text-dark-text-secondary">{value}</p>
                </div>
              ))}
            </section>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row gap-6">

              {/* Imagen */}
              <div className="lg:w-100 shrink-0 hidden sm:block">
                <div className="aspect-square bg-white dark:bg-dark-raised rounded-lg flex items-center justify-center overflow-hidden border dark:border-white/[0.07]">
                  <Image
                    src="https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/100000.jpg"
                    alt={product.itemName}
                    className="w-full h-full object-contain p-4"
                    height={400}
                    width={400}
                  />
                </div>
              </div>

              {/* Datos del producto */}
              <div className="flex-1 lg:overflow-y-auto lg:max-h-[calc(90vh-220px)]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase">Categoría</p>
                      <p className="text-sm font-medium dark:text-dark-text-secondary">{product.groupName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase">Disponibilidad</p>
                      <p className={`text-sm font-bold ${product.inStock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {product.inStock > 0 ? `${formatNumber(product.inStock)} en stock` : 'Agotado'}
                      </p>
                    </div>
                  </div>

                  <section className="pt-4 border-t dark:border-white/6 flex flex-wrap gap-4 justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase mb-2">Precio de Venta</p>
                      <div className="flex flex-col gap-1">
                        <div className="relative flex items-center">
                          <span className="font-bold text-lg mr-1 dark:text-dark-text-primary">L.</span>
                          <Input
                            type="text"
                            className={`w-40 font-bold text-lg h-11 tabular-nums dark:bg-dark-raised dark:border-white/6 dark:text-dark-text-primary ${!isPriceValid ? 'border-red-500 bg-red-500/10' : ''
                              } ${!canEditPrice ? 'dark:bg-dark-raised dark:text-dark-text-muted' : ''}`}
                            value={editablePriceText}
                            onChange={handlePriceChange}
                            onBlur={handlePriceBlur}
                            readOnly={!canEditPrice}
                          />
                        </div>
                        {!isPriceValid && (
                          <p className="text-[10px] text-red-500 dark:text-red-400 font-medium">
                            El precio no puede ser menor al mínimo permitido.
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 dark:text-dark-text-disabled">
                          Precio base original: L. {formatPrice(product.price).intPart}
                          <span className="text-[10px]">.{formatPrice(product.price).decPart}</span> + {product.taxType}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-dark-text-disabled">{product.priceListName}</p>
                      </div>
                    </div>

                    {(product.priceListNum === 11 && !isFletes && !isGroup120) && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase mb-2">Descuento</p>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0} max={5} step={0.01}
                            className="w-20 font-bold text-lg h-11 tabular-nums dark:bg-dark-raised dark:border-white/[0.07] dark:text-dark-text-primary"
                            value={discountPercent}
                            onChange={handleDiscountChange}
                          />
                          <span className="font-bold text-lg dark:text-dark-text-primary">%</span>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-dark-text-disabled">Máx. 5%</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase mb-2">Cantidad a comprar</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border dark:border-white/[0.07] rounded-lg overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none h-10 w-10 dark:text-dark-text-secondary dark:hover:bg-dark-raised"
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          >
                            -
                          </Button>
                          <Input
                            type="text"
                            className="w-12 h-10 border-none rounded-none text-center font-bold text-lg focus-visible:ring-0 p-0 dark:bg-dark-card dark:text-dark-text-primary"
                            value={formatNumber(quantity)}
                            onChange={handleQuantityChange}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none h-10 w-10 dark:text-dark-text-secondary dark:hover:bg-dark-raised"
                            onClick={() => setQuantity(q => q + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-dark-text-muted">{product.salesUnit}</span>
                      </div>
                    </div>
                  </section>

                  {/* Inventario general */}
                  <div className="pt-4 border-t dark:border-white/6">
                    <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase mb-2">Inventario General</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Disponible", value: product.inStock },
                        { label: "En Pedido", value: product.ordered },
                        { label: "Comprometido", value: product.committed },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-100 dark:bg-dark-raised p-2 rounded-lg text-start">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-dark-text-disabled uppercase">{label}</p>
                          <p className="text-sm font-bold dark:text-dark-text-primary">{formatNumber(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stock por almacén */}
                  {product.ws && product.ws.length > 0 && (
                    <div className="pt-4 border-t dark:border-white/6">
                      <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase mb-2">Stock por Almacén</p>
                      <div className="space-y-1">
                        {product.ws.map((w, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-dark-text-muted">{w.warehouseName}</span>
                            <span className="font-medium dark:text-dark-text-primary">{formatNumber(w.inStock)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tiers */}
                {product.tiers && product.tiers.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-400 dark:text-dark-text-disabled uppercase">Precios por Cantidad</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => { setApplyTierDiscounts(!applyTierDiscounts); setIsPriceManuallyEdited(false) }}
                        className="h-auto p-0 text-[10px] font-bold text-brand-primary dark:text-dark-text-secondary hover:no-underline"
                      >
                        {applyTierDiscounts ? 'DESACTIVAR' : 'ACTIVAR'}
                      </Button>
                    </div>
                    <div className={`border dark:border-white/6 rounded-md overflow-hidden transition-opacity ${!applyTierDiscounts ? 'opacity-50' : 'opacity-100'}`}>
                      <Table>
                        <TableHeader className="bg-gray-100 dark:bg-dark-raised">
                          <TableRow className="dark:border-white/6">
                            <TableHead className="h-9 text-xs font-bold uppercase dark:text-dark-text-muted">Cantidad</TableHead>
                            <TableHead className="h-9 text-xs font-bold uppercase text-right dark:text-dark-text-muted">Precio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {product.tiers.map((t, idx) => (
                            <TableRow key={idx} className="dark:border-white/6 dark:hover:bg-dark-raised">
                              <TableCell className="py-2 text-sm">
                                <div className="font-semibold dark:text-dark-text-primary">
                                  Desde {formatNumber(t.qty)} und.{" "}
                                  <span className="font-semibold bg-green-200 dark:bg-green-400/10 py-0 px-2 rounded-full text-sm text-green-500 dark:text-green-400">
                                    {t.percent}%
                                  </span>
                                </div>
                                <div className="text-red-400 dark:text-red-400 text-xs">
                                  Expira: <span>{t.expiry}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 text-sm text-right text-brand-primary dark:text-dark-text-primary">
                                L.{formatPrice(t.price).intPart}
                                <span className="text-[10px] font-normal">.{formatPrice(t.price).decPart}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="mt-auto p-4 bg-gray-50 dark:bg-dark-raised rounded-lg border border-dashed border-gray-200 dark:border-white/[0.07]">
                  <p className="text-xs text-gray-400 dark:text-dark-text-disabled italic">
                    * El precio final puede variar según las promociones vigentes al momento de la facturación.
                  </p>
                </div>
              </div>

              {/* Analíticas */}
              <div className="lg:w-90 shrink-0 border-t dark:border-white/6 pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6 dark:lg:border-white/6 lg:sticky lg:top-0 lg:h-[calc(90vh-180px)] lg:flex lg:flex-col">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <ChartPieSliceIcon size={20} className="text-gray-500 dark:text-dark-text-muted" weight="fill" />
                  <h3 className="font-bold text-md dark:text-dark-text-primary">Historial de Movimientos</h3>
                </div>

                {loadingAnalytics ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <CircleNotch className="animate-spin text-gray-400 dark:text-dark-text-muted" size={28} weight="bold" />
                    <p className="text-xs text-gray-400 dark:text-dark-text-muted">Cargando...</p>
                  </div>
                ) : analyticsData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-400 dark:text-dark-text-disabled">
                    <FileText size={32} weight="thin" />
                    <p className="text-xs text-center">Sin historial de movimientos</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {analyticsData.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-dark-raised rounded-lg p-4 border border-gray-100 dark:border-white/6 hover:border-gray-300 dark:hover:border-white/12 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-1 rounded bg-gray-200 dark:bg-dark-card text-gray-600 dark:text-dark-text-secondary">
                              {item.docType}
                            </span>
                            <span className="text-sm font-medium flex items-center gap-1 dark:text-dark-text-primary">
                              <Hash size={14} /> {item.docNum}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-dark-text-disabled">
                            {new Date(item.docDate).toLocaleDateString('es-HN')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { icon: Cube, label: "Cantidad", value: formatNumber(item.quantity) },
                            { icon: TagSimple, label: "Dto%", value: `${formatNumber(item.discountPercent)}%` },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-2">
                              <Icon size={16} className="text-gray-400 dark:text-dark-text-disabled" />
                              <div>
                                <p className="text-xs text-gray-400 dark:text-dark-text-disabled uppercase">{label}</p>
                                <p className="text-sm font-bold dark:text-dark-text-primary">{value}</p>
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <Money size={16} className="text-gray-400 dark:text-dark-text-disabled" />
                            <div>
                              <p className="text-xs text-gray-400 dark:text-dark-text-disabled uppercase">Neto</p>
                              <p className="text-sm font-bold dark:text-dark-text-primary">
                                L. {formatPrice(item.netAfterDiscount).intPart}
                                <span className="text-[10px]">.{formatPrice(item.netAfterDiscount).decPart}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingCart size={16} className="text-gray-400 dark:text-dark-text-disabled" />
                            <div>
                              <p className="text-xs text-gray-400 dark:text-dark-text-disabled uppercase">Total</p>
                              <p className="text-sm font-bold dark:text-dark-text-primary">
                                L. {formatPrice(item.grossAfterDiscount).intPart}
                                <span className="text-[10px]">.{formatPrice(item.grossAfterDiscount).decPart}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/6">
                          <p className="text-xs text-gray-400 dark:text-dark-text-disabled">
                            {item.taxCode} ({item.vatPercent}%)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-4 py-4 sm:px-6 border-t dark:border-white/6 bg-white dark:bg-dark-card flex flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 dark:text-dark-text-disabled font-medium uppercase tracking-wider">
                Total estimado
              </span>
              <div className="flex items-baseline gap-0">
                <span className="text-2xl sm:text-3xl font-black dark:text-dark-text-primary">
                  L.{formatPrice(editablePrice * quantity).intPart}
                </span>
                <span className="text-sm font-bold dark:text-dark-text-primary">
                  .{formatPrice(editablePrice * quantity).decPart}
                </span>
              </div>
            </div>
            <Button
              className="bg-brand-primary text-white hover:bg-brand-primary/90 rounded-full px-6 py-3 h-auto text-xs font-bold transition-transform active:scale-95"
              onClick={handleAddToCart}
              disabled={!isPriceValid}
            >
              Agregar al carrito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!alertInfo} onOpenChange={(isOpen) => !isOpen && setAlertInfo(null)}>
        <AlertDialogContent className="dark:bg-dark-card dark:border-white/6">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-dark-text-primary">{alertInfo?.title}</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-dark-text-muted">
              {alertInfo?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertInfo?.showCancel && (
              <AlertDialogCancel className="dark:bg-dark-raised dark:text-dark-text-secondary dark:border-white/6">
                Cancelar
              </AlertDialogCancel>
            )}
            <AlertDialogAction onClick={alertInfo?.onConfirm}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function Page() {
  const { data: session } = useSession()
  const token = session?.user.token
  const fullName = session?.user.fullName
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('ofertas')
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    subCategory: null as string | null,
  })

  const activeFiltersCount = filters.subCategory ? 1 : 0

  const currentCategory = categories.find(c => c.code === activeCategory)
  const subCategories = currentCategory?.subCategories || []

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setActiveSubCategory(null)
    setFilters(prev => ({ ...prev, subCategory: null }))
  }, [activeCategory])


  useEffect(() => {
    if (!token) return

    axios
      .get<Category[]>('/api-proxy/sap/items/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => setCategories(res.data))
      .catch((err: any) => {
        logClient({
          level: 'ERROR',
          category: 'GENERAL',
          endpoint: '/api-proxy/sap/items/categories',
          errorCode: err.response?.status,
          message: err.response?.data?.message || err.response?.data?.error || 'Error al cargar categorías',
          responseBody: err.response?.data,
          pageUrl: '/dashboard/orders/shop',
          userId: fullName ?? undefined,
        });
      })
  }, [token, fullName])

  if (!token) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Inicia sesión para ver el catálogo.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full p-6 dark:bg-dark-page">
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Categorías sidebar - desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-20 overflow-hidden">
            <BackButton />

            {/* Botón Cotizaciones */}
            <button
              onClick={() => { setActiveCategory('ofertas'); setSearchTerm('') }}
              className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors ${activeCategory === 'ofertas'
                ? 'bg-brand-primary dark:bg-dark-raised text-white dark:text-dark-text-primary'
                : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised'
                }`}
            >
              <Tag size={16} weight="fill" />
              <span className="font-medium text-sm">Cotizaciones</span>
            </button>

            <div className="px-4 py-2 border-t dark:border-white/6">
              <span className="text-xs text-gray-400 dark:text-dark-text-disabled uppercase tracking-wider">
                Categorías
              </span>
            </div>

            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              {categories.map(cat => (
                <button
                  key={cat.code}
                  onClick={() => { setActiveCategory(cat.code); setSearchTerm('') }}
                  className={`w-full flex items-center px-1 py-2 text-left transition-colors ${activeCategory === cat.code
                    ? 'bg-brand-primary/10 dark:bg-dark-raised text-brand-primary dark:text-dark-text-primary border-l-4 border-brand-primary dark:border-dark-text-primary'
                    : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised border-l-4 border-transparent'
                    }`}
                >
                  <span className="font-medium text-xs truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <div className="flex-1">
          {/* Mobile: Categorías horizontales */}
          <div className="lg:hidden -mx-4 -mt-4 px-4 py-2 mb-2 border-b dark:border-white/6 overflow-x-auto flex gap-2">
            <button
              onClick={() => { setActiveCategory('ofertas'); setSearchTerm('') }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${activeCategory === 'ofertas'
                ? 'bg-brand-primary dark:bg-dark-raised text-white dark:text-dark-text-primary'
                : 'bg-gray-100 dark:bg-dark-raised text-gray-500 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-white/6'
                }`}
            >
              <Tag size={14} weight="fill" />
              Cotizaciones
            </button>

            {categories.map(cat => (
              <button
                key={cat.code}
                onClick={() => { setActiveCategory(cat.code); setSearchTerm('') }}
                className={`px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${activeCategory === cat.code
                  ? 'bg-brand-primary dark:bg-dark-raised text-white dark:text-dark-text-primary'
                  : 'bg-gray-100 dark:bg-dark-raised text-gray-500 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-white/6'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Subcategorías mobile */}
          {subCategories.length > 0 && (
            <div className="lg:hidden hidden mb-4 -mx-4 px-4 overflow-x-auto gap-2 pb-2">
              <button
                onClick={() => {
                  setActiveSubCategory(null)
                  setFilters(prev => ({ ...prev, subCategory: null }))
                  setSearchTerm('')
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${activeSubCategory === null
                  ? 'bg-brand-primary dark:bg-dark-raised text-white dark:text-dark-text-primary'
                  : 'bg-gray-100 dark:bg-dark-raised text-gray-500 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-white/6'
                  }`}
              >
                Todas
              </button>

              {subCategories.map((sub, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSubCategory(sub.name)
                    setFilters(prev => ({ ...prev, subCategory: sub.name }))
                    setSearchTerm(sub.name)
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${activeSubCategory === sub.name
                    ? 'bg-brand-primary dark:bg-dark-raised text-white dark:text-dark-text-primary'
                    : 'bg-gray-100 dark:bg-dark-raised text-gray-500 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-white/6'
                    }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* Search bar */}
          <div className="sticky bg-[#f9fafb] dark:bg-dark-page top-20 z-10 pb-2">
            <div className="flex gap-2">
              <InputGroup className="rounded-full h-12.5 px-2 flex-1 dark:bg-dark-card dark:border-white/[0.07]">
                <InputGroupInput
                  placeholder={filters.subCategory ? '' : "Buscar Producto por nombre, codigo, etc..."}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="dark:text-dark-text-primary dark:placeholder:text-dark-text-disabled"
                />
                <InputGroupAddon>
                  <MagnifyingGlass size={32} className="text-gray-400 dark:text-dark-text-muted" />
                </InputGroupAddon>
              </InputGroup>

              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12.5 w-12.5 rounded-full px-4 relative dark:bg-dark-card dark:border-white/[0.07] dark:text-dark-text-secondary dark:hover:bg-dark-raised"
                  >
                    <Funnel size={24} />
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-72 dark:bg-dark-card dark:border-white/[0.07]" align="end">
                  <PopoverHeader>
                    <PopoverTitle className="dark:text-dark-text-primary">
                      {activeCategory === 'ofertas'
                        ? 'Todas las Subcategorías'
                        : categories.find(c => c.code === activeCategory)?.name || 'Subcategorías'}
                    </PopoverTitle>
                  </PopoverHeader>

                  <div className="max-h-64 overflow-y-auto space-y-1 pt-1">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, subCategory: null }))
                        setSearchTerm('')
                        setFilterOpen(false)
                      }}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${filters.subCategory === null
                        ? 'bg-brand-primary/10 dark:bg-dark-raised text-brand-primary dark:text-dark-text-primary font-medium'
                        : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised'
                        }`}
                    >
                      Todas las subcategorías
                    </button>

                    {(activeCategory === 'ofertas'
                      ? categories.flatMap(cat => (cat.subCategories || []).map(sub => ({ ...sub, catCode: cat.code })))
                      : categories.find(c => c.code === activeCategory)?.subCategories || []
                    ).map((sub: any, idx: number) => (
                      <button
                        key={activeCategory === 'ofertas' ? `${sub.catCode}-${idx}` : idx}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, subCategory: sub.name }))
                          setSearchTerm(sub.name)
                          setFilterOpen(false)
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${filters.subCategory === sub.name
                          ? 'bg-brand-primary/10 dark:bg-dark-raised text-brand-primary dark:text-dark-text-primary font-medium'
                          : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised'
                          }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <main className="flex-1 min-w-0">
            {debouncedSearchTerm ? (
              <SearchedProducts searchTerm={debouncedSearchTerm} />
            ) : activeCategory === 'ofertas' ? (
              <DiscountedProducts />
            ) : (
              <CategoryProducts groupCode={activeCategory} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}