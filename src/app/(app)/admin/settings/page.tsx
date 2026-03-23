"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getStoreSettings, updateStoreSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { ParsedStoreSettings } from "@/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ParsedStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 初期値取得 ---
  useEffect(() => {
    async function fetchSettings() {
      const result = await getStoreSettings();
      if (result.success) {
        setSettings(result.data);
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  // --- 保存 ---
  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("storeName", settings.storeName);
      formData.set("businessStartTime", settings.businessStartTime);
      formData.set("businessEndTime", settings.businessEndTime);
      formData.set("requestDeadlineDay", String(settings.requestDeadlineDay));
      formData.set("targetMonthOffset", String(settings.targetMonthOffset));
      formData.set("minStaffPerSlot", String(settings.minStaffPerSlot));
      formData.set("maxStaffPerSlot", String(settings.maxStaffPerSlot));
      formData.set("allowedStartTimes", settings.allowedStartTimes.join(","));
      formData.set("allowedEndTimes", settings.allowedEndTimes.join(","));

      const result = await updateStoreSettings(formData);
      if (result.success) {
        toast.success("設定を保存しました");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("設定の保存中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  // --- ローディング ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-text-secondary">読み込み中...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-system-red">設定の取得に失敗しました</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">設定</h1>
        <p className="text-sm text-text-secondary mt-1">
          店舗の基本設定を管理します
        </p>
      </div>

      {/* 基本情報セクション */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-4">
          基本情報
        </h2>
        <Card>
          <Input
            label="店舗名"
            name="storeName"
            value={settings.storeName}
            onChange={(e) =>
              setSettings({ ...settings, storeName: e.target.value })
            }
            placeholder="店舗名を入力"
          />
        </Card>
      </section>

      {/* 営業時間セクション */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-4">
          営業時間
        </h2>
        <Card className="space-y-4">
          <Input
            label="開店時刻"
            name="businessStartTime"
            type="time"
            value={settings.businessStartTime}
            onChange={(e) =>
              setSettings({ ...settings, businessStartTime: e.target.value })
            }
          />
          <Input
            label="閉店時刻"
            name="businessEndTime"
            type="time"
            value={settings.businessEndTime}
            onChange={(e) =>
              setSettings({ ...settings, businessEndTime: e.target.value })
            }
          />
        </Card>
      </section>

      {/* シフト希望セクション */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-4">
          シフト希望
        </h2>
        <Card className="space-y-4">
          <Input
            label="提出期限日（毎月N日）"
            name="requestDeadlineDay"
            type="number"
            value={String(settings.requestDeadlineDay)}
            onChange={(e) =>
              setSettings({
                ...settings,
                requestDeadlineDay: Number(e.target.value) || 0,
              })
            }
            placeholder="1〜28"
          />
          <Input
            label="対象月オフセット（何ヶ月先のシフトか）"
            name="targetMonthOffset"
            type="number"
            value={String(settings.targetMonthOffset)}
            onChange={(e) =>
              setSettings({
                ...settings,
                targetMonthOffset: Number(e.target.value) || 0,
              })
            }
            placeholder="1〜3"
          />
        </Card>
      </section>

      {/* 人員配置セクション */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-4">
          人員配置
        </h2>
        <Card className="space-y-4">
          <Input
            label="最小スタッフ数"
            name="minStaffPerSlot"
            type="number"
            value={String(settings.minStaffPerSlot)}
            onChange={(e) =>
              setSettings({
                ...settings,
                minStaffPerSlot: Number(e.target.value) || 0,
              })
            }
            placeholder="0以上"
          />
          <Input
            label="最大スタッフ数"
            name="maxStaffPerSlot"
            type="number"
            value={String(settings.maxStaffPerSlot)}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxStaffPerSlot: Number(e.target.value) || 0,
              })
            }
            placeholder="1以上"
          />
        </Card>
      </section>

      {/* シフト時間帯セクション */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-4">
          シフト時間帯オプション
        </h2>
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              選択可能な出勤時刻
            </label>
            <p className="text-xs text-text-secondary mb-2">
              カンマ区切りで入力（例: 09:00,09:30,10:00）
            </p>
            <input
              type="text"
              value={settings.allowedStartTimes.join(",")}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allowedStartTimes: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-2.5 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm placeholder:text-text-tertiary transition-all duration-fast focus:ring-2 focus:ring-system-blue/40"
              placeholder="09:00,09:30,10:00,10:30,11:00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              選択可能な退勤時刻
            </label>
            <p className="text-xs text-text-secondary mb-2">
              カンマ区切りで入力（例: 17:00,18:00,22:00）
            </p>
            <input
              type="text"
              value={settings.allowedEndTimes.join(",")}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allowedEndTimes: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-2.5 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm placeholder:text-text-tertiary transition-all duration-fast focus:ring-2 focus:ring-system-blue/40"
              placeholder="15:00,16:00,17:00,18:00,19:00,20:00,21:00,22:00"
            />
          </div>
        </Card>
      </section>

      {/* 保存ボタン */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
