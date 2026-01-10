"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ROLE_DEFINITIONS, PermissionCode, hasPermission, RoleCode } from "./permissions";

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
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: PermissionCode) => boolean;
  isMaster: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  master: {
    password: "master123",
    user: {
      id: "1",
      username: "master",
      name: "เจ้าของระบบ",
      email: "master@punsook.com",
      role: {
        code: "MASTER",
        name: "Master",
        permissions: ROLE_DEFINITIONS.MASTER.permissions as unknown as string[],
      },
    },
  },
  admin: {
    password: "admin123",
    user: {
      id: "2",
      username: "admin",
      name: "ผู้ดูแลระบบ",
      email: "admin@punsook.com",
      role: {
        code: "ADMIN",
        name: "Admin",
        permissions: ROLE_DEFINITIONS.ADMIN.permissions as unknown as string[],
      },
    },
  },
  operator: {
    password: "operator123",
    user: {
      id: "3",
      username: "operator",
      name: "พนักงานคีย์หวย",
      email: "operator@punsook.com",
      role: {
        code: "OPERATOR",
        name: "Operator",
        permissions: ROLE_DEFINITIONS.OPERATOR.permissions as unknown as string[],
      },
    },
  },
  viewer: {
    password: "viewer123",
    user: {
      id: "4",
      username: "viewer",
      name: "ผู้ดูรายงาน",
      email: "viewer@punsook.com",
      role: {
        code: "VIEWER",
        name: "Viewer",
        permissions: ROLE_DEFINITIONS.VIEWER.permissions as unknown as string[],
      },
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("authUser");
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    // Demo login - in production, this would call an API
    const demoUser = DEMO_USERS[username.toLowerCase()];
    
    if (demoUser && demoUser.password === password) {
      setUser(demoUser.user);
      localStorage.setItem("authUser", JSON.stringify(demoUser.user));
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", demoUser.user.name);
      return true;
    }
    
    // Fallback for old demo login (admin/admin)
    if (username === "admin" && password === "admin") {
      const fallbackUser = DEMO_USERS.admin.user;
      setUser(fallbackUser);
      localStorage.setItem("authUser", JSON.stringify(fallbackUser));
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", fallbackUser.name);
      return true;
    }
    
    return false;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
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
