"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Wand2,
  Save,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  getShiftPatterns,
  getShiftRequests,
  getConfirmedShifts,
  saveConfirmedShifts,
  publishShifts,
} from "@/actions/shifts";
import { getStaffList } from "@/actions/staff";
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
  ConfirmedShiftWithDetails,
} from "@/types";

// セル識別用キー生成関数（staffIdに_が含まれるため::を区切りに使用）
function cellKey(staffId: string, date: string): string {
  return `${staffId}::${date}`;
}
function parseCellKey(key: string): { staffId: string; date: string } {
  const idx = key.lastIndexOf("::");
  return { staffId: key.slice(0, idx), date: key.slice(idx + 2) };
}

export default function AdminShiftsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [staffList, setStaffList] = useState<StaffPublic[]>([]);
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);
  const [requests, setRequests] = useState<ShiftRequestWithDetails[]>([]);
  const [confirmedShifts, setConfirmedShifts] = useState<
    ConfirmedShiftWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Grid editing state: cellKey -> patternId
  const [grid, setGrid] = useState<Map<string, string>>(new Map());
  const [gridCustomTimes, setGridCustomTimes] = useState<Map<string, { startTime: string; endTime: string }>>(new Map());
  const [dirty, setDirty] = useState(false);

  // Edit modal
  const [editCell, setEditCell] = useState<{
    staffId: string;
    staffName: string;
    date: string;
  } | null>(null);

  const yearMonth = formatYearMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  // Week period management
  const weekPeriods = (() => {
    const periods: { start: number; end: number; label: string }[] = [];
    for (let s = 1; s <= daysInMonth; s += 7) {
      const e = Math.min(s + 6, daysInMonth);
      periods.push({ start: s, end: e, label: `${s}日〜${e}日` });
    }
    return periods;
  })();
  const [weekIndex, setWeekIndex] = useState(0);
  const currentPeriod = weekPeriods[weekIndex] || weekPeriods[0];
  const days = currentPeriod ? allDays.filter(d => d >= currentPeriod.start && d <= currentPeriod.end) : allDays;

  // Determine if the current month is published
  const isPublished = useMemo(() => {
    return (
      confirmedShifts.length > 0 &&
      confirmedShifts.every((s) => s.status === "published")
    );
  }, [confirmedShifts]);

  const hasDrafts = useMemo(() => {
    return confirmedShifts.some((s) => s.status === "draft");
  }, [confirmedShifts]);

  // Request map for quick lookup
  const requestMap = useMemo(() => {
    const m = new Map<string, ShiftRequestWithDetails>();
    for (const r of requests) {
      m.set(cellKey(r.staffId, r.date), r);
    }
    return m;
  }, [requests]);

  // Pattern map
  const patternMap = useMemo(() => {
    const m = new Map<string, ShiftPattern>();
    for (const p of patterns) {
      m.set(p.id, p);
    }
    return m;
  }, [patterns]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, patRes, reqRes, confRes] = await Promise.all([
        getStaffList(),
        getShiftPatterns(),
        getShiftRequests(year, month),
        getConfirmedShifts(year, month),
      ]);

      if (staffRes.success)
        setStaffList(staffRes.data.filter((s) => s.isActive));
      if (patRes.success) setPatterns(patRes.data);
      if (reqRes.success) setRequests(reqRes.data);
      if (confRes.success) setConfirmedShifts(confRes.data);

      // Initialize grid from confirmed shifts
      if (confRes.success) {
        const newGrid = new Map<string, string>();
        const newCustomTimes = new Map<string, { startTime: string; endTime: string }>();
        for (const s of confRes.data) {
          const key = cellKey(s.staffId, s.date);
          newGrid.set(key, s.patternId);
          if (s.customStartTime || s.customEndTime) {
            newCustomTimes.set(key, {
              startTime: s.customStartTime || "",
              endTime: s.customEndTime || "",
            });
          }
        }
        setGrid(newGrid);
        setGridCustomTimes(newCustomTimes);
      }

      setDirty(false);
    } catch {
      toast.error("データの取得に失敗しました");
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
    setWeekIndex(0);
  };

  const goNext = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
    setWeekIndex(0);
  };

  // --- Cell Edit ---
  const setCellPattern = (staffId: string, date: string, patternId: string) => {
    const key = cellKey(staffId, date);
    setGrid((prev) => {
      const next = new Map(prev);
      if (patternId === "") {
        next.delete(key);
      } else {
        next.set(key, patternId);
      }
      return next;
    });
    setDirty(true);
  };

  // --- Auto-fill from requests ---
  const handleAutoFill = () => {
    const newGrid = new Map(grid);
    const newCustomTimes = new Map(gridCustomTimes);
    let filled = 0;

    for (const staff of staffList) {
      for (const day of allDays) {
        const dateStr = formatDate(new Date(year, month - 1, day));
        const key = cellKey(staff.id, dateStr);
        const request = requestMap.get(key);

        if (request) {
          if (
            request.availability === "available" ||
            request.availability === "preferred"
          ) {
            if (request.patternId) {
              newGrid.set(key, request.patternId);
              filled++;
            } else if (patterns.length > 0) {
              newGrid.set(key, patterns[0].id);
              filled++;
            }
            if (request.customStartTime || request.customEndTime) {
              newCustomTimes.set(key, {
                startTime: request.customStartTime || "",
                endTime: request.customEndTime || "",
              });
            }
          } else if (request.availability === "unavailable") {
            newGrid.delete(key);
            newCustomTimes.delete(key);
          }
        }
      }
    }

    setGrid(newGrid);
    setGridCustomTimes(newCustomTimes);
    setDirty(true);
    if (filled > 0) {
      toast.success(`${filled}件のシフトを希望から割り当てました`);
    } else {
      toast("希望データがありません。先にスタッフがシフト希望を提出してください。", { icon: "ℹ️" });
    }
  };

  // --- Save ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const shiftsToSave: { staffId: string; date: string; patternId: string; customStartTime?: string; customEndTime?: string }[] =
        [];
      grid.forEach((patternId, key) => {
        const { staffId, date } = parseCellKey(key);
        const custom = gridCustomTimes.get(key);
        shiftsToSave.push({
          staffId,
          date,
          patternId,
          customStartTime: custom?.startTime || undefined,
          customEndTime: custom?.endTime || undefined,
        });
      });

      const result = await saveConfirmedShifts(shiftsToSave, yearMonth);
      if (result.success) {
        toast.success("シフトを保存しました");
        setDirty(false);
        await loadData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // --- Publish ---
  const handlePublish = async () => {
    if (dirty) {
      toast.error("先にシフトを保存してください");
      return;
    }

    if (grid.size === 0) {
      toast.error("公開するシフトがありません");
      return;
    }

    if (!confirm("シフトを公開しますか？スタッフに表示されるようになります。")) {
      return;
    }

    setPublishing(true);
    try {
      const result = await publishShifts(yearMonth);
      if (result.success) {
        toast.success(`${result.data.count}件のシフトを公開しました`);
        await loadData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("公開に失敗しました");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-full mx-auto px-4">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">シフト管理</h1>
          {isPublished ? (
            <Badge variant="success">公開済み</Badge>
          ) : hasDrafts ? (
            <Badge variant="warning">下書き</Badge>
          ) : (
            <Badge variant="neutral">未作成</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="secondary" onClick={handleAutoFill}>
            <Wand2 size={14} className="mr-1.5" />
            希望から一括割当
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            <Save size={14} className="mr-1.5" />
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishing || dirty}
          >
            <Send size={14} className="mr-1.5" />
            {publishing ? "公開中..." : "公開する"}
          </Button>
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
                          "text-center text-xs font-medium px-1 py-2 min-w-[44px] border-b border-separator",
                          dow === 0 && "text-system-red bg-system-red/5",
                          dow === 6 && "text-system-blue bg-system-blue/5",
                          dow !== 0 && dow !== 6 && "text-text-secondary",
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
                            staff.role === "admin"
                              ? "bg-system-purple"
                              : "bg-system-blue",
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
                      const dateStr = formatDate(
                        new Date(year, month - 1, day),
                      );
                      const key = cellKey(staff.id, dateStr);
                      const patternId = grid.get(key);
                      const pattern = patternId
                        ? patternMap.get(patternId)
                        : null;
                      const request = requestMap.get(key);
                      const dow = new Date(year, month - 1, day).getDay();

                      // Request indicator
                      let reqIndicator: string | null = null;
                      if (request) {
                        if (request.availability === "preferred")
                          reqIndicator = "border-system-green";
                        else if (request.availability === "available")
                          reqIndicator = "border-system-blue";
                        else if (request.availability === "unavailable")
                          reqIndicator = "border-system-red";
                      }

                      return (
                        <td
                          key={dateStr}
                          className={cn(
                            "text-center px-0.5 py-1 cursor-pointer transition-colors duration-fast hover:bg-system-blue/5",
                            dow === 0 && "bg-system-red/[0.03]",
                            dow === 6 && "bg-system-blue/[0.03]",
                          )}
                          onClick={() =>
                            setEditCell({
                              staffId: staff.id,
                              staffName: staff.name,
                              date: dateStr,
                            })
                          }
                        >
                          <div
                            className={cn(
                              "min-h-[32px] flex flex-col items-center justify-center rounded text-[11px] font-medium mx-auto",
                              reqIndicator && `border ${reqIndicator}`,
                              pattern && "px-1",
                            )}
                            style={
                              pattern
                                ? {
                                    backgroundColor: `${pattern.color || "var(--color-system-blue)"}20`,
                                    color:
                                      pattern.color ||
                                      "var(--color-system-blue)",
                                  }
                                : undefined
                            }
                          >
                            {pattern ? pattern.shortName : ""}
                            {(() => {
                              const ct = gridCustomTimes.get(key);
                              if (ct && (ct.startTime || ct.endTime)) {
                                return (
                                  <span className="text-[8px] opacity-70 leading-tight">
                                    {ct.startTime || ""}-{ct.endTime || ""}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </>
      )}

      {/* Edit Cell Modal */}
      <Modal
        isOpen={editCell !== null}
        onClose={() => setEditCell(null)}
        title={
          editCell
            ? `${editCell.staffName} - ${new Date(editCell.date + "T00:00:00").getMonth() + 1}/${new Date(editCell.date + "T00:00:00").getDate()}`
            : ""
        }
      >
        {editCell && (
          <div className="space-y-4">
            {/* Show request info */}
            {(() => {
              const req = requestMap.get(
                cellKey(editCell.staffId, editCell.date),
              );
              if (!req) return null;

              const availabilityLabel =
                req.availability === "preferred"
                  ? "希望"
                  : req.availability === "available"
                    ? "出勤可"
                    : "出勤不可";
              const availabilityVariant =
                req.availability === "preferred"
                  ? "success"
                  : req.availability === "available"
                    ? "info"
                    : "error";

              return (
                <div className="p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-xs text-text-secondary mb-1">
                    スタッフの希望
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={availabilityVariant as "success" | "info" | "error"}>
                      {availabilityLabel}
                    </Badge>
                    {req.patternName && (
                      <span className="text-xs text-text-primary">
                        {req.patternName}
                      </span>
                    )}
                  </div>
                  {req.note && (
                    <p className="text-xs text-text-secondary mt-1">
                      {req.note}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Pattern selection */}
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">
                シフトパターンを選択
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* OFF option */}
                <button
                  onClick={() => {
                    setCellPattern(editCell.staffId, editCell.date, "");
                    setEditCell(null);
                  }}
                  className={cn(
                    "p-3 rounded-lg text-sm font-medium text-center transition-all duration-fast border-2",
                    !grid.get(cellKey(editCell.staffId, editCell.date))
                      ? "border-system-blue bg-system-blue/10 text-system-blue"
                      : "border-separator bg-bg-tertiary text-text-secondary hover:border-system-blue/50",
                  )}
                >
                  OFF
                </button>

                {patterns.map((pat) => {
                  const currentPatternId = grid.get(
                    cellKey(editCell.staffId, editCell.date),
                  );
                  const isSelected = currentPatternId === pat.id;

                  return (
                    <button
                      key={pat.id}
                      onClick={() => {
                        setCellPattern(editCell.staffId, editCell.date, pat.id);
                        setEditCell(null);
                      }}
                      className={cn(
                        "p-3 rounded-lg text-sm font-medium text-center transition-all duration-fast border-2",
                        isSelected
                          ? "border-system-blue bg-system-blue/10"
                          : "border-separator bg-bg-tertiary hover:border-system-blue/50",
                      )}
                      style={{
                        color: pat.color || "var(--color-text-primary)",
                      }}
                    >
                      <div className="font-semibold">{pat.shortName}</div>
                      <div className="text-[11px] text-text-secondary mt-0.5">
                        {pat.startTime}-{pat.endTime}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Time */}
            {grid.get(cellKey(editCell.staffId, editCell.date)) && (
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">
                  時間帯を調整
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">出勤</p>
                    <input
                      type="time"
                      value={gridCustomTimes.get(cellKey(editCell.staffId, editCell.date))?.startTime || ""}
                      onChange={(e) => {
                        const k = cellKey(editCell.staffId, editCell.date);
                        const existing = gridCustomTimes.get(k) || { startTime: "", endTime: "" };
                        const next = new Map(gridCustomTimes);
                        next.set(k, { ...existing, startTime: e.target.value });
                        setGridCustomTimes(next);
                        setDirty(true);
                      }}
                      className="w-full px-3 py-2 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-system-blue/40"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">退勤</p>
                    <input
                      type="time"
                      value={gridCustomTimes.get(cellKey(editCell.staffId, editCell.date))?.endTime || ""}
                      onChange={(e) => {
                        const k = cellKey(editCell.staffId, editCell.date);
                        const existing = gridCustomTimes.get(k) || { startTime: "", endTime: "" };
                        const next = new Map(gridCustomTimes);
                        next.set(k, { ...existing, endTime: e.target.value });
                        setGridCustomTimes(next);
                        setDirty(true);
                      }}
                      className="w-full px-3 py-2 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-system-blue/40"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
