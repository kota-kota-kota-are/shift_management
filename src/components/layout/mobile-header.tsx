"use client";

import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { logout } from "@/actions/auth";

type MobileHeaderProps = {
  staffName: string;
  role: "admin" | "staff";
};

export default function MobileHeader({ staffName, role }: MobileHeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="flex md:hidden items-center justify-between h-12 px-4 bg-bg-secondary/80 backdrop-blur-xl border-b border-separator sticky top-0 z-40">
      {/* User info */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`
            w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0
            ${role === "admin" ? "bg-system-purple" : "bg-system-blue"}
          `}
        >
          {staffName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-text-primary truncate">
            {staffName}
          </p>
        </div>
        <span
          className={`
            text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0
            ${role === "admin" ? "bg-system-orange/15 text-system-orange" : "bg-system-blue/15 text-system-blue"}
          `}
        >
          {role === "admin" ? "管理者" : "スタッフ"}
        </span>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-system-red hover:bg-system-red/10 active:bg-system-red/15 transition-colors duration-fast min-h-[44px]"
        aria-label="ログアウト"
      >
        <LogOut size={16} />
        <span className="text-[13px] font-medium">
          {loggingOut ? "..." : "ログアウト"}
        </span>
      </button>
    </header>
  );
}
