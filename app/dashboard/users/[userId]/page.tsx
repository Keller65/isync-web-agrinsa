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
import { toast, Toaster } from "sonner"
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
  const [deleteUser, setDeleteUser] = useState(false)
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
  const [savingPermissionKey, setSavingPermissionKey] = useState<string | null>(null)

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

  const handleToggleActive = async (checked: boolean) => {
    if (!token || !userId) return

    const prev = formData.isActive
    // optimistic update
    setFormData((p) => ({ ...p, isActive: checked }))
    setSavingUser(true)
    try {
      await axios.patch(
        `/api-proxy/api/isync/auth/admin/users/${userId}/status`,
        { isActive: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Estado actualizado`)
    } catch (err) {
      console.error("Error updating active status:", err)
      // revert
      setFormData((p) => ({ ...p, isActive: prev }))
      toast.error("Error al actualizar estado")
    } finally {
      setSavingUser(false)
    }
  }

  const handleTogglePermission = async (key: string, checked: boolean) => {
    if (!token || !userId) return

    const prev = { ...formData }
    // optimistic update
    setFormData((p) => ({ ...p, [key]: checked }))
    setSavingPermissionKey(key)

    try {
      const payload = {
        email: prev.email ?? "",
        employeeId: prev.employeeId ? Number(prev.employeeId) : 0,
        salesPersonCode: prev.salesPersonCode ? Number(prev.salesPersonCode) : 0,
        canLoginWeb: key === "canLoginWeb" ? checked : prev.canLoginWeb,
        canLoginApp: prev.canLoginApp,
        isMasterAdmin: key === "isMasterAdmin" ? checked : prev.isMasterAdmin,
      }

      await axios.put(
        `/api-proxy/api/isync/auth/admin/users/${userId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success("Configuración actualizada")
    } catch (err) {
      console.error("Error updating permission:", err)
      // revert
      setFormData(prev)
      toast.error("Error al actualizar configuración")
    } finally {
      setSavingPermissionKey(null)
    }
  }

  const handleToggle = (key: string, checked: boolean) => {
    if (key === "isActive") {
      void handleToggleActive(checked)
      return
    }

    if (key === "canLoginWeb" || key === "isMasterAdmin") {
      void handleTogglePermission(key, Boolean(checked))
      return
    }

    setFormData((p) => ({ ...p, [key]: checked }))
  }

  const handleDeleteUser = async () => {
    try {
      const response = await axios.delete(
        `/api-proxy/api/isync/auth/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.warning('Usuario Eliminado', {
        description: 'se elimino el usuario tanto web como android',
      })

      console.log(response.data);
      setDeleteUser(true)
      router.replace('/dashboard/users')
    } catch (error) {
      setDeleteUser(false)
      toast.error(`Error al eliminar el usuario: ${error}`)
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
    <div className="flex flex-col p-4 max-w-full mx-auto gap-4 dark:bg-dark-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}
          className="text-gray-500 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-raised"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold dark:text-dark-text-primary">Editar usuario</h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">
            Configura los datos y permisos del usuario
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Datos del usuario */}
        <section className="bg-white dark:bg-dark-card flex-1 border border-gray-200 dark:border-white/[0.07] rounded-xl p-6 relative flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/10 dark:bg-dark-raised rounded-lg">
              <UserIcon size={20} className="text-brand-primary dark:text-dark-text-secondary" />
            </div>
            <h2 className="text-lg font-semibold dark:text-dark-text-primary">Datos del usuario</h2>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <Avvvatars value={formData.email} style="shape" size={64} />
            <div>
              <p className="font-medium dark:text-dark-text-primary">{formData.fullName || formData.username}</p>
              <p className="text-sm text-gray-500 dark:text-dark-text-muted">{formData.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Nombre de usuario", key: "username", type: "text" },
              { label: "Nombre completo", key: "fullName", type: "text" },
              { label: "Correo electrónico", key: "email", type: "email" },
              { label: "Sales Person Code", key: "salesPersonCode", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium dark:text-dark-text-secondary">{label}</label>
                <Input
                  type={type}
                  value={formData[key as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="dark:bg-dark-raised dark:border-white/[0.07] dark:text-dark-text-primary dark:placeholder:text-dark-text-disabled"
                />
              </div>
            ))}
          </div>

          <section className="flex items-center justify-end w-full">
            <Button onClick={handleSave} disabled={saving}>
              <FloppyDiskIcon size={18} className="mr-2" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </section>
        </section>

        {/* Columna derecha */}
        <section className="flex-1 flex flex-col gap-4">

          {/* Opciones adicionales */}
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-white/[0.07] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-primary/10 dark:bg-dark-raised rounded-lg">
                <Shield size={20} className="text-brand-primary dark:text-dark-text-secondary" />
              </div>
              <h2 className="text-lg font-semibold dark:text-dark-text-primary">Opciones adicionales</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: UserIcon, label: "Permitir login web", key: "canLoginWeb" },
                { icon: UserIcon, label: "Permitir login app", key: "canLoginApp" },
                { icon: ShieldIcon, label: "Es administrador maestro", key: "isMasterAdmin" },
                { icon: UserIcon, label: "Usuario activo", key: "isActive" },
              ].map(({ icon: Icon, label, key }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-dark-raised rounded-lg">
                      <Icon size={18} className="text-gray-500 dark:text-dark-text-muted" />
                    </div>
                    <label className="text-sm font-medium dark:text-dark-text-secondary">{label}</label>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={formData[key as keyof typeof formData] as boolean}
                    disabled={
                      key === "isActive"
                        ? savingUser
                        : key === "canLoginWeb" || key === "isMasterAdmin"
                          ? savingPermissionKey === key
                          : false
                    }
                    onCheckedChange={(checked) => handleToggle(key, Boolean(checked))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Contraseña */}
          <div className="bg-white flex-1 dark:bg-dark-card border border-gray-200 dark:border-white/7 rounded-xl p-6 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-dark-text-secondary">Nueva Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa la Nueva Contraseña"
                  className="pr-9 dark:bg-dark-raised dark:border-white/[0.07] dark:text-dark-text-primary dark:placeholder:text-dark-text-disabled"
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 flex items-center cursor-pointer text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary"
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
                className="rounded accent-brand-primary"
              />
              <label htmlFor="resetTwoFactor" className="text-sm dark:text-dark-text-secondary">
                Resetear 2FA al cambiar contraseña
              </label>
            </div>

            <section className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleResetPassword}
                disabled={resettingPassword || !newPassword}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-dark-text-secondary dark:border-white/[0.07] dark:hover:bg-dark-raised"
              >
                {resettingPassword ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReset2FA}
                disabled={resetting2FA}
              >
                {resetting2FA ? "Resetando..." : "Resetear 2FA"}
              </Button>

              {!formData.isMasterAdmin && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={formData.isMasterAdmin || deleteUser}
                >
                  {deleteUser ? "Eliminando..." : "Eliminar Usuario"}
                </Button>
              )}
            </section>
          </div>

        </section>
      </div>

      {/* Permisos de menú */}
      <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-white/[0.07] rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 dark:bg-dark-raised rounded-lg">
              <Shield size={20} className="text-brand-primary dark:text-dark-text-secondary" />
            </div>
            <h2 className="text-lg font-semibold dark:text-dark-text-primary">Permisos de menú</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-dark-text-muted bg-gray-100 dark:bg-dark-raised px-3 py-1 rounded-full border border-gray-200 dark:border-white/[0.07]">
            {menus.filter(m => m.canView).length} activos · {menus.length} total
          </span>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setMenuFilter(f)}
                className={`text-xs cursor-pointer px-3 py-1.5 rounded-full border transition-colors ${menuFilter === f
                  ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary dark:bg-dark-raised dark:border-white/12 dark:text-dark-text-primary font-medium"
                  : "border-transparent text-gray-400 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-raised"
                  }`}
              >
                {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de permisos */}
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${menu.canView
                  ? "border-brand-primary/20 bg-brand-primary/5 dark:border-white/12 dark:bg-dark-raised"
                  : "border-gray-200 dark:border-white/[0.07] hover:bg-gray-50 dark:hover:bg-dark-raised"
                  }`}
              >
                <section className="flex gap-2 items-center">
                  <span className={`text-sm font-medium ${menu.canView
                    ? "text-brand-primary dark:text-dark-text-primary"
                    : "text-gray-500 dark:text-dark-text-muted"
                    }`}>
                    {menu.menuName}
                  </span>
                  <div className="flex gap-1.5 items-center text-gray-300 dark:text-dark-text-disabled">
                    <AndroidLogoIcon size={14} />
                    <GlobeIcon size={14} />
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