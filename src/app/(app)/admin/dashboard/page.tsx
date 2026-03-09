import { getConfirmedShifts, getShiftRequests } from "@/actions/shifts";
import { getStaffList } from "@/actions/staff";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatYearMonth } from "@/lib/utils";
import { Users, ClipboardList, AlertTriangle, CheckCircle } from "lucide-react";
import type { ConfirmedShiftWithDetails, ShiftRequestWithDetails, StaffPublic } from "@/types";

export default async function AdminDashboardPage() {
  const today = new Date();
  const todayStr = formatDate(today);
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // Fetch data in parallel
  const [shiftsResult, requestsResult, staffResult] = await Promise.all([
    getConfirmedShifts(year, month),
    getShiftRequests(year, month),
    getStaffList(),
  ]);

  const shifts: ConfirmedShiftWithDetails[] = shiftsResult.success
    ? shiftsResult.data
    : [];
  const requests: ShiftRequestWithDetails[] = requestsResult.success
    ? requestsResult.data
    : [];
  const staffList: StaffPublic[] = staffResult.success
    ? staffResult.data.filter((s) => s.isActive)
    : [];

  // Today's shifts
  const todayShifts = shifts.filter((s) => s.date === todayStr);

  // Shift request submission status (unique staff who submitted for this month)
  const submittedStaffIds = new Set(requests.map((r) => r.staffId));
  const submittedCount = staffList.filter((s) => submittedStaffIds.has(s.id)).length;
  const totalActiveStaff = staffList.length;
  const progressPercent = totalActiveStaff > 0
    ? Math.round((submittedCount / totalActiveStaff) * 100)
    : 0;

  // Alerts: days with low staffing (less than 2 people)
  const MIN_STAFF = 2;
  const shiftsByDate = new Map<string, ConfirmedShiftWithDetails[]>();
  for (const s of shifts) {
    const existing = shiftsByDate.get(s.date) || [];
    existing.push(s);
    shiftsByDate.set(s.date, existing);
  }

  const lowStaffDays: { date: string; count: number }[] = [];
  // Check only future dates
  shiftsByDate.forEach((dayShifts, date) => {
    if (date >= todayStr && dayShifts.length < MIN_STAFF) {
      lowStaffDays.push({ date, count: dayShifts.length });
    }
  });
  lowStaffDays.sort((a, b) => a.date.localeCompare(b.date));

  // Draft vs published count
  const draftCount = shifts.filter((s) => s.status === "draft").length;
  const publishedCount = shifts.filter((s) => s.status === "published").length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">ダッシュボード</h1>
        <p className="text-sm text-text-secondary">
          {year}年{month}月{today.getDate()}日
        </p>
      </div>

      <div className="space-y-5">
        {/* Today's Shift Card */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-system-blue/15 flex items-center justify-center">
              <Users size={20} className="text-system-blue" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                今日のシフト
              </h2>
              <p className="text-xs text-text-secondary">
                出勤スタッフ {todayShifts.length}名
              </p>
            </div>
          </div>

          {todayShifts.length === 0 ? (
            <p className="text-sm text-text-secondary py-3 text-center bg-bg-tertiary rounded-lg">
              今日のシフトはありません
            </p>
          ) : (
            <div className="space-y-2">
              {todayShifts.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
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
        </Card>

        {/* Shift Request Submission Progress */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-system-green/15 flex items-center justify-center">
              <ClipboardList size={20} className="text-system-green" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                シフト希望提出状況
              </h2>
              <p className="text-xs text-text-secondary">
                {year}年{month}月分
              </p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text-secondary">
                提出済み {submittedCount} / {totalActiveStaff} 名
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-system-green rounded-full transition-all duration-normal"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {staffList.map((s) => (
              <Badge
                key={s.id}
                variant={submittedStaffIds.has(s.id) ? "success" : "warning"}
              >
                {s.name}
                {submittedStaffIds.has(s.id) ? " ✓" : " 未"}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Schedule Status */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-system-indigo/15 flex items-center justify-center">
              <CheckCircle size={20} className="text-system-indigo" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                シフト公開状況
              </h2>
              <p className="text-xs text-text-secondary">
                {year}年{month}月
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-bg-tertiary rounded-lg text-center">
              <p className="text-2xl font-bold text-system-orange">{draftCount}</p>
              <p className="text-xs text-text-secondary mt-1">下書き</p>
            </div>
            <div className="p-3 bg-bg-tertiary rounded-lg text-center">
              <p className="text-2xl font-bold text-system-green">{publishedCount}</p>
              <p className="text-xs text-text-secondary mt-1">公開済み</p>
            </div>
          </div>
        </Card>

        {/* Alerts */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-system-orange/15 flex items-center justify-center">
              <AlertTriangle size={20} className="text-system-orange" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                アラート
              </h2>
              <p className="text-xs text-text-secondary">人員不足の日</p>
            </div>
          </div>

          {lowStaffDays.length === 0 ? (
            <p className="text-sm text-text-secondary py-3 text-center bg-bg-tertiary rounded-lg">
              人員不足の日はありません
            </p>
          ) : (
            <div className="space-y-2">
              {lowStaffDays.slice(0, 5).map(({ date, count }) => {
                const d = new Date(date + "T00:00:00");
                const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
                return (
                  <div
                    key={date}
                    className="flex items-center justify-between p-3 bg-system-orange/5 border border-system-orange/20 rounded-lg"
                  >
                    <span className="text-sm font-medium text-text-primary">
                      {d.getMonth() + 1}/{d.getDate()}（{weekdays[d.getDay()]}）
                    </span>
                    <Badge variant="warning">
                      {count}名 / 最低{MIN_STAFF}名
                    </Badge>
                  </div>
                );
              })}
              {lowStaffDays.length > 5 && (
                <p className="text-xs text-text-secondary text-center pt-1">
                  他 {lowStaffDays.length - 5} 日
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
