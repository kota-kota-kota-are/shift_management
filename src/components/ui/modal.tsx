"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className="
          relative z-10
          w-full max-w-md mx-4
          bg-bg-secondary rounded-2xl shadow-lg
          animate-[scaleIn_200ms_ease-out]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-separator">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="
              p-1 rounded-full
              text-text-secondary hover:bg-bg-tertiary
              transition-colors duration-fast
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
