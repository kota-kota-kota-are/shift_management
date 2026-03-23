"use client";

import { CalendarCog, Wand2, Save, Send, Clock, Grid3X3 } from "lucide-react";
import { AccordionGroup, AccordionItem, Step, Tip, FeatureBadge } from "@/components/ui/accordion";

const SEARCH_TEXT = "シフト管理 グリッド 表 編集 パターン 割り当て 一括 保存 公開 下書き 週 期間 カスタム 時間 調整 自動 希望 早番 遅番 通し OFF";

type Props = { searchQuery: string };

export default function AdminShiftsSection({ searchQuery }: Props) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="管理者：シフト管理">
      <AccordionItem title="シフト管理画面の使い方" icon={<CalendarCog size={18} />} defaultOpen>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>スタッフ × 日付のグリッド表でシフトを管理します。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>行 = スタッフ名</li>
            <li>列 = 日付（曜日表示付き）</li>
            <li>セルにパターンの略称とカラーが表示されます</li>
            <li>セルの枠線は希望状況を表します：<span className="text-system-green">緑</span>=ぜひ、<span className="text-system-blue">青</span>=可能、<span className="text-system-red">赤</span>=不可</li>
          </ul>
        </div>
      </AccordionItem>

      <AccordionItem title="週単位の表示" icon={<Grid3X3 size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>
            <FeatureBadge>新機能</FeatureBadge>
          </p>
          <p>グリッドの上にある期間タブで、表示する日付を1週間ごとに切り替えられます。</p>
          <p>月全体のグリッドは横スクロールが必要ですが、週単位にすると7日分だけ表示されるため、確認・編集がしやすくなります。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="セルの編集" icon={<CalendarCog size={18} />}>
        <Step number={1} title="セルをタップ">
          グリッドのセルをタップすると編集画面が開きます。
        </Step>
        <Step number={2} title="パターンを選択">
          <div className="space-y-1">
            <p>表示される選択肢：</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><span className="font-medium text-text-primary">OFF</span> — 休み（セルをクリア）</li>
              <li><span className="font-medium text-text-primary">早番・遅番・通し等</span> — シフトパターンを割り当て</li>
            </ul>
          </div>
        </Step>
        <Step number={3} title="時間帯を調整（任意）">
          パターンを割り当てた後、出退勤の時間を個別に調整できます。
          これにより同じパターンでもスタッフごとに異なる勤務時間を設定できます。
        </Step>
        <div className="mt-2">
          <p className="text-sm text-text-secondary">編集画面にはスタッフの希望情報も表示されるので、参考にしながら割り当てできます。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="一括割り当て" icon={<Wand2 size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>「希望から一括割当」ボタンを押すと、スタッフの希望に基づいて自動でシフトが割り当てられます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>「出勤可能」「ぜひ出勤したい」の日に希望パターンを自動割り当て</li>
            <li>「出勤不可」の日は空（OFF）にします</li>
            <li>希望にカスタム時間があれば、それも引き継がれます</li>
          </ul>
        </div>
        <Tip>
          一括割り当て後に手動で微調整することをおすすめします。
        </Tip>
      </AccordionItem>

      <AccordionItem title="保存と公開" icon={<Send size={18} />}>
        <Step number={1} title="保存（下書き）">
          「保存」ボタンで現在のグリッドを下書き保存します。スタッフにはまだ見えません。
        </Step>
        <Step number={2} title="公開">
          「公開する」ボタンで全スタッフの勤務表に反映されます。公開後はスタッフが閲覧できるようになります。
        </Step>
        <Tip variant="warning">
          公開前に必ず人員配置を確認してください。保存していない変更がある場合は先に保存が必要です。
        </Tip>
      </AccordionItem>
    </AccordionGroup>
  );
}
