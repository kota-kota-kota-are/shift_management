// ============================================================
// Staff
// ============================================================

export type Staff = {
  id: string;
  name: string;
  role: "admin" | "staff";
  pinHash: string;
  displayOrder: number;
  isActive: boolean;
  weeklyMaxHours: number | null;
  createdAt: string;
  updatedAt: string;
};

export type StaffPublic = Omit<Staff, "pinHash">;

export type StaffCreateInput = {
  name: string;
  role: "admin" | "staff";
  pin: string;
  weeklyMaxHours?: number;
};

// ============================================================
// Shift Pattern
// ============================================================

export type ShiftPattern = {
  id: string;
  name: string;
  shortName: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  color: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
};

// ============================================================
// Shift Request
// ============================================================

export type Availability = "available" | "unavailable" | "preferred";

export type ShiftRequest = {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  patternId: string | null;
  availability: Availability;
  note: string | null;
  submittedAt: string;
  updatedAt: string;
};

export type ShiftRequestWithDetails = ShiftRequest & {
  staffName: string;
  patternName: string | null;
};

// ============================================================
// Confirmed Shift
// ============================================================

export type ShiftStatus = "draft" | "published";

export type ConfirmedShift = {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  patternId: string;
  status: ShiftStatus;
  adminNote: string | null;
  confirmedBy: string;
  confirmedAt: string;
  updatedAt: string;
};

export type ConfirmedShiftWithDetails = ConfirmedShift & {
  staffName: string;
  patternName: string;
  patternShortName: string;
  patternStartTime: string;
  patternEndTime: string;
  patternColor: string | null;
};

// ============================================================
// Store Settings
// ============================================================

export type StoreSetting = {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
};

export type StoreSettingKey =
  | "store_name"
  | "request_deadline_day"
  | "target_month_offset"
  | "business_start_time"
  | "business_end_time"
  | "min_staff_per_slot"
  | "max_staff_per_slot";

export type ParsedStoreSettings = {
  storeName: string;
  requestDeadlineDay: number;
  targetMonthOffset: number;
  businessStartTime: string;
  businessEndTime: string;
  minStaffPerSlot: number;
  maxStaffPerSlot: number;
};

// ============================================================
// Session
// ============================================================

export type SessionData = {
  staffId: string;
  staffName: string;
  role: "admin" | "staff";
  isLoggedIn: boolean;
};

// ============================================================
// Action Result
// ============================================================

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "SHEETS_ERROR"
  | "INTERNAL_ERROR";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCode };

// ============================================================
// Google Sheets
// ============================================================

export type SheetRow = string[];

export type SheetName =
  | "スタッフ一覧"
  | "シフトパターン"
  | "シフト希望"
  | "確定シフト"
  | "店舗設定";

// ============================================================
// Monthly Shift Request Input
// ============================================================

export type MonthlyShiftRequestInput = {
  staffId: string;
  yearMonth: string; // YYYY-MM
  requests: {
    date: string; // YYYY-MM-DD
    availability: Availability;
    patternId?: string;
    note?: string;
  }[];
};
