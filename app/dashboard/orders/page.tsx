'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { AlertCircle, Loader2, RefreshCw, TrendingUp, Plus, Search, ArrowRight, MapPin, Check } from 'lucide-react';
import { useCustomerStore } from '@/lib/store/store.customer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { CustomerType, CustomerResponseType, CustomerAddress } from '@/types/customers';
import { Input } from "@/components/ui/input";
import { ArrowClockwise, CalendarDots, Coins, FileText } from '@phosphor-icons/react';
import Avvvatars from 'avvvatars-react';
import { useCartStore } from '@/lib/store/store.cart';
import { Button } from '@/components/ui/button';
import { logClient } from '@/lib/logger/logger.client';
import { useSession } from 'next-auth/react';

interface OrderDataType {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  address: string;
  docDate: string;
  vatSum: number;
  docTotal: number;
  comments: string;
  salesPersonCode: number;
  priceListNum: number;
  lines: any[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderDataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuotation, setSearchQuotation] = useState('');
  const { productsInCart, removeProduct } = useCartStore();

  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [isLastCustomerPage, setIsLastCustomerPage] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState<CustomerType | null>(null);
  const CUSTOMER_PAGE_SIZE = 50;
  const customerObserverRef = useRef<IntersectionObserver | null>(null);
  const customerSearchRef = useRef(customerSearch);

  const PAGE_SIZE = 20;
  const isLoadingRef = useRef(false);
  const isLastPageRef = useRef(false);
  const isLastCustomerPageRef = useRef(false);
  const { data: session } = useSession();

  const {
    setSelectedCustomer,
    selectedCustomer,
    addresses,
    setAddresses,
    selectedAddress,
    setSelectedAddress,
    setSellerDifferent,
    setSelectedSlpCode,
  } = useCustomerStore();

