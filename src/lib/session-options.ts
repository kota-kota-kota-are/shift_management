import type { SessionOptions } from "iron-session";

export const sessionOptions: SessionOptions = {
  cookieName: "shift_session",
  password: process.env.SESSION_SECRET || "shift-management-default-secret-key-32chars!",
  ttl: 28800, // 8時間
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },
};
