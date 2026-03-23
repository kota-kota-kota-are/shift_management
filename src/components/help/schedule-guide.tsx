"use client";

import { CalendarDays, Clock, Eye, Filter } from "lucide-react";
import { AccordionGroup, AccordionItem, Tip, FeatureBadge } from "@/components/ui/accordion";

const SEARCH_TEXT = "勤務表 スケジュール カレンダー 出勤日数 勤務時間 時間 週 全日程 期間 確認 公開 シフト";

type Props = { searchQuery: string };

export default function ScheduleSection({ searchQuery }: Props) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="勤務表">
      <AccordionItem title="勤務表の見方" icon={<CalendarDays size={18} />} defaultOpen>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>確定した勤務スケジュールを確認できます。管理者がシフトを「公開」すると表示されます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>カレンダーの各日にシフトパターンの略称が表示されます</li>
            <li>出勤日はパターンカラーでハイライトされます</li>
            <li>休みの日は「OFF」と表示されます</li>
            <li>今日の日付は青い枠線でハイライトされます</li>
          </ul>
        </div>
      </AccordionItem>

      <AccordionItem title="サマリー" icon={<Clock size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>画面上部に月間のサマリーが表示されます：</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium text-text-primary">出勤日数：</span>その月の出勤予定日数</li>
            <li><span className="font-medium text-text-primary">推定勤務時間：</span>休憩を除いた勤務時間の合計</li>
          </ul>
          <p>カスタム時間が設定されている場合は、実際の出退勤時刻で計算されます。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="週単位の表示切替" icon={<Filter size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>
            <FeatureBadge>新機能</FeatureBadge>
          </p>
          <p>カレンダーの上に期間切替タブがあります：</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium text-text-primary">全日程：</span>月全体を表示します</li>
            <li><span className="font-medium text-text-primary">1日〜7日 / 8日〜14日 ...：</span>1週間ごとに絞り込んで表示します</li>
          </ul>
          <p>多くのシフトがある場合、週単位で見ると見やすくなります。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="日付の詳細" icon={<Eye size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>カレンダーの日付をタップすると、その日のシフト詳細が表示されます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>その日に出勤する全スタッフの名前</li>
            <li>各スタッフのシフトパターンと勤務時間</li>
            <li>自分のシフトは「(自分)」マーク付きでハイライトされます</li>
          </ul>
          <p>カスタム時間が設定されている場合、通常パターンとの差分も表示されます。</p>
        </div>
        <Tip>
          勤務表は管理者が「公開」するまで表示されません。シフトが見えない場合は管理者に確認してください。
        </Tip>
      </AccordionItem>
    </AccordionGroup>
  );
}
