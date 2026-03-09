"use server";

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import type { ActionResult, SessionData, ErrorCode } from "@/types";
import { getSheetData } from "@/lib/google-sheets";
import { SHEET_NAMES } from "@/lib/constants";
import { sessionOptions } from "@/lib/session-options";
import { AUTH_STAFF_COL as STAFF_COL } from "./_columns";

// ============================================================
// login
// ============================================================

export async function login(
  formData: FormData,
): Promise<ActionResult<{ staffName: string; role: string }>> {
  try {
    // --- FormData から値を取得 ---
    const staffId = formData.get("staffId") as string | null;
    const pin = formData.get("pin") as string | null;

    // --- バリデーション ---
    if (!staffId || staffId.trim() === "") {
      return {
        success: false,
        error: "スタッフIDを指定してください",
        code: "VALIDATION_ERROR" as ErrorCode,
      };
    }

    if (!pin || pin.trim() === "") {
      return {
        success: false,
        error: "PINを入力してください",
        code: "VALIDATION_ERROR" as ErrorCode,
      };
    }

    if (!/^\d{4}$/.test(pin)) {
      return {
        success: false,
        error: "PINは4桁の数字で入力してください",
        code: "VALIDATION_ERROR" as ErrorCode,
      };
    }

    // --- Google Sheets からスタッフ検索 ---
    const rows = await getSheetData(SHEET_NAMES.STAFF);

    // 先頭行はヘッダーなのでスキップ
    const staffRow = rows.find(
      (row, index) => index > 0 && row[STAFF_COL.ID] === staffId,
    );

    if (!staffRow) {
      return {
        success: false,
        error: "スタッフが見つかりません",
        code: "NOT_FOUND" as ErrorCode,
      };
    }

    // --- isActive 確認 ---
    const isActive = staffRow[STAFF_COL.IS_ACTIVE];
    if (isActive !== "TRUE" && isActive !== "true" && isActive !== "1") {
      return {
        success: false,
        error: "このアカウントは無効化されています",
        code: "FORBIDDEN" as ErrorCode,
      };
    }

    // --- PIN 照合 ---
    const pinHash = staffRow[STAFF_COL.PIN_HASH];
    if (!pinHash) {
      return {
        success: false,
        error: "PINが設定されていません。管理者にお問い合わせください",
        code: "INTERNAL_ERROR" as ErrorCode,
      };
    }

    const isMatch = await bcrypt.compare(pin, pinHash);
    if (!isMatch) {
      return {
        success: false,
        error: "PINが正しくありません",
        code: "UNAUTHORIZED" as ErrorCode,
      };
    }

    // --- セッション設定 ---
    const staffName = staffRow[STAFF_COL.NAME] ?? "";
    const role = staffRow[STAFF_COL.ROLE] ?? "staff";

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions,
    );

    session.staffId = staffId;
    session.staffName = staffName;
    session.role = role as "admin" | "staff";
    session.isLoggedIn = true;
    await session.save();

    return {
      success: true,
      data: { staffName, role },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "ログイン処理中にエラーが発生しました",
      code: "INTERNAL_ERROR" as ErrorCode,
    };
  }
}

// ============================================================
// logout
// ============================================================

export async function logout(): Promise<ActionResult<null>> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions,
    );

    session.destroy();

    return { success: true, data: null };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "ログアウト処理中にエラーが発生しました",
      code: "INTERNAL_ERROR" as ErrorCode,
    };
  }
}

// ============================================================
// getSessionData
// ============================================================

export async function getSessionData(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions,
    );

    if (!session.isLoggedIn) {
      return null;
    }

    return {
      staffId: session.staffId,
      staffName: session.staffName,
      role: session.role,
      isLoggedIn: session.isLoggedIn,
    };
  } catch (error) {
    console.error("getSessionData error:", error);
    return null;
  }
}
