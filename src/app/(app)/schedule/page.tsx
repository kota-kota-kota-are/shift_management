"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Clock, CalendarDays } from "lucide-react";
import { getConfirmedShifts, getShiftPatterns } from "@/actions/shifts";
import { getSessionData } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { cn, formatDate, getDaysInMonth, getFirstDayOfMonth, calculateWorkingMinutes } from "@/lib/utils";
import type { ConfirmedShiftWithDetails, ShiftPattern, SessionData } from "@/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function SchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [shifts, setShifts] = useState<ConfirmedShiftWithDetails[]>([]);
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftsResult, patternsResult, sessionData] = await Promise.all([
        getConfirmedShifts(year, month),
        getShiftPatterns(),
        getSessionData(),
      ]);

      if (shiftsResult.success) setShifts(shiftsResult.data);
      if (patternsResult.success) setPatterns(patternsResult.data);
      setSession(sessionData);
    } catch (e) {
      console.error("Failed to load schedule data:", e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Navigation ---
  const goPrev = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  // --- Calendar data ---
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month); // 0=Sun

  // Build a map: date -> shifts for that date
  const shiftsByDate = new Map<string, ConfirmedShiftWithDetails[]>();
  for (const s of shifts) {
    const existing = shiftsByDate.get(s.date) || [];
    existing.push(s);
    shiftsByDate.set(s.date, existing);
  }

  // My shifts for summary
  const myShifts = session
    ? shifts.filter((s) => s.staffId === session.staffId)
    : [];

  const workDays = myShifts.length;
  const totalMinutes = myShifts.reduce((acc, s) => {
    const pat = patterns.find((p) => p.id === s.patternId);
    if (!pat) return acc;
    return acc + calculateWorkingMinutes(pat.startTime, pat.endTime, pat.breakMinutes);
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainMinutes = totalMinutes % 60;

  // Calendar grid cells (fill leading blanks for alignment)
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Selected date modal data
  const selectedShifts = selectedDate ? shiftsByDate.get(selectedDate) || [] : [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-text-primary">勤務表</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-system-blue/15 flex items-center justify-center">
              <CalendarDays size={16} className="text-system-blue" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">出勤日数</p>
              <p className="text-lg font-semibold text-text-primary">{workDays}日</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-system-green/15 flex items-center justify-center">
              <Clock size={16} className="text-system-green" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">推定勤務時間</p>
              <p className="text-lg font-semibold text-text-primary">
                {totalHours}h{remainMinutes > 0 ? `${remainMinutes}m` : ""}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Month Navigation */}
      <Card padding="sm" className="mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors duration-fast"
          >
            <ChevronLeft size={20} className="text-system-blue" />
          </button>
          <span className="text-lg font-semibold text-text-primary">
            {year}年{month}月
          </span>
          <button
            onClick={goNext}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors duration-fast"
          >
            <ChevronRight size={20} className="text-system-blue" />
          </button>
        </div>
      </Card>

      {/* Calendar */}
      <Card padding="sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={cn(
                    "text-center text-xs font-medium py-1.5",
                    i === 0 && "text-system-red",
                    i === 6 && "text-system-blue",
                    i !== 0 && i !== 6 && "text-text-secondary",
                  )}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`blank-${idx}`} className="aspect-square" />;
                }

                const dateStr = formatDate(new Date(year, month - 1, day));
                const dayOfWeek = new Date(year, month - 1, day).getDay();
                const dayShifts = shiftsByDate.get(dateStr) || [];
                const myDayShift = dayShifts.find(
                  (s) => s.staffId === session?.staffId,
                );

                const isOff = !myDayShift;
                const todayStr = formatDate(new Date());
                const isTodayCell = dateStr === todayStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-fast relative",
                      isTodayCell && "ring-2 ring-system-blue",
                      myDayShift && "bg-system-blue/10",
                      isOff && !isTodayCell && "bg-bg-tertiary/50",
                      "hover:bg-system-blue/5 active:scale-95",
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium text-xs",
                        dayOfWeek === 0 && "text-system-red",
                        dayOfWeek === 6 && "text-system-blue",
                        dayOfWeek !== 0 && dayOfWeek !== 6 && "text-text-primary",
                      )}
                    >
                      {day}
                    </span>
                    {myDayShift ? (
                      <span
                        className="text-[10px] font-medium mt-0.5 px-1 rounded"
                        style={{
                          color: myDayShift.patternColor || "var(--color-system-blue)",
                        }}
                      >
                        {myDayShift.patternShortName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-tertiary mt-0.5">
                        OFF
                      </span>
                    )}
                    {dayShifts.length > 0 && (
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {dayShifts.length > 3 ? (
                          <span className="w-1 h-1 rounded-full bg-system-blue" />
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Day Detail Modal */}
      <Modal
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        title={
          selectedDate
            ? `${new Date(selectedDate + "T00:00:00").getMonth() + 1}/${new Date(selectedDate + "T00:00:00").getDate()}（${WEEKDAY_LABELS[new Date(selectedDate + "T00:00:00").getDay()]}）のシフト`
            : ""
        }
      >
        {selectedShifts.length === 0 ? (
          <p className="text-text-secondary text-sm py-4 text-center">
            この日のシフトはありません
          </p>
        ) : (
          <div className="space-y-2">
            {selectedShifts.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  s.staffId === session?.staffId
                    ? "bg-system-blue/10"
                    : "bg-bg-tertiary",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-8 rounded-full"
                    style={{
                      backgroundColor:
                        s.patternColor || "var(--color-system-blue)",
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {s.staffName}
                      {s.staffId === session?.staffId && (
                        <span className="text-system-blue ml-1 text-xs">
                          (自分)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {s.patternName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">
                    {s.patternStartTime} - {s.patternEndTime}
                  </p>
                  <Badge variant="info">{s.patternShortName}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
