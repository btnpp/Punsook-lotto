"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/sidebar-context";
import { MENU_ITEMS, hasPermission, ROLE_COLORS } from "@/lib/permissions";
import {
  LayoutDashboard,
  Users,
  Ticket,
  Settings,
  TrendingUp,
  FileSpreadsheet,
  Shield,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  UserCog,
  LucideIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Ticket,
  Settings,
  TrendingUp,
  FileSpreadsheet,
  Shield,
  History,
  BarChart3,
  Calendar,
  UserCog,
};

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isOpen, isMobile, close } = useSidebar();

  // Get user permissions (default to empty if not logged in)
  const userPermissions = user?.role?.permissions || [];

  // Filter menu items based on user permissions
  const accessibleMenuItems = MENU_ITEMS.filter((item) =>
    hasPermission(userPermissions, item.requiredPermission)
  );

  // Get role color
  const roleColor = user?.role?.code ? ROLE_COLORS[user.role.code] : null;

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={close}
          />
        )}
        
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 h-screen w-72 transition-transform duration-300 lg:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800">
            {/* Logo with Close */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={close}>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">Punsook</span>
              </Link>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {user.name}
                    </p>
                    {roleColor && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs px-1.5 py-0",
                          roleColor.bg,
                          roleColor.text,
                          roleColor.border
                        )}
                      >
                        {user.role.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <ul className="space-y-1">
                {accessibleMenuItems.map((item) => {
                  const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                        )}
                      >
                        <IconComponent className={cn("h-5 w-5 shrink-0", isActive && "text-amber-400")} />
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="border-t border-slate-800 p-3">
              <button
                onClick={() => { logout(); close(); }}
                className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 hidden lg:block",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">Punsook</span>
            </Link>
          )}
          
          {isCollapsed && (
            <div className="w-10 h-10 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Ticket className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* User Info */}
        {user && !isCollapsed && (
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">
                  {user.name}
                </p>
                {roleColor && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs px-1.5 py-0",
                      roleColor.bg,
                      roleColor.text,
                      roleColor.border
                    )}
                  >
                    {user.role.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {accessibleMenuItems.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
                      isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <IconComponent className={cn("h-5 w-5 shrink-0", isActive && "text-amber-400")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>

        {/* Logout */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium w-full",
              "text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
