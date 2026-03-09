type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-system-blue text-white hover:bg-system-blue/90",
  secondary: "bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80",
  destructive: "bg-system-red text-white hover:bg-system-red/90",
  ghost: "bg-transparent text-text-primary hover:bg-bg-tertiary",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  disabled = false,
  onClick,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        rounded-lg font-medium
        transition-all duration-fast
        active:scale-[0.97]
        disabled:opacity-50 disabled:pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
