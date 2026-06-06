"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const CATEGORIES = [
  "Akademik",
  "Hafalan Qur'an",
  "Pekerjaan Rumah",
  "Ibadah Rutin",
  "Lainnya",
] as const;

type Category = (typeof CATEGORIES)[number];

type ChoreStatus = "ACTIVE" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "REVISION_NEEDED" | "CANCELLED";

interface Chore {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  rewardAmount: number;
  deadline: string;
  status: ChoreStatus;
  assignedToId: string;
  latestSubmission: { notes: string | null; mediaUrl: string | null; submittedAt: string } | null;
}

interface Child {
  id: string;
  fullName: string;
}

const STATUS_LABELS: Record<ChoreStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Aktif", color: "bg-blue-100 text-blue-700" },
  PENDING_REVIEW: { label: "Menunggu Review", color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-700" },
  REVISION_NEEDED: { label: "Perlu Revisi", color: "bg-orange-100 text-orange-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-gray-100 text-gray-500" },
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_FORM = {
  assignedToId: "",
  title: "",
  category: "Akademik" as Category,
  rewardAmount: "",
  deadline: "",
  description: "",
};

export function ChildTasksPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("active");

  const fetchData = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setIsLoading(true);
    try {
      const [choresRes, childrenRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/chores`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/family/children`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [choresData, childrenData] = await Promise.all([choresRes.json(), childrenRes.json()]);
      if (choresData.success) setChores(choresData.data);
      if (childrenData.success) setChildren(childrenData.data);
    } catch {
      setError("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assignedToId) { setFormError("Pilih anak terlebih dahulu"); return; }
    if (!formData.title.trim()) { setFormError("Judul tugas wajib diisi"); return; }
    if (!formData.rewardAmount || isNaN(Number(formData.rewardAmount)) || Number(formData.rewardAmount) <= 0) {
      setFormError("Reward harus berupa angka lebih dari 0");
      return;
    }
    if (!formData.deadline) { setFormError("Deadline wajib diisi"); return; }

    setIsSubmitting(true);
    setFormError("");
    try {
      const token = localStorage.getItem("accessToken");
      const deadline = new Date(formData.deadline);
      deadline.setUTCHours(23, 59, 59, 0);

      const res = await fetch(`${API_BASE_URL}/api/chores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          assignedToId: formData.assignedToId,
          title: formData.title.trim(),
          category: formData.category,
          rewardAmount: Number(formData.rewardAmount),
          deadline: deadline.toISOString(),
          description: formData.description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message ?? "Gagal membuat tugas"); return; }

      setChores((prev) => [data.data, ...prev]);
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setFormError("Gagal terhubung ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChore = async (choreId: string) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/chores/${choreId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setChores((prev) => prev.filter((c) => c.id !== choreId));
    } catch { /* ignore */ }
  };

  const filteredChores = chores.filter((c) => {
    if (activeTab === "active") return ["ACTIVE", "PENDING_REVIEW", "REVISION_NEEDED"].includes(c.status);
    if (activeTab === "completed") return ["APPROVED", "REJECTED", "CANCELLED"].includes(c.status);
    return true;
  });

  const childName = (id: string) => children.find((c) => c.id === id)?.fullName ?? "—";

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-['Montserrat',sans-serif] font-bold text-2xl sm:text-3xl text-black">
            Tugas Anak
          </h1>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">
            Kelola tantangan dan tugas untuk anak Anda
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark shadow-sm px-5 py-2.5 rounded-xl font-['Poppins',sans-serif] font-semibold text-sm text-white transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Buat Tugas Baru
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-['Lato',sans-serif] text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f3f4f6] rounded-xl p-1 mb-6 w-fit">
        {(["active", "completed", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-['Poppins',sans-serif] font-semibold text-sm transition-all ${
              activeTab === tab
                ? "bg-white text-bsi-teal-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "active" ? "Aktif" : tab === "completed" ? "Selesai" : "Semua"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filteredChores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-bsi-teal-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-['Montserrat',sans-serif] font-bold text-gray-600 text-lg mb-1">Belum Ada Tugas</p>
          <p className="font-['Lato',sans-serif] text-gray-400 text-sm mb-4">Buat tugas pertama untuk anak Anda</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white font-['Poppins',sans-serif] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Buat Tugas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredChores.map((chore) => {
            const status = STATUS_LABELS[chore.status];
            const isOverdue = chore.status === "ACTIVE" && new Date(chore.deadline) < new Date();
            return (
              <div key={chore.id} className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-5 flex flex-col gap-3">
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-['Poppins',sans-serif] font-bold text-[10px] tracking-widest uppercase mb-2 ${status.color}`}>
                      {status.label}
                    </span>
                    <h3 className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm leading-snug">
                      {chore.title}
                    </h3>
                    <p className="font-['Lato',sans-serif] text-gray-500 text-xs mt-0.5">
                      Untuk: <strong>{childName(chore.assignedToId)}</strong>
                    </p>
                  </div>
                  {chore.status === "ACTIVE" && (
                    <button
                      onClick={() => handleDeleteChore(chore.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
                      title="Batalkan tugas"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {chore.description && (
                  <p className="font-['Lato',sans-serif] text-gray-500 text-xs">{chore.description}</p>
                )}

                {/* Info */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1">
                    <div className="bg-bsi-orange-primary/10 px-2 py-0.5 rounded-full">
                      <span className="font-['Poppins',sans-serif] font-bold text-bsi-orange-primary text-xs">{chore.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-bsi-teal-primary">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    <span className="font-['Poppins',sans-serif] font-bold text-xs">{formatRupiah(chore.rewardAmount)}</span>
                  </div>
                </div>

                {/* Deadline */}
                <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-['Lato',sans-serif]">
                    {isOverdue ? "Kedaluwarsa: " : "Deadline: "}{formatDate(chore.deadline)}
                  </span>
                </div>

                {/* Latest submission note */}
                {chore.latestSubmission?.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <p className="font-['Lato',sans-serif] text-amber-700 text-xs">
                      Catatan: {chore.latestSubmission.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Chore Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg my-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-xl">
                Buat Tugas Baru
              </h2>
              <button onClick={() => { setShowForm(false); setFormError(""); setFormData(EMPTY_FORM); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-['Lato',sans-serif] text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateChore} className="space-y-4">
              {/* Assign to */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Untuk Anak
                </label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => handleFormChange("assignedToId", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-sm text-gray-900 bg-white focus:border-bsi-teal-primary focus:outline-none transition-colors"
                >
                  <option value="">-- Pilih Anak --</option>
                  {children.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  placeholder="Contoh: Hafal Surat Al-Fatihah"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-sm text-gray-900 bg-white focus:border-bsi-teal-primary focus:outline-none transition-colors placeholder:text-gray-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleFormChange("category", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-sm text-gray-900 bg-white focus:border-bsi-teal-primary focus:outline-none transition-colors"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Reward & Deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                    Reward (Rp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rewardAmount}
                    onChange={(e) => handleFormChange("rewardAmount", e.target.value)}
                    placeholder="50000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-sm text-gray-900 bg-white focus:border-bsi-teal-primary focus:outline-none transition-colors placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => handleFormChange("deadline", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-sm text-gray-900 bg-white focus:border-bsi-teal-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Deskripsi (opsional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Jelaskan lebih lanjut apa yang harus dilakukan anak..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-sm text-gray-900 bg-white focus:border-bsi-teal-primary focus:outline-none transition-colors placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(""); setFormData(EMPTY_FORM); }}
                  className="flex-1 bg-white border border-[#e0e7e7] hover:bg-gray-50 text-gray-600 font-['Poppins',sans-serif] font-bold text-sm py-3 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-60 text-white font-['Poppins',sans-serif] font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : null}
                  {isSubmitting ? "Menyimpan..." : "Buat Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
