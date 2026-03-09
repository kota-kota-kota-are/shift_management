import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

interface SessionData {
  staffId: string;
  staffName: string;
  role: "admin" | "staff";
  isLoggedIn: boolean;
}

const sessionOptions = {
  cookieName: "shift_session",
  password: process.env.SESSION_SECRET || "shift-management-default-secret-key-32chars!",
  ttl: 28800,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  const isLoggedIn = session.isLoggedIn === true;
  const isAdmin = session.role === "admin";

  // /login: ログイン済みならロールに応じてリダイレクト
  if (pathname === "/login") {
    if (isLoggedIn) {
      const destination = isAdmin ? "/admin/dashboard" : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return response;
  }

  // /admin/*: セッションなし→/login、role!=="admin"→/
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // その他の認証必須パス: セッションなし→/login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
