import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 focus-visible:ring-orange-500",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 focus-visible:ring-red-500",
        outline:
          "border-2 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-slate-500",
        secondary:
          "bg-slate-700 text-slate-100 hover:bg-slate-600 focus-visible:ring-slate-500",
        ghost:
          "text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-slate-500",
        link:
          "text-amber-400 underline-offset-4 hover:underline focus-visible:ring-amber-500",
        success:
          "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 focus-visible:ring-emerald-500",
      },
      size: {
        default: "h-10 px-4 py-2 sm:h-11 sm:px-5",
        sm: "h-8 rounded-md px-3 text-xs sm:h-9",
        lg: "h-11 rounded-xl px-6 text-base sm:h-12 sm:px-8",
        xl: "h-12 rounded-xl px-8 text-lg sm:h-14 sm:px-10",
        icon: "h-9 w-9 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

