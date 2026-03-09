"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult, ParsedStoreSettings, StoreSettingKey } from "@/types";
import { requireAuth, requireAdmin } from "@/lib/auth";
import {
  getSheetData,
  appendRow,
  updateRow,
} from "@/lib/google-sheets";
import { SHEET_NAMES, DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { nowISO } from "@/lib/utils";
import { SETTINGS_COL as COL } from "./_columns";
import { getKeyDescription, parseSettings } from "./_helpers";

// ============================================================
// 1. getStoreSettings
// ============================================================

export async function getStoreSettings(): Promise<
  ActionResult<ParsedStoreSettings>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  try {
    const data = await getSheetData(SHEET_NAMES.STORE_SETTINGS);

    // データがヘッダー行のみ or 空の場合はデフォルト値を返す
    if (data.length <= 1) {
      return {
        success: true,
        data: { ...DEFAULT_STORE_SETTINGS },
      };
    }

    return {
      success: true,
      data: parseSettings(data),
    };
  } catch (error) {
    return {
      success: false,
      error: `店舗設定の取得に失敗しました: ${String(error)}`,
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 2. updateStoreSettings
// ============================================================

export async function updateStoreSettings(
  formData: FormData,
): Promise<ActionResult<null>> {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult;

  // --- FormData から設定値を取得 ---
  const settings: { key: StoreSettingKey; value: string }[] = [
    {
      key: "store_name",
      value: (formData.get("storeName") as string | null)?.trim() ?? "",
    },
    {
      key: "business_start_time",
      value: (formData.get("businessStartTime") as string | null) ?? "",
    },
    {
      key: "business_end_time",
      value: (formData.get("businessEndTime") as string | null) ?? "",
    },
    {
      key: "request_deadline_day",
      value: (formData.get("requestDeadlineDay") as string | null) ?? "",
    },
    {
      key: "target_month_offset",
      value: (formData.get("targetMonthOffset") as string | null) ?? "",
    },
    {
      key: "min_staff_per_slot",
      value: (formData.get("minStaffPerSlot") as string | null) ?? "",
    },
    {
      key: "max_staff_per_slot",
      value: (formData.get("maxStaffPerSlot") as string | null) ?? "",
    },
  ];

  // --- バリデーション ---
  const storeName = settings.find((s) => s.key === "store_name")?.value ?? "";
  if (!storeName) {
    return {
      success: false,
      error: "店舗名を入力してください",
      code: "VALIDATION_ERROR",
    };
  }

  const deadlineDay = Number(
    settings.find((s) => s.key === "request_deadline_day")?.value,
  );
  if (isNaN(deadlineDay) || deadlineDay < 1 || deadlineDay > 28) {
    return {
      success: false,
      error: "提出期限日は1〜28の範囲で入力してください",
      code: "VALIDATION_ERROR",
    };
  }

  const offset = Number(
    settings.find((s) => s.key === "target_month_offset")?.value,
  );
  if (isNaN(offset) || offset < 1 || offset > 3) {
    return {
      success: false,
      error: "対象月オフセットは1〜3の範囲で入力してください",
      code: "VALIDATION_ERROR",
    };
  }

  const minStaff = Number(
    settings.find((s) => s.key === "min_staff_per_slot")?.value,
  );
  const maxStaff = Number(
    settings.find((s) => s.key === "max_staff_per_slot")?.value,
  );
  if (isNaN(minStaff) || minStaff < 0) {
    return {
      success: false,
      error: "最小人数は0以上の数値で入力してください",
      code: "VALIDATION_ERROR",
    };
  }
  if (isNaN(maxStaff) || maxStaff < 1) {
    return {
      success: false,
      error: "最大人数は1以上の数値で入力してください",
      code: "VALIDATION_ERROR",
    };
  }
  if (minStaff > maxStaff) {
    return {
      success: false,
      error: "最小人数は最大人数以下にしてください",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // 既存データを取得
    const data = await getSheetData(SHEET_NAMES.STORE_SETTINGS);
    const now = nowISO();

    // 既存キーの行インデックスマップ（ヘッダー除く 0ベース）
    const existingKeyMap = new Map<string, number>();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row[COL.KEY]) {
        existingKeyMap.set(row[COL.KEY], i - 1);
      }
    }

    // 各設定を更新 or 追加
    for (const { key, value } of settings) {
      const rowValues = [
        key,
        value,
        getKeyDescription(key),
        now,
      ];

      const existingIndex = existingKeyMap.get(key);
      if (existingIndex !== undefined) {
        await updateRow(SHEET_NAMES.STORE_SETTINGS, existingIndex, rowValues);
      } else {
        await appendRow(SHEET_NAMES.STORE_SETTINGS, rowValues);
      }
    }

    revalidatePath("/admin/settings");

    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: `店舗設定の更新に失敗しました: ${String(error)}`,
      code: "SHEETS_ERROR",
    };
  }
}
