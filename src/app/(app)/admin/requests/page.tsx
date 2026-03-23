"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  X,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getShiftPatterns,
  getShiftRequests,
  adminUpdateShiftRequest,
} from "@/actions/shifts";
import { getStaffList } from "@/actions/staff";
import { getStoreSettings } from "@/actions/settings";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  cn,
  formatDate,
  formatYearMonth,
  getDaysInMonth,
} from "@/lib/utils";
import type {
  StaffPublic,
  ShiftPattern,
  ShiftRequestWithDetails,
  Availability,
  ParsedStoreSettings,
} from "@/types";

const AVAILABILITY_OPTIONS: {
  value: Availability;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  { value: "preferred", label: "ぜひ出勤したい", color: "text-system-green", bgColor: "bg-system-green/15" },
  { value: "available", label: "出勤可能", color: "text-system-blue", bgColor: "bg-system-blue/15" },
  { value: "unavailable", label: "出勤不可", color: "text-system-red", bgColor: "bg-system-red/15" },
];

function cellKey(staffId: string, date: string): string {
  return `${staffId}::${date}`;
}

export default function AdminRequestsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(
    now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2
  );
  const [yearForInit] = useState(
    now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear()
  );

  useEffect(() => {
    if (month <= 12 && month >= 1) setYear(yearForInit);
  }, [yearForInit, month]);

  const [staffList, setStaffList] = useState<StaffPublic[]>([]);
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);
  const [requests, setRequests] = useState<ShiftRequestWithDetails[]>([]);
  const [settings, setSettings] = useState<ParsedStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Week period
  const daysInMonth = getDaysInMonth(year, month);
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekPeriods = useMemo(() => {
    const periods: { start: number; end: number; label: string }[] = [];
    for (let s = 1; s <= daysInMonth; s += 7) {
      const e = Math.min(s + 6, daysInMonth);
      periods.push({ start: s, end: e, label: `${s}日〜${e}日` });
    }
    return periods;
  }, [daysInMonth]);
  const [weekIndex, setWeekIndex] = useState(0);
  const currentPeriod = weekPeriods[weekIndex] || weekPeriods[0];
  const days = currentPeriod
    ? allDays.filter((d) => d >= currentPeriod.start && d <= currentPeriod.end)
    : allDays;

  // Edit modal
  const [editRequest, setEditRequest] = useState<ShiftRequestWithDetails | null>(null);
  const [editAvailability, setEditAvailability] = useState<Availability>("available");
  const [editPatternId, setEditPatternId] = useState<string | null>(null);
  const [editCustomStart, setEditCustomStart] = useState<string>("");
  const [editCustomEnd, setEditCustomEnd] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");

  const requestMap = useMemo(() => {
    const m = new Map<string, ShiftRequestWithDetails>();
    for (const r of requests) {
      m.set(cellKey(r.staffId, r.date), r);
    }
    return m;
  }, [requests]);

  const patternMap = useMemo(() => {
    const m = new Map<string, ShiftPattern>();
    for (const p of patterns) m.set(p.id, p);
    return m;
  }, [patterns]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, patRes, reqRes, settingsRes] = await Promise.all([
        getStaffList(),
        getShiftPatterns(),
        getShiftRequests(year, month),
        getStoreSettings(),
      ]);
      if (staffRes.success) setStaffList(staffRes.data.filter((s) => s.isActive));
      if (patRes.success) setPatterns(patRes.data);
      if (reqRes.success) setRequests(reqRes.data);
      if (settingsRes.success) setSettings(settingsRes.data);
    } catch {
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigation
  const goPrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
    setWeekIndex(0);
  };
  const goNext = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
    setWeekIndex(0);
  };

  // Open edit modal
  const openEdit = (req: ShiftRequestWithDetails) => {
    setEditRequest(req);
    setEditAvailability(req.availability);
    setEditPatternId(req.patternId);
    setEditCustomStart(req.customStartTime || "");
    setEditCustomEnd(req.customEndTime || "");
    setEditNote(req.note || "");
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editRequest) return;
    setSaving(true);
    try {
      const result = await adminUpdateShiftRequest(editRequest.id, {
        availability: editAvailability,
        patternId: editPatternId,
        customStartTime: editCustomStart || null,
        customEndTime: editCustomEnd || null,
        note: editNote || null,
      });
      if (result.success) {
        toast.success("シフト希望を更新しました");
        setEditRequest(null);
        await loadData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  const getAvailabilityBadge = (availability: Availability) => {
    switch (availability) {
      case "preferred":
        return <Star size={12} className="text-system-green" />;
      case "available":
        return <Check size={12} className="text-system-blue" />;
      case "unavailable":
        return <X size={12} className="text-system-red" />;
    }
  };

  return (
    <div className="max-w-full mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">シフト希望編集</h1>
          <p className="text-sm text-text-secondary mt-1">
            スタッフの希望を確認・編集できます
          </p>
        </div>
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

      {/* Week Period Selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {weekPeriods.map((period, idx) => (
          <button
            key={idx}
            onClick={() => setWeekIndex(idx)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-fast",
              weekIndex === idx
                ? "bg-system-blue text-white"
                : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
            )}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
        <p className="text-xs text-text-tertiary mb-2 sm:hidden">← 横スクロールで全日程を確認できます</p>
        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-bg-secondary text-left text-xs font-medium text-text-secondary px-3 py-2 min-w-[100px] border-b border-r border-separator">
                    スタッフ
                  </th>
                  {days.map((day) => {
                    const d = new Date(year, month - 1, day);
                    const dow = d.getDay();
                    return (
                      <th
                        key={day}
                        className={cn(
                          "text-center text-xs font-medium px-1 py-2 min-w-[60px] border-b border-separator",
                          dow === 0 && "text-system-red bg-system-red/5",
                          dow === 6 && "text-system-blue bg-system-blue/5",
                          dow !== 0 && dow !== 6 && "text-text-secondary"
                        )}
                      >
                        <div>{day}</div>
                        <div className="text-[10px]">{weekdays[dow]}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.id} className="border-b border-separator last:border-b-0">
                    <td className="sticky left-0 z-10 bg-bg-secondary px-3 py-2 border-r border-separator">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium",
                            staff.role === "admin" ? "bg-system-purple" : "bg-system-blue"
                          )}
                        >
                          {staff.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-text-primary whitespace-nowrap">
                          {staff.name}
                        </span>
                      </div>
                    </td>
                    {days.map((day) => {
                      const dateStr = formatDate(new Date(year, month - 1, day));
                      const key = cellKey(staff.id, dateStr);
                      const req = requestMap.get(key);
                      const dow = new Date(year, month - 1, day).getDay();

                      return (
                        <td
                          key={dateStr}
                          className={cn(
                            "text-center px-0.5 py-1 cursor-pointer transition-colors duration-fast hover:bg-system-blue/5",
                            dow === 0 && "bg-system-red/[0.03]",
                            dow === 6 && "bg-system-blue/[0.03]"
                          )}
                          onClick={() => req && openEdit(req)}
                        >
                          {req ? (
                            <div
                              className={cn(
                                "min-h-[36px] flex flex-col items-center justify-center rounded text-[10px] font-medium mx-auto px-1",
                                req.availability === "preferred" && "bg-system-green/10 border border-system-green/30",
                                req.availability === "available" && "bg-system-blue/10 border border-system-blue/30",
                                req.availability === "unavailable" && "bg-system-red/10 border border-system-red/30"
                              )}
                            >
                              <div className="flex items-center gap-0.5">
                                {getAvailabilityBadge(req.availability)}
                                {req.patternName && (
                                  <span className="truncate max-w-[40px]">
                                    {req.patternName}
                                  </span>
                                )}
                              </div>
                              {(req.customStartTime || req.customEndTime) && (
                                <span className="text-[8px] text-text-tertiary">
                                  {req.customStartTime || ""}~{req.customEndTime || ""}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="min-h-[36px] flex items-center justify-center text-text-tertiary text-[10px]">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submission stats */}
          <div className="mt-4 pt-3 border-t border-separator">
            <div className="flex flex-wrap gap-2">
              {staffList.map((staff) => {
                const staffReqs = requests.filter((r) => r.staffId === staff.id);
                const hasSubmitted = staffReqs.length > 0;
                return (
                  <Badge
                    key={staff.id}
                    variant={hasSubmitted ? "success" : "warning"}
                  >
                    {staff.name} {hasSubmitted ? `✓ ${staffReqs.length}日` : "未提出"}
                  </Badge>
                );
              })}
            </div>
          </div>
        </Card>
        </>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={editRequest !== null}
        onClose={() => setEditRequest(null)}
        title={
          editRequest
            ? `${editRequest.staffName} - ${new Date(editRequest.date + "T00:00:00").getMonth() + 1}/${new Date(editRequest.date + "T00:00:00").getDate()}`
            : ""
        }
      >
        {editRequest && (
          <div className="space-y-5">
            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                出勤可否
              </label>
              <div className="space-y-2">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEditAvailability(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-fast",
                      editAvailability === opt.value
                        ? `${opt.bgColor} ring-2 ring-current ${opt.color}`
                        : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        editAvailability === opt.value
                          ? "border-current bg-current"
                          : "border-text-tertiary"
                      )}
                    >
                      {editAvailability === opt.value && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern */}
            {editAvailability !== "unavailable" && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  シフトパターン
                </label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setEditPatternId(null)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-fast",
                      editPatternId === null
                        ? "bg-system-blue/15 text-system-blue font-medium"
                        : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
                    )}
                  >
                    指定なし
                  </button>
                  {patterns.map((pat) => (
                    <button
                      key={pat.id}
                      onClick={() => setEditPatternId(pat.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-fast",
                        editPatternId === pat.id
                          ? "bg-system-blue/15 text-system-blue font-medium"
                          : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
                      )}
                    >
                      <span>{pat.name}</span>
                      <span className="text-xs opacity-70">
                        {pat.startTime}〜{pat.endTime}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Times */}
            {editAvailability !== "unavailable" && settings && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  希望時間帯
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-text-secondary mb-1.5">出勤時刻</p>
                    <select
                      value={editCustomStart}
                      onChange={(e) => setEditCustomStart(e.target.value)}
                      className="w-full px-3 py-2.5 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-system-blue/40"
                    >
                      <option value="">パターン既定</option>
                      {settings.allowedStartTimes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1.5">退勤時刻</p>
                    <select
                      value={editCustomEnd}
                      onChange={(e) => setEditCustomEnd(e.target.value)}
                      className="w-full px-3 py-2.5 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-system-blue/40"
                    >
                      <option value="">パターン既定</option>
                      {settings.allowedEndTimes.map((t) => (
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
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none placeholder:text-text-tertiary text-sm resize-none focus:ring-2 focus:ring-system-blue/40"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setEditRequest(null)}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
