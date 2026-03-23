// ---------------------------------------------------------------------------
// Helper functions for action files
// Separated from "use server" files to avoid Turbopack build errors.
// ---------------------------------------------------------------------------

import type {
  StaffPublic,
  ShiftPattern,
  ShiftRequest,
  ConfirmedShift,
  Availability,
  ShiftStatus,
  ParsedStoreSettings,
  StoreSettingKey,
} from "@/types";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import {
  STAFF_COL,
  PAT,
  REQ,
  CONF,
  SETTINGS_COL,
} from "./_columns";

// ---------------------------------------------------------------------------
// staff.ts helpers
// ---------------------------------------------------------------------------

export function rowToStaffPublic(row: string[]): StaffPublic {
  return {
    id: row[STAFF_COL.ID] ?? "",
    name: row[STAFF_COL.NAME] ?? "",
    role: (row[STAFF_COL.ROLE] as "admin" | "staff") ?? "staff",
    displayOrder: Number(row[STAFF_COL.DISPLAY_ORDER] ?? "0"),
    isActive: row[STAFF_COL.IS_ACTIVE] === "TRUE",
    weeklyMaxHours: row[STAFF_COL.WEEKLY_MAX_HOURS]
      ? Number(row[STAFF_COL.WEEKLY_MAX_HOURS])
      : null,
    createdAt: row[STAFF_COL.CREATED_AT] ?? "",
    updatedAt: row[STAFF_COL.UPDATED_AT] ?? "",
  };
}

// ---------------------------------------------------------------------------
// shifts.ts helpers
// ---------------------------------------------------------------------------

export function rowToShiftPattern(row: string[]): ShiftPattern {
  return {
    id: row[PAT.ID] ?? "",
    name: row[PAT.NAME] ?? "",
    shortName: row[PAT.SHORT_NAME] ?? "",
    startTime: row[PAT.START_TIME] ?? "",
    endTime: row[PAT.END_TIME] ?? "",
    breakMinutes: Number(row[PAT.BREAK_MINUTES] ?? 0),
    color: row[PAT.COLOR] || null,
    displayOrder: Number(row[PAT.DISPLAY_ORDER] ?? 0),
    isActive: row[PAT.IS_ACTIVE] === "TRUE",
    createdAt: row[PAT.CREATED_AT] ?? "",
  };
}

export function rowToShiftRequest(row: string[]): ShiftRequest {
  return {
    id: row[REQ.ID] ?? "",
    staffId: row[REQ.STAFF_ID] ?? "",
    date: row[REQ.DATE] ?? "",
    patternId: row[REQ.PATTERN_ID] || null,
    customStartTime: row[REQ.CUSTOM_START_TIME] || null,
    customEndTime: row[REQ.CUSTOM_END_TIME] || null,
    availability: (row[REQ.AVAILABILITY] ?? "available") as Availability,
    note: row[REQ.NOTE] || null,
    submittedAt: row[REQ.SUBMITTED_AT] ?? "",
    updatedAt: row[REQ.UPDATED_AT] ?? "",
  };
}

export function rowToConfirmedShift(row: string[]): ConfirmedShift {
  return {
    id: row[CONF.ID] ?? "",
    staffId: row[CONF.STAFF_ID] ?? "",
    date: row[CONF.DATE] ?? "",
    patternId: row[CONF.PATTERN_ID] ?? "",
    customStartTime: row[CONF.CUSTOM_START_TIME] || null,
    customEndTime: row[CONF.CUSTOM_END_TIME] || null,
    status: (row[CONF.STATUS] ?? "draft") as ShiftStatus,
    adminNote: row[CONF.ADMIN_NOTE] || null,
    confirmedBy: row[CONF.CONFIRMED_BY] ?? "",
    confirmedAt: row[CONF.CONFIRMED_AT] ?? "",
    updatedAt: row[CONF.UPDATED_AT] ?? "",
  };
}

// ---------------------------------------------------------------------------
// settings.ts helpers
// ---------------------------------------------------------------------------

export function getKeyDescription(key: StoreSettingKey): string {
  const descriptions: Record<StoreSettingKey, string> = {
    store_name: "店舗名",
    request_deadline_day: "シフト希望提出期限日（毎月N日）",
    target_month_offset: "対象月オフセット（何ヶ月先を対象にするか）",
    business_start_time: "営業開始時刻",
    business_end_time: "営業終了時刻",
    min_staff_per_slot: "時間帯あたり最小スタッフ数",
    max_staff_per_slot: "時間帯あたり最大スタッフ数",
    allowed_start_times: "選択可能な出勤時刻（カンマ区切り）",
    allowed_end_times: "選択可能な退勤時刻（カンマ区切り）",
  };
  return descriptions[key] ?? "";
}

export function parseSettings(rows: string[][]): ParsedStoreSettings {
  const map = new Map<string, string>();

  // 先頭行はヘッダーなのでスキップ
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row[SETTINGS_COL.KEY]) {
      map.set(row[SETTINGS_COL.KEY], row[SETTINGS_COL.VALUE] ?? "");
    }
  }

  return {
    storeName:
      map.get("store_name") || DEFAULT_STORE_SETTINGS.storeName,
    requestDeadlineDay:
      Number(map.get("request_deadline_day")) ||
      DEFAULT_STORE_SETTINGS.requestDeadlineDay,
    targetMonthOffset:
      Number(map.get("target_month_offset")) ||
      DEFAULT_STORE_SETTINGS.targetMonthOffset,
    businessStartTime:
      map.get("business_start_time") ||
      DEFAULT_STORE_SETTINGS.businessStartTime,
    businessEndTime:
      map.get("business_end_time") ||
      DEFAULT_STORE_SETTINGS.businessEndTime,
    minStaffPerSlot:
      Number(map.get("min_staff_per_slot")) ||
      DEFAULT_STORE_SETTINGS.minStaffPerSlot,
    maxStaffPerSlot:
      Number(map.get("max_staff_per_slot")) ||
      DEFAULT_STORE_SETTINGS.maxStaffPerSlot,
    allowedStartTimes: (map.get("allowed_start_times") || "09:00,09:30,10:00,10:30,11:00")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    allowedEndTimes: (map.get("allowed_end_times") || "15:00,16:00,17:00,18:00,19:00,20:00,21:00,22:00")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}
