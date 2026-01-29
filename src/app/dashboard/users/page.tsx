"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  UserCog,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Users,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UsersSkeleton } from "@/components/ui/skeleton";
import { ROLE_DEFINITIONS, ROLE_COLORS, PERMISSIONS, RoleCode } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";

// Permission groups for better UI organization
const PERMISSION_GROUPS = {
  dashboard: {
    name: "Dashboard",
    icon: "📊",
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  agent: {
    name: "จัดการ Agent",
    icon: "👥",
    permissions: [
      PERMISSIONS.AGENT_VIEW,
      PERMISSIONS.AGENT_CREATE,
      PERMISSIONS.AGENT_EDIT,
      PERMISSIONS.AGENT_DELETE,
    ],
  },
  betting: {
    name: "คีย์หวย",
    icon: "🎫",
    permissions: [
      PERMISSIONS.BET_VIEW,
      PERMISSIONS.BET_CREATE,
      PERMISSIONS.BET_CANCEL,
    ],
  },
  risk: {
    name: "ความเสี่ยง",
    icon: "🛡️",
    permissions: [PERMISSIONS.RISK_VIEW, PERMISSIONS.RISK_MANAGE],
  },
  layoff: {
    name: "ตีออก",
    icon: "📤",
    permissions: [PERMISSIONS.LAYOFF_VIEW, PERMISSIONS.LAYOFF_MANAGE],
  },
  round: {
    name: "งวดหวย/เลขอั้น",
    icon: "📅",
    permissions: [PERMISSIONS.ROUND_VIEW, PERMISSIONS.ROUND_MANAGE],
  },
  result: {
    name: "ผลหวย",
    icon: "🏆",
    permissions: [PERMISSIONS.RESULT_VIEW, PERMISSIONS.RESULT_SUBMIT],
  },
  history: {
    name: "ประวัติ",
    icon: "📜",
    permissions: [PERMISSIONS.HISTORY_VIEW],
  },
  report: {
    name: "รายงาน",
    icon: "📈",
    permissions: [PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT],
  },
  settings: {
    name: "ตั้งค่า",
    icon: "⚙️",
    permissions: [PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE],
  },
  user: {
    name: "จัดการ Admin",
    icon: "👤",
    permissions: [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_EDIT,
      PERMISSIONS.USER_DELETE,
    ],
  },
};

// Get permission display name
const getPermissionName = (perm: string): string => {
  const names: Record<string, string> = {
    "dashboard:view": "ดู Dashboard",
    "agent:view": "ดูรายการ Agent",
    "agent:create": "เพิ่ม Agent",
    "agent:edit": "แก้ไข Agent",
    "agent:delete": "ลบ Agent",
    "bet:view": "ดูรายการแทง",
    "bet:create": "คีย์หวย",
    "bet:cancel": "ยกเลิกรายการ",
    "risk:view": "ดูความเสี่ยง",
    "risk:manage": "จัดการความเสี่ยง",
    "layoff:view": "ดูตีออก",
    "layoff:manage": "จัดการตีออก",
    "round:view": "ดูงวดหวย",
    "round:manage": "จัดการงวด/เลขอั้น",
    "result:view": "ดูผลหวย",
    "result:submit": "กรอกผลหวย",
    "history:view": "ดูประวัติ",
    "report:view": "ดูรายงาน",
    "report:export": "Export รายงาน",
    "settings:view": "ดูตั้งค่า",
    "settings:manage": "แก้ไขตั้งค่า",
    "user:view": "ดูรายการ Admin",
    "user:create": "เพิ่ม Admin",
    "user:edit": "แก้ไข Admin",
    "user:delete": "ลบ Admin",
  };
  return names[perm] || perm;
};

// User type with custom permissions
interface UserData {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  customPermissions: string[] | null; // null = use role default
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

// Demo users data
const initialUsers: UserData[] = [
  {
    id: "1",
    username: "master",
    name: "เจ้าของระบบ",
    email: "master@punsook.com",
    phone: "081-234-5678",
    role: "MASTER",
    customPermissions: null,
    isActive: true,
    lastLogin: new Date("2026-01-10T10:30:00"),
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "2",
    username: "admin",
    name: "ผู้ดูแลระบบ",
    email: "admin@punsook.com",
    phone: "082-345-6789",
    role: "ADMIN",
    customPermissions: null,
    isActive: true,
    lastLogin: new Date("2026-01-10T09:15:00"),
    createdAt: new Date("2025-06-15"),
  },
  {
    id: "3",
    username: "somchai",
    name: "สมชาย คีย์หวย",
    email: "somchai@punsook.com",
    phone: "083-456-7890",
    role: "OPERATOR",
    customPermissions: null,
    isActive: true,
    lastLogin: new Date("2026-01-09T16:45:00"),
    createdAt: new Date("2025-08-20"),
  },
  {
    id: "4",
    username: "reporter",
    name: "ผู้ดูรายงาน",
    email: "reporter@punsook.com",
    phone: null,
    role: "VIEWER",
    customPermissions: null,
    isActive: true,
    lastLogin: new Date("2026-01-08T11:00:00"),
    createdAt: new Date("2025-10-01"),
  },
  {
    id: "5",
    username: "old_admin",
    name: "แอดมินเก่า",
    email: "old@punsook.com",
    phone: null,
    role: "ADMIN",
    customPermissions: null,
    isActive: false,
    lastLogin: new Date("2025-12-01T08:00:00"),
    createdAt: new Date("2025-03-10"),
  },
];

export default function UsersPage() {
  const { user: currentUser, isMaster } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Array<{ code: string; name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isEditPermissionsDialogOpen, setIsEditPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  
  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    role: "OPERATOR",
  });

  // SWR for users and roles
  interface UsersResponse {
    users: Array<Omit<UserData, "role"> & { 
      role: { id: string; code: string; name: string };
      createdAt: string; 
      lastLogin: string | null;
    }>;
  }
  interface RolesResponse {
    roles: Array<{ code: string; name: string }>;
  }
  const { data: usersData, isLoading: usersLoading, mutate: mutateUsers } = useSWR<UsersResponse>("/api/users");
  const { data: rolesData, isLoading: rolesLoading } = useSWR<RolesResponse>("/api/roles");
  
  const isLoading = usersLoading || rolesLoading;

  useEffect(() => {
    if (usersData?.users) {
      setUsers(usersData.users.map((u) => ({
        ...u,
        role: u.role.code, // Extract role code from role object
        createdAt: new Date(u.createdAt),
        lastLogin: u.lastLogin ? new Date(u.lastLogin) : null,
      })));
    }
  }, [usersData]);

  useEffect(() => {
    if (rolesData?.roles) {
      setRoles(rolesData.roles);
    }
  }, [rolesData]);

  const fetchUsers = () => mutateUsers();


  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchRole = filterRole === "ALL" || user.role === filterRole;
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && user.isActive) ||
      (filterStatus === "INACTIVE" && !user.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  // Handlers
  const handleCreateUser = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          roleCode: formData.role,
        }),
      });
      if (res.ok) {
        fetchUsers();
        setIsCreateDialogOpen(false);
        resetForm();
        toast.success("เพิ่ม Admin สำเร็จ");
      } else {
        const data = await res.json();
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Create user error:", error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่ม Admin");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          roleCode: formData.role,
          password: formData.password || undefined,
        }),
      });
      if (res.ok) {
        fetchUsers();
        setIsEditDialogOpen(false);
        resetForm();
        toast.success("แก้ไขข้อมูล Admin สำเร็จ");
      } else {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถแก้ไขข้อมูลได้");
      }
    } catch (error) {
      console.error("Edit user error:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        toast.success("ลบ Admin สำเร็จ");
      } else {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถลบได้");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Toggle active error:", error);
    }
  };

  const openEditDialog = (user: typeof initialUsers[0]) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const openPermissionsDialog = (user: UserData) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const openEditPermissionsDialog = (user: UserData) => {
    setSelectedUser(user);
    // Get current effective permissions
    const rolePermissions = ROLE_DEFINITIONS[user.role as RoleCode]?.permissions || [];
    const currentPermissions = user.customPermissions || [...rolePermissions];
    setEditingPermissions(currentPermissions as string[]);
    setUseCustomPermissions(user.customPermissions !== null);
    setIsEditPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    setIsSaving(true);
    try {
      const customPermissions = useCustomPermissions ? editingPermissions : null;
      
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPermissions }),
      });

      if (res.ok) {
        // Update local state
        setUsers(
          users.map((u) =>
            u.id === selectedUser.id
              ? { ...u, customPermissions }
              : u
          )
        );
        setIsEditPermissionsDialogOpen(false);
        setSelectedUser(null);
        toast.success("บันทึกสิทธิ์สำเร็จ");
      } else {
        const error = await res.json();
        toast.error(error.error || "ไม่สามารถบันทึกสิทธิ์ได้");
      }
    } catch (error) {
      console.error("Save permissions error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (perm: string) => {
    if (editingPermissions.includes(perm)) {
      setEditingPermissions(editingPermissions.filter((p) => p !== perm));
    } else {
      setEditingPermissions([...editingPermissions, perm]);
    }
  };

  const toggleAllInGroup = (groupPerms: readonly string[]) => {
    const allSelected = groupPerms.every((p) => editingPermissions.includes(p));
    if (allSelected) {
      setEditingPermissions(editingPermissions.filter((p) => !groupPerms.includes(p)));
    } else {
      const newPerms = [...editingPermissions];
      groupPerms.forEach((p) => {
        if (!newPerms.includes(p)) newPerms.push(p);
      });
      setEditingPermissions(newPerms);
    }
  };

  const resetToRoleDefault = () => {
    const rolePermissions = ROLE_DEFINITIONS[selectedUser?.role as RoleCode]?.permissions || [];
    setEditingPermissions([...rolePermissions] as string[]);
  };

  // Get effective permissions for a user
  const getEffectivePermissions = (user: UserData): string[] => {
    if (user.customPermissions) {
      return user.customPermissions;
    }
    return [...(ROLE_DEFINITIONS[user.role as RoleCode]?.permissions || [])] as string[];
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      role: "OPERATOR",
    });
    setShowPassword(false);
    setSelectedUser(null);
  };

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const roleStats = Object.keys(ROLE_DEFINITIONS).map((role) => ({
    role,
    count: users.filter((u) => u.role === role).length,
  }));

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="จัดการ Admin" subtitle="เพิ่ม แก้ไข และจัดการผู้ใช้งานระบบ" />
        <UsersSkeleton />
      </div>
    );
  }

  // Check if current user is master
  if (!isMaster()) {
    return (
      <div className="min-h-screen">
        <Header title="จัดการ Admin" subtitle="ไม่มีสิทธิ์เข้าถึง" />
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                ไม่มีสิทธิ์เข้าถึงหน้านี้
              </h2>
              <p className="text-slate-400">
                เฉพาะ Master เท่านั้นที่สามารถจัดการ Admin ได้
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="จัดการ Admin" subtitle="เพิ่ม แก้ไข และกำหนดสิทธิ์ผู้ใช้งาน" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/20">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">ทั้งหมด</p>
                  <p className="text-xl font-bold text-slate-100">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">ใช้งาน</p>
                  <p className="text-xl font-bold text-emerald-400">{activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {roleStats.map(({ role, count }) => {
            const roleInfo = ROLE_DEFINITIONS[role as RoleCode];
            const color = ROLE_COLORS[role];
            return (
              <Card key={role}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", color?.bg)}>
                      <Shield className={cn("w-5 h-5", color?.text)} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{roleInfo?.name}</p>
                      <p className={cn("text-xl font-bold", color?.text)}>{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="ค้นหา username, ชื่อ, อีเมล..."
                  icon={<Search className="w-4 h-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุก Role</SelectItem>
                  {Object.entries(ROLE_DEFINITIONS).map(([code, role]) => (
                    <SelectItem key={code} value={code}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                  <SelectItem value="INACTIVE">ปิดใช้งาน</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="gap-2"
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                เพิ่ม Admin
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              รายชื่อ Admin ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>เข้าใช้ล่าสุด</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleInfo = ROLE_DEFINITIONS[user.role as RoleCode];
                  const roleColor = ROLE_COLORS[user.role];
                  const isCurrentUser = currentUser?.id === user.id;
                  const isSystemUser = user.role === "MASTER" && users.filter(u => u.role === "MASTER").length === 1;
                  
                  return (
                    <TableRow key={user.id} className="table-row-hover">
                      <TableCell>
                        <span className="font-mono text-amber-400">{user.username}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="ml-2 text-xs">คุณ</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-slate-400">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              roleColor?.bg,
                              roleColor?.text,
                              roleColor?.border
                            )}
                          >
                            {roleInfo?.name}
                          </Badge>
                          {user.customPermissions && (
                            <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                              กำหนดเอง
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleActive(user.id)}
                            disabled={isCurrentUser || isSystemUser}
                          />
                          <span className={user.isActive ? "text-emerald-400" : "text-slate-500"}>
                            {user.isActive ? "ใช้งาน" : "ปิด"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {user.lastLogin
                          ? user.lastLogin.toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPermissionsDialog(user)}
                            title="ดูสิทธิ์"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditPermissionsDialog(user)}
                            title="แก้ไขสิทธิ์"
                            disabled={user.role === "MASTER"}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            title="แก้ไขข้อมูล"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={isCurrentUser || isSystemUser}
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-amber-400" />
              {isCreateDialogOpen ? "เพิ่ม Admin ใหม่" : "แก้ไข Admin"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={isEditDialogOpen}
                />
              </div>
              <div className="space-y-2">
                <Label>{isCreateDialogOpen ? "รหัสผ่าน *" : "รหัสผ่านใหม่"}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={isEditDialogOpen ? "ว่างไว้ถ้าไม่เปลี่ยน" : "รหัสผ่าน"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ชื่อ-นามสกุล *</Label>
              <Input
                placeholder="ชื่อแสดง"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>เบอร์โทร</Label>
                <Input
                  placeholder="08x-xxx-xxxx"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_DEFINITIONS).map(([code, role]) => {
                    const color = ROLE_COLORS[code];
                    return (
                      <SelectItem key={code} value={code}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", color?.bg?.replace("/20", ""))} />
                          <span>{role.name}</span>
                          <span className="text-xs text-slate-500">- {role.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Role Preview */}
            {formData.role && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">สิทธิ์ที่จะได้รับ:</p>
                <div className="flex flex-wrap gap-1">
                  {ROLE_DEFINITIONS[formData.role as RoleCode]?.permissions.slice(0, 6).map((perm) => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm.split(":")[0]}
                    </Badge>
                  ))}
                  {(ROLE_DEFINITIONS[formData.role as RoleCode]?.permissions.length || 0) > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{(ROLE_DEFINITIONS[formData.role as RoleCode]?.permissions.length || 0) - 6} อื่นๆ
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={isCreateDialogOpen ? handleCreateUser : handleEditUser}
              disabled={
                !formData.username ||
                !formData.name ||
                (isCreateDialogOpen && !formData.password)
              }
            >
              {isCreateDialogOpen ? "เพิ่ม Admin" : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">ยืนยันการลบ Admin</DialogTitle>
            <DialogDescription>
              คุณต้องการลบ Admin "{selectedUser?.name}" ({selectedUser?.username}) ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              ลบ Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-400" />
              สิทธิ์ของ {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-2">
                Role: {selectedUser && ROLE_DEFINITIONS[selectedUser.role as RoleCode]?.name}
                {selectedUser?.customPermissions && (
                  <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                    กำหนดเอง
                  </Badge>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {selectedUser.customPermissions && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <p className="text-sm text-purple-300">
                    ⚠️ Admin นี้มีสิทธิ์ที่กำหนดเองแทน Role เดิม
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">สิทธิ์ที่มี ({getEffectivePermissions(selectedUser).length}):</p>
                <div className="grid grid-cols-2 gap-2">
                  {getEffectivePermissions(selectedUser).map((perm) => (
                    <div
                      key={perm}
                      className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/30"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-slate-300">{getPermissionName(perm)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">สิทธิ์ที่ไม่มี:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PERMISSIONS)
                    .filter((perm) => !getEffectivePermissions(selectedUser).includes(perm))
                    .map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700"
                      >
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                        <span className="text-xs text-slate-500">{getPermissionName(perm)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsPermissionsDialogOpen(false);
                if (selectedUser && selectedUser.role !== "MASTER") {
                  openEditPermissionsDialog(selectedUser);
                }
              }}
              disabled={selectedUser?.role === "MASTER"}
            >
              <Key className="w-4 h-4 mr-2" />
              แก้ไขสิทธิ์
            </Button>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditPermissionsDialogOpen} onOpenChange={setIsEditPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              แก้ไขสิทธิ์ของ {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              เลือกสิทธิ์ที่ต้องการให้ Admin นี้มี
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* Toggle Custom Permissions */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="font-medium text-slate-100">ใช้สิทธิ์กำหนดเอง</p>
                  <p className="text-sm text-slate-400">
                    {useCustomPermissions 
                      ? "กำหนดสิทธิ์เฉพาะสำหรับ Admin นี้" 
                      : `ใช้สิทธิ์ตาม Role (${ROLE_DEFINITIONS[selectedUser.role as RoleCode]?.name})`}
                  </p>
                </div>
                <Switch
                  checked={useCustomPermissions}
                  onCheckedChange={(checked) => {
                    setUseCustomPermissions(checked);
                    if (!checked) {
                      resetToRoleDefault();
                    }
                  }}
                />
              </div>

              {useCustomPermissions && (
                <>
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetToRoleDefault}>
                      รีเซ็ตตาม Role
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingPermissions(Object.values(PERMISSIONS))}
                    >
                      เลือกทั้งหมด
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingPermissions([])}
                    >
                      ล้างทั้งหมด
                    </Button>
                  </div>

                  {/* Permission Groups */}
                  <div className="space-y-3">
                    {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                      const allSelected = group.permissions.every((p) => 
                        editingPermissions.includes(p)
                      );
                      const someSelected = group.permissions.some((p) => 
                        editingPermissions.includes(p)
                      );
                      
                      return (
                        <div 
                          key={key} 
                          className="p-3 rounded-lg bg-slate-800/30 border border-slate-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span>{group.icon}</span>
                              <span className="font-medium text-slate-100">{group.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {group.permissions.filter((p) => editingPermissions.includes(p)).length}/{group.permissions.length}
                              </Badge>
                            </div>
                            <Switch
                              checked={allSelected}
                              onCheckedChange={() => toggleAllInGroup(group.permissions)}
                              className={someSelected && !allSelected ? "bg-purple-500" : ""}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {group.permissions.map((perm) => {
                              const isSelected = editingPermissions.includes(perm);
                              return (
                                <button
                                  key={perm}
                                  onClick={() => togglePermission(perm)}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded text-left text-sm transition-colors",
                                    isSelected
                                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                                      : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-700/50"
                                  )}
                                >
                                  <div className={cn(
                                    "w-3 h-3 rounded border-2 flex items-center justify-center",
                                    isSelected 
                                      ? "border-emerald-400 bg-emerald-400" 
                                      : "border-slate-500"
                                  )}>
                                    {isSelected && (
                                      <svg className="w-2 h-2 text-slate-900" fill="currentColor" viewBox="0 0 12 12">
                                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                      </svg>
                                    )}
                                  </div>
                                  <span>{getPermissionName(perm)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Summary */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-sm text-purple-300">
                  สรุป: {editingPermissions.length} สิทธิ์
                  {useCustomPermissions ? " (กำหนดเอง)" : ` (ตาม Role ${ROLE_DEFINITIONS[selectedUser.role as RoleCode]?.name})`}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPermissionsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSavePermissions}>
              บันทึกสิทธิ์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
