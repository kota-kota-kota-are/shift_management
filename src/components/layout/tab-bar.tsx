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
} from "lucide-react";
import { NAV_ITEMS_STAFF, NAV_ITEMS_ADMIN } from "@/lib/constants";

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
// Tab items per role (limit to fit mobile)
// ---------------------------------------------------------------------------
const TAB_ITEMS_STAFF = NAV_ITEMS_STAFF;

const TAB_ITEMS_ADMIN = [
  NAV_ITEMS_ADMIN[0], // ダッシュボード
  NAV_ITEMS_ADMIN[1], // シフト管理
  NAV_ITEMS_ADMIN[2], // 希望編集
  NAV_ITEMS_ADMIN[4], // 勤務表
  NAV_ITEMS_ADMIN[5], // 設定
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
type TabBarProps = {
  role: "admin" | "staff";
};

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------
export default function TabBar({ role }: TabBarProps) {
  const currentPath = usePathname();
  const items = role === "admin" ? TAB_ITEMS_ADMIN : TAB_ITEMS_STAFF;

  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 w-full bg-bg-secondary/80 backdrop-blur-xl border-t border-separator z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.map((item) => {
        const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
        const isActive =
          item.href === "/"
            ? currentPath === "/"
            : currentPath.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center justify-center flex-1 pt-2 pb-1.5 gap-0.5
              transition-colors duration-[200ms]
              ${isActive ? "text-system-blue" : "text-text-secondary"}
            `}
          >
            {Icon && <Icon size={24} strokeWidth={isActive ? 2.2 : 1.8} />}
            <span className="text-[10px] font-medium leading-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
