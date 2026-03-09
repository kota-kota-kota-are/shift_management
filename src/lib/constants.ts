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
} as const;

// ---------------------------------------------------------------------------
// Navigation Items
// ---------------------------------------------------------------------------
export const NAV_ITEMS_STAFF = [
  { label: "ホーム", href: "/", icon: "Home" },
  { label: "シフト希望", href: "/shift-request", icon: "CalendarPlus" },
  { label: "勤務表", href: "/schedule", icon: "CalendarDays" },
] as const;

export const NAV_ITEMS_ADMIN = [
  { label: "ダッシュボード", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "シフト管理", href: "/admin/shifts", icon: "CalendarCog" },
  { label: "スタッフ", href: "/admin/staff", icon: "Users" },
  { label: "勤務表", href: "/schedule", icon: "CalendarDays" },
  { label: "設定", href: "/admin/settings", icon: "Settings" },
] as const;
