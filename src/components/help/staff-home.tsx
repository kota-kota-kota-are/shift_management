"use client";

import { Home, Calendar, Clock, CalendarCheck } from "lucide-react";
import { AccordionGroup, AccordionItem, Tip } from "@/components/ui/accordion";

const SEARCH_TEXT = "ホーム 今日 シフト 今週 確認 お知らせ 勤務 出勤 休み OFF";

type Props = { searchQuery: string };

export default function StaffHomeSection({ searchQuery }: Props) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="ホーム画面">
      <AccordionItem title="今日のシフト" icon={<Clock size={18} />} defaultOpen>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>ホーム画面の上部に、今日のシフト情報が表示されます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium text-text-primary">出勤日：</span>シフトパターン名と勤務時間が表示されます</li>
            <li><span className="font-medium text-text-primary">休日：</span>「今日はお休みです」と表示されます</li>
          </ul>
          <p>カスタム時間が設定されている場合は、通常パターンの時間ではなく実際の勤務時間が表示されます。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="今週のシフト" icon={<Calendar size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>月曜〜日曜の1週間分のシフトが一覧で表示されます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>各日にシフトパターンの略称（早・遅・通など）が表示されます</li>
            <li>勤務開始時刻も小さく表示されます</li>
            <li>今日の日付はハイライト表示されます</li>
            <li>休みの日は「-」と表示されます</li>
          </ul>
        </div>
      </AccordionItem>

      <AccordionItem title="シフト希望のステータス" icon={<CalendarCheck size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>来月のシフト希望の提出状況が確認できます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="text-system-green font-medium">提出済み：</span>希望が正しく提出されています</li>
            <li><span className="text-system-orange font-medium">未提出：</span>まだ希望が提出されていません</li>
          </ul>
          <p>「提出する」または「確認する」ボタンからシフト希望画面へ移動できます。</p>
        </div>
        <Tip variant="warning">
          毎月の提出期限までに必ずシフト希望を提出してください。
        </Tip>
      </AccordionItem>
    </AccordionGroup>
  );
}
