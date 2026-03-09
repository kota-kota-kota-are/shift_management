type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-system-green/15 text-system-green",
  warning: "bg-system-orange/15 text-system-orange",
  error: "bg-system-red/15 text-system-red",
  info: "bg-system-blue/15 text-system-blue",
  neutral: "bg-bg-tertiary text-text-secondary",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5
        text-xs font-medium
        rounded-full
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
