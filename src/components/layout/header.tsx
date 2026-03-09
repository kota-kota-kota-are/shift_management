"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
type HeaderProps = {
  title: string;
  showBack?: boolean;
};

// ---------------------------------------------------------------------------
// Header (Mobile)
// ---------------------------------------------------------------------------
export default function Header({ title, showBack = false }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="flex md:hidden items-center h-11 px-4 bg-bg-secondary/80 backdrop-blur-xl border-b border-separator sticky top-0 z-40">
      {/* ---- Back Button ---- */}
      {showBack && (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-0.5 text-system-blue -ml-1 mr-2 shrink-0"
          aria-label="戻る"
        >
          <ChevronLeft size={28} strokeWidth={2} />
        </button>
      )}

      {/* ---- Title ---- */}
      <h1
        className={`
          flex-1 text-[17px] font-semibold text-text-primary truncate
          ${showBack ? "text-center pr-7" : "text-center"}
        `}
      >
        {title}
      </h1>
    </header>
  );
}
