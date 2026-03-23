"use client";

import { useState, useEffect } from "react";
import { Search, BookOpen, X } from "lucide-react";
import { getSessionData } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SessionData } from "@/types";

import GettingStartedSection from "@/components/help/getting-started";
import StaffHomeSection from "@/components/help/staff-home";
import ShiftRequestSection from "@/components/help/shift-request-guide";
import ScheduleSection from "@/components/help/schedule-guide";
import AdminDashboardSection from "@/components/help/admin-dashboard-guide";
import AdminShiftsSection from "@/components/help/admin-shifts-guide";
import AdminRequestsSection from "@/components/help/admin-requests-guide";
import AdminStaffSettingsSection from "@/components/help/admin-staff-settings-guide";
import NewFeaturesSection from "@/components/help/new-features-guide";

const SECTION_TAGS = {
  staff: ["getting-started", "staff-home", "shift-request", "schedule", "new-features"],
  admin: ["getting-started", "staff-home", "shift-request", "schedule", "admin-dashboard", "admin-shifts", "admin-requests", "admin-staff-settings", "new-features"],
};

const SECTION_LABELS: Record<string, string> = {
  "getting-started": "はじめに",
  "staff-home": "ホーム画面",
  "shift-request": "シフト希望提出",
  "schedule": "勤務表",
  "admin-dashboard": "ダッシュボード",
  "admin-shifts": "シフト管理",
  "admin-requests": "希望編集",
  "admin-staff-settings": "スタッフ・設定",
  "new-features": "新機能ガイド",
};

export default function HelpPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    getSessionData().then((s) => setSession(s));
  }, []);

  const role = session?.role ?? "staff";
  const visibleSections = SECTION_TAGS[role] ?? SECTION_TAGS.staff;

  const filteredSections = activeFilter
    ? visibleSections.filter((s) => s === activeFilter)
    : visibleSections;

  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-system-blue/15 flex items-center justify-center">
            <BookOpen size={20} className="text-system-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">使い方ガイド</h1>
            <p className="text-sm text-text-secondary">
              {role === "admin" ? "管理者向け" : "スタッフ向け"}マニュアル
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card padding="sm" className="mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キーワードで検索..."
            className="w-full pl-9 pr-8 py-2.5 bg-bg-tertiary text-text-primary rounded-lg border-none outline-none text-sm placeholder:text-text-tertiary focus:ring-2 focus:ring-system-blue/40 transition-all duration-fast"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </Card>

      {/* Filter Tags */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-fast",
            activeFilter === null
              ? "bg-system-blue text-white"
              : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
          )}
        >
          すべて
        </button>
        {visibleSections.map((section) => (
          <button
            key={section}
            onClick={() => setActiveFilter(activeFilter === section ? null : section)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-fast",
              activeFilter === section
                ? "bg-system-blue text-white"
                : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
            )}
          >
            {SECTION_LABELS[section]}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {filteredSections.includes("getting-started") && (
          <GettingStartedSection searchQuery={searchQuery} />
        )}
        {filteredSections.includes("staff-home") && (
          <StaffHomeSection searchQuery={searchQuery} />
        )}
        {filteredSections.includes("shift-request") && (
          <ShiftRequestSection searchQuery={searchQuery} />
        )}
        {filteredSections.includes("schedule") && (
          <ScheduleSection searchQuery={searchQuery} />
        )}
        {filteredSections.includes("admin-dashboard") && (
          <AdminDashboardSection searchQuery={searchQuery} />
        )}
        {filteredSections.includes("admin-shifts") && (
          <AdminShiftsSection searchQuery={searchQuery} />
        )}
        {filteredSections.includes("admin-requests") && (
          <AdminRequestsSection searchQuery={searchQuery} />
        )}
        {filteredSections.includes("admin-staff-settings") && (
          <AdminStaffSettingsSection searchQuery={searchQuery} />
        )}
        {filteredSections.includes("new-features") && (
          <NewFeaturesSection searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}
