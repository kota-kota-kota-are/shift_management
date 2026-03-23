"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getStaffForLogin } from "@/actions/staff";
import { login } from "@/actions/auth";

type StaffOption = {
  id: string;
  name: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // スタッフ一覧を取得
  useEffect(() => {
    (async () => {
      const result = await getStaffForLogin();
      if (result.success) {
        setStaffList(result.data);
      } else {
        setError("スタッフ一覧の取得に失敗しました");
      }
      setIsLoading(false);
    })();
  }, []);

  // ステップ2に進んだらPIN入力にフォーカス
  useEffect(() => {
    if (step === 2) {
      pinRefs.current[0]?.focus();
    }
  }, [step]);

  const selectedStaffName =
    staffList.find((s) => s.id === selectedStaffId)?.name ?? "";

  function handleStaffSelect(id: string) {
    setSelectedStaffId(id);
    setError("");
    setStep(2);
    setPin(["", "", "", ""]);
  }

  function handlePinChange(index: number, value: string) {
    // 数字のみ許可
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    // 次のフィールドにフォーカス
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  }

  function handlePinPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const newPin = pasted.split("");
      setPin(newPin);
      pinRefs.current[3]?.focus();
    }
  }

  function handleBack() {
    setStep(1);
    setSelectedStaffId("");
    setPin(["", "", "", ""]);
    setError("");
  }

  function handleLogin() {
    const pinStr = pin.join("");
    if (pinStr.length !== 4) {
      setError("4桁のPINを入力してください");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("staffId", selectedStaffId);
      formData.set("pin", pinStr);

      const result = await login(formData);

      if (result.success) {
        toast.success(`${result.data.staffName}さん、こんにちは！`);
        if (result.data.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      } else {
        setError(result.error);
        setPin(["", "", "", ""]);
        pinRefs.current[0]?.focus();
      }
    });
  }

  // PIN入力完了時に自動ログイン
  useEffect(() => {
    if (pin.every((d) => d !== "") && step === 2) {
      handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* ロゴ / タイトル */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#007AFF] rounded-[18px] flex items-center justify-center mx-auto mb-4 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#000000]">シフト管理</h1>
          <p className="text-sm text-[rgba(60,60,67,0.6)] mt-1">
            ログインしてください
          </p>
        </div>

        {/* カード */}
        <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* ステップ1: スタッフ選択 */}
          {step === 1 && (
            <div>
              <div className="px-4 py-3 border-b border-[rgba(60,60,67,0.12)]">
                <h2 className="text-[15px] font-semibold text-[rgba(60,60,67,0.6)] uppercase tracking-wide">
                  名前を選択
                </h2>
              </div>

              {isLoading ? (
                <div className="px-4 py-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[rgba(60,60,67,0.6)] mt-3">
                    読み込み中...
                  </p>
                </div>
              ) : staffList.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-[rgba(60,60,67,0.6)]">
                    登録されたスタッフがいません
                  </p>
                </div>
              ) : (
                <ul>
                  {staffList.map((staff, index) => (
                    <li key={staff.id}>
                      <button
                        type="button"
                        onClick={() => handleStaffSelect(staff.id)}
                        className={`w-full text-left px-4 py-3.5 flex items-center justify-between min-h-[44px] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] transition-colors duration-150 ${
                          index < staffList.length - 1
                            ? "border-b border-[rgba(60,60,67,0.12)]"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-sm font-medium">
                            {staff.name.charAt(0)}
                          </div>
                          <span className="text-[17px] text-[#000000]">
                            {staff.name}
                          </span>
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="rgba(60,60,67,0.3)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ステップ2: PIN入力 */}
          {step === 2 && (
            <div className="px-6 py-6">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-[#007AFF] text-[15px] mb-5 -ml-2 px-1 min-h-[44px] hover:opacity-70 active:opacity-50 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                戻る
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-lg font-medium mx-auto mb-2">
                  {selectedStaffName.charAt(0)}
                </div>
                <p className="text-[17px] font-semibold text-[#000000]">
                  {selectedStaffName}
                </p>
                <p className="text-[13px] text-[rgba(60,60,67,0.6)] mt-1">
                  PINを入力してください
                </p>
              </div>

              {/* PIN入力フィールド */}
              <div className="flex justify-center gap-3 mb-6">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      pinRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    onPaste={index === 0 ? handlePinPaste : undefined}
                    className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] focus:border-[#007AFF] focus:bg-white focus:outline-none transition-all duration-200"
                    autoComplete="off"
                  />
                ))}
              </div>

              {/* エラーメッセージ */}
              {error && (
                <p className="text-[13px] text-[#FF3B30] text-center mb-4">
                  {error}
                </p>
              )}

              {/* ログインボタン */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={isPending || pin.some((d) => d === "")}
                className="w-full py-3 min-h-[44px] bg-[#007AFF] text-white text-[17px] font-semibold rounded-xl hover:bg-[#0066DD] active:bg-[#0055CC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ログイン中...
                  </span>
                ) : (
                  "ログイン"
                )}
              </button>
            </div>
          )}
        </div>

        {/* フッター */}
        <p className="text-center text-[11px] text-[rgba(60,60,67,0.3)] mt-6">
          シフト管理システム v1.0
        </p>
      </div>
    </div>
  );
}
