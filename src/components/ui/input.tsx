import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 sm:h-11 w-full rounded-lg border-2 border-slate-700 bg-slate-800/50 px-4 py-2 text-base text-slate-100 placeholder:text-slate-500 transition-all duration-200",
            "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "touch-manipulation",
            // Prevent iOS zoom on focus by using 16px font
            "[font-size:16px] sm:text-base",
            icon && "pl-10",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };

