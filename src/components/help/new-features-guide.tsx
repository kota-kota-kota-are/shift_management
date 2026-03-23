"use client";

import { Sparkles, Clock, ClipboardEdit, Calendar } from "lucide-react";
import { AccordionGroup, AccordionItem, FeatureBadge, Tip } from "@/components/ui/accordion";

const SEARCH_TEXT = "新機能 アップデート カスタム 時間帯 出退勤 希望編集 管理者編集 週表示 期間 バリエーション";

type Props = { searchQuery: string };

export default function NewFeaturesSection({ searchQuery }: Props) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="新機能ガイド">
      <AccordionItem title="出退勤時刻のカスタマイズ" icon={<Clock size={18} />} defaultOpen>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p><FeatureBadge>新機能</FeatureBadge></p>
          <p>シフトパターン（早番・遅番・通し等）に加えて、出勤・退勤時刻を個別に指定できるようになりました。</p>

          <div className="bg-bg-tertiary rounded-lg p-3 space-y-2">
            <p className="font-medium text-text-primary text-xs">使用例</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>早番パターン（9:00〜15:00）だが、10:00出勤にしたい</li>
              <li>遅番パターン（15:00〜22:00）だが、20:00で上がりたい</li>
              <li>通しパターン（9:00〜22:00）だが、11:00出勤にしたい</li>
            </ul>
          </div>

          <p><span className="font-medium text-text-primary">スタッフ：</span>シフト希望提出時に「希望時間帯」で出退勤時刻を指定できます。</p>
          <p><span className="font-medium text-text-primary">管理者：</span>シフト管理画面でセル編集時に時間帯を調整できます。設定画面で選択可能な時刻のリストを管理できます。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="管理者によるシフト希望の編集" icon={<ClipboardEdit size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p><FeatureBadge>新機能</FeatureBadge></p>
          <p>管理者がスタッフのシフト希望を直接編集できるようになりました。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>サイドバー/タブバーの「希望編集」からアクセス</li>
            <li>全スタッフの希望をグリッド表示で一覧確認</li>
            <li>セルをタップして出勤可否・パターン・時間帯・備考を編集</li>
          </ul>
          <p>口頭で受けた変更依頼をすぐに反映できます。変更は「希望から一括割当」にも反映されます。</p>
        </div>
        <Tip variant="success">
          スタッフとのコミュニケーションを取りながら希望を調整することで、より良いシフトが組めます。
        </Tip>
      </AccordionItem>

      <AccordionItem title="1週間ごとの表示切替" icon={<Calendar size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p><FeatureBadge>新機能</FeatureBadge></p>
          <p>各画面に週単位の期間切替タブが追加されました。</p>

          <div className="bg-bg-tertiary rounded-lg p-3 space-y-2">
            <p className="font-medium text-text-primary text-xs">対応画面</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><span className="font-medium">シフト管理</span>（管理者）— グリッドの日付を週単位で絞り込み</li>
              <li><span className="font-medium">希望編集</span>（管理者）— 希望グリッドを週単位で絞り込み</li>
              <li><span className="font-medium">勤務表</span>（全員）— カレンダーを週単位/全月で切替</li>
            </ul>
          </div>

          <p>特にスマホでの操作性が向上し、横スクロールの手間が大幅に減ります。</p>
        </div>
      </AccordionItem>
    </AccordionGroup>
  );
}
