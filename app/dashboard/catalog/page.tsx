"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { File, Image, Rows, Grid3X3 } from "lucide-react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import axios, { isAxiosError } from "axios"
import { usePathname } from "next/navigation"
import CatalogPdf from "@/components/CatalogPdf"
import { useSession } from "next-auth/react"

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
)

interface Product {
  itemCode: string
  itemName: string
  price: number
  groupName?: string
  inStock?: number
  priceListName?: string
}

export default function CatalogPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [generating, setGenerating] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [hasMore, setHasMore] = useState(true)

  const { data: session } = useSession();
  const token = session?.user.token
  const pathname = usePathname()
  const prevTokenRef = useRef<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredProducts = debouncedSearch
    ? allProducts.filter(p =>
      p.itemName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.itemCode.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    : allProducts

  const toggleProduct = (code: string) => {
    setSelectedProducts(prev =>
      prev.includes(code)
        ? prev.filter(p => p !== code)
        : [...prev, code]
    )
  }

  const selectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.itemCode))
    }
  }

  async function fetchProducts(pageNumber: number, search?: string) {
    try {
      const res = await axios.get(
        `/api-proxy/api/Catalog/products/search?search=${search || '1'}&priceList=1&groupCode=0&page=${pageNumber}&pageSize=60`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const items = res.data.items ?? res.data

      const mapped: Product[] = items.map((p: any) => ({
        itemCode: p.itemCode,
        itemName: p.itemName,
        price: p.price,
        groupName: p.groupName,
        inStock: p.inStock,
      }))

      if (pageNumber === 1) {
        setAllProducts(mapped)
      } else {
        setAllProducts(prev => [...prev, ...mapped])
      }

      setHasMore(items.length === 60)

    } catch (error) {
      console.error(
        "Error fetching products:",
        isAxiosError(error) ? error.response?.data : error
      )
    }
  }

  useEffect(() => {
    if (token) {
      if (prevTokenRef.current === null && token) {
        prevTokenRef.current = token;
        setAllProducts([])
        setPage(1)
        setHasMore(true)
        fetchProducts(1, debouncedSearch || undefined)
      } else if (prevTokenRef.current !== token) {
        prevTokenRef.current = token;
        setAllProducts([])
        setPage(1)
        setHasMore(true)
        fetchProducts(1, debouncedSearch || undefined)
      }
    }
  }, [token, debouncedSearch, pathname])

  const selectedItems = filteredProducts.filter(p =>
    selectedProducts.includes(p.itemCode)
  )

  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    await fetchProducts(nextPage, debouncedSearch || undefined)
    setPage(nextPage)
    setLoadingMore(false)
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
          Catalogo de Productos
        </h2>
        <p className="text-sm text-gray-500">
          Exportar como PDF tus productos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">

        {/* PRODUCTOS */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Productos ({filteredProducts.length})
                </CardTitle>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-muted" : ""}
                  >
                    <Grid3X3 size={20} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-muted" : ""}
                  >
                    <Rows size={20} />
                  </Button>
                </div>
              </div>

              <div className="relative mt-4">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedProducts.length === filteredProducts.length
                    ? "Deseleccionar todo"
                    : "Seleccionar todo"}
                </Button>

                <span className="text-sm text-muted-foreground self-center">
                  {selectedProducts.length} seleccionados
                </span>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredProducts.map(product => (
                    <div
                      key={product.itemCode}
                      onClick={() => toggleProduct(product.itemCode)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedProducts.includes(product.itemCode)
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground"
                        }`}
                    >
                      <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                        <Image size={32} className="text-muted-foreground" />
                      </div>

                      <p className="text-xs font-mono text-muted-foreground">
                        {product.itemCode}
                      </p>

                      <p className="font-medium text-sm truncate">
                        {product.itemName}
                      </p>

                      <p className="text-sm font-semibold">
                        L {product.price.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map(product => (
                    <div
                      key={product.itemCode}
                      onClick={() => toggleProduct(product.itemCode)}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedProducts.includes(product.itemCode)
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground"
                        }`}
                    >
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <Image size={20} className="text-muted-foreground" />
                      </div>

                      <div className="flex-1">
                        <p className="font-medium">{product.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.itemCode}
                        </p>
                      </div>

                      <p className="font-semibold">
                        L {product.price.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* BOTON CARGAR MAS */}
              <div className="flex justify-center mt-6">
                <Button onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* FILTROS CATALOGO */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Opciones del Catálogo</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <div>
                <label className="text-sm font-medium block mb-2">Título</label>
                <input
                  type="text"
                  defaultValue="Catálogo de Productos"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Incluir</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked /> Imagenes
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked /> Precios
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked /> Código
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Diseño</label>
                <select className="w-full px-3 py-2 border rounded-md text-sm">
                  <option>Grid (Cuadrícula)</option>
                  <option>Lista</option>
                  <option>Compacto</option>
                </select>
              </div>

            </CardContent>
          </Card>

          {/* RESUMEN */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Productos</span>
                <span className="font-medium">
                  {selectedProducts.length}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Páginas estimadas</span>
                <span className="font-medium">
                  {Math.ceil(selectedProducts.length / 6)}
                </span>
              </div>

              <PDFDownloadLink
                document={
                  <CatalogPdf
                    products={selectedItems}
                    title="Catálogo de Productos"
                  />
                }
                fileName="catalogo-productos.pdf"
              >
                {({ loading }) => (
                  <Button
                    className="w-full gap-2"
                    disabled={selectedItems.length === 0}
                  >
                    {loading ? "Generando..." : (
                      <>
                        <File size={18} />
                        Generar PDF
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}