"use client";

import { LayoutDashboard, Users, AlertTriangle, BarChart3 } from "lucide-react";
import { AccordionGroup, AccordionItem, Tip } from "@/components/ui/accordion";

const SEARCH_TEXT = "ダッシュボード 管理 今日 出勤 提出 進捗 アラート 人員不足 ステータス 公開 下書き";

type Props = { searchQuery: string };

export default function AdminDashboardSection({ searchQuery }: Props) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="管理者：ダッシュボード">
      <AccordionItem title="ダッシュボード概要" icon={<LayoutDashboard size={18} />} defaultOpen>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>ダッシュボードは管理者のホーム画面です。店舗の運営状況を一目で把握できます。</p>
          <p>4つのセクションで構成されています：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>今日のシフト</li>
            <li>シフト希望の提出状況</li>
            <li>スケジュールのステータス</li>
            <li>人員配置アラート</li>
          </ul>
        </div>
      </AccordionItem>

      <AccordionItem title="今日のシフト" icon={<Users size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>今日出勤予定のスタッフとそのシフト情報が表示されます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>出勤人数の合計</li>
            <li>各スタッフの名前、パターン、勤務時間</li>
            <li>カスタム時間が設定されている場合は実際の勤務時間を表示</li>
          </ul>
        </div>
      </AccordionItem>

      <AccordionItem title="提出状況の確認" icon={<BarChart3 size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>来月分のシフト希望をどのスタッフが提出済みかを確認できます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="text-system-green font-medium">✓マーク：</span>提出済みのスタッフ</li>
            <li><span className="text-system-orange font-medium">未マーク：</span>まだ提出していないスタッフ</li>
          </ul>
          <p>プログレスバーで全体の提出率も確認できます。</p>
        </div>
        <Tip>
          提出期限が近づいたら、未提出のスタッフに声をかけてください。
        </Tip>
      </AccordionItem>

      <AccordionItem title="人員配置アラート" icon={<AlertTriangle size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>設定で指定した最小スタッフ数を下回る日がある場合、アラートが表示されます。</p>
          <p>該当する日付と現在の出勤予定人数が一覧で確認でき、シフトの調整が必要な箇所がすぐにわかります。</p>
        </div>
        <Tip variant="warning">
          人員不足の日は早めにシフト調整を行い、サービス品質を維持しましょう。
        </Tip>
      </AccordionItem>
    </AccordionGroup>
  );
}
