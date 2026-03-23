import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import TabBar from "@/components/layout/tab-bar";
import MobileHeader from "@/components/layout/mobile-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* サイドバー（デスクトップのみ表示、fixed） */}
      <Sidebar staffName={session.staffName} role={session.role} />

      {/* モバイルヘッダー（ユーザー名+ログアウト） */}
      <MobileHeader staffName={session.staffName} role={session.role} />

      {/* メインコンテンツ */}
      <main className="md:ml-[260px] pb-20 md:pb-0">
        {children}
      </main>

      {/* タブバー（モバイルのみ表示） */}
      <TabBar role={session.role} />
    </div>
  );
}
