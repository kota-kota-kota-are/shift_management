"use server";

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import type { SessionData, ActionResult } from "@/types";
import { sessionOptions } from "@/lib/session-options";

// ============================================================
// getSession - セッション取得
// ============================================================

export async function getSession(): Promise<SessionData | null> {
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
}

// ============================================================
// requireAuth - 認証必須
// ============================================================

export async function requireAuth(): Promise<
  ActionResult<SessionData>
> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "ログインが必要です",
      code: "UNAUTHORIZED",
    };
  }

  return { success: true, data: session };
}

// ============================================================
// requireAdmin - 管理者権限必須
// ============================================================

export async function requireAdmin(): Promise<
  ActionResult<SessionData>
> {
  const authResult = await requireAuth();

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.data.role !== "admin") {
    return {
      success: false,
      error: "管理者権限が必要です",
      code: "FORBIDDEN",
    };
  }

  return authResult;
}
