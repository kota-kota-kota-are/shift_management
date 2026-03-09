import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "シフト管理",
  description: "小規模飲食店向けシフト管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        style={{
          fontFamily:
            '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }}
      >
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
