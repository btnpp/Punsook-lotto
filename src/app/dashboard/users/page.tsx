"use client";

import { useState } from "react";
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
import { ROLE_DEFINITIONS, ROLE_COLORS, PERMISSIONS, RoleCode } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

// Demo users data
const initialUsers = [
  {
    id: "1",
    username: "master",
    name: "เจ้าของระบบ",
    email: "master@punsook.com",
    phone: "081-234-5678",
    role: "MASTER",
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
    isActive: false,
    lastLogin: new Date("2025-12-01T08:00:00"),
    createdAt: new Date("2025-03-10"),
  },
];

export default function UsersPage() {
  const { user: currentUser, isMaster } = useAuth();
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof initialUsers[0] | null>(null);
  
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
  const handleCreateUser = () => {
    const newUser = {
      id: String(users.length + 1),
      ...formData,
      isActive: true,
      lastLogin: null as Date | null,
      createdAt: new Date(),
    };
    setUsers([...users, newUser as typeof initialUsers[0]]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    setUsers(
      users.map((u) =>
        u.id === selectedUser.id
          ? { ...u, ...formData }
          : u
      )
    );
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsers(users.filter((u) => u.id !== selectedUser.id));
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleToggleActive = (userId: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      )
    );
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

  const openPermissionsDialog = (user: typeof initialUsers[0]) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
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

  // Check if current user is master
  if (!isMaster()) {
    return (
      <div className="min-h-screen">
        <Header title="จัดการ User" subtitle="ไม่มีสิทธิ์เข้าถึง" />
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                ไม่มีสิทธิ์เข้าถึงหน้านี้
              </h2>
              <p className="text-slate-400">
                เฉพาะ Master เท่านั้นที่สามารถจัดการ User ได้
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="จัดการ User" subtitle="เพิ่ม แก้ไข และกำหนดสิทธิ์ผู้ใช้งาน" />

      <div className="p-6 space-y-6">
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
                เพิ่ม User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              รายชื่อ User ({filteredUsers.length})
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
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            title="แก้ไข"
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
              {isCreateDialogOpen ? "เพิ่ม User ใหม่" : "แก้ไข User"}
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
              {isCreateDialogOpen ? "เพิ่ม User" : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">ยืนยันการลบ User</DialogTitle>
            <DialogDescription>
              คุณต้องการลบ User "{selectedUser?.name}" ({selectedUser?.username}) ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              ลบ User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              สิทธิ์ของ {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Role: {selectedUser && ROLE_DEFINITIONS[selectedUser.role as RoleCode]?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-300 mb-3">
                  {ROLE_DEFINITIONS[selectedUser.role as RoleCode]?.description}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">รายการสิทธิ์:</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_DEFINITIONS[selectedUser.role as RoleCode]?.permissions.map((perm) => (
                    <div
                      key={perm}
                      className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/30"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-slate-300">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">สิทธิ์ที่ไม่มี:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PERMISSIONS)
                    .filter(
                      (perm) =>
                        !ROLE_DEFINITIONS[selectedUser.role as RoleCode]?.permissions.includes(perm)
                    )
                    .map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700"
                      >
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                        <span className="text-xs text-slate-500">{perm}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
