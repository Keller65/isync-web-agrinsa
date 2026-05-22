"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCustomerStore } from '@/lib/store/store.customer'
import { useCartStore } from '@/lib/store/store.cart'
import { X, Plus, Edit3, AlertCircle, Trash } from "lucide-react"
import { PenIcon, ShoppingCartIcon, MapPinLine } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import { CustomerAddress } from "@/types/customers"
import { Howl } from "howler"
import { useSession } from "next-auth/react"

let successSound: Howl | null = null
let errorSound: Howl | null = null

const getSuccessSound = () => {
  if (!successSound) {
    successSound = new Howl({
      src: ["/sound/success.mp3"],
      volume: 0.5,
    });
  }
  return successSound
}

const getErrorSound = () => {
  if (!errorSound) {
    errorSound = new Howl({
      src: ["/sound/error.mp3"],
      volume: 0.5,
    });
  }
  return errorSound
}

const PriceDisplay = ({ price, decimalNum }: { price: number; decimalNum: number }) => {
  const formatted = price.toLocaleString('es-HN', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const [integer, decimal] = formatted.split('.');
  const totalDecimals = decimalNum ?? 3;
  const decimalPart = decimal ? decimal.substring(0, totalDecimals) : '00';
  return (
    <span>
      <span>{integer}</span>
      <span className="text-[10px]">.{decimalPart}</span>
    </span>
  );
}

function CartISync() {
  const router = useRouter()
  const { selectedCustomer, selectedAddress, clearSelectedCustomer, setSelectedAddress, sellerDifferent, selectedSlpCode } = useCustomerStore()
  const { productsInCart, removeProduct, clearCart, editMode, setEditMode, setDocEntry, docEntry, open, setOpen } = useCartStore()
  const { data: session } = useSession()
  const u_WhsCode = session?.user.u_WhsCode
  const u_SerieCot = session?.user.u_SerieCot
  const token = session?.user.token
  const salesPersonCode = session?.user.salesPersonCode

  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [showConfirmAlert, setShowConfirmAlert] = useState(false)
  const [showCancelOrderAlert, setShowCancelOrderAlert] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)

  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false)
  const [editCustomerName, setEditCustomerName] = useState("")
  const [editCustomerRTN, setEditCustomerRTN] = useState("")

  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [, setLoadingAddresses] = useState(false)
  const [orderInfo, setOrderInfo] = useState<{ docEntry?: string }>({})
  const [comments, setComments] = useState("")
  const [orderId, setOrderId] = useState<string | null>(null)

  const isProcessing = useRef(false)
  const TAX_RATE = 0.15

  useEffect(() => {
    if (productsInCart.length === 0 && open) {
      setOpen(false)
    }
  }, [productsInCart.length, open, setOpen])

  useEffect(() => {
    if (editMode) {
      setOrderId(null)
      return
    }

    if (productsInCart.length > 0 && !orderId) {
      setOrderId(uuidv4())
    } else if (productsInCart.length === 0 && orderId) {
      setOrderId(null)
    }
  }, [productsInCart, orderId, editMode])

  const { taxableAmount, tax } = productsInCart.reduce(
    (acc, item) => {
      const price = (item.priceAfterVAT ?? item.unitPriceNoVAT ?? item.priceList ?? 0)
      const quantity = item.quantity ?? 0
      const totalPrice = price * quantity

      const isExempt = item.taxCode === "EXO" || item.taxCode === "EXE"

      if (!isExempt) {
        acc.taxableAmount += totalPrice
      }

      return acc
    },
    { taxableAmount: 0, tax: 0 }
  )

  const subtotal = productsInCart.reduce(
    (acc, item) => {
      const price = (item.priceAfterVAT ?? item.unitPriceNoVAT ?? item.priceList ?? 0)
      return acc + price * (item.quantity ?? 0)
    },
    0
  )

  const calculatedTax = taxableAmount * 0.15
  const total = subtotal + calculatedTax

  const triggerError = (message: string) => {
    setErrorMessage(message)
    setShowErrorAlert(true)
    getErrorSound().play();
  }

  const fetchAddresses = async () => {
    if (!selectedCustomer) return

    try {
      setLoadingAddresses(true)
      const { data } = await axios.get<CustomerAddress[]>(
        `/api-proxy/api/Customers/${selectedCustomer.cardCode}/addresses`,
        { headers: { Authorization: `Bearer ${session?.user.token}` } }
      )
      setAddresses(data)
    } catch {
      triggerError("No se pudieron cargar las direcciones del cliente.")
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleCancelOrder = () => {
    clearCart()
    clearSelectedCustomer()
    setEditMode(false)
    setComments("")
    setOrderId(null)
    setShowCancelOrderAlert(false)
    setOpen(false)
    router.replace("/dashboard/orders")
  }

  const handleSubmitOrder = async () => {
    if (isProcessing.current) return

    if (!selectedCustomer) {
      triggerError("Debe seleccionar un cliente antes de continuar.")
      return
    }

    if (productsInCart.length === 0) {
      triggerError("El carrito está vacío.")
      return
    }

    try {
      isProcessing.current = true
      setIsLoading(true)

      const payload = {
        ...(editMode ? {} : { requestId: orderId }),
        cardCode: selectedCustomer.cardCode,
        cardName: selectedCustomer.editRTN && editCustomerName ? editCustomerName : selectedCustomer.cardName,
        u_RTN: selectedCustomer.editRTN && editCustomerRTN ? editCustomerRTN : selectedCustomer.federalTaxID,
        salesPersonCode: sellerDifferent ? selectedSlpCode : salesPersonCode,
        payToCode: selectedAddress?.addressName ?? '',
        comments: comments,
        series: u_SerieCot ?? undefined,
        u_Referido: selectedCustomer.referidoCode,
        lines: productsInCart.map((p) => {
          const line: any = {
            itemCode: p.itemCode,
            quantity: p.quantity,
            unitPriceNoVAT: p.unitPriceNoVAT,
            basePriceNoVAT: p.basePriceNoVAT,
            taxCode: p.taxCode,
            warehouseCode: u_WhsCode
          }
          if (p.barCode) line.barCode = p.barCode
          if (p.priceList) line.priceList = p.priceList
          if (p.priceAfterVAT) line.priceAfterVAT = p.priceAfterVAT
          return line
        })
      }

      console.log("Enviando payload:", payload)
      console.log("URL:", editMode ? `/api-proxy/api/Quotations/${docEntry}` : '/api-proxy/api/Quotations')
      console.log("Method:", editMode ? "PATCH" : "POST")

      const response = await axios({
        method: editMode ? "PATCH" : "POST",
        url: editMode ? `/api-proxy/api/Quotations/${docEntry}` : `/api-proxy/api/Quotations`,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      })

      setOrderInfo({ docEntry: response.data?.docEntry })
      console.log("Pedido Enviado con exito", payload)
      setShowSuccessAlert(true)
      getSuccessSound().play();
      setOpen(false)
    } catch (error: any) {
      const msg = error.response?.data?.message || "Ocurrió un error inesperado al procesar el pedido."
      triggerError(msg)
    } finally {
      setIsLoading(false)
      isProcessing.current = false
      setShowConfirmAlert(false)
    }
  }

  const handleSuccess = () => {
    setShowSuccessAlert(false)
    clearCart()
    clearSelectedCustomer()
    setEditMode(false)
    setDocEntry("")
    setComments("")
    router.push("/dashboard/orders")
  }

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerTrigger asChild>
          <span className="relative mr-3 cursor-pointer">
            {productsInCart.length > 0 &&
              (editMode ? <PenIcon size={24} /> : <ShoppingCartIcon size={24} />)}
            {productsInCart.length > 0 && (
              <Badge className="absolute -top-2 -right-4 size-5 grid place-content-center text-[10px]">
                {productsInCart.length}
              </Badge>
            )}
          </span>
        </DrawerTrigger>

        <DrawerContent className="h-screen min-w-screen md:min-w-[60vw] max-w-150 right-0 left-auto rounded-none border-l dark:border-white/[0.07]">
          <div className="flex flex-col h-full bg-white dark:bg-dark-card justify-between">
            <DrawerHeader className="flex flex-row justify-between px-4 md:px-8 py-4 md:py-6">
              <DrawerTitle className="text-lg md:text-2xl font-semibold uppercase tracking-tight flex items-center gap-2 md:gap-3 text-gray-900 dark:text-dark-text-primary">
                Carrito
                {editMode && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 dark:border-amber-400/40 text-amber-600 dark:text-amber-400 animate-pulse flex gap-1 items-center py-1 text-[10px] md:text-xs"
                  >
                    <Edit3 size={12} /> #{docEntry}
                  </Badge>
                )}
              </DrawerTitle>
              <DrawerClose className="cursor-pointer text-gray-400 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text-primary transition-colors">
                <X />
              </DrawerClose>
            </DrawerHeader>

            <div className="px-4 flex md:px-8 pb-4 gap-4 justify-between">
              <Textarea
                placeholder="Instrucciones especiales, notas..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="bg-gray-50 dark:bg-dark-raised border-gray-200 dark:border-white/[0.07] text-gray-900 dark:text-dark-text-primary placeholder:text-gray-400 dark:placeholder:text-dark-text-disabled rounded-2xl focus:border-black dark:focus:border-white/30 min-h-10 max-h-10 resize-none text-sm"
              />
              {editMode && (
                <Button
                  onClick={() => setShowCancelOrderAlert(true)}
                  variant="destructive"
                  className="rounded-full cursor-pointer min-h-10 text-xs"
                >
                  Cancelar Cotizacion
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 max-h-[50vh] md:max-h-[60vh] px-3 md:px-6 pb-10">
              <div className="space-y-2 py-2">
                {productsInCart.map(item => {
                  const unitPrice = (item.priceAfterVAT ?? item.unitPriceNoVAT ?? item.priceList ?? 0)
                  const quantity = item.quantity ?? 0
                  const sku = item.suppCatNum
                  const taxCode = item.taxCode
                  const isExempt = taxCode === "EXO" || taxCode === "EXE"
                  const unitPriceGross = isExempt ? unitPrice : unitPrice * (1 + TAX_RATE)
                  const totalPrice = unitPrice * quantity
                  const totalPriceGross = unitPriceGross * quantity

                  return (
                    <div
                      key={item.itemCode}
                      className="group flex items-center gap-2 md:gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-raised hover:bg-gray-100 dark:hover:bg-white/6 transition-colors border border-gray-200/50 dark:border-white/6"
                    >
                      <div className="relative shrink-0">
                        <Image
                          src={`https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/100000.jpg`}
                          alt={item.itemCode}
                          width={48}
                          height={48}
                          className="object-contain rounded-lg bg-white dark:bg-dark-card md:w-14 md:h-14"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary truncate">
                          {item.itemName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-dark-text-disabled font-mono">
                          {item.itemCode}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-primary/10 dark:bg-dark-card text-brand-primary dark:text-dark-text-secondary font-medium">
                            Cant: {quantity}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-primary/10 dark:bg-dark-card text-brand-primary dark:text-dark-text-secondary font-medium">
                            SKU: {sku}
                          </span>
                          <span className="text-gray-500 dark:text-dark-text-muted">
                            L. <PriceDisplay price={unitPrice} decimalNum={4} /> + {taxCode} = L. <PriceDisplay price={unitPriceGross} decimalNum={4} /> c/u
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-bold text-sm text-gray-900 dark:text-dark-text-primary">
                          L. <PriceDisplay price={totalPrice} decimalNum={2} />
                        </span>
                        <button
                          onClick={() => removeProduct(item.itemCode)}
                          className="opacity-100 md:opacity-0 cursor-pointer md:group-hover:opacity-100 p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-4 md:px-8 py-4 bg-[#fcfcfc] dark:bg-dark-page border-t border-gray-100 dark:border-white/6 sticky bottom-0">
              <div className="space-y-2 mb-3 md:mb-4">
                <div className="flex justify-between text-xs md:text-sm items-center">
                  <span className="text-gray-500 dark:text-dark-text-muted">Ubicación</span>
                  <p className="text-xs md:text-sm dark:text-dark-text-secondary truncate max-w-50">
                    {selectedAddress?.addressName ?? "No selec."}
                  </p>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-500 dark:text-dark-text-muted">Subtotal</span>
                  <span className="font-medium dark:text-dark-text-secondary">
                    L. <PriceDisplay price={subtotal} decimalNum={2} />
                  </span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-500 dark:text-dark-text-muted">ISV (15%)</span>
                  <span className="font-medium dark:text-dark-text-secondary">
                    L. <PriceDisplay price={calculatedTax} decimalNum={2} />
                  </span>
                </div>
                <div className="flex justify-between text-base md:text-lg pt-3 md:pt-4 border-t border-gray-200 dark:border-white/6">
                  <span className="font-light uppercase tracking-wider text-sm md:text-base dark:text-dark-text-secondary">
                    Total
                  </span>
                  <span className="font-bold dark:text-dark-text-primary">
                    L. <PriceDisplay price={total} decimalNum={2} />
                  </span>
                </div>
              </div>

              <div className="flex flex-row gap-2 md:gap-3">
                <Button
                  onClick={() => {
                    if (selectedCustomer?.editRTN) {
                      setEditCustomerName(selectedCustomer.cardName)
                      setEditCustomerRTN(selectedCustomer.federalTaxID)
                      setShowEditCustomerDialog(true)
                    } else {
                      setShowConfirmAlert(true)
                    }
                  }}
                  className="flex-1 font-normal bg-brand-primary text-white hover:bg-brand-primary h-12 text-sm md:text-md tracking-[0.3px] rounded-full cursor-pointer disabled:bg-gray-300 dark:disabled:bg-dark-raised disabled:text-gray-600 dark:disabled:text-dark-text-disabled"
                  disabled={productsInCart.length === 0 || isLoading}
                >
                  {isLoading ? "Procesando..." : editMode ? "Actualizar" : "Realizar Cotizacion"}
                </Button>

                <div className="flex gap-2 md:gap-3">
                  <DrawerClose asChild>
                    <Link
                      href="/dashboard/orders/shop"
                      className="flex-1 flex items-center bg-brand-primary rounded-full justify-center gap-2 text-xs text-white py-3 px-4 md:px-8"
                    >
                      <Plus size={14} /> Agregar
                    </Link>
                  </DrawerClose>
                  <Button
                    onClick={() => {
                      fetchAddresses()
                      setShowAddressDialog(true)
                    }}
                    className="size-12 md:size-13 rounded-full bg-brand-primary hover:bg-brand-primary p-0 grid place-content-center cursor-pointer disabled:bg-gray-300 dark:disabled:bg-dark-raised"
                  >
                    <MapPinLine color="white" size={68} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Alert — Error */}
      <AlertDialog open={showErrorAlert} onOpenChange={setShowErrorAlert}>
        <AlertDialogContent className="bg-[#ff9e9e] dark:bg-red-400/10 border-none dark:border dark:border-red-400/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle size={20} /> Error en la solicitud
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-700 dark:text-red-400 pt-2">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction variant="destructive" onClick={() => setShowErrorAlert(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert — Seleccionar dirección */}
      <AlertDialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <AlertDialogContent className="dark:bg-dark-card dark:border-white/[0.07]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-dark-text-primary">
              Seleccionar ubicación
            </AlertDialogTitle>
          </AlertDialogHeader>
          <ScrollArea className="max-h-75">
            <div className="space-y-2">
              {addresses.map(addr => (
                <button
                  key={addr.rowNum}
                  className="w-full border border-gray-200 dark:border-white/[0.07] rounded-md p-3 text-left hover:border-black dark:hover:border-white/30 dark:bg-dark-raised transition-colors"
                  onClick={() => {
                    setSelectedAddress(addr)
                    setShowAddressDialog(false)
                  }}
                >
                  <p className="text-sm font-medium dark:text-dark-text-primary">{addr.addressName}</p>
                  <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                    {addr.street} · {addr.ciudadName}, {addr.stateName}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-dark-raised dark:text-dark-text-secondary dark:border-white/[0.07]">
              Cerrar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert — Confirmar pedido */}
      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent className="dark:bg-dark-card dark:border-white/[0.07]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-dark-text-primary">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-dark-text-muted">
              {editMode
                ? "¿Deseas actualizar esta cotizacion con los cambios actuales?"
                : "¿Seguro que quieres enviar esta cotizacion?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-dark-raised dark:text-dark-text-secondary dark:border-white/[0.07]">
              No, cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitOrder}>Sí, enviar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert — Vaciar carrito */}
      <AlertDialog open={showCancelOrderAlert} onOpenChange={setShowCancelOrderAlert}>
        <AlertDialogContent className="dark:bg-dark-card dark:border-white/[0.07]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-dark-text-primary">¿Vaciar carrito?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-dark-text-muted">
              Se eliminarán todos los productos y se cancelará el proceso actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-dark-raised dark:text-dark-text-secondary dark:border-white/[0.07]">
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleCancelOrder}
            >
              Sí, vaciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert — Éxito */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent className="bg-green-300 dark:bg-green-400/10 border-green-300 dark:border-green-400/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600 dark:text-green-400">
              {editMode ? "¡Cotizacion Actualizada!" : "¡Cotizacion Creada!"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-green-600 dark:text-green-400">
              La cotizacion ha sido{" "}
              {editMode
                ? "actualizada correctamente"
                : <>creada correctamente con el número <strong>#{orderInfo.docEntry}</strong></>}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccess}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert — Editar cliente */}
      {selectedCustomer?.editRTN && (
        <AlertDialog open={showEditCustomerDialog} onOpenChange={setShowEditCustomerDialog}>
          <AlertDialogContent className="dark:bg-dark-card dark:border-white/[0.07]">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-dark-text-primary">
                Editar Datos del Cliente
              </AlertDialogTitle>
              <AlertDialogDescription className="dark:text-dark-text-muted">
                Actualice el nombre y RTN del cliente según sea necesario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-dark-text-secondary">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full p-2 border border-gray-200 dark:border-white/[0.07] rounded-md bg-white dark:bg-dark-raised text-gray-900 dark:text-dark-text-primary placeholder:text-gray-400 dark:placeholder:text-dark-text-disabled"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-dark-text-secondary">RTN</label>
                <input
                  type="text"
                  value={editCustomerRTN}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 14)
                    setEditCustomerRTN(value)
                  }}
                  className="w-full p-2 border border-gray-200 dark:border-white/[0.07] rounded-md bg-white dark:bg-dark-raised text-gray-900 dark:text-dark-text-primary placeholder:text-gray-400 dark:placeholder:text-dark-text-disabled"
                  placeholder="Ingrese 14 dígitos"
                />
                <p className="text-xs text-gray-400 dark:text-dark-text-disabled">
                  {editCustomerRTN.length}/14 caracteres
                </p>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="dark:bg-dark-raised dark:text-dark-text-secondary dark:border-white/[0.07]"
                onClick={() => {
                  setEditCustomerName(selectedCustomer?.cardName ?? "")
                  setEditCustomerRTN(selectedCustomer?.federalTaxID ?? "")
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className={
                  editCustomerName.trim().length === 0 || editCustomerRTN.length !== 14
                    ? "bg-gray-200 dark:bg-dark-raised text-gray-500 dark:text-dark-text-disabled hover:bg-gray-200"
                    : ""
                }
                disabled={editCustomerName.trim().length === 0 || editCustomerRTN.length !== 14}
                onClick={() => {
                  if (editCustomerRTN.length !== 14) {
                    triggerError("El RTN debe tener exactamente 14 dígitos.")
                    return
                  }
                  setShowEditCustomerDialog(false)
                  setShowConfirmAlert(true)
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export default CartISync;