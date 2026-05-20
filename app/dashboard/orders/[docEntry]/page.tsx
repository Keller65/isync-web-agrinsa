'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import axios from 'axios';
import { ArrowLeft, Package, User, Calendar, FileText, Download, Edit3, Printer, MapPin, MessageSquareText, ChevronRight } from 'lucide-react';
import OrderPDF from '@/components/pdf/OrderPDF';
import { useSession } from "next-auth/react";
import { useCartStore } from '@/lib/store/store.cart';
import { useCustomerStore } from '@/lib/store/store.customer';
import { OrderDetailType } from '@/types/orders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Coins } from '@phosphor-icons/react';
import { logClient } from '@/lib/logger/logger.client';
import Avvvatars from 'avvvatars-react';
import NextImage from 'next/image';

const IMG_BASE = 'https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev';

const PriceDisplay = ({ price, decimalNum }: { price: number; decimalNum: number }) => {
  const formatted = price.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [integer, decimal] = formatted.split('.');
  const totalDecimals = decimalNum ?? 2;
  const decimalPart = decimal ? decimal.substring(0, totalDecimals) : '00';
  return (
    <span>
      <span>{integer}</span>
      <span className="text-[10px]">.{decimalPart}</span>
    </span>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

function OrderSkeleton() {
  return (
    <div className="min-h-fit md:p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>
      </div>
      <main className="mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200">
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const docEntry = params.docEntry as string;

  const [orderDetail, setOrderDetail] = useState<OrderDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { setSelectedCustomer } = useCustomerStore();
  const { loadCartWithProducts, clearCart, setEditMode, setDocEntry } = useCartStore();
  const { data: session } = useSession()
  const token = session?.user?.token ?? null
  const sellerName = session?.user?.fullName ?? null
  const FETCH_URL = '/api-proxy/api/Quotations';

  const fetchOrderDetail = useCallback(async () => {
    if (!token) {
      setError('Token de autenticación no disponible');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.get(`${FETCH_URL}/${docEntry}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setOrderDetail(res.data);
      setError(null);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'No se pudieron obtener los detalles.';
      setError(message);
      logClient({
        level: 'ERROR',
        category: 'PEDIDO',
        endpoint: `${FETCH_URL}/${docEntry}`,
        errorCode: err.response?.status,
        message,
        responseBody: err.response?.data,
        pageUrl: `/dashboard/orders/${docEntry}`,
        userId: sellerName ?? undefined,
      });
    } finally {
      setIsLoading(false);
    }
  }, [docEntry, token, FETCH_URL]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isLoading) return <OrderSkeleton />;

  if (error || !orderDetail) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">No se pudo cargar la Oferta</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'Oferta no encontrada.'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </div>
    );
  }

  const subtotal = orderDetail.docTotal - orderDetail.vatSum;
  const formattedDate = new Date(orderDetail.docDate).toLocaleDateString('es-HN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function handleEditOrder() {
    if (!orderDetail) return;

    setSelectedCustomer({
      cardCode: orderDetail.cardCode,
      cardName: orderDetail.cardName,
      federalTaxID: orderDetail.federalTaxID,
      address: orderDetail.address,
      priceListNum: orderDetail.priceListNum,
    });

    clearCart();
    setEditMode(true);

    const productsToLoad = orderDetail.lines.map((line) => {
      const product: any = {
        itemCode: line.itemCode,
        itemName: line.itemName,
        quantity: line.quantity,
        unitPriceNoVAT: line.unitPriceNoVAT,
        basePriceNoVAT: line.basePriceNoVAT,
        taxCode: line.taxCode,
        warehouseCode: line.warehouseCode
      }
      if (line.barCode) product.barCode = line.barCode
      if (line.priceList) product.priceList = line.priceList
      if (line.priceAfterVAT) product.priceAfterVAT = line.priceAfterVAT
      return product
    })

    logClient({
      level: 'INFO',
      category: 'PEDIDO',
      endpoint: `${FETCH_URL}/${orderDetail.docEntry}`,
      message: `Edición iniciada — Oferta #${orderDetail.docNum} (${orderDetail.cardName})`,
      payload: { docEntry: orderDetail.docEntry, docNum: orderDetail.docNum, cardCode: orderDetail.cardCode, lines: orderDetail.lines.length },
      pageUrl: `/dashboard/orders/${orderDetail.docEntry}`,
      userId: sellerName ?? undefined,
    });

    loadCartWithProducts(productsToLoad);
    setDocEntry(orderDetail.docEntry);
  }

  return (
    <div className="min-h-fit md:p-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:dark:bg-dark-page/80 backdrop-blur-md border-b border-gray-100 dark:border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-2">
            <button onClick={() => router.back()} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Oferta</button>
            <ChevronRight size={12} />
            <span className="text-gray-700 dark:text-gray-200 font-medium">#{orderDetail.docNum}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/6 rounded-xl transition-colors text-gray-400 dark:text-gray-500">
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Oferta #{orderDetail.docNum}</h1>
                  <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20">
                    En Proceso
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isClient && orderDetail && (
                <>
                  <PDFDownloadLink
                    document={<OrderPDF order={orderDetail} sellerName={sellerName ?? ''} />}
                    fileName={`Oferta-${orderDetail.docNum}.pdf`}
                  >
                    {({ loading }: { loading: boolean }) => (
                      <button
                        disabled={loading}
                        className="cursor-pointer flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/[0.07] rounded-xl hover:bg-gray-50 dark:hover:bg-dark-raised transition-all disabled:opacity-50"
                      >
                        <Download size={16} />
                        <span className="hidden sm:inline">{loading ? 'Generando...' : 'Descargar'}</span>
                      </button>
                    )}
                  </PDFDownloadLink>
                  <button
                    onClick={async () => {
                      if (!orderDetail) return
                      try {
                        const blob = await pdf(React.createElement(OrderPDF, { order: orderDetail, sellerName: sellerName ?? '' }) as any).toBlob();
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      } catch (err) {
                        console.error('Error generating PDF:', err)
                      }
                    }}
                    className="cursor-pointer flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/[0.07] rounded-xl hover:bg-gray-50 dark:hover:bg-dark-raised transition-all"
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">Imprimir</span>
                  </button>
                </>
              )}
              <button
                onClick={handleEditOrder}
                className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-xl hover:opacity-90 transition-all"
              >
                <Edit3 size={16} /> Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-5">
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Fecha', value: formattedDate, icon: Calendar },
                { label: 'Vendedor', value: orderDetail.salesPersonName, icon: User },
                { label: 'RTN', value: orderDetail.federalTaxID || 'Consumidor Final', icon: FileText },
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-200 dark:border-white/[0.07] transition-colors">
                  <div className="flex items-center gap-2 mb-1.5 text-brand-primary">
                    <item.icon size={14} />
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-white/[0.07] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/6 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package size={16} className="text-gray-400 dark:text-gray-500" />
                  Productos
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-raised px-2 py-0.5 rounded-full">
                    {orderDetail.lines.length}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {orderDetail.lines.reduce((sum, l) => sum + l.quantity, 0)} unidades
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-50 dark:border-white/4">
                      <TableHead className="text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 w-10 text-center">#</TableHead>
                      <TableHead className="text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500">Producto</TableHead>
                      <TableHead className="text-center text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 w-20">Cant.</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 w-28">Precio</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 w-28">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetail.lines.map((line, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/3 border-gray-50 dark:border-white/4 group">
                        <TableCell className="text-center text-xs text-gray-300 dark:text-gray-600 font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-gray-50 dark:bg-dark-raised border border-gray-100 dark:border-white/6 overflow-hidden shrink-0 flex items-center justify-center">
                              <NextImage
                                src={`${IMG_BASE}/${line.itemCode}.jpg`}
                                alt={line.itemName}
                                width={40}
                                height={40}
                                className="object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
                                {line.itemName}
                              </p>
                              <p className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">{line.itemCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center min-w-7 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                            {line.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                          L <PriceDisplay decimalNum={2} price={line.unitPriceNoVAT ?? 0} />
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                          L <PriceDisplay decimalNum={2} price={(line.unitPriceNoVAT ?? 0) * line.quantity} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-28">
            {/* Client Card */}
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-white/[0.07] p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avvvatars size={44} value={orderDetail.cardName} style="character" />
                <div className="overflow-hidden flex-1">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight truncate">
                    {orderDetail.cardName}
                  </h3>
                  <p className="text-[11px] font-mono text-gray-400 dark:text-gray-500">{orderDetail.cardCode}</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-dark-raised p-3.5 rounded-xl space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin size={10} /> Dirección de Entrega
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{orderDetail.address}</p>
                </div>
                {orderDetail.federalTaxID && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">RTN</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">{orderDetail.federalTaxID}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-white/[0.07] p-4 rounded-2xl flex gap-3">
              <MessageSquareText size={16} className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Comentarios</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {orderDetail.comments || "No hay comentarios"}
                </p>
              </div>
            </div>

            {/* Totals Card */}
            <div className="bg-gray-900 dark:bg-dark-card rounded-2xl p-5 text-white dark:border dark:border-white/[0.07]">
              <h3 className="text-[10px] font-semibold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Coins size={14} /> Resumen del Pedido
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Subtotal ({orderDetail.lines.length} items)</span>
                  <span className="font-semibold text-gray-300 tabular-nums">
                    L <PriceDisplay decimalNum={2} price={subtotal} />
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">ISV (15%)</span>
                  <span className="font-semibold text-amber-400 tabular-nums">
                    L <PriceDisplay decimalNum={2} price={orderDetail.vatSum} />
                  </span>
                </div>
                <div className="pt-3 mt-1 border-t border-white/10 flex justify-between items-end">
                  <span className="text-sm font-bold text-white">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white leading-none tabular-nums">
                      L <PriceDisplay decimalNum={2} price={orderDetail.docTotal} />
                    </p>
                    <p className="text-[9px] text-gray-500 mt-1 uppercase">Lempiras</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}