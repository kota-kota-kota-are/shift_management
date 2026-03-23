"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star, Check, X, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

import { getShiftPatterns, getShiftRequests, submitShiftRequests } from "@/actions/shifts";
import { getSessionData } from "@/actions/auth";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  formatYearMonth,
  cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import type { ShiftPattern, Availability, SessionData } from "@/types";
import type { ParsedStoreSettings } from "@/types";
import { getStoreSettings } from "@/actions/settings";

// ============================================================
// Types
// ============================================================

type DayRequest = {
  patternId: string | null;
  customStartTime: string | null;
  customEndTime: string | null;
  availability: Availability;
  note: string;
};

type RequestMap = Map<string, DayRequest>;

// ============================================================
// Constants
// ============================================================

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

const AVAILABILITY_OPTIONS: {
  value: Availability;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  {
    value: "preferred",
    label: "ぜひ出勤したい",
    color: "text-system-green",
    bgColor: "bg-system-green/15",
  },
  {
    value: "available",
    label: "出勤可能",
    color: "text-system-blue",
    bgColor: "bg-system-blue/15",
  },
  {
    value: "unavailable",
    label: "出勤不可",
    color: "text-system-red",
    bgColor: "bg-system-red/15",
  },
];

// ============================================================
// Helper: Build calendar grid
// ============================================================

type CalendarCell = {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
};

function buildCalendarGrid(year: number, month: number): CalendarCell[][] {
  const daysInMonth = getDaysInMonth(year, month);
  let firstDay = getFirstDayOfMonth(year, month); // 0=Sun
  // Convert to Monday-based (0=Mon, 6=Sun)
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const cells: CalendarCell[] = [];

  // Previous month padding
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(prevYear, prevMonth - 1, day);
    cells.push({
      date,
      dateStr: formatDate(date),
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    cells.push({
      date,
      dateStr: formatDate(date),
      isCurrentMonth: true,
    });
  }

  // Next month padding
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(nextYear, nextMonth - 1, d);
      cells.push({
        date,
        dateStr: formatDate(date),
        isCurrentMonth: false,
      });
    }
  }

  // Split into weeks
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

// ============================================================
// Component
// ============================================================

