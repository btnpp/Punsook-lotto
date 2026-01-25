"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ROLE_DEFINITIONS, PermissionCode, hasPermission } from "./permissions";

// User type
export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: {
    code: string;
    name: string;
    permissions: string[];
  };
}

// Auth context type
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: PermissionCode) => boolean;
  isMaster: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check auth status via API
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const userData: AuthUser = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          email: data.user.email,
          role: {
            code: data.user.role,
            name: ROLE_DEFINITIONS[data.user.role as keyof typeof ROLE_DEFINITIONS]?.name || data.user.role,
            permissions: data.user.permissions || [],
          },
        };
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function - calls API
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userData: AuthUser = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          email: data.user.email,
          role: {
            code: data.user.role,
            name: ROLE_DEFINITIONS[data.user.role as keyof typeof ROLE_DEFINITIONS]?.name || data.user.role,
            permissions: data.user.permissions || [],
          },
        };
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: data.error || "เข้าสู่ระบบไม่สำเร็จ" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อ" };
    }
  };

  // Logout function - calls API
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    window.location.href = "/";
  };

  // Check permission
  const checkPermission = (permission: PermissionCode): boolean => {
    if (!user) return false;
    return hasPermission(user.role.permissions, permission);
  };

  // Check if user is master
  const isMaster = (): boolean => {
    return user?.role.code === "MASTER";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        hasPermission: checkPermission,
        isMaster,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to check permission (convenience)
export function usePermission(permission: PermissionCode): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}
