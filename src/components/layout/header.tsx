"use client";

import { User, Menu } from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { toggle, isMobile } = useSidebar();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 lg:h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left side - Menu button (mobile) + Title */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={toggle}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg lg:text-xl font-bold text-slate-100 truncate">{title}</h1>
            {subtitle && <p className="text-xs lg:text-sm text-slate-400 truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        {/* Right side - User */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-100">{user?.name || "Admin"}</p>
            <p className="text-xs text-slate-400">{user?.role?.name || "เจ้ามือ"}</p>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}

