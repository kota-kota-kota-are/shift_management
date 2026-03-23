// ---------------------------------------------------------------------------
// Sheet Names
// ---------------------------------------------------------------------------
export const SHEET_NAMES = {
  STAFF: "スタッフ一覧",
  SHIFT_PATTERNS: "シフトパターン",
  SHIFT_REQUESTS: "シフト希望",
  CONFIRMED_SHIFTS: "確定シフト",
  STORE_SETTINGS: "店舗設定",
} as const;

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------
export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
} as const;

// ---------------------------------------------------------------------------
// Shift Status
// ---------------------------------------------------------------------------
export const SHIFT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------
export const AVAILABILITY = {
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  PREFERRED: "preferred",
} as const;

// ---------------------------------------------------------------------------
// Default Store Settings
// ---------------------------------------------------------------------------
export const DEFAULT_STORE_SETTINGS = {
  storeName: "店舗名",
  requestDeadlineDay: 20,
  targetMonthOffset: 1,
  businessStartTime: "09:00",
  businessEndTime: "23:00",
  minStaffPerSlot: 2,
  maxStaffPerSlot: 5,
  allowedStartTimes: ["09:00", "09:30", "10:00", "10:30", "11:00"],
  allowedEndTimes: ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
};

// ---------------------------------------------------------------------------
// Navigation Items
// ---------------------------------------------------------------------------
export const NAV_ITEMS_STAFF = [
  { label: "ホーム", href: "/", icon: "Home" },
  { label: "シフト希望", href: "/shift-request", icon: "CalendarPlus" },
  { label: "勤務表", href: "/schedule", icon: "CalendarDays" },
  { label: "ヘルプ", href: "/help", icon: "HelpCircle" },
] as const;

export const NAV_ITEMS_ADMIN = [
  { label: "ダッシュボード", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "シフト管理", href: "/admin/shifts", icon: "CalendarCog" },
  { label: "希望編集", href: "/admin/requests", icon: "ClipboardEdit" },
  { label: "スタッフ", href: "/admin/staff", icon: "Users" },
  { label: "勤務表", href: "/schedule", icon: "CalendarDays" },
  { label: "設定", href: "/admin/settings", icon: "Settings" },
  { label: "ヘルプ", href: "/help", icon: "HelpCircle" },
] as const;