export default function ShiftRequestPage() {
  // --- State ---
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2); // 翌月デフォルト
  const [yearForMonth, setYearForMonth] = useState(
    now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear()
  );

  // 初期表示は翌月
  useEffect(() => {
    setYear(yearForMonth);
  }, [yearForMonth]);

  const [requests, setRequests] = useState<RequestMap>(new Map());
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalPatternId, setModalPatternId] = useState<string | null>(null);
  const [modalAvailability, setModalAvailability] = useState<Availability>("available");
  const [modalNote, setModalNote] = useState("");
  const [modalCustomStartTime, setModalCustomStartTime] = useState<string | null>(null);
  const [modalCustomEndTime, setModalCustomEndTime] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<ParsedStoreSettings | null>(null);

  // Submit confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [isPending, startTransition] = useTransition();

  // --- Navigation ---
  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
      setYearForMonth((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
      setYearForMonth((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // --- Load data ---
  const loadData = useCallback(() => {
    startTransition(async () => {
      const [sessionResult, patternsResult, requestsResult, settingsResult] = await Promise.all([
        getSessionData(),
        getShiftPatterns(),
        getShiftRequests(year, month),
        getStoreSettings(),
      ]);

      if (sessionResult) {
        setSession(sessionResult);
      }

      if (patternsResult.success) {
        setPatterns(patternsResult.data);
      }

      if (settingsResult.success) {
        setStoreSettings(settingsResult.data);
      }

      if (requestsResult.success) {
        const map = new Map<string, DayRequest>();
        let hasData = false;
        for (const req of requestsResult.data) {
          map.set(req.date, {
            patternId: req.patternId,
            customStartTime: req.customStartTime ?? null,
            customEndTime: req.customEndTime ?? null,
            availability: req.availability,
            note: req.note ?? "",
          });
          hasData = true;
        }
        setRequests(map);
        setIsSubmitted(hasData);
      } else {
        setRequests(new Map());
        setIsSubmitted(false);
      }
    });
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Calendar grid ---
  const calendarWeeks = buildCalendarGrid(year, month);

  // --- Cell tap handler ---
  const openDayModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = requests.get(dateStr);
    if (existing) {
      setModalPatternId(existing.patternId);
      setModalCustomStartTime(existing.customStartTime);
      setModalCustomEndTime(existing.customEndTime);
      setModalAvailability(existing.availability);
      setModalNote(existing.note);
    } else {
      setModalPatternId(null);
      setModalCustomStartTime(null);
      setModalCustomEndTime(null);
      setModalAvailability("available");
      setModalNote("");
    }
  };

  const closeDayModal = () => {
    setSelectedDate(null);
  };

  // --- Save single day ---
  const saveDayRequest = () => {
    if (!selectedDate) return;
    const newMap = new Map(requests);
    newMap.set(selectedDate, {
      patternId: modalPatternId,
      customStartTime: modalCustomStartTime,
      customEndTime: modalCustomEndTime,
      availability: modalAvailability,
      note: modalNote,
    });
    setRequests(newMap);
    setIsSubmitted(false); // 変更があるので下書き状態に
    toast.success("保存しました");
    closeDayModal();
  };

  // --- Clear single day ---
  const clearDayRequest = () => {
    if (!selectedDate) return;
    const newMap = new Map(requests);
    newMap.delete(selectedDate);
    setRequests(newMap);
    setIsSubmitted(false);
    toast.success("クリアしました");
    closeDayModal();
  };

  // --- Submit ---
  const handleSubmit = () => {
    if (requests.size === 0) {
      toast.error("シフト希望が入力されていません");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    if (!session) {
      toast.error("セッションが取得できません。再ログインしてください。");
      return;
    }

    startTransition(async () => {
      const reqArray = Array.from(requests.entries()).map(([date, data]) => ({
        date,
        availability: data.availability,
        patternId: data.patternId ?? undefined,
        customStartTime: data.customStartTime ?? undefined,
        customEndTime: data.customEndTime ?? undefined,
        note: data.note || undefined,
      }));

      const result = await submitShiftRequests({
        staffId: session.staffId,
        yearMonth: formatYearMonth(year, month),
        requests: reqArray,
      });

      if (result.success) {
        toast.success("シフト希望を提出しました");
        setIsSubmitted(true);
      } else {
        toast.error(result.error);
      }

      setShowConfirmModal(false);
    });
  };

  // --- Pattern lookup helper ---
  const getPatternById = (id: string | null): ShiftPattern | undefined => {
    if (!id) return undefined;
    return patterns.find((p) => p.id === id);
  };

  // --- Availability cell bg ---
  const getAvailabilityBg = (availability: Availability): string => {
    switch (availability) {
      case "preferred":
        return "bg-system-green/10 border-system-green/30";
      case "available":
        return "bg-system-blue/10 border-system-blue/30";
      case "unavailable":
        return "bg-system-red/10 border-system-red/30";
    }
  };

  const getAvailabilityIcon = (availability: Availability) => {
    switch (availability) {
      case "preferred":
        return <Star size={10} className="text-system-green" />;
      case "available":
        return <Check size={10} className="text-system-blue" />;
      case "unavailable":
        return <X size={10} className="text-system-red" />;
    }
  };

  // --- Deadline display ---
  const deadlineText = `${month}月分の提出期限: 前月25日`;

  // --- Selected date formatting ---
  const formatSelectedDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayLabel = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${m}月${d}日（${dayLabel}）`;
  };

  // --- Filled count ---
  const filledCount = requests.size;
  const totalDays = getDaysInMonth(year, month);

  return (
    <div className="max-w-lg mx-auto px-4 pb-28">
      {/* ================================================ */}
      {/* Header */}
      {/* ================================================ */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary mb-1">シフト希望提出</h1>
        <p className="text-sm text-text-secondary">{deadlineText}</p>
      </div>

      {/* Month Navigation + Status */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors duration-fast"
          >
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-text-primary">
              {year}年{month}月
            </span>
            <Badge variant={isSubmitted ? "success" : "warning"}>
              {isSubmitted ? "提出済み" : "下書き"}
            </Badge>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors duration-fast"
          >
            <ChevronRight size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-system-blue rounded-full transition-all duration-normal"
              style={{ width: `${totalDays > 0 ? (filledCount / totalDays) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-text-secondary whitespace-nowrap">
            {filledCount}/{totalDays}日
          </span>
        </div>
      </Card>

      {/* ================================================ */}
      {/* Calendar Grid */}
      {/* ================================================ */}
      <Card padding="sm" className="mb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "text-center text-xs font-medium py-1.5",
                i === 5 ? "text-system-blue" : i === 6 ? "text-system-red" : "text-text-secondary"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {calendarWeeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
            {week.map((cell) => {
              const req = cell.isCurrentMonth ? requests.get(cell.dateStr) : undefined;
              const pattern = req ? getPatternById(req.patternId) : undefined;
              const dayOfWeek = cell.date.getDay();
              const isSat = dayOfWeek === 6;
              const isSun = dayOfWeek === 0;
              const todayStr = formatDate(new Date());
              const isCurrentDay = cell.dateStr === todayStr;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => {
                    if (cell.isCurrentMonth) openDayModal(cell.dateStr);
                  }}
                  disabled={!cell.isCurrentMonth}
                  className={cn(
                    "relative flex flex-col items-center rounded-lg py-1 min-h-[56px] transition-all duration-fast",
                    cell.isCurrentMonth
                      ? "hover:bg-bg-tertiary active:scale-[0.96] cursor-pointer"
                      : "opacity-30 cursor-default",
                    req ? `border ${getAvailabilityBg(req.availability)}` : "border border-transparent",
                    isCurrentDay && "ring-2 ring-system-blue/40"
                  )}
                >
                  {/* Date number */}
                  <span
                    className={cn(
                      "text-xs font-medium leading-tight",
                      !cell.isCurrentMonth
                        ? "text-text-tertiary"
                        : isSun
                          ? "text-system-red"
                          : isSat
                            ? "text-system-blue"
                            : "text-text-primary"
                    )}
                  >
                    {cell.date.getDate()}
                  </span>

                  {/* Pattern short name + availability icon */}
                  {req && (
                    <div className="flex flex-col items-center gap-0 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        {getAvailabilityIcon(req.availability)}
                        {pattern && (
                          <span className="text-[10px] font-medium text-text-secondary truncate max-w-[36px]">
                            {pattern.shortName}
                          </span>
                        )}
                      </div>
                      {(req.customStartTime || req.customEndTime) && (
                        <span className="text-[8px] text-text-tertiary leading-tight">
                          {req.customStartTime || ""}~{req.customEndTime || ""}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Note indicator */}
                  {req?.note && (
                    <MessageSquare size={8} className="absolute top-0.5 right-0.5 text-text-tertiary" />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-separator">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-1">
              <div className={cn("w-2.5 h-2.5 rounded-full", opt.bgColor, opt.color)} />
              <span className="text-[10px] text-text-secondary">
                {opt.value === "preferred" ? "ぜひ" : opt.value === "available" ? "可能" : "不可"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ================================================ */}
      {/* Footer: Submit button */}
      {/* ================================================ */}
      <div
        className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-bg-primary via-bg-primary to-transparent pt-6 z-40"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-lg mx-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending || requests.size === 0}
          >
            {isPending ? "処理中..." : isSubmitted ? "再提出する" : "提出する"}
          </Button>
        </div>
      </div>

      {/* ================================================ */}
      {/* Day Input Modal */}
      {/* ================================================ */}
      <Modal
        isOpen={selectedDate !== null}
        onClose={closeDayModal}
        title={selectedDate ? formatSelectedDate(selectedDate) : ""}
      >
        <div className="space-y-5">
          {/* Availability selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              出勤可否
            </label>
            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setModalAvailability(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-fast",
                    modalAvailability === opt.value
                      ? `${opt.bgColor} ring-2 ring-current ${opt.color}`
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      modalAvailability === opt.value
                        ? "border-current bg-current"
                        : "border-text-tertiary"
                    )}
                  >
                    {modalAvailability === opt.value && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shift pattern selection */}
          {modalAvailability !== "unavailable" && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                希望シフトパターン
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => setModalPatternId(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-fast text-sm",
                    modalPatternId === null
                      ? "bg-system-blue/15 text-system-blue font-medium"
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
                  )}
                >
                  指定なし
                </button>
                {patterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => setModalPatternId(pattern.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-fast text-sm",
                      modalPatternId === pattern.id
                        ? "bg-system-blue/15 text-system-blue font-medium"
                        : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
                    )}
                  >
                    <span>{pattern.name}</span>
                    <span className="text-xs opacity-70">
                      {pattern.startTime}〜{pattern.endTime}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Time Selection */}
          {modalAvailability !== "unavailable" && storeSettings && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                希望時間帯
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-text-secondary mb-1.5">出勤時刻</p>
                  <select
                    value={modalCustomStartTime ?? ""}
                    onChange={(e) => setModalCustomStartTime(e.target.value || null)}
                    className="w-full px-3 py-2.5 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm transition-all duration-fast focus:ring-2 focus:ring-system-blue/40"
                  >
                    <option value="">パターン既定</option>
                    {storeSettings.allowedStartTimes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1.5">退勤時刻</p>
                  <select
                    value={modalCustomEndTime ?? ""}
                    onChange={(e) => setModalCustomEndTime(e.target.value || null)}
                    className="w-full px-3 py-2.5 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm transition-all duration-fast focus:ring-2 focus:ring-system-blue/40"
                  >
                    <option value="">パターン既定</option>
                    {storeSettings.allowedEndTimes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              備考
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="早上がり希望、遅出希望など..."
              rows={2}
              className="
                w-full px-3 py-2.5
                bg-bg-tertiary text-text-primary
                rounded-lg border-none outline-none
                placeholder:text-text-tertiary
                text-sm resize-none
                transition-all duration-fast
                focus:ring-2 focus:ring-system-blue/40
              "
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={clearDayRequest}
            >
              クリア
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={saveDayRequest}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================ */}
      {/* Submit Confirmation Modal */}
      {/* ================================================ */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="シフト希望を提出"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {year}年{month}月のシフト希望を提出します。
            <br />
            入力済み: <span className="font-semibold text-text-primary">{filledCount}日分</span>
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={confirmSubmit}
              disabled={isPending}
            >
              {isPending ? "送信中..." : "提出する"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
