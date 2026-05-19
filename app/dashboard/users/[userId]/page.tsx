"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import { ArrowLeft, FloppyDiskIcon, User as UserIcon, Shield, EyeSlashIcon, EyeIcon, AndroidLogoIcon, GlobeIcon } from "@phosphor-icons/react"
import Avvvatars from "avvvatars-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { AdminUser, MenuItemResponse } from "@/types/api-types"
import { toast } from "sonner"
import { ShieldIcon } from "lucide-react"

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const { data: session } = useSession()
  const token = session?.user?.token ?? null

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingMenu, setSavingMenu] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [resetting2FA, setResetting2FA] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [resetTwoFactor, setResetTwoFactor] = useState(true)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    employeeId: "",
    salesPersonCode: "",
    canLoginWeb: true,
    canLoginApp: true,
    isMasterAdmin: false,
    isActive: true,
  })
  const [menus, setMenus] = useState<MenuItemResponse[]>([])

  const [menuSearch, setMenuSearch] = useState("")
  const [menuFilter, setMenuFilter] = useState<"all" | "active" | "inactive">("all")

  useEffect(() => {
    if (!token || !userId) return

    const fetchUser = async () => {
      try {
        const response = await axios.get<AdminUser>(
          `/api-proxy/api/isync/auth/admin/users/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        const user = response.data
        setFormData({
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          employeeId: user.employeeId?.toString() ?? "",
          salesPersonCode: user.salesPersonCode?.toString() ?? "",
          canLoginWeb: user.canLoginWeb,
          canLoginApp: user.canLoginApp,
          isMasterAdmin: user.isMasterAdmin,
          isActive: user.isActive,
        })
      } catch (err) {
        console.error("Error fetching user:", err)
      } finally {
        setLoading(false)
      }
    }

    const fetchMenus = async () => {
      try {
        const menusResponse = await axios.get<MenuItemResponse[]>(
          `/api-proxy/api/isync/auth/admin/users/${userId}/menus`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setMenus(menusResponse.data.sort((a, b) => a.sortOrder - b.sortOrder))
      } catch (err) {
        console.error("Error fetching menus:", err)
      }
    }

    fetchUser()
    fetchMenus()
  }, [token, userId])

  const handleMenuToggle = (menuCode: string, canView: boolean) => {
    setMenus(menus.map(m => m.menuCode === menuCode ? { ...m, canView } : m))
  }

  const handleReset2FA = async () => {
    if (!token || !userId || resetting2FA) return

    const confirmed = window.confirm("¿Estás seguro de resetear el 2FA de este usuario?")
    if (!confirmed) return

    setResetting2FA(true)
    try {
      await axios.patch(
        `/api-proxy/api/isync/auth/admin/users/${userId}/reset-2fa`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("2FA reseteado exitosamente")
    } catch (err) {
      console.error("Error resetting 2FA:", err)
      toast.error("Error al resetear 2FA")
    } finally {
      setResetting2FA(false)
    }
  }

  const handleResetPassword = async () => {
    if (!token || !userId || resettingPassword || !newPassword) return

    const confirmed = window.confirm("¿Estás seguro de cambiar la password de este usuario?")
    if (!confirmed) return

    setResettingPassword(true)
    try {
      const response = await axios.patch(
        `/api-proxy/api/isync/auth/admin/users/${userId}/reset-password`,
        { newPassword, resetTwoFactor },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 204 || response.status === 200) {
        toast.success("Password cambiada exitosamente")
        setNewPassword("")
      }
    } catch (err) {
      console.error("Error resetting password:", err)
      toast.error("Error al cambiar la password")
    } finally {
      setResettingPassword(false)
    }
  }

  const handleSave = async () => {
    if (!token || !userId) return

    setSaving(true)
    try {
      await axios.put(
        `/api-proxy/api/isync/auth/admin/users/${userId}`,
        {
          email: formData.email,
          employeeId: null,
          salesPersonCode: formData.salesPersonCode,
          canLoginWeb: formData.canLoginWeb,
          canLoginApp: formData.canLoginApp,
          isMasterAdmin: formData.isMasterAdmin,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Datos Guardados Correctamente");
    } catch (err) {
      console.error("Error saving user:", err)
      toast.error(`Error al guardar: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMenu = async () => {
    if (!token || !userId) return

    setSavingMenu(true)
    try {
      await axios.put(
        `/api-proxy/api/isync/auth/admin/users/${userId}/menus`,
        { menus: menus.map(m => ({ menuCode: m.menuCode, canView: m.canView })) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Datos Guardados Correctamente");
    } catch (err) {
      console.error("Error saving user:", err)
      toast.error(`Error al guardar: ${err}`)
    } finally {
      setSavingMenu(false)
    }
  }

  const handleActiveUser = async () => {
    if (!token || !userId) return

    setSavingUser(true);
    try {
      await axios.put(
        `/api-proxy/api/isync/auth/admin/users/${userId}/menus`,
        { menus: menus.map(m => ({ menuCode: m.menuCode, canView: m.canView })) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Datos Guardados Correctamente");
    } catch (err) {
      console.error("Error saving user:", err)
      toast.error(`Error al guardar: ${err}`)
    } finally {
      setSavingUser(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 max-w-full mx-auto gap-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Editar usuario</h1>
          <p className="text-sm text-muted-foreground mt-1">Configura los datos y permisos del usuario</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <section className="bg-card flex-1 border rounded-xl p-6 relative flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserIcon size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Datos del usuario</h2>
          </div>
          <div className="flex items-center gap-6 mb-6">
            <Avvvatars value={formData.email} style="shape" size={64} />
            <div>
              <p className="font-medium">{formData.fullName || formData.username}</p>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de usuario</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo electrónico</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sales Person Code</label>
              <Input
                type="number"
                value={formData.salesPersonCode}
                onChange={(e) => setFormData({ ...formData, salesPersonCode: e.target.value })}
              />
            </div>
          </div>

          <section className="flex items-center justify-end w-full">
            <Button onClick={handleSave} disabled={saving}>
              <FloppyDiskIcon size={18} className="mr-2" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </section>
        </section>

        <section className="flex-1">
          <div className="space-y-4">

            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield size={20} className="text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Opciones adicionales</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <UserIcon size={18} className="text-muted-foreground" />
                    </div>
                    <label className="text-sm font-medium">Permitir login web</label>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={formData.canLoginWeb}
                    onCheckedChange={(checked) => setFormData({ ...formData, canLoginWeb: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <UserIcon size={18} className="text-muted-foreground" />
                    </div>
                    <label className="text-sm font-medium">Permitir login app</label>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={formData.canLoginApp}
                    onCheckedChange={(checked) => setFormData({ ...formData, canLoginApp: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <ShieldIcon size={18} className="text-muted-foreground" />
                    </div>
                    <label className="text-sm font-medium">Es administrador maestro</label>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={formData.isMasterAdmin}
                    onCheckedChange={(checked) => setFormData({ ...formData, isMasterAdmin: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <UserIcon size={18} className="text-muted-foreground" />
                    </div>
                    <label className="text-sm font-medium">Usuario activo</label>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3 bg-card border rounded-xl p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nueva Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa la Nueva Contraseña"
                    className="pr-9"
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-2 flex items-center cursor-pointer"
                  >
                    {showPassword ? <EyeIcon size={16} /> : <EyeSlashIcon size={16} />}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="resetTwoFactor"
                  checked={resetTwoFactor}
                  onChange={(e) => setResetTwoFactor(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="resetTwoFactor" className="text-sm">Resetear 2FA al cambiar contraseña</label>
              </div>

              <section className="flex flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={resettingPassword || !newPassword}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  {resettingPassword ? "Cambiando..." : "Cambiar Contraseña"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset2FA}
                  disabled={resetting2FA}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  {resetting2FA ? "Resetando..." : "Resetear 2FA"}
                </Button>
              </section>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-card border rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Permisos de menú</h2>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border">
            {menus.filter(m => m.canView).length} activos · {menus.length} total
          </span>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setMenuFilter(f)}
                className={`text-xs cursor-pointer px-3 py-1.5 rounded-full border transition-colors ${menuFilter === f
                  ? "bg-primary/10 border-primary/30 text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:bg-muted"
                  }`}
              >
                {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {menus
            .filter((m) => m.menuName.toLowerCase().includes(menuSearch.toLowerCase()))
            .filter((m) =>
              menuFilter === "active" ? m.canView :
                menuFilter === "inactive" ? !m.canView : true
            )
            .map((menu) => (
              <div
                key={menu.menuCode}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors}`}
              >
                <section className="flex gap-2 items-center justify-center">
                  <span className={`text-sm font-medium ${menu.canView ? "text-brand-primary" : "text-muted-foreground"}`}>
                    {menu.menuName}
                  </span>
                  <div className="flex gap-2 items-center justify-center">
                    <AndroidLogoIcon size={16} />
                    <GlobeIcon size={16} />
                  </div>
                </section>

                <Switch
                  className="cursor-pointer"
                  checked={menu.canView}
                  onCheckedChange={(checked) => handleMenuToggle(menu.menuCode, checked)}
                />
              </div>
            ))}
        </div>

        <section className="flex items-center justify-end w-full">
          <Button onClick={handleSaveMenu} disabled={savingMenu}>
            <FloppyDiskIcon size={18} className="mr-2" />
            {savingMenu ? "Guardando..." : "Guardar cambios"}
          </Button>
        </section>
      </section>
    </div>
  )
}