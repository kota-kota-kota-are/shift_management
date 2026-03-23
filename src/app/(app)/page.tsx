import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getConfirmedShifts, getShiftRequestStatus } from "@/actions/shifts";
import { Card } from "@/components/ui/card";
import {
  formatDate,
  getWeekDays,
  isToday,
  formatYearMonth,
} from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  Coffee,
  CalendarCheck,
  CalendarPlus,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { ConfirmedShiftWithDetails } from "@/types";

// ---------------------------------------------------------------------------
// 曜日ラベル
// ---------------------------------------------------------------------------
const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const today = new Date();
  const todayStr = formatDate(today);
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const yearMonth = formatYearMonth(year, month);

  // 来月の年月を計算
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextYearMonth = formatYearMonth(nextYear, nextMonth);

  // データ取得（並列）
  const [shiftsResult, requestStatusResult] = await Promise.all([
    getConfirmedShifts(year, month),
    getShiftRequestStatus(nextYearMonth, session.staffId),
  ]);

  const shifts: ConfirmedShiftWithDetails[] =
    shiftsResult.success ? shiftsResult.data : [];

  // 自分のシフトのみフィルタ
  const myShifts = shifts.filter((s) => s.staffId === session.staffId);

  // 今日のシフト
  const todayShift = myShifts.find((s) => s.date === todayStr);

  // 今週のシフト
  const weekDays = getWeekDays(today);
  const weekShifts = weekDays.map((day) => {
    const dateStr = formatDate(day);
    const shift = myShifts.find((s) => s.date === dateStr);
    return { date: day, dateStr, shift: shift ?? null };
  });

  // 来月の希望提出状況
  const requestStatus = requestStatusResult.success
    ? requestStatusResult.data
    : { submitted: false, count: 0 };

  // 挨拶メッセージ
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "お疲れさまです";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ---- 挨拶 ---- */}
      <section>
        <h1 className="text-[28px] font-bold text-text-primary tracking-tight">
          {greeting}、{session.staffName}さん
        </h1>
        <p className="text-[15px] text-text-secondary mt-1">
          {year}年{month}月{today.getDate()}日（{DAY_LABELS[today.getDay()]}）
        </p>
      </section>

      {/* ---- 今日のシフト ---- */}
      <section>
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
          今日のシフト
        </h2>
        <Card padding="lg">
          {todayShift ? (
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl"
                style={{
                  backgroundColor: todayShift.patternColor
                    ? `${todayShift.patternColor}20`
                    : "rgba(0, 122, 255, 0.1)",
                }}
              >
                <Clock
                  size={24}
                  style={{
                    color: todayShift.patternColor || "var(--color-system-blue)",
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-semibold text-text-primary">
                  {todayShift.patternName}
                </p>
                <p className="text-[15px] text-text-secondary">
                  {todayShift.effectiveStartTime} ~ {todayShift.effectiveEndTime}
                </p>
              </div>
              <span
                className="text-[13px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: todayShift.patternColor
                    ? `${todayShift.patternColor}15`
                    : "rgba(0, 122, 255, 0.1)",
                  color: todayShift.patternColor || "var(--color-system-blue)",
                }}
              >
                {todayShift.patternShortName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-system-green/10">
                <Coffee size={24} className="text-system-green" />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-text-primary">
                  今日はお休みです
                </p>
                <p className="text-[15px] text-text-secondary">
                  ゆっくり休んでください
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ---- 今週のシフト ---- */}
      <section>
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
          今週のシフト
        </h2>
        <Card padding="sm">
          <div className="grid grid-cols-7 gap-1">
            {weekShifts.map(({ date, dateStr, shift }) => {
              const dayOfWeek = date.getDay();
              const isTodayDate = isToday(date);
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <div
                  key={dateStr}
                  className={`
                    flex flex-col items-center py-2 px-1 rounded-xl text-center
                    ${isTodayDate ? "bg-system-blue/10 ring-2 ring-system-blue/30" : ""}
                  `}
                >
                  {/* 曜日 */}
                  <span
                    className={`
                      text-[11px] font-medium
                      ${isSunday ? "text-system-red" : ""}
                      ${isSaturday ? "text-system-blue" : ""}
                      ${!isSunday && !isSaturday ? "text-text-secondary" : ""}
                    `}
                  >
                    {DAY_LABELS[dayOfWeek]}
                  </span>

                  {/* 日付 */}
                  <span
                    className={`
                      text-[15px] font-semibold mt-0.5
                      ${isTodayDate ? "text-system-blue" : "text-text-primary"}
                    `}
                  >
                    {date.getDate()}
                  </span>

                  {/* シフト情報 */}
                  {shift ? (
                    <div className="mt-1.5 w-full">
                      <span
                        className="block text-[10px] font-medium px-1 py-0.5 rounded-md truncate"
                        style={{
                          backgroundColor: shift.patternColor
                            ? `${shift.patternColor}20`
                            : "rgba(0, 122, 255, 0.1)",
                          color: shift.patternColor || "var(--color-system-blue)",
                        }}
                      >
                        {shift.patternShortName}
                      </span>
                      <span className="block text-[9px] text-text-tertiary mt-0.5">
                        {shift.effectiveStartTime}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1.5">
                      <span className="text-[10px] text-text-tertiary">-</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
        <Link
          href="/schedule"
          className="flex items-center justify-between mt-2 px-3 py-2.5 rounded-xl text-[15px] text-system-blue font-medium hover:bg-system-blue/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <CalendarDays size={18} />
            勤務表を見る
          </span>
          <ChevronRight size={18} className="text-text-tertiary" />
        </Link>
      </section>

      {/* ---- シフト希望ステータス ---- */}
      <section>
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
          シフト希望
        </h2>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-xl
                  ${requestStatus.submitted ? "bg-system-green/10" : "bg-system-orange/10"}
                `}
              >
                {requestStatus.submitted ? (
                  <CalendarCheck size={20} className="text-system-green" />
                ) : (
                  <CalendarPlus size={20} className="text-system-orange" />
                )}
              </div>
              <div>
                <p className="text-[15px] font-medium text-text-primary">
                  {nextYear}年{nextMonth}月分
                </p>
                {requestStatus.submitted ? (
                  <p className="text-[13px] text-system-green font-medium">
                    提出済み（{requestStatus.count}日分）
                  </p>
                ) : (
                  <p className="text-[13px] text-system-orange font-medium">
                    未提出
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/shift-request"
              className="flex items-center gap-1 text-[14px] text-system-blue font-medium hover:opacity-80 transition-opacity"
            >
              {requestStatus.submitted ? "確認する" : "提出する"}
              <ChevronRight size={16} />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
