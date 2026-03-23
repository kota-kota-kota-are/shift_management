"use client";

import { Users, Settings, KeyRound, UserPlus } from "lucide-react";
import { AccordionGroup, AccordionItem, Step, Tip } from "@/components/ui/accordion";

const SEARCH_TEXT = "スタッフ 管理 追加 編集 PIN リセット 有効 無効 設定 店舗 営業時間 時間帯 人員 提出期限 出勤時刻 退勤時刻 オプション";

type Props = { searchQuery: string };

export default function AdminStaffSettingsSection({ searchQuery }: Props) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="管理者：スタッフ管理・設定">
      <AccordionItem title="スタッフの追加" icon={<UserPlus size={18} />} defaultOpen>
        <Step number={1} title="「新規追加」ボタンをタップ">
          スタッフ管理画面の上部にあるボタンから追加画面を開きます。
        </Step>
        <Step number={2} title="情報を入力">
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            <li>名前（必須）— 他のスタッフと重複不可</li>
            <li>役割 — 「スタッフ」または「管理者」</li>
            <li>PINコード（必須）— 4桁の数字</li>
            <li>週あたり最大勤務時間（任意）</li>
          </ul>
        </Step>
        <Step number={3} title="保存">
          「追加」ボタンで保存します。追加直後からログイン可能になります。
        </Step>
      </AccordionItem>

      <AccordionItem title="スタッフの編集・無効化" icon={<Users size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>スタッフ一覧から各スタッフの操作ができます：</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium text-text-primary">編集：</span>名前、役割、最大勤務時間を変更</li>
            <li><span className="font-medium text-text-primary">有効/無効切替：</span>退職等でログインを停止する場合に使用</li>
          </ul>
          <p>無効化されたスタッフはログイン画面に表示されなくなりますが、データは保持されます。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="PINリセット" icon={<KeyRound size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>スタッフがPINコードを忘れた場合、管理者がリセットできます。</p>
          <p>スタッフ一覧から対象者の「PINリセット」ボタンをタップし、新しい4桁のPINを設定してください。</p>
        </div>
        <Tip variant="warning">
          リセット後は必ずスタッフに新しいPINを伝えてください。セキュリティのため、初回ログイン後の変更を推奨します。
        </Tip>
      </AccordionItem>

      <AccordionItem title="店舗設定" icon={<Settings size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-3">
          <div>
            <p className="font-medium text-text-primary mb-1">基本情報</p>
            <p>店舗名を設定します。</p>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">営業時間</p>
            <p>開店・閉店時刻を設定します。</p>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">シフト希望</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>提出期限日 — 毎月何日までにシフト希望を提出するか</li>
              <li>対象月オフセット — 何ヶ月先のシフトを対象にするか</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">人員配置</p>
            <p>1時間帯あたりの最小・最大スタッフ数を設定します。</p>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">シフト時間帯オプション</p>
            <p>スタッフが選択できる出勤・退勤時刻の選択肢をカンマ区切りで設定します。</p>
            <p className="text-xs mt-1">例：09:00,09:30,10:00,10:30,11:00</p>
          </div>
        </div>
      </AccordionItem>
    </AccordionGroup>
  );
}
