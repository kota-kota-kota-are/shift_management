"use client";

import { LogIn, KeyRound, Shield, Smartphone } from "lucide-react";
import { AccordionGroup, AccordionItem, Step, Tip } from "@/components/ui/accordion";

const SEARCH_TEXT = "ログイン PIN 認証 はじめに 初めて 使い方 パスワード アカウント ログアウト";

type Props = { searchQuery: string };

export default function GettingStartedSection({ searchQuery }: Props) {
  if (searchQuery && !SEARCH_TEXT.includes(searchQuery) && !searchQuery.split("").every(c => SEARCH_TEXT.includes(c))) {
    const q = searchQuery.toLowerCase();
    if (!SEARCH_TEXT.toLowerCase().includes(q)) return null;
  }

  return (
    <AccordionGroup title="はじめに">
      <AccordionItem title="ログイン方法" icon={<LogIn size={18} />} defaultOpen>
        <Step number={1} title="名前を選択">
          ログイン画面で、スタッフ一覧から自分の名前をタップしてください。
        </Step>
        <Step number={2} title="PINコードを入力">
          4桁のPINコードを入力します。入力が完了すると自動的にログインされます。
        </Step>
        <Step number={3} title="ホーム画面へ">
          ログインに成功すると、スタッフはホーム画面、管理者はダッシュボードに移動します。
        </Step>
        <Tip>
          PINコードを忘れた場合は、管理者にリセットを依頼してください。
        </Tip>
      </AccordionItem>

      <AccordionItem title="PINコードについて" icon={<KeyRound size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p>PINコードは4桁の数字です。セキュリティのため、他の人と共有しないでください。</p>
          <p>PINコードは暗号化されて保存されるため、管理者も確認できません。忘れた場合はリセットが必要です。</p>
        </div>
      </AccordionItem>

      <AccordionItem title="権限について" icon={<Shield size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-3">
          <div>
            <p className="font-medium text-text-primary mb-1">スタッフ</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>ホーム画面で今日・今週のシフトを確認</li>
              <li>シフト希望の提出</li>
              <li>確定した勤務表の閲覧</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">管理者</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>上記のスタッフ機能に加えて...</li>
              <li>ダッシュボードでの全体把握</li>
              <li>シフトの作成・編集・公開</li>
              <li>スタッフの希望を編集</li>
              <li>スタッフの追加・管理</li>
              <li>店舗設定の変更</li>
            </ul>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem title="画面の操作方法" icon={<Smartphone size={18} />}>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          <p><span className="font-medium text-text-primary">スマホ：</span>画面下部のタブバーでページを切り替えます。</p>
          <p><span className="font-medium text-text-primary">PC：</span>画面左のサイドバーでページを切り替えます。</p>
          <p><span className="font-medium text-text-primary">ログアウト：</span>サイドバー下部（PC）のログアウトボタンを使用します。</p>
        </div>
        <Tip variant="success">
          このアプリはスマホでもPCでも快適に使えるよう設計されています。
        </Tip>
      </AccordionItem>
    </AccordionGroup>
  );
}
