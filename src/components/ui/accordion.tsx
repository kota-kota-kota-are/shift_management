"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionItemProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function AccordionItem({ title, icon, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-separator last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-bg-tertiary/50 transition-colors duration-fast"
      >
        {icon && <span className="text-system-blue shrink-0">{icon}</span>}
        <span className="flex-1 text-[15px] font-medium text-text-primary">{title}</span>
        <ChevronDown
          size={18}
          className={cn(
            "text-text-tertiary transition-transform duration-normal shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-normal",
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

type AccordionGroupProps = {
  title?: string;
  children: React.ReactNode;
};

export function AccordionGroup({ title, children }: AccordionGroupProps) {
  return (
    <section className="mb-6">
      {title && (
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-4">
          {title}
        </h2>
      )}
      <div className="bg-bg-secondary rounded-xl shadow-sm overflow-hidden">
        {children}
      </div>
    </section>
  );
}

type StepProps = {
  number: number;
  title: string;
  children: React.ReactNode;
};

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-3 mb-4 last:mb-0">
      <div className="w-6 h-6 rounded-full bg-system-blue flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary mb-1">{title}</p>
        <div className="text-sm text-text-secondary leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

type TipProps = {
  children: React.ReactNode;
  variant?: "info" | "warning" | "success";
};

export function Tip({ children, variant = "info" }: TipProps) {
  const styles = {
    info: "bg-system-blue/10 border-system-blue/20 text-system-blue",
    warning: "bg-system-orange/10 border-system-orange/20 text-system-orange",
    success: "bg-system-green/10 border-system-green/20 text-system-green",
  };

  const labels = {
    info: "ヒント",
    warning: "注意",
    success: "ポイント",
  };

  return (
    <div className={cn("rounded-lg border px-3 py-2.5 mt-3", styles[variant])}>
      <p className="text-xs font-semibold mb-0.5">{labels[variant]}</p>
      <p className="text-xs opacity-90 text-text-secondary">{children}</p>
    </div>
  );
}

type FeatureBadgeProps = {
  children: React.ReactNode;
};

export function FeatureBadge({ children }: FeatureBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-system-purple/15 text-system-purple">
      {children}
    </span>
  );
}
