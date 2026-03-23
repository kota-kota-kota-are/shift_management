"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin, getSession } from "@/lib/auth";
import {
  getSheetData,
  appendRow,
  updateRow,
  findRowIndex,
  deleteRow,
} from "@/lib/google-sheets";
import { SHEET_NAMES } from "@/lib/constants";
import { generateId, nowISO } from "@/lib/utils";
import type {
  ActionResult,
  ShiftPattern,
  ShiftRequest,
  ShiftRequestWithDetails,
  ConfirmedShift,
  ConfirmedShiftWithDetails,
  MonthlyShiftRequestInput,
  Availability,
  ShiftStatus,
} from "@/types";
import { PAT, REQ, CONF, SHIFTS_STAFF as STAFF } from "./_columns";
import {
  rowToShiftPattern,
  rowToShiftRequest,
  rowToConfirmedShift,
} from "./_helpers";

// ============================================================
// 1. getShiftPatterns
// ============================================================

export async function getShiftPatterns(): Promise<
  ActionResult<ShiftPattern[]>
> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const rows = await getSheetData(SHEET_NAMES.SHIFT_PATTERNS);

    // ヘッダー行をスキップし、isActive=TRUE のみ
    const patterns = rows
      .slice(1)
      .filter((row) => row[PAT.IS_ACTIVE] === "TRUE")
      .map(rowToShiftPattern)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return { success: true, data: patterns };
  } catch (err) {
    console.error("getShiftPatterns error:", err);
    return {
      success: false,
      error: "シフトパターンの取得に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 2. createShiftPattern
// ============================================================

export async function createShiftPattern(
  formData: FormData,
): Promise<ActionResult<ShiftPattern>> {
  try {
    const adminResult = await requireAdmin();
    if (!adminResult.success) return adminResult;

    const name = formData.get("name") as string;
    const shortName = formData.get("shortName") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const breakMinutes = formData.get("breakMinutes") as string;
    const color = (formData.get("color") as string) || "";

    if (!name || !shortName || !startTime || !endTime) {
      return {
        success: false,
        error: "必須項目が入力されていません",
        code: "VALIDATION_ERROR",
      };
    }

    // displayOrder を既存の最大値 + 1 にする
    const rows = await getSheetData(SHEET_NAMES.SHIFT_PATTERNS);
    const maxOrder = rows.slice(1).reduce((max, row) => {
      const order = Number(row[PAT.DISPLAY_ORDER] ?? 0);
      return order > max ? order : max;
    }, 0);

    const id = generateId();
    const now = nowISO();

    const newRow = [
      id,
      name,
      shortName,
      startTime,
      endTime,
      breakMinutes || "0",
      color,
      String(maxOrder + 1),
      "TRUE",
      now,
    ];

    await appendRow(SHEET_NAMES.SHIFT_PATTERNS, newRow);

    revalidatePath("/admin/shifts");

    return {
      success: true,
      data: rowToShiftPattern(newRow),
    };
  } catch (err) {
    console.error("createShiftPattern error:", err);
    return {
      success: false,
      error: "シフトパターンの作成に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 3. updateShiftPattern
// ============================================================

export async function updateShiftPattern(
  formData: FormData,
): Promise<ActionResult<ShiftPattern>> {
  try {
    const adminResult = await requireAdmin();
    if (!adminResult.success) return adminResult;

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const shortName = formData.get("shortName") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const breakMinutes = formData.get("breakMinutes") as string;
    const color = (formData.get("color") as string) || "";

    if (!id || !name || !shortName || !startTime || !endTime) {
      return {
        success: false,
        error: "必須項目が入力されていません",
        code: "VALIDATION_ERROR",
      };
    }

    const rowIndex = await findRowIndex(
      SHEET_NAMES.SHIFT_PATTERNS,
      PAT.ID,
      id,
    );

    if (rowIndex === null) {
      return {
        success: false,
        error: "指定されたシフトパターンが見つかりません",
        code: "NOT_FOUND",
      };
    }

    // 既存行を取得して displayOrder, isActive, createdAt を保持
    const rows = await getSheetData(SHEET_NAMES.SHIFT_PATTERNS);
    const existingRow = rows[rowIndex + 1]; // +1 でヘッダー分オフセット

    const updatedRow = [
      id,
      name,
      shortName,
      startTime,
      endTime,
      breakMinutes || "0",
      color,
      existingRow?.[PAT.DISPLAY_ORDER] ?? "0",
      existingRow?.[PAT.IS_ACTIVE] ?? "TRUE",
      existingRow?.[PAT.CREATED_AT] ?? nowISO(),
    ];

    await updateRow(SHEET_NAMES.SHIFT_PATTERNS, rowIndex, updatedRow);

    revalidatePath("/admin/shifts");

    return {
      success: true,
      data: rowToShiftPattern(updatedRow),
    };
  } catch (err) {
    console.error("updateShiftPattern error:", err);
    return {
      success: false,
      error: "シフトパターンの更新に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 4. getShiftRequests
// ============================================================

export async function getShiftRequests(
  year: number,
  month: number,
): Promise<ActionResult<ShiftRequestWithDetails[]>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const session = authResult.data;
    const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

    // シフト希望・スタッフ一覧・シフトパターンを並行取得
    const [requestRows, staffRows, patternRows] = await Promise.all([
      getSheetData(SHEET_NAMES.SHIFT_REQUESTS),
      getSheetData(SHEET_NAMES.STAFF),
      getSheetData(SHEET_NAMES.SHIFT_PATTERNS),
    ]);

    // スタッフ名マップ
    const staffMap = new Map<string, string>();
    for (const row of staffRows.slice(1)) {
      staffMap.set(row[STAFF.ID], row[STAFF.NAME]);
    }

    // パターン名マップ
    const patternMap = new Map<string, string>();
    for (const row of patternRows.slice(1)) {
      patternMap.set(row[PAT.ID], row[PAT.NAME]);
    }

    // 該当月のリクエストをフィルタ
    const requests = requestRows
      .slice(1)
      .filter((row) => {
        const date = row[REQ.DATE] ?? "";
        if (!date.startsWith(yearMonth)) return false;
        // スタッフの場合は自分のデータのみ
        if (session.role !== "admin" && row[REQ.STAFF_ID] !== session.staffId) {
          return false;
        }
        return true;
      })
      .map((row): ShiftRequestWithDetails => {
        const request = rowToShiftRequest(row);
        return {
          ...request,
          staffName: staffMap.get(request.staffId) ?? "不明",
          patternName: request.patternId
            ? patternMap.get(request.patternId) ?? null
            : null,
        };
      });

    return { success: true, data: requests };
  } catch (err) {
    console.error("getShiftRequests error:", err);
    return {
      success: false,
      error: "シフト希望の取得に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 5. submitShiftRequests
// ============================================================

export async function submitShiftRequests(
  data: MonthlyShiftRequestInput,
): Promise<ActionResult<null>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const session = authResult.data;

    // セッションのstaffIdとdata.staffIdが一致するか確認
    if (session.staffId !== data.staffId) {
      return {
        success: false,
        error: "他のスタッフのシフト希望は提出できません",
        code: "FORBIDDEN",
      };
    }

    const yearMonth = data.yearMonth; // "YYYY-MM"

    // 既存の同月・同スタッフの希望を削除（後ろから削除してインデックスずれ防止）
    const rows = await getSheetData(SHEET_NAMES.SHIFT_REQUESTS);
    const deleteIndices: number[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const date = row[REQ.DATE] ?? "";
      if (row[REQ.STAFF_ID] === data.staffId && date.startsWith(yearMonth)) {
        deleteIndices.push(i - 1); // 0ベース（ヘッダー除く）
      }
    }

    // 後ろから削除してインデックスずれを防止
    for (let i = deleteIndices.length - 1; i >= 0; i--) {
      await deleteRow(SHEET_NAMES.SHIFT_REQUESTS, deleteIndices[i]);
    }

    // 新規追加
    const now = nowISO();
    for (const req of data.requests) {
      const newRow = [
        generateId(),
        data.staffId,
        req.date,
        req.patternId ?? "",
        req.customStartTime ?? "",
        req.customEndTime ?? "",
        req.availability,
        req.note ?? "",
        now,
        now,
      ];
      await appendRow(SHEET_NAMES.SHIFT_REQUESTS, newRow);
    }

    revalidatePath("/shift-request");
    revalidatePath("/admin/shifts");

    return { success: true, data: null };
  } catch (err) {
    console.error("submitShiftRequests error:", err);
    return {
      success: false,
      error: "シフト希望の提出に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 6. getConfirmedShifts
// ============================================================

export async function getConfirmedShifts(
  year: number,
  month: number,
): Promise<ActionResult<ConfirmedShiftWithDetails[]>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const session = authResult.data;
    const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

    // 確定シフト・スタッフ一覧・シフトパターンを並行取得
    const [confirmedRows, staffRows, patternRows] = await Promise.all([
      getSheetData(SHEET_NAMES.CONFIRMED_SHIFTS),
      getSheetData(SHEET_NAMES.STAFF),
      getSheetData(SHEET_NAMES.SHIFT_PATTERNS),
    ]);

    // スタッフ名マップ
    const staffMap = new Map<string, string>();
    for (const row of staffRows.slice(1)) {
      staffMap.set(row[STAFF.ID], row[STAFF.NAME]);
    }

    // パターン情報マップ
    const patternInfoMap = new Map<
      string,
      {
        name: string;
        shortName: string;
        startTime: string;
        endTime: string;
        color: string | null;
      }
    >();
    for (const row of patternRows.slice(1)) {
      patternInfoMap.set(row[PAT.ID], {
        name: row[PAT.NAME] ?? "",
        shortName: row[PAT.SHORT_NAME] ?? "",
        startTime: row[PAT.START_TIME] ?? "",
        endTime: row[PAT.END_TIME] ?? "",
        color: row[PAT.COLOR] || null,
      });
    }

    // 該当月の確定シフトをフィルタ
    const shifts = confirmedRows
      .slice(1)
      .filter((row) => {
        const date = row[CONF.DATE] ?? "";
        if (!date.startsWith(yearMonth)) return false;

        // スタッフの場合は published のみ
        if (session.role !== "admin") {
          if (row[CONF.STATUS] !== "published") return false;
        }

        return true;
      })
      .map((row): ConfirmedShiftWithDetails => {
        const shift = rowToConfirmedShift(row);
        const patternInfo = patternInfoMap.get(shift.patternId);
        return {
          ...shift,
          staffName: staffMap.get(shift.staffId) ?? "不明",
          patternName: patternInfo?.name ?? "不明",
          patternShortName: patternInfo?.shortName ?? "",
          patternStartTime: patternInfo?.startTime ?? "",
          patternEndTime: patternInfo?.endTime ?? "",
          patternColor: patternInfo?.color ?? null,
          effectiveStartTime: shift.customStartTime || patternInfo?.startTime || "",
          effectiveEndTime: shift.customEndTime || patternInfo?.endTime || "",
        };
      });

    return { success: true, data: shifts };
  } catch (err) {
    console.error("getConfirmedShifts error:", err);
    return {
      success: false,
      error: "確定シフトの取得に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 7. saveConfirmedShifts
// ============================================================

export async function saveConfirmedShifts(
  shifts: { staffId: string; date: string; patternId: string; customStartTime?: string; customEndTime?: string }[],
  yearMonth: string,
): Promise<ActionResult<null>> {
  try {
    const adminResult = await requireAdmin();
    if (!adminResult.success) return adminResult;

    const session = adminResult.data;

    // 既存の同月確定シフトを削除（後ろから）
    const rows = await getSheetData(SHEET_NAMES.CONFIRMED_SHIFTS);
    const deleteIndices: number[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const date = row[CONF.DATE] ?? "";
      if (date.startsWith(yearMonth)) {
        deleteIndices.push(i - 1);
      }
    }

    for (let i = deleteIndices.length - 1; i >= 0; i--) {
      await deleteRow(SHEET_NAMES.CONFIRMED_SHIFTS, deleteIndices[i]);
    }

    // 新規追加
    const now = nowISO();
    for (const shift of shifts) {
      const newRow = [
        generateId(),
        shift.staffId,
        shift.date,
        shift.patternId,
        shift.customStartTime ?? "",
        shift.customEndTime ?? "",
        "draft",
        "",
        session.staffId,
        now,
        now,
      ];
      await appendRow(SHEET_NAMES.CONFIRMED_SHIFTS, newRow);
    }

    revalidatePath("/admin/shifts");
    revalidatePath("/schedule");

    return { success: true, data: null };
  } catch (err) {
    console.error("saveConfirmedShifts error:", err);
    return {
      success: false,
      error: "確定シフトの保存に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 8. getShiftRequestStatus - スタッフの月別希望提出状況
// ============================================================

export async function getShiftRequestStatus(
  yearMonth: string,
  staffId: string,
): Promise<ActionResult<{ submitted: boolean; count: number }>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const rows = await getSheetData(SHEET_NAMES.SHIFT_REQUESTS);

    const requests = rows.slice(1).filter((row) => {
      const date = row[REQ.DATE] ?? "";
      return date.startsWith(yearMonth) && row[REQ.STAFF_ID] === staffId;
    });

    return {
      success: true,
      data: {
        submitted: requests.length > 0,
        count: requests.length,
      },
    };
  } catch (err) {
    console.error("getShiftRequestStatus error:", err);
    return {
      success: false,
      error: "シフト希望の取得に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 9. publishShifts
// ============================================================

export async function publishShifts(
  yearMonth: string,
): Promise<ActionResult<{ count: number }>> {
  try {
    const adminResult = await requireAdmin();
    if (!adminResult.success) return adminResult;

    const rows = await getSheetData(SHEET_NAMES.CONFIRMED_SHIFTS);
    const now = nowISO();
    let count = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const date = row[CONF.DATE] ?? "";

      if (date.startsWith(yearMonth) && row[CONF.STATUS] !== "published") {
        const updatedRow = [...row];
        updatedRow[CONF.STATUS] = "published";
        updatedRow[CONF.UPDATED_AT] = now;
        await updateRow(SHEET_NAMES.CONFIRMED_SHIFTS, i - 1, updatedRow);
        count++;
      }
    }

    revalidatePath("/schedule");
    revalidatePath("/admin/shifts");
    revalidatePath("/");

    return { success: true, data: { count } };
  } catch (err) {
    console.error("publishShifts error:", err);
    return {
      success: false,
      error: "シフトの公開に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}

// ============================================================
// 10. adminUpdateShiftRequest - 管理者によるシフト希望の編集
// ============================================================

export async function adminUpdateShiftRequest(
  requestId: string,
  updates: {
    availability?: Availability;
    patternId?: string | null;
    customStartTime?: string | null;
    customEndTime?: string | null;
    note?: string | null;
  },
): Promise<ActionResult<null>> {
  try {
    const adminResult = await requireAdmin();
    if (!adminResult.success) return adminResult;

    const rowIndex = await findRowIndex(
      SHEET_NAMES.SHIFT_REQUESTS,
      REQ.ID,
      requestId,
    );

    if (rowIndex === null) {
      return {
        success: false,
        error: "指定されたシフト希望が見つかりません",
        code: "NOT_FOUND",
      };
    }

    const rows = await getSheetData(SHEET_NAMES.SHIFT_REQUESTS);
    const existingRow = rows[rowIndex + 1];
    if (!existingRow) {
      return {
        success: false,
        error: "データの取得に失敗しました",
        code: "INTERNAL_ERROR",
      };
    }

    const now = nowISO();
    const updatedRow = [...existingRow];

    if (updates.availability !== undefined) {
      updatedRow[REQ.AVAILABILITY] = updates.availability;
    }
    if (updates.patternId !== undefined) {
      updatedRow[REQ.PATTERN_ID] = updates.patternId ?? "";
    }
    if (updates.customStartTime !== undefined) {
      updatedRow[REQ.CUSTOM_START_TIME] = updates.customStartTime ?? "";
    }
    if (updates.customEndTime !== undefined) {
      updatedRow[REQ.CUSTOM_END_TIME] = updates.customEndTime ?? "";
    }
    if (updates.note !== undefined) {
      updatedRow[REQ.NOTE] = updates.note ?? "";
    }
    updatedRow[REQ.UPDATED_AT] = now;

    await updateRow(SHEET_NAMES.SHIFT_REQUESTS, rowIndex, updatedRow);

    revalidatePath("/admin/requests");
    revalidatePath("/admin/shifts");

    return { success: true, data: null };
  } catch (err) {
    console.error("adminUpdateShiftRequest error:", err);
    return {
      success: false,
      error: "シフト希望の更新に失敗しました",
      code: "SHEETS_ERROR",
    };
  }
}