  const FETCH_URL = '/api-proxy/api/Quotations/open';
  const CUSTOMERS_URL = '/api-proxy/api/Customers/by-sales-emp';
  const ADDRESSES_URL = '/api-proxy/api/Customers';

  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const fetchOrders = useCallback(async (pageToFetch: number, isRefresh = false) => {
    if (!session?.user || !session?.user.token) {
      setError('Datos de autenticación no disponibles');
      return;
    }

    if (!isRefresh && isLastPageRef.current) return;
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const res = await axios.get(
        `${FETCH_URL}/${session?.user.salesPersonCode}?page=${pageToFetch}&pageSize=${PAGE_SIZE}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const newOrders = res.data;
      if (isRefresh) {
        setOrderData(newOrders);
        setPage(2);
      } else {
        setOrderData((prev) => [...prev, ...newOrders]);
        setPage(pageToFetch + 1);
      }

      const lastPage = newOrders.length < PAGE_SIZE;
      isLastPageRef.current = lastPage;
      setIsLastPage(lastPage);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'No se pudieron obtener las órdenes.';
      setError(message);
      logClient({
        level: 'ERROR',
        category: 'PEDIDO',
        endpoint: `${FETCH_URL}/${!session?.user.salesPersonCode}`,
        errorCode: err.response?.status,
        message,
        responseBody: err.response?.data,
        pageUrl: '/dashboard/orders',
        userId: session?.user.fullName ?? undefined,
      });
    } finally {
      isLoadingRef.current = false;
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [FETCH_URL, !session?.user.token, !session?.user.salesPersonCode, session?.user.fullName]);

  const fetchCustomers = useCallback(async (pageToFetch = 1, isRefresh = false) => {
    if (!session?.user.salesPersonCode || !session?.user.token) return;
    if (!isRefresh && isLastCustomerPageRef.current) return;

    const searchValue = customerSearchRef.current;
    const searchParam = searchValue.trim() ? `&search=${encodeURIComponent(searchValue.trim())}` : '';
    const url = `${CUSTOMERS_URL}?slpCode=${searchParam}&page=${pageToFetch}&pageSize=${CUSTOMER_PAGE_SIZE}`;

    setIsLoadingCustomers(true);
    try {
      const res = await axios.get<CustomerResponseType>(url, {
        headers: {
          Authorization: `Bearer ${session?.user.token}`,
          'Content-Type': 'application/json',
        },
      });
      const newCustomers = res.data.items ?? [];
      if (isRefresh || pageToFetch === 1) {
        setCustomers(newCustomers);
        setCustomerPage(2);
      } else {
        setCustomers(prev => [...prev, ...newCustomers]);
        setCustomerPage(pageToFetch + 1);
      }
      const lastPage = newCustomers.length < CUSTOMER_PAGE_SIZE;
      isLastCustomerPageRef.current = lastPage;
      setIsLastCustomerPage(lastPage);
    } catch (err: any) {
      logClient({
        level: 'ERROR',
        category: 'CLIENTES',
        endpoint: CUSTOMERS_URL,
        errorCode: err.response?.status,
        message: err.response?.data?.message || err.response?.data?.error || 'Error al cargar clientes',
        responseBody: err.response?.data,
        pageUrl: '/dashboard/orders',
        userId: session?.user.fullName ?? undefined,
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [CUSTOMERS_URL, session?.user.salesPersonCode, session?.user.token]);

  const fetchAddresses = useCallback(async (cardCode: string) => {
    if (!session?.user.token) return;

    setIsLoadingAddresses(true);
    try {
      const res = await axios.get<CustomerAddress[]>(
        `${ADDRESSES_URL}/${cardCode}/addresses`,
        {
          headers: {
            Authorization: `Bearer ${session?.user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setAddresses(res.data);
      if (res.data.length > 0) {
        setSelectedAddress(res.data[0]);
      } else {
        setSelectedAddress(null);
      }
    } catch (err: any) {
      logClient({
        level: 'ERROR',
        category: 'CLIENTES',
        endpoint: `${ADDRESSES_URL}/${cardCode}/addresses`,
        errorCode: err.response?.status,
        message: err.response?.data?.message || err.response?.data?.error || 'Error al cargar direcciones',
        responseBody: err.response?.data,
        pageUrl: '/dashboard/orders',
        userId: session?.user.fullName ?? undefined,
      });
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [ADDRESSES_URL, session?.user.token, setAddresses, setSelectedAddress]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    isLastPageRef.current = false;
    setIsLastPage(false);
    fetchOrders(1, true);
  }, [fetchOrders]);

  const handleLoadMore = useCallback(() => {
    if (!isLastPage) {
      fetchOrders(page, false);
    }
  }, [fetchOrders, page, isLastPage]);

  useEffect(() => {
    customerSearchRef.current = customerSearch;
  }, [customerSearch]);

  useEffect(() => {
    if (!isDialogOpen) return;

    const timer = setTimeout(() => {
      setCustomerPage(1);
      isLastCustomerPageRef.current = false;
      setIsLastCustomerPage(false);
      fetchCustomers(1, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch, isDialogOpen, fetchCustomers]);

  useEffect(() => {
    if (!isDialogOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingCustomers && !isLastCustomerPage) {
          fetchCustomers(customerPage, false);
        }
      },
      { threshold: 0.1 }
    );

    customerObserverRef.current = observer;

    const sentinelEl = document.getElementById('customer-scroll-sentinel');
    if (sentinelEl) {
      observer.observe(sentinelEl);
    }

    return () => {
      observer.disconnect();
    };
  }, [isDialogOpen, isLoadingCustomers, isLastCustomerPage, customerPage, fetchCustomers]);

  useEffect(() => {
    if (session?.user.salesPersonCode && session?.user.token) {
      fetchOrders(1, true);
    }
  }, [session?.user.salesPersonCode, session?.user.token, fetchOrders]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchAddresses(selectedCustomer.cardCode);
    }
  }, [selectedCustomer, fetchAddresses]);

  const filteredOrders = orderData.filter((order) => {
    const search = searchQuotation.toLowerCase();
    return (
      order.cardName.toLowerCase().includes(search) ||
      order.cardCode.toLowerCase().includes(search) ||
      order.docNum.toString().includes(search)
    );
  });

  return (
    <div className="flex-1 h-fit p-4 sm:p-6 bg-gray-50/50 dark:dark:bg-dark-page">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
            Cotizaciones Realizadas
          </h2>
          <p className="text-sm text-gray-500">
            Historial reciente de cotizaciones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
            <Input
              placeholder="Buscar Cotizacion..."
              className="pl-9 h-9 w-48 bg-white border-gray-200 text-sm rounded-full"
              value={searchQuotation}
              onChange={(e) => setSearchQuotation(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <ArrowClockwise size={15} className={isRefreshing ? 'animate-spin' : ''} />
            Actualizar
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {productsInCart.length === 0 && (
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus size={15} />
                  Nueva Cotizacion
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-4xl h-[92vh] sm:h-[85vh] max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none flex flex-col p-0 overflow-hidden">
              <div className="flex h-full sm:divide-x sm:divide-gray-100 flex-col sm:flex-row">

                {/* PANEL IZQUIERDO: solo visible en sm+ */}
                <div className="hidden sm:flex w-72 bg-gray-50 border-r border-gray-100 flex-col">
                  <div className="flex-1 overflow-y-auto p-5">
                    {selectedCustomer ? (
                      <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                        {/* Avatar + nombre */}
                        <div className="flex flex-col items-center text-center mb-5">
                          <Avvvatars size={72} value={selectedCustomer.cardName} style="character" />
                          <h3 className="mt-3 font-bold text-gray-900 text-base leading-snug px-2">
                            {selectedCustomer.cardName}
                          </h3>
                          <span className="mt-1.5 text-xs font-bold tracking-widest bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full uppercase">
                            {selectedCustomer.cardCode}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="space-y-3 mb-5">
                          <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">RTN</p>
                            <p className="text-sm font-semibold text-gray-700 truncate">{selectedCustomer.federalTaxID || '—'}</p>
                          </div>
                          <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Lista de Precios</p>
                            <p className="text-sm font-semibold text-gray-700">Lista #{selectedCustomer.priceListNum}</p>
                          </div>
                        </div>

                        {/* Direcciones */}
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
                            Direcciones de entrega
                          </p>
                          {isLoadingAddresses ? (
                            <div className="space-y-2">
                              {[1, 2].map(i => (
                                <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
                              ))}
                            </div>
                          ) : addresses.length > 0 ? (
                            <div className="space-y-1.5">
                              {addresses.map((addr) => (
                                <button
                                  key={addr.rowNum}
                                  type="button"
                                  onClick={() => setSelectedAddress(addr)}
                                  className={`w-full text-left p-2.5 rounded-xl border transition-all ${selectedAddress?.rowNum === addr.rowNum
                                    ? 'bg-brand-primary/5 border-brand-primary'
                                    : 'bg-white hover:bg-gray-50 border-gray-100'
                                    }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <MapPin size={14} className={`mt-0.5 shrink-0 ${selectedAddress?.rowNum === addr.rowNum ? 'text-brand-primary' : 'text-gray-400'}`} />
                                    <div className="overflow-hidden">
                                      <p className="text-xs font-bold text-gray-800 truncate">{addr.addressName}</p>
                                      <p className="text-[11px] text-gray-500 truncate">{addr.street}</p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Sin direcciones registradas.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-50 text-center gap-3 opacity-40">
                        <div className="w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center">
                          <Search size={24} className="text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500">Selecciona un cliente</p>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  {selectedCustomer && (
                    <div className="p-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setIsDialogOpen(false);
                          router.push('/dashboard/orders/shop');
                        }}
                        className="w-full bg-brand-primary cursor-pointer text-white text-sm font-semibold h-11 rounded-full transition-all hover:bg-brand-primary/90 flex items-center justify-center gap-2"
                      >
                        {addresses.length > 0 ? 'Realizar Cotizacion' : 'Continuar sin Ubicación'}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* PANEL DERECHO: BUSCADOR Y LISTA */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
                  <DialogHeader className="px-6 pt-5 pb-3">
                    <DialogTitle className="text-2xl font-bold">Seleccionar Cliente</DialogTitle>
                    <DialogDescription className="text-sm">
                      Busca por nombre o código SAP
                    </DialogDescription>
                  </DialogHeader>

                  <div className="px-6 pb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={17} />
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
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 animate-pulse">
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
                        {customers.map((customer) => {
                          const isSelected = selectedCustomer?.cardCode === customer.cardCode;
                          return (
                            <button
                              key={customer.cardCode}
                              type="button"
                              onClick={() => {
                                if (!isSelected) {
                                  if (session?.user.salesPersonCode && customer.slpCode && session?.user.salesPersonCode !== customer.slpCode) {
                                    setPendingCustomer(customer);
                                  } else {
                                    setSelectedCustomer(customer);
                                    logClient({ level: 'INFO', category: 'CLIENTES', message: `Cliente seleccionado: ${customer.cardName} (${customer.cardCode})`, pageUrl: '/dashboard/orders', userId: session?.user.fullName ?? undefined });
                                  }
                                }
                              }}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${isSelected
                                ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              <Avvvatars size={40} value={customer.cardName} style="character" />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-brand-primary' : 'text-gray-900'}`}>
                                  {customer.cardName}
                                </p>
                                <p className="text-xs text-gray-400 font-mono">{customer.cardCode}</p>
                              </div>
                              {isSelected && (
                                <div className="shrink-0 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                                  <Check size={11} className="text-white" strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}

                        {customers.length === 0 && !isLoadingCustomers && (
                          <div className="text-center py-12">
                            <p className="text-sm text-gray-400">Sin resultados para <span className="font-semibold">"{customerSearch}"</span></p>
                          </div>
                        )}

                        <div id="customer-scroll-sentinel" className="h-4" />

                        {isLoadingCustomers && customers.length > 0 && (
                          <div className="flex items-center justify-center py-3 gap-2">
                            <Loader2 size={14} className="text-brand-primary animate-spin" />
                            <span className="text-xs text-gray-400">Cargando más...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* BARRA INFERIOR MOBILE: cliente seleccionado + CTA */}
                {selectedCustomer && (
                  <div className="sm:hidden shrink-0 border-t border-gray-100 bg-white px-4 py-3 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Avvvatars size={38} value={selectedCustomer.cardName} style="character" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedCustomer.cardName}</p>
                        <p className="text-xs text-gray-400 font-mono">{selectedCustomer.cardCode}</p>
                      </div>
                      {isLoadingAddresses && <Loader2 size={15} className="text-brand-primary animate-spin shrink-0" />}
                    </div>
                    <button
                      onClick={() => {
                        setIsDialogOpen(false);
                        router.push('/dashboard/orders/shop');
                      }}
                      className="w-full bg-brand-primary text-white text-sm font-semibold h-11 rounded-full flex items-center justify-center gap-2"
                    >
                      {addresses.length > 0 ? 'Realizar Cotizacion' : 'Continuar sin Ubicación'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid de Órdenes */}
      <div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 text-sm font-semibold">Error al cargar</p>
              <p className="text-red-700 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {isRefreshing && orderData.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                </div>
                <div className="h-9 bg-gray-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : orderData.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredOrders.map((item) => (
                <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-200 dark:border-white/[0.07] overflow-hidden hover:border-gray-300 dark:hover:border-white/12 transition-colors h-full">

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-gray-700 dark:text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cotizacion{" "}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          #{item.docNum}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20 px-2.5 py-1 rounded-full">
                      En Proceso
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-gray-100 dark:bg-dark-raised size-10 rounded-full overflow-hidden shrink-0">
                      <Avvvatars value={item.cardName} size={40} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-gray-500 dark:text-gray-500">Cliente</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.cardName}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-start gap-2">
                      <div className="bg-gray-100 dark:bg-dark-raised p-1.5 rounded-full">
                        <CalendarDots size={16} className="text-gray-600 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-none">Fecha</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {new Date(item.docDate).toLocaleDateString('es-HN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="bg-gray-100 dark:bg-dark-raised p-1.5 rounded-full">
                        <Coins size={16} className="text-gray-600 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-none">Total</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          L.{item.docTotal.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto">
                    <button
                      onClick={() => router.push(`/dashboard/orders/${item.docEntry}`)}
                      className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-semibold py-2.5 rounded-full cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      Ver detalles
                      <ArrowRight color='currentColor' size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!isLastPage && (
              <div className="flex justify-center pb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold border border-gray-200 rounded-full transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Cargar más Cotizacion'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          !error && (
            <div className="py-12 text-center h-[76vh] text-gray-500 flex flex-col items-center justify-center">
              <p className="text-sm">No hay cotizaciones registrados</p>
              <p className="text-xs">
                Las cotizaciones aparecerán aquí automáticamente
              </p>
            </div>
          )
        )}
      </div>

      <AlertDialog open={!!pendingCustomer} onOpenChange={(isOpen) => !isOpen && setPendingCustomer(null)}>
        <AlertDialogContent className='min-w-fit'>
          <AlertDialogHeader>
            <AlertDialogTitle>Vendedor asignado diferente</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {`Este cliente está asignado a ${pendingCustomer?.slpName}, pero tú estás logueado como ${session?.user.fullName}.\n\n¿Con cuál vendedor deseas realizar la Cotizacion?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (!pendingCustomer) return;
                setSellerDifferent(true);
                setSelectedSlpCode(pendingCustomer.slpCode ?? null);
                setSelectedCustomer(pendingCustomer);
                logClient({ level: 'INFO', category: 'CLIENTES', message: `Cliente seleccionado con vendedor diferente: ${pendingCustomer.cardName}`, pageUrl: '/dashboard/orders', userId: session?.user.fullName ?? undefined });
                setPendingCustomer(null);
              }}
            >
              Con {pendingCustomer?.slpName}
            </AlertDialogAction>

            <AlertDialogCancel
              onClick={() => {
                if (!pendingCustomer) return;
                setSellerDifferent(false);
                setSelectedSlpCode(session?.user.salesPersonCode != null ? Number(session.user.salesPersonCode) : null);
                setSelectedCustomer(pendingCustomer);
                logClient({ level: 'INFO', category: 'CLIENTES', message: `Cliente seleccionado (vendedor propio): ${pendingCustomer.cardName} (${pendingCustomer.cardCode})`, pageUrl: '/dashboard/orders', userId: session?.user.fullName ?? undefined });
                setPendingCustomer(null);
              }}
            >
              Con {session?.user.fullName}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}