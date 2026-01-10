// =============================================
// PERMISSION & ROLE SYSTEM
// ระบบสิทธิ์การเข้าถึงเมนูตาม Role
// =============================================

// Permission codes - สิทธิ์ทั้งหมดในระบบ
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",
  
  // Agent Management
  AGENT_VIEW: "agent:view",
  AGENT_CREATE: "agent:create",
  AGENT_EDIT: "agent:edit",
  AGENT_DELETE: "agent:delete",
  
  // Betting
  BET_VIEW: "bet:view",
  BET_CREATE: "bet:create",
  BET_CANCEL: "bet:cancel",
  
  // Risk Management
  RISK_VIEW: "risk:view",
  RISK_MANAGE: "risk:manage",
  
  // Layoff
  LAYOFF_VIEW: "layoff:view",
  LAYOFF_MANAGE: "layoff:manage",
  
  // Rounds & Restrictions
  ROUND_VIEW: "round:view",
  ROUND_MANAGE: "round:manage",
  
  // Results
  RESULT_VIEW: "result:view",
  RESULT_SUBMIT: "result:submit",
  
  // History
  HISTORY_VIEW: "history:view",
  
  // Reports
  REPORT_VIEW: "report:view",
  REPORT_EXPORT: "report:export",
  
  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",
  
  // User Management (MASTER only)
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_EDIT: "user:edit",
  USER_DELETE: "user:delete",
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role definitions with default permissions
export const ROLE_DEFINITIONS = {
  MASTER: {
    code: "MASTER",
    name: "Master",
    description: "เจ้าของระบบ - เข้าถึงทุกเมนู รวมถึงจัดการ Admin และตั้งค่า",
    permissions: Object.values(PERMISSIONS), // All permissions
    isSystem: true,
  },
  ADMIN: {
    code: "ADMIN",
    name: "Admin",
    description: "ผู้ดูแลระบบ - เข้าถึงทุกเมนู ยกเว้น จัดการ Admin และบางตั้งค่า",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.AGENT_VIEW,
      PERMISSIONS.AGENT_CREATE,
      PERMISSIONS.AGENT_EDIT,
      PERMISSIONS.BET_VIEW,
      PERMISSIONS.BET_CREATE,
      PERMISSIONS.BET_CANCEL,
      PERMISSIONS.RISK_VIEW,
      PERMISSIONS.RISK_MANAGE,
      PERMISSIONS.LAYOFF_VIEW,
      PERMISSIONS.LAYOFF_MANAGE,
      PERMISSIONS.ROUND_VIEW,
      PERMISSIONS.ROUND_MANAGE,
      PERMISSIONS.RESULT_VIEW,
      PERMISSIONS.RESULT_SUBMIT,
      PERMISSIONS.HISTORY_VIEW,
      PERMISSIONS.REPORT_VIEW,
      PERMISSIONS.REPORT_EXPORT,
    ],
    isSystem: true,
  },
  OPERATOR: {
    code: "OPERATOR",
    name: "Operator",
    description: "พนักงานคีย์หวย - เข้าถึงเฉพาะ คีย์หวย และประวัติ",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.BET_VIEW,
      PERMISSIONS.BET_CREATE,
      PERMISSIONS.HISTORY_VIEW,
    ],
    isSystem: true,
  },
  VIEWER: {
    code: "VIEWER",
    name: "Viewer",
    description: "ผู้ดูรายงาน - ดูได้อย่างเดียว ไม่สามารถแก้ไขข้อมูล",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.HISTORY_VIEW,
      PERMISSIONS.REPORT_VIEW,
    ],
    isSystem: true,
  },
} as const;

export type RoleCode = keyof typeof ROLE_DEFINITIONS;

// Menu items with required permissions
export interface MenuItem {
  title: string;
  href: string;
  icon: string; // Icon name as string for serialization
  requiredPermission: PermissionCode;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    title: "หน้าหลัก",
    href: "/dashboard",
    icon: "LayoutDashboard",
    requiredPermission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    title: "จัดการ Agent",
    href: "/dashboard/agents",
    icon: "Users",
    requiredPermission: PERMISSIONS.AGENT_VIEW,
  },
  {
    title: "คีย์หวย",
    href: "/dashboard/bets",
    icon: "Ticket",
    requiredPermission: PERMISSIONS.BET_VIEW,
  },
  {
    title: "ความเสี่ยง",
    href: "/dashboard/risk",
    icon: "Shield",
    requiredPermission: PERMISSIONS.RISK_VIEW,
  },
  {
    title: "ตีออก",
    href: "/dashboard/layoff",
    icon: "TrendingUp",
    requiredPermission: PERMISSIONS.LAYOFF_VIEW,
  },
  {
    title: "งวดหวย/เลขอั้น",
    href: "/dashboard/rounds",
    icon: "Calendar",
    requiredPermission: PERMISSIONS.ROUND_VIEW,
  },
  {
    title: "ผลหวย",
    href: "/dashboard/results",
    icon: "FileSpreadsheet",
    requiredPermission: PERMISSIONS.RESULT_VIEW,
  },
  {
    title: "ประวัติ",
    href: "/dashboard/history",
    icon: "History",
    requiredPermission: PERMISSIONS.HISTORY_VIEW,
  },
  {
    title: "รายงานการเงิน",
    href: "/dashboard/reports",
    icon: "BarChart3",
    requiredPermission: PERMISSIONS.REPORT_VIEW,
  },
  {
    title: "จัดการ Admin",
    href: "/dashboard/users",
    icon: "UserCog",
    requiredPermission: PERMISSIONS.USER_VIEW,
  },
  {
    title: "ตั้งค่า",
    href: "/dashboard/settings",
    icon: "Settings",
    requiredPermission: PERMISSIONS.SETTINGS_VIEW,
  },
];

// Helper function to check if user has permission
export function hasPermission(userPermissions: string[], requiredPermission: PermissionCode): boolean {
  return userPermissions.includes(requiredPermission);
}

// Helper function to get accessible menu items for a role
export function getAccessibleMenuItems(userPermissions: string[]): MenuItem[] {
  return MENU_ITEMS.filter((item) => hasPermission(userPermissions, item.requiredPermission));
}

// Helper to get role display info
export function getRoleInfo(roleCode: string) {
  return ROLE_DEFINITIONS[roleCode as RoleCode] || null;
}

// Role badge colors
export const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MASTER: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  ADMIN: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  OPERATOR: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  VIEWER: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
};
