"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, HelpCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmType = "danger" | "warning" | "info" | "success";

interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

const TYPE_STYLES = {
  danger: {
    icon: Trash2,
    iconClass: "text-red-400",
    bgClass: "bg-red-500/10 border-red-500/30",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/30",
    buttonVariant: "default" as const,
  },
  info: {
    icon: HelpCircle,
    iconClass: "text-blue-400",
    bgClass: "bg-blue-500/10 border-blue-500/30",
    buttonVariant: "default" as const,
  },
  success: {
    icon: CheckCircle,
    iconClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
    buttonVariant: "default" as const,
  },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef?.(true);
    setResolveRef(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef?.(false);
    setResolveRef(null);
  };

  const type = options?.type || "warning";
  const typeStyle = TYPE_STYLES[type];
  const Icon = options?.icon ? null : typeStyle.icon;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className={cn(
              "mx-auto w-14 h-14 rounded-full flex items-center justify-center border-2 mb-4",
              typeStyle.bgClass
            )}>
              {options?.icon || (Icon && <Icon className={cn("w-7 h-7", typeStyle.iconClass)} />)}
            </div>
            <DialogTitle className="text-center text-lg">
              {options?.title}
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400">
              {options?.message}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-3 sm:justify-center mt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 sm:flex-none sm:min-w-[100px]"
            >
              {options?.cancelText || "ยกเลิก"}
            </Button>
            <Button
              variant={typeStyle.buttonVariant}
              onClick={handleConfirm}
              className={cn(
                "flex-1 sm:flex-none sm:min-w-[100px]",
                type === "warning" && "bg-amber-500 hover:bg-amber-600"
              )}
            >
              {options?.confirmText || "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
