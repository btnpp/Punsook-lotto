"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_STYLES = {
  success: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
  error: "bg-red-500/20 border-red-500/50 text-red-300",
  info: "bg-blue-500/20 border-blue-500/50 text-blue-300",
  warning: "bg-amber-500/20 border-amber-500/50 text-amber-300",
};

const ICON_STYLES = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-blue-400",
  warning: "text-amber-400",
};

const PROGRESS_STYLES = {
  success: "bg-emerald-400",
  error: "bg-red-400",
  info: "bg-blue-400",
  warning: "bg-amber-400",
};

function ToastItem({ 
  toast, 
  onClose 
}: { 
  toast: Toast; 
  onClose: () => void;
}) {
  const Icon = TOAST_ICONS[toast.type];
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const startTime = toast.createdAt;
    const endTime = startTime + toast.duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const percent = (remaining / toast.duration) * 100;
      setProgress(percent);

      if (percent <= 0) {
        setIsExiting(true);
        setTimeout(onClose, 200);
      }
    };

    // Update every 50ms for smooth animation
    const interval = setInterval(updateProgress, 50);
    updateProgress();

    return () => clearInterval(interval);
  }, [toast.duration, toast.createdAt, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg",
        "transition-all duration-200",
        isExiting 
          ? "animate-out slide-out-to-right-full fade-out" 
          : "animate-in slide-in-from-right-full fade-in duration-150",
        TOAST_STYLES[toast.type]
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0", ICON_STYLES[toast.type])} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleClose}
        className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className={cn(
              "h-full transition-all duration-100 ease-linear",
              PROGRESS_STYLES[toast.type]
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 3000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const toast: Toast = { 
        id, 
        message, 
        type, 
        duration,
        createdAt: Date.now(),
      };

      // Use startTransition for immediate update
      setToasts((prev) => [...prev, toast]);
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, "success", duration ?? 3000),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => showToast(message, "error", duration ?? 5000),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => showToast(message, "info", duration ?? 3000),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => showToast(message, "warning", duration ?? 4000),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
