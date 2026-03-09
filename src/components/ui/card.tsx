type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: CardPadding;
}

const paddingStyles: Record<CardPadding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  className = "",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`
        bg-bg-secondary rounded-xl shadow-sm
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
