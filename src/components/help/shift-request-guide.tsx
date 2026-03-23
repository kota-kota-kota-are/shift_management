"use client";

import { CalendarPlus, Star, Check, X, Clock, MessageSquare } from "lucide-react";
import { AccordionGroup, AccordionItem, Step, Tip, FeatureBadge } from "@/components/ui/accordion";

const SEARCH_TEXT = "シフト希望 提出 出勤 休み 可能 不可 パターン 早番 遅番 通し カレンダー 備考 メモ 時間帯 カスタム 出勤時刻 退勤時刻 下書き 再提出";

type Props = { searchQuery: string };

export default function ShiftRequestSection({ searchQuery }: Props) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="シフト希望提出">
      <AccordionItem title="シフト希望の入力方法" icon={<CalendarPlus size={18} />} defaultOpen>
        <Step number={1} title="月を選択">
          画面上部の矢印ボタンで対象月を切り替えます。通常は翌月が表示されます。
        </Step>
        <Step number={2} title="日付をタップ">
          カレンダーの日付をタップすると、入力画面が開きます。
        </Step>
        <Step number={3} title="出勤可否を選択">
          <div className="space-y-1.5 mt-1">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-system-green shrink-0" />
              <span><span className="font-medium text-system-green">ぜひ出勤したい</span> — 優先的に出勤を希望</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-system-blue shrink-0" />
              <span><span className="font-medium text-system-blue">出勤可能</span> — 出勤できる日</span>
            </div>
            <div className="flex items-center gap-2">
              <X size={14} className="text-system-red shrink-0" />
              <span><span className="font-medium text-system-red">出勤不可</span> — 休みたい日</span>
            </div>
          </div>
        </Step>
        <Step number={4} title="パターンと時間を設定">
          出勤可能な日では、希望するシフトパターン（早番・遅番・通し等）を選択できます。
          さらに出勤・退勤の時間を細かく指定することもできます。
        </Step>
        <Step number={5} title="提出">
          全ての日付の入力が終わったら「提出する」ボタンをタップします。
        </Step>
      </AccordionItem>

      <AccordionItem title="希望時間帯の指定" icon={<Clock size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>
            <FeatureBadge>新機能</FeatureBadge>
          </p>
          <p>シフトパターンの既定時間とは別に、出勤・退勤の時刻を個別に指定できます。</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium text-text-primary">出勤時刻：</span>管理者が設定した選択肢から選びます</li>
            <li><span className="font-medium text-text-primary">退勤時刻：</span>管理者が設定した選択肢から選びます</li>
            <li>「パターン既定」を選ぶと、パターンの通常時間が適用されます</li>
          </ul>
          <p>例：早番パターン（9:00〜15:00）を選択しつつ、出勤を10:00にしたい場合は出勤時刻で「10:00」を選択します。</p>
        </div>
        <Tip variant="success">
          時間指定はあくまで「希望」です。最終的な勤務時間は管理者が決定します。
        </Tip>
      </AccordionItem>

      <AccordionItem title="備考の入力" icon={<MessageSquare size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>各日付の入力画面で、備考欄にメモを残すことができます。</p>
          <p>使用例：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>「午前中は病院のため、午後から出勤希望」</li>
            <li>「この日は早上がり希望」</li>
            <li>「子供の行事のため休み希望」</li>
          </ul>
          <p>備考が入力されている日はカレンダー上にアイコンが表示されます。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="提出と再提出" icon={<Check size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>提出状態は画面上部に表示されます：</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium text-system-green">提出済み：</span>正常に提出されています</li>
            <li><span className="font-medium text-system-orange">下書き：</span>まだ提出されていない、または変更後未提出です</li>
          </ul>
          <p>一度提出した後でも、再度編集して「再提出する」ボタンから上書き提出できます。</p>
        </div>
        <Tip>
          進捗バーで何日分入力済みか確認できます。全日分入力することをおすすめします。
        </Tip>
      </AccordionItem>
    </AccordionGroup>
  );
}
