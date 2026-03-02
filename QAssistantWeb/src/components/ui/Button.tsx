import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "brand" | "surface" | "ghost" | "danger" | "nav";
    size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "surface", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50",
                    variant === "brand" && "bg-brand text-white hover:bg-brand-hover shadow-sm",
                    variant === "surface" && "bg-bg-surface text-text-main hover:bg-bg-surface-hover border border-border-subtle",
                    variant === "ghost" && "hover:bg-bg-surface-hover text-text-muted hover:text-text-main",
                    variant === "nav" && "bg-transparent text-text-muted hover:bg-bg-surface hover:text-white justify-start w-full",
                    variant === "danger" && "bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20",
                    size === "sm" && "h-8 px-3 text-xs",
                    size === "md" && "h-9 px-4 py-2",
                    size === "lg" && "h-10 px-8",
                    size === "icon" && "h-9 w-9",
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
