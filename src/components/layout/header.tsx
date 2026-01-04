"use client";

import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-100">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:block w-64">
            <Input
              placeholder="ค้นหา..."
              icon={<Search className="w-4 h-4" />}
              className="h-9 bg-slate-800/50"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-100">Admin</p>
              <p className="text-xs text-slate-400">เจ้ามือ</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

