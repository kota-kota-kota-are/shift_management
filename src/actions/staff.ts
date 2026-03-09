"use server";

import { revalidatePath } from "next/cache";
import bcryptjs from "bcryptjs";
import type { ActionResult, StaffPublic } from "@/types";
import { requireAuth, requireAdmin } from "@/lib/auth";
import {
  getSheetData,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/lib/google-sheets";
import { SHEET_NAMES } from "@/lib/constants";
import { generateId, nowISO } from "@/lib/utils";
import { STAFF_COL as COL } from "./_columns";
import { rowToStaffPublic } from "./_helpers";

// ============================================================
// 1. getStaffList
// ============================================================

export async function getStaffList(): Promise<ActionResult<StaffPublic[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  try {
    const data = await getSheetData(SHEET_NAMES.STAFF);
    // 先頭行はヘッダー
    const rows = data.slice(1);

    const isAdmin = authResult.data.role === "admin";

    const staffList: StaffPublic[] = rows
      .filter((row) => isAdmin || row[COL.IS_ACTIVE] === "TRUE")
      .map(rowToStaffPublic);

    return { success: true, data: staffList };
  } catch (error) {
    return {
      success: false,
      error: `スタッフ一覧の取得に失敗しました: ${String(error)}`,
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 2. getStaffForLogin
// ============================================================

export async function getStaffForLogin(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  try {
    const data = await getSheetData(SHEET_NAMES.STAFF);
    const rows = data.slice(1);

    const staffList = rows
      .filter((row) => row[COL.IS_ACTIVE] === "TRUE")
      .map((row) => ({
        id: row[COL.ID] ?? "",
        name: row[COL.NAME] ?? "",
      }));

    return { success: true, data: staffList };
  } catch (error) {
    return {
      success: false,
      error: `スタッフ一覧の取得に失敗しました: ${String(error)}`,
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 3. createStaff
// ============================================================

export async function createStaff(
  formData: FormData,
): Promise<ActionResult<StaffPublic>> {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult;

  // --- FormData から取得 ---
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const pin = (formData.get("pin") as string | null) ?? "";
  const role = (formData.get("role") as string | null) ?? "staff";
  const weeklyMaxHoursRaw = formData.get("weeklyMaxHours") as string | null;

  // --- バリデーション ---
  if (!name) {
    return {
      success: false,
      error: "名前を入力してください",
      code: "VALIDATION_ERROR",
    };
  }

  if (!/^\d{4}$/.test(pin)) {
    return {
      success: false,
      error: "PINは4桁の数字で入力してください",
      code: "VALIDATION_ERROR",
    };
  }

  if (role !== "admin" && role !== "staff") {
    return {
      success: false,
      error: "役割はadminまたはstaffを指定してください",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    // --- 名前重複チェック ---
    const data = await getSheetData(SHEET_NAMES.STAFF);
    const rows = data.slice(1);
    const duplicate = rows.find((row) => row[COL.NAME] === name);
    if (duplicate) {
      return {
        success: false,
        error: "同じ名前のスタッフが既に存在します",
        code: "CONFLICT",
      };
    }

    // --- ハッシュ化 & ID生成 ---
    const pinHash = await bcryptjs.hash(pin, 10);
    const id = generateId();
    const now = nowISO();
    const displayOrder = String(rows.length + 1);
    const weeklyMaxHours = weeklyMaxHoursRaw ? weeklyMaxHoursRaw : "";

    const newRow = [
      id,
      name,
      role,
      pinHash,
      displayOrder,
      "TRUE",
      weeklyMaxHours,
      now,
      now,
    ];

    await appendRow(SHEET_NAMES.STAFF, newRow);

    revalidatePath("/admin/staff");

    const staffPublic: StaffPublic = {
      id,
      name,
      role: role as "admin" | "staff",
      displayOrder: Number(displayOrder),
      isActive: true,
      weeklyMaxHours: weeklyMaxHours ? Number(weeklyMaxHours) : null,
      createdAt: now,
      updatedAt: now,
    };

    return { success: true, data: staffPublic };
  } catch (error) {
    return {
      success: false,
      error: `スタッフの作成に失敗しました: ${String(error)}`,
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 4. updateStaff
// ============================================================

export async function updateStaff(
  formData: FormData,
): Promise<ActionResult<StaffPublic>> {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult;

  const id = (formData.get("id") as string | null) ?? "";
  if (!id) {
    return {
      success: false,
      error: "スタッフIDが指定されていません",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const rowIndex = await findRowIndex(SHEET_NAMES.STAFF, COL.ID, id);
    if (rowIndex === null) {
      return {
        success: false,
        error: "スタッフが見つかりません",
        code: "NOT_FOUND",
      };
    }

    // 現在の行データを取得
    const data = await getSheetData(SHEET_NAMES.STAFF);
    const currentRow = data[rowIndex + 1]; // +1 でヘッダー分をオフセット
    if (!currentRow) {
      return {
        success: false,
        error: "スタッフデータの取得に失敗しました",
        code: "NOT_FOUND",
      };
    }

    // FormData から取得（指定されたフィールドのみ上書き）
    const name = formData.has("name")
      ? ((formData.get("name") as string)?.trim() ?? currentRow[COL.NAME])
      : currentRow[COL.NAME];
    const role = formData.has("role")
      ? (formData.get("role") as string) ?? currentRow[COL.ROLE]
      : currentRow[COL.ROLE];
    const weeklyMaxHours = formData.has("weeklyMaxHours")
      ? (formData.get("weeklyMaxHours") as string) ?? currentRow[COL.WEEKLY_MAX_HOURS]
      : currentRow[COL.WEEKLY_MAX_HOURS] ?? "";
    const isActive = formData.has("isActive")
      ? (formData.get("isActive") as string) === "true"
        ? "TRUE"
        : "FALSE"
      : currentRow[COL.IS_ACTIVE] ?? "TRUE";

    const now = nowISO();

    const updatedRow = [
      currentRow[COL.ID],
      name,
      role,
      currentRow[COL.PIN_HASH],
      currentRow[COL.DISPLAY_ORDER] ?? "0",
      isActive,
      weeklyMaxHours,
      currentRow[COL.CREATED_AT],
      now,
    ];

    await updateRow(SHEET_NAMES.STAFF, rowIndex, updatedRow);

    revalidatePath("/admin/staff");

    return {
      success: true,
      data: rowToStaffPublic(updatedRow),
    };
  } catch (error) {
    return {
      success: false,
      error: `スタッフの更新に失敗しました: ${String(error)}`,
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 5. resetPin
// ============================================================

export async function resetPin(
  staffId: string,
  newPin: string,
): Promise<ActionResult<null>> {
  const adminResult = await requireAdmin();
  if (!adminResult.success) return adminResult;

  // --- バリデーション ---
  if (!/^\d{4}$/.test(newPin)) {
    return {
      success: false,
      error: "PINは4桁の数字で入力してください",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const rowIndex = await findRowIndex(SHEET_NAMES.STAFF, COL.ID, staffId);
    if (rowIndex === null) {
      return {
        success: false,
        error: "スタッフが見つかりません",
        code: "NOT_FOUND",
      };
    }

    // 現在の行データを取得
    const data = await getSheetData(SHEET_NAMES.STAFF);
    const currentRow = data[rowIndex + 1];
    if (!currentRow) {
      return {
        success: false,
        error: "スタッフデータの取得に失敗しました",
        code: "NOT_FOUND",
      };
    }

    const pinHash = await bcryptjs.hash(newPin, 10);
    const now = nowISO();

    const updatedRow = [
      currentRow[COL.ID],
      currentRow[COL.NAME],
      currentRow[COL.ROLE],
      pinHash,
      currentRow[COL.DISPLAY_ORDER] ?? "0",
      currentRow[COL.IS_ACTIVE] ?? "TRUE",
      currentRow[COL.WEEKLY_MAX_HOURS] ?? "",
      currentRow[COL.CREATED_AT],
      now,
    ];

    await updateRow(SHEET_NAMES.STAFF, rowIndex, updatedRow);

    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: `PINのリセットに失敗しました: ${String(error)}`,
      code: "SHEETS_ERROR",
    };
  }
}
