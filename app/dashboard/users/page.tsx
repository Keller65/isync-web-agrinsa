"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { PencilSimple, Plus, User as UserIcon } from "@phosphor-icons/react"
import Avvvatars from "avvvatars-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { AdminUser } from "@/types/api-types"

interface UserData {
  id: string
  name: string
  email: string
  active: boolean
  salesPersonCode: number | null
  isMasterAdmin: boolean
  twoFactorEnabled: boolean
}

export default function Page() {
  const router = useRouter()
  const { data: session } = useSession()
  const token = session?.user?.token ?? null
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    employeeId: "",
    salesPersonCode: "",
    canLoginWeb: true,
    canLoginApp: true,
    isMasterAdmin: false,
  })

  useEffect(() => {
    if (!token) return

    const fetchUsers = async () => {
      try {
        const response = await axios.get<AdminUser[]>("/api-proxy/api/isync/auth/admin/users", {
          params: { page: 1, pageSize: 20 },
          headers: { Authorization: `Bearer ${token}` },
        })

        const apiUsers: UserData[] = (response.data ?? []).map((user) => ({
          id: String(user.userId),
          name: user.fullName || user.username,
          email: user.email,
          active: user.isActive,
          salesPersonCode: user.salesPersonCode,
          isMasterAdmin: user.isMasterAdmin,
          twoFactorEnabled: user.twoFactorEnabled,
        }))

        setUsers(apiUsers)
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [token])

  const handleEditClick = (user: UserData) => {
    router.push(`/dashboard/users/${user.id}`)
  }

  const handleCreateUser = async () => {
    if (!token || !createForm.username || !createForm.email || !createForm.password) {
      return
    }

    setCreating(true)
    try {
      const response = await axios.post<{ userId: number }>(
        "/api-proxy/api/isync/auth/admin/users",
        {
          username: createForm.username,
          email: createForm.email,
          password: createForm.password,
          employeeId: createForm.employeeId ? Number(createForm.employeeId) : null,
          salesPersonCode: createForm.salesPersonCode ? Number(createForm.salesPersonCode) : null,
          canLoginWeb: createForm.canLoginWeb,
          canLoginApp: createForm.canLoginApp,
          isMasterAdmin: createForm.isMasterAdmin,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data?.userId) {
        const newUser: UserData = {
          id: String(response.data.userId),
          name: createForm.username,
          email: createForm.email,
          active: true,
          salesPersonCode: createForm.salesPersonCode ? Number(createForm.salesPersonCode) : null,
          isMasterAdmin: createForm.isMasterAdmin,
          twoFactorEnabled: false,
        }
        setUsers([newUser, ...users])
        setIsCreateModalOpen(false)
        setCreateForm({
          username: "",
          email: "",
          password: "",
          employeeId: "",
          salesPersonCode: "",
          canLoginWeb: true,
          canLoginApp: true,
          isMasterAdmin: false,
        })
      }
    } catch (err) {
      console.error("Error creating user:", err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-4 max-w-full mx-auto dark:bg-dark-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona el acceso y permisos de tu equipo</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} />
          Nuevo usuario
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <UserIcon size={48} className="mb-4 opacity-50" />
          <p>No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/[0.07] rounded-lg hover:bg-gray-50/50 dark:hover:bg-dark-raised transition-colors"
            >
              <Avvvatars value={user.email} style="shape" size={48} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate dark:text-dark-text-primary">{user.name}</h3>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${user.active ? "bg-green-500" : "bg-gray-300 dark:bg-dark-text-disabled"}`} />
                </div>
                <p className="text-sm text-gray-500 dark:text-dark-text-muted truncate">{user.email}</p>
              </div>

              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-400 dark:text-dark-text-disabled text-xs uppercase tracking-wider">Admin</p>
                  <p className={`font-medium ${user.isMasterAdmin ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-dark-text-disabled"}`}>
                    {user.isMasterAdmin ? "Sí" : "No"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 dark:text-dark-text-disabled text-xs uppercase tracking-wider">2FA</p>
                  <p className={`font-medium ${user.twoFactorEnabled ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-dark-text-disabled"}`}>
                    {user.twoFactorEnabled ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 dark:text-dark-text-disabled text-xs uppercase tracking-wider">Estado</p>
                  <p className={`font-medium ${user.active ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-dark-text-disabled"}`}>
                    {user.active ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditClick(user)}
                className="text-gray-400 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-raised"
              >
                <PencilSimple size={20} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de usuario</label>
              <Input
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="Ingrese el nombre del usuario"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo electrónico</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="Ingrese el Correo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sales Person Code</label>
                <Input
                  type="number"
                  value={createForm.salesPersonCode}
                  onChange={(e) => setCreateForm({ ...createForm, salesPersonCode: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Permitir login web</label>
              <Switch
                checked={createForm.canLoginWeb}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, canLoginWeb: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Permitir login app</label>
              <Switch
                checked={createForm.canLoginApp}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, canLoginApp: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Es administrador maestro</label>
              <Switch
                checked={createForm.isMasterAdmin}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, isMasterAdmin: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={creating || !createForm.username || !createForm.email || !createForm.password}
              className="flex-1"
            >
              {creating ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}