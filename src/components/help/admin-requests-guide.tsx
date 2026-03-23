"use client";

import { ClipboardEdit, Eye, Pencil, Filter } from "lucide-react";
import { AccordionGroup, AccordionItem, Step, Tip, FeatureBadge } from "@/components/ui/accordion";

const SEARCH_TEXT = "希望編集 リクエスト 管理者 編集 確認 スタッフ 希望 変更 可否 パターン 時間 備考 週 提出状況";

type Props = { searchQuery: string };

export default function AdminRequestsSection({ searchQuery }: Props) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="管理者：希望編集">
      <AccordionItem title="希望編集画面について" icon={<ClipboardEdit size={18} />} defaultOpen>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>
            <FeatureBadge>新機能</FeatureBadge>
          </p>
          <p>スタッフが提出したシフト希望を管理者が確認・編集できる画面です。</p>
          <p>以下のような場合に使用します：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>スタッフが口頭で希望変更を伝えてきた場合</li>
            <li>シフトの調整のため希望を修正する必要がある場合</li>
            <li>スタッフに代わって希望を入力する場合</li>
          </ul>
        </div>
      </AccordionItem>

      <AccordionItem title="希望の確認" icon={<Eye size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>スタッフ × 日付のグリッドで全員の希望を一覧で確認できます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="text-system-green font-medium">緑色セル：</span>ぜひ出勤したい</li>
            <li><span className="text-system-blue font-medium">青色セル：</span>出勤可能</li>
            <li><span className="text-system-red font-medium">赤色セル：</span>出勤不可</li>
            <li><span className="text-text-tertiary">「-」：</span>希望が未入力</li>
          </ul>
          <p>セルにはパターン名とカスタム時間も表示されます。</p>
          <p>画面下部には各スタッフの提出状況がバッジで表示されます。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="希望の編集方法" icon={<Pencil size={18} />}>
        <Step number={1} title="セルをタップ">
          希望が入力されているセルをタップすると、編集画面が開きます。
        </Step>
        <Step number={2} title="出勤可否の変更">
          「ぜひ出勤したい」「出勤可能」「出勤不可」を変更できます。
        </Step>
        <Step number={3} title="パターン・時間帯の変更">
          シフトパターンや希望の出退勤時刻を変更できます。
        </Step>
        <Step number={4} title="備考の編集">
          スタッフが残したメモを確認・編集できます。
        </Step>
        <Step number={5} title="保存">
          「保存」ボタンで変更を保存します。変更はすぐに反映されます。
        </Step>
        <Tip>
          ここでの変更はシフト管理画面の「希望から一括割当」にも反映されます。
        </Tip>
      </AccordionItem>

      <AccordionItem title="週単位の表示" icon={<Filter size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>シフト管理と同様に、1週間ごとの期間タブで表示を切り替えられます。</p>
          <p>月全体を一度に見るのが大変な場合は、週単位で確認すると効率的です。</p>
        </div>
      </AccordionItem>
    </AccordionGroup>
  );
}
