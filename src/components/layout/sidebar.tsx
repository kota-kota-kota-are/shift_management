"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarPlus,
  CalendarDays,
  LayoutDashboard,
  CalendarCog,
  ClipboardEdit,
  Users,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { NAV_ITEMS_STAFF, NAV_ITEMS_ADMIN } from "@/lib/constants";
import { logout } from "@/actions/auth";

// ---------------------------------------------------------------------------
// Icon Map
// ---------------------------------------------------------------------------
const ICON_MAP = {
  Home,
  CalendarPlus,
  CalendarDays,
  LayoutDashboard,
  CalendarCog,
  ClipboardEdit,
  Users,
  Settings,
  HelpCircle,
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
type SidebarProps = {
  staffName: string;
  role: "admin" | "staff";
};

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
export default function Sidebar({ staffName, role }: SidebarProps) {
  const currentPath = usePathname();
  const navItems = role === "admin" ? NAV_ITEMS_ADMIN : NAV_ITEMS_STAFF;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 w-[260px] h-screen bg-bg-secondary/80 backdrop-blur-xl border-r border-separator z-40">
      {/* ---- App Title ---- */}
      <div className="flex items-center h-14 px-5 border-b border-separator">
        <h1 className="text-[17px] font-semibold tracking-tight text-text-primary">
          シフト管理
        </h1>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
            const isActive =
              item.href === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[15px] font-medium
                    transition-colors duration-[200ms]
                    ${
                      isActive
                        ? "bg-system-blue/10 text-system-blue border-l-[3px] border-system-blue pl-[9px]"
                        : "text-text-primary hover:bg-bg-tertiary"
                    }
                  `}
                >
                  {Icon && (
                    <Icon
                      size={20}
                      className={isActive ? "text-system-blue" : "text-text-secondary"}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---- User Info + Logout ---- */}
      <div className="border-t border-separator px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar circle */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-system-blue/10 text-system-blue text-[13px] font-semibold shrink-0">
              {staffName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-text-primary truncate">
                {staffName}
              </p>
              <span
                className={`
                  inline-block text-[11px] font-medium px-1.5 py-0.5 rounded-full
                  ${
                    role === "admin"
                      ? "bg-system-orange/15 text-system-orange"
                      : "bg-system-blue/15 text-system-blue"
                  }
                `}
              >
                {role === "admin" ? "管理者" : "スタッフ"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-[10px] text-text-secondary hover:bg-bg-tertiary hover:text-system-red transition-colors duration-[200ms]"
            aria-label="ログアウト"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
