// ---------------------------------------------------------------------------
// Column index constants for Google Sheets
// Separated from "use server" files to avoid Turbopack build errors.
// ("use server" files can only export async functions, not objects/constants)
// ---------------------------------------------------------------------------

// auth.ts: スタッフ一覧シートのカラムインデックス
export const AUTH_STAFF_COL = {
  ID: 0,
  NAME: 1,
  ROLE: 2,
  PIN_HASH: 3,
  DISPLAY_ORDER: 4,
  IS_ACTIVE: 5,
  WEEKLY_MAX_HOURS: 6,
  CREATED_AT: 7,
  UPDATED_AT: 8,
} as const;

// staff.ts: スタッフ一覧カラムインデックス
export const STAFF_COL = {
  ID: 0,
  NAME: 1,
  ROLE: 2,
  PIN_HASH: 3,
  DISPLAY_ORDER: 4,
  IS_ACTIVE: 5,
  WEEKLY_MAX_HOURS: 6,
  CREATED_AT: 7,
  UPDATED_AT: 8,
} as const;

// shifts.ts: シフトパターンカラム
export const PAT = {
  ID: 0,
  NAME: 1,
  SHORT_NAME: 2,
  START_TIME: 3,
  END_TIME: 4,
  BREAK_MINUTES: 5,
  COLOR: 6,
  DISPLAY_ORDER: 7,
  IS_ACTIVE: 8,
  CREATED_AT: 9,
} as const;

// shifts.ts: シフト希望カラム
export const REQ = {
  ID: 0,
  STAFF_ID: 1,
  DATE: 2,
  PATTERN_ID: 3,
  AVAILABILITY: 4,
  NOTE: 5,
  SUBMITTED_AT: 6,
  UPDATED_AT: 7,
} as const;

// shifts.ts: 確定シフトカラム
export const CONF = {
  ID: 0,
  STAFF_ID: 1,
  DATE: 2,
  PATTERN_ID: 3,
  STATUS: 4,
  ADMIN_NOTE: 5,
  CONFIRMED_BY: 6,
  CONFIRMED_AT: 7,
  UPDATED_AT: 8,
} as const;

// shifts.ts: スタッフ一覧カラム（名前取得用）
export const SHIFTS_STAFF = {
  ID: 0,
  NAME: 1,
} as const;

// settings.ts: 店舗設定カラム
export const SETTINGS_COL = {
  KEY: 0,
  VALUE: 1,
  DESCRIPTION: 2,
  UPDATED_AT: 3,
} as const;
