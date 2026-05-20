"use client"

import { useState, useEffect, cloneElement } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  RefreshCw, Bell, Database, LogOut, Wifi, Smartphone,
  Image as ImageIcon, Shield, Settings, Cpu, Trash2, MapPin,
  Volume2, UserCircle, CheckCircle2, AlertTriangle, Download
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useSettingsStore } from '@/lib/store/store.general'
import { cn } from "@/lib/utils"

const navItems = [
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "system", label: "Sistema y Datos", icon: Cpu },
  { id: "security", label: "Cuenta y Seguridad", icon: Shield },
]

export default function SettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const fullName = session?.user?.fullName ?? null
  const {
    biometricEnabled, setBiometricEnabled,
    pushEnabled, setPushEnabled,
    soundEnabled, setSoundEnabled,
    productsWithImage, setProductsWithImage,
  } = useSettingsStore()

  const [activeSection, setActiveSection] = useState("notifications")
  const [syncLoading, setSyncLoading] = useState(false)
  const [exportingLogs, setExportingLogs] = useState(false)
  const [logCategory, setLogCategory] = useState<string>('ALL')
  const [cacheSize, setCacheSize] = useState("0 MB")
  const [ipAddress] = useState("192.168.1.1")
  const [appVersion, setAppVersion] = useState("1.0.0")
  const [wsIp, setWsIp] = useState("")
  const [wsPort, setWsPort] = useState("")
  const [wsProtocol, setWsProtocol] = useState<"http" | "https">("http")
  const [wsSaving, setWsSaving] = useState(false)

  useEffect(() => {
    calculateCacheSize()
    fetchVersion()

    const savedIp = localStorage.getItem('settings:wsIp')
    const savedPort = localStorage.getItem('settings:wsPort')
    const savedProtocol = localStorage.getItem('settings:wsProtocol') as 'http' | 'https' | null

    if (savedIp) setWsIp(savedIp)
    if (savedPort) setWsPort(savedPort)
    if (savedProtocol) setWsProtocol(savedProtocol)
  }, [])

  const fetchVersion = async () => {
    try {
      const res = await fetch('/api/version')
      const data = await res.json()
      setAppVersion(data.version)
    } catch (error) {
      console.error('Error fetching version:', error)
    }
  }

  const calculateCacheSize = () => {
    let total = 0
    for (const x in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
        total += (localStorage[x].length + x.length) * 2
      }
    }
    setCacheSize((total / (1024 * 1024)).toFixed(2) + " MB")
  }

  const handleSync = () => {
    setSyncLoading(true)
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'Sincronizando con el servidor...',
      success: () => { setSyncLoading(false); calculateCacheSize(); return 'Datos actualizados correctamente' },
      error: 'Error en la sincronización',
    })
  }

  const handleClearCache = () => {
    const preserve = ['settings:', 'next-auth', 'auth-storage']
    Object.keys(localStorage).forEach(key => {
      if (!preserve.some(p => key.startsWith(p))) localStorage.removeItem(key)
    })
    calculateCacheSize()
    toast.success("Caché local limpiada")
  }

  const handleExportLogs = async () => {
    setExportingLogs(true)
    try {
      const params = new URLSearchParams()
      if (logCategory !== 'ALL') params.set('category', logCategory)

      const listRes = await fetch(`/api/logs?${params}`)
      const { files } = await listRes.json()

      if (!files || files.length === 0) {
        toast.info('No hay logs disponibles para la categoría seleccionada')
        return
      }

      const contents = await Promise.all(
        files.map(async (filePath: string) => {
          const res = await fetch(`/api/logs?file=${encodeURIComponent(filePath)}`)
          return res.text()
        })
      )

      const blob = new Blob([contents.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `isync-logs-${logCategory === 'ALL' ? 'all' : logCategory.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${files.length} archivo${files.length !== 1 ? 's' : ''} descargado${files.length !== 1 ? 's' : ''}`)
    } catch {
      toast.error('Error al exportar los logs')
    } finally {
      setExportingLogs(false)
    }
  }

  const handleSaveWsConfig = async () => {
    if (!wsIp || !wsPort) {
      toast.error("Por favor ingresa la IP y el puerto")
      return
    }

    setWsSaving(true)
    try {
      localStorage.setItem('settings:wsIp', wsIp)
      localStorage.setItem('settings:wsPort', wsPort)
      localStorage.setItem('settings:wsProtocol', wsProtocol)
      const wsUrl = `${wsProtocol}://${wsIp}:${wsPort}`
      localStorage.setItem('settings:wsUrl', wsUrl)
      toast.success(`WebSocket guardado: ${wsUrl}`)
    } catch {
      toast.error("Error al guardar la configuración")
    } finally {
      setWsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const renderContent = () => {
    switch (activeSection) {
      case "notifications": return (
        <Section title="Notificaciones" description="Gestiona cómo y cuándo recibes alertas del sistema iSync.">
          <ToggleItem
            icon={<Bell />}
            title="Notificaciones Push"
            desc="Alertas globales, nuevos pedidos y actualizaciones de estado."
            checked={pushEnabled}
            onCheckedChange={(val: boolean) => { setPushEnabled(val); localStorage.setItem('settings:pushEnabled', String(val)) }}
          />
          <ToggleItem
            icon={<Volume2 />}
            title="Alertas Sonoras"
            desc="Reproducir un sonido corto para notificaciones críticas."
            checked={soundEnabled}
            disabled={!pushEnabled}
            onCheckedChange={(val: boolean) => { setSoundEnabled(val); localStorage.setItem('settings:soundEnabled', String(val)) }}
          />
          <ToggleItem
            icon={<ImageIcon />}
            title="Miniaturas en Notificaciones"
            desc="Mostrar imágenes de productos en las alertas emergentes."
            checked={true}
          />
          <ToggleItem
            icon={<ImageIcon />}
            title="Productos con Imagen"
            desc="Mostrar imagen en el catálogo de productos."
            checked={productsWithImage}
            onCheckedChange={(val: boolean) => { setProductsWithImage(val); localStorage.setItem('settings:productsWithImage', String(val)) }}
          />
        </Section>
      )

      case "system": return (
        <Section title="Sistema y Datos" description="Información técnica y herramientas de mantenimiento.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={<Wifi />} label="Dirección IP" value={ipAddress} pulse />
            <StatCard icon={<Smartphone />} label="Build Versión" value={appVersion} />
            <StatCard icon={<Database />} label="Caché Utilizada" value={cacheSize} />
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Acciones</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSync}
                disabled={syncLoading}
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary/90 rounded-full"
              >
                <RefreshCw size={14} className={cn("mr-1.5", syncLoading && "animate-spin")} />
                {syncLoading ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                className="rounded-full border-gray-200"
              >
                <Trash2 size={14} className="mr-1.5 text-gray-500" />
                Limpiar Caché
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Descargar Logs</p>
            <div className="flex items-center gap-2">
              <Select value={logCategory} onValueChange={setLogCategory}>
                <SelectTrigger className="w-36 h-9 text-sm border-gray-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PEDIDO">Pedidos</SelectItem>
                  <SelectItem value="COBRO">Cobro</SelectItem>
                  <SelectItem value="COBROS">Cobros</SelectItem>
                  <SelectItem value="ANALITICAS">Analíticas</SelectItem>
                  <SelectItem value="CLIENTES">Clientes</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLogs}
                disabled={exportingLogs}
                className="rounded-full border-gray-200"
              >
                <Download size={14} className="mr-1.5 text-gray-500" />
                {exportingLogs ? 'Exportando...' : 'Descargar'}
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Configuración WebSocket</p>
            <div className="flex gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Protocolo</Label>
                <Select value={wsProtocol} onValueChange={(val) => setWsProtocol(val as "http" | "https")}>
                  <SelectTrigger className="h-9 text-sm border-gray-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">IP del Servidor</Label>
                <Input
                  placeholder="000.000.000.00"
                  value={wsIp}
                  onChange={(e) => setWsIp(e.target.value)}
                  className="h-9 text-sm border-gray-200 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Puerto</Label>
                <Input
                  placeholder="5050"
                  value={wsPort}
                  onChange={(e) => setWsPort(e.target.value)}
                  className="h-9 text-sm border-gray-200 rounded-xl"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={handleSaveWsConfig}
                disabled={wsSaving}
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary/90 rounded-full"
              >
                <Wifi size={14} className="mr-1.5" />
                {wsSaving ? 'Guardando...' : 'Guardar WebSocket'}
              </Button>
            </div>
          </div>
        </Section>
      )

      case "security": return (
        <Section title="Cuenta y Seguridad" description="Gestiona el acceso y las credenciales de tu sesión activa.">
          <div className="flex items-center justify-between gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-brand-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{fullName || "Usuario iSync"}</p>
                <p className="text-xs text-gray-500">Vendedor Pro · ID: IS-4509</p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit border border-green-100">
                  <CheckCircle2 size={11} />
                  Sesión activa
                </div>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={14} className="mr-1.5" />
              Cerrar Sesión
            </Button>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <span><span className="font-semibold">Nota:</span> Tu sesión expira automáticamente tras 1 hora de inactividad. No compartas tus credenciales.</span>
          </div>
        </Section>
      )

      default: return null
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-gray-50/50 dark:bg-[#141414] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <p className="text-sm text-gray-500">Preferencias de iSync Web</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar */}
        <aside className="w-full md:w-52 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible bg-white rounded-2xl border border-gray-200 p-2">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors w-full text-left",
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon size={16} className={isActive ? "text-brand-primary" : "text-gray-400"} strokeWidth={isActive ? 2 : 1.5} />
                  {label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>

      <footer className="pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} iSync Web · Build {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'HEAD'}
        </p>
      </footer>
    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="p-6 flex flex-col gap-3">
        {children}
      </div>
    </div>
  )
}

function ToggleItem({ icon, title, desc, checked, onCheckedChange, disabled = false }: {
  icon: React.ReactElement<{ size?: number; strokeWidth?: number }>;
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange?: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-2xl border border-gray-200 transition-colors",
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50/50"
    )}>
      <div className="flex gap-3 items-center">
        <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 shrink-0">
          {cloneElement(icon, { size: 16, strokeWidth: 1.5 })}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-brand-primary"
      />
    </div>
  )
}

function StatCard({ icon, label, value, pulse = false }: {
  icon: React.ReactElement<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200">
      <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
        {cloneElement(icon, { size: 16, strokeWidth: 1.5 })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-medium text-gray-400 truncate">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      </div>
      {pulse && (
        <div className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
        </div>
      )}
    </div>
  )
}
