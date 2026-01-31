"use client";

import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  disabled?: boolean;
}

export const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ children, className, onClick, hapticStyle = 'light', disabled }, ref) => {
    const handleClick = () => {
      if (disabled) return;
      haptic(hapticStyle);
      onClick?.();
    };

    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          "rounded-xl border bg-card transition-all duration-150",
          onClick && !disabled && "cursor-pointer press-scale hover:bg-card/80",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

InteractiveCard.displayName = "InteractiveCard";

// Interactive button with haptics
interface InteractiveButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'success';
  disabled?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
}

export function InteractiveButton({
  children,
  className,
  onClick,
  hapticStyle = 'light',
  disabled,
  variant = 'default',
}: InteractiveButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    haptic(hapticStyle);
    onClick?.();
  };

  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all",
        "press-scale-sm",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
