"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Shield,
  User,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getStaffList, createStaff, updateStaff, resetPin } from "@/actions/staff";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { StaffPublic } from "@/types";

type ModalMode = "create" | "edit" | "resetPin" | null;

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffPublic | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "staff">("staff");
  const [formPin, setFormPin] = useState("");
  const [formMaxHours, setFormMaxHours] = useState("");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStaffList();
      if (result.success) {
        setStaffList(result.data);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("スタッフ一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // --- Modal Handlers ---
  const openCreateModal = () => {
    setFormName("");
    setFormRole("staff");
    setFormPin("");
    setFormMaxHours("");
    setSelectedStaff(null);
    setModalMode("create");
  };

  const openEditModal = (staff: StaffPublic) => {
    setFormName(staff.name);
    setFormRole(staff.role);
    setFormMaxHours(staff.weeklyMaxHours?.toString() || "");
    setSelectedStaff(staff);
    setModalMode("edit");
  };

  const openResetPinModal = (staff: StaffPublic) => {
    setFormPin("");
    setSelectedStaff(staff);
    setModalMode("resetPin");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedStaff(null);
  };

  // --- Submit Handlers ---
  const handleCreateSubmit = async () => {
    if (!formName.trim()) {
      toast.error("名前を入力してください");
      return;
    }
    if (!/^\d{4}$/.test(formPin)) {
      toast.error("PINは4桁の数字で入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("name", formName.trim());
      fd.set("role", formRole);
      fd.set("pin", formPin);
      if (formMaxHours) fd.set("weeklyMaxHours", formMaxHours);

      const result = await createStaff(fd);
      if (result.success) {
        toast.success(`${result.data.name} を追加しました`);
        closeModal();
        await loadStaff();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("スタッフの追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedStaff) return;
    if (!formName.trim()) {
      toast.error("名前を入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("id", selectedStaff.id);
      fd.set("name", formName.trim());
      fd.set("role", formRole);
      if (formMaxHours) fd.set("weeklyMaxHours", formMaxHours);

      const result = await updateStaff(fd);
      if (result.success) {
        toast.success(`${result.data.name} を更新しました`);
        closeModal();
        await loadStaff();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("スタッフの更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPinSubmit = async () => {
    if (!selectedStaff) return;
    if (!/^\d{4}$/.test(formPin)) {
      toast.error("PINは4桁の数字で入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPin(selectedStaff.id, formPin);
      if (result.success) {
        toast.success(`${selectedStaff.name} のPINをリセットしました`);
        closeModal();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("PINのリセットに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (staff: StaffPublic) => {
    const newActive = !staff.isActive;
    const fd = new FormData();
    fd.set("id", staff.id);
    fd.set("isActive", newActive.toString());

    try {
      const result = await updateStaff(fd);
      if (result.success) {
        toast.success(
          `${staff.name} を${newActive ? "有効化" : "無効化"}しました`,
        );
        await loadStaff();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("操作に失敗しました");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-text-primary">スタッフ管理</h1>
        <Button onClick={openCreateModal} size="sm">
          <Plus size={16} className="mr-1.5" />
          スタッフ追加
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <Card>
          <p className="text-center text-text-secondary py-8">
            スタッフが登録されていません
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card padding="sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-separator">
                    <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                      名前
                    </th>
                    <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                      ロール
                    </th>
                    <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                      ステータス
                    </th>
                    <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr
                      key={staff.id}
                      className={cn(
                        "border-b border-separator last:border-b-0",
                        !staff.isActive && "opacity-50",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                              staff.role === "admin"
                                ? "bg-system-purple"
                                : "bg-system-blue",
                            )}
                          >
                            {staff.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-text-primary">
                            {staff.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            staff.role === "admin" ? "info" : "neutral"
                          }
                        >
                          {staff.role === "admin" ? (
                            <span className="flex items-center gap-1">
                              <Shield size={12} />
                              管理者
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              スタッフ
                            </span>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={staff.isActive ? "success" : "error"}
                        >
                          {staff.isActive ? "有効" : "無効"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(staff)}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors duration-fast"
                            title="編集"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => openResetPinModal(staff)}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors duration-fast"
                            title="PINリセット"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(staff)}
                            className={cn(
                              "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors duration-fast",
                              staff.isActive
                                ? "text-system-red hover:bg-system-red/10"
                                : "text-system-green hover:bg-system-green/10",
                            )}
                            title={staff.isActive ? "無効化" : "有効化"}
                          >
                            {staff.isActive ? (
                              <UserX size={16} />
                            ) : (
                              <UserCheck size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {staffList.map((staff) => (
              <Card
                key={staff.id}
                padding="md"
                className={cn(!staff.isActive && "opacity-50")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium",
                        staff.role === "admin"
                          ? "bg-system-purple"
                          : "bg-system-blue",
                      )}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {staff.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            staff.role === "admin" ? "info" : "neutral"
                          }
                        >
                          {staff.role === "admin" ? "管理者" : "スタッフ"}
                        </Badge>
                        <Badge
                          variant={staff.isActive ? "success" : "error"}
                        >
                          {staff.isActive ? "有効" : "無効"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-separator">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditModal(staff)}
                    className="min-h-[44px]"
                  >
                    <Pencil size={14} className="mr-1" />
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openResetPinModal(staff)}
                    className="min-h-[44px]"
                  >
                    <KeyRound size={14} className="mr-1" />
                    PIN
                  </Button>
                  <Button
                    size="sm"
                    variant={staff.isActive ? "destructive" : "primary"}
                    onClick={() => handleToggleActive(staff)}
                    className="min-h-[44px]"
                  >
                    {staff.isActive ? (
                      <>
                        <UserX size={14} className="mr-1" />
                        無効化
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} className="mr-1" />
                        有効化
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalMode === "create" || modalMode === "edit"}
        onClose={closeModal}
        title={modalMode === "create" ? "スタッフ追加" : "スタッフ編集"}
      >
        <div className="space-y-4">
          <Input
            label="名前"
            name="name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="山田 太郎"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              ロール
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormRole("staff")}
                className={cn(
                  "flex-1 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-fast",
                  formRole === "staff"
                    ? "bg-system-blue text-white"
                    : "bg-bg-tertiary text-text-primary",
                )}
              >
                スタッフ
              </button>
              <button
                type="button"
                onClick={() => setFormRole("admin")}
                className={cn(
                  "flex-1 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-fast",
                  formRole === "admin"
                    ? "bg-system-purple text-white"
                    : "bg-bg-tertiary text-text-primary",
                )}
              >
                管理者
              </button>
            </div>
          </div>

          {modalMode === "create" && (
            <Input
              label="PIN（4桁の数字）"
              name="pin"
              type="password"
              value={formPin}
              onChange={(e) => setFormPin(e.target.value)}
              placeholder="0000"
              required
            />
          )}

          <Input
            label="週間最大勤務時間（任意）"
            name="weeklyMaxHours"
            type="number"
            value={formMaxHours}
            onChange={(e) => setFormMaxHours(e.target.value)}
            placeholder="40"
          />

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} className="flex-1">
              キャンセル
            </Button>
            <Button
              onClick={
                modalMode === "create" ? handleCreateSubmit : handleEditSubmit
              }
              disabled={submitting}
              className="flex-1"
            >
              {submitting
                ? "処理中..."
                : modalMode === "create"
                  ? "追加"
                  : "更新"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset PIN Modal */}
      <Modal
        isOpen={modalMode === "resetPin"}
        onClose={closeModal}
        title="PINリセット"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {selectedStaff?.name} の新しいPINを入力してください
          </p>

          <Input
            label="新しいPIN（4桁の数字）"
            name="newPin"
            type="password"
            value={formPin}
            onChange={(e) => setFormPin(e.target.value)}
            placeholder="0000"
            required
          />

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} className="flex-1">
              キャンセル
            </Button>
            <Button
              onClick={handleResetPinSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? "処理中..." : "リセット"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
