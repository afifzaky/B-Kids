"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ChoreStatus =
  | "ACTIVE"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_NEEDED"
  | "EXPIRED"
  | "CANCELLED";

interface Chore {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rewardAmount: number;
  deadline: string;
  status: ChoreStatus;
  rejectionNote: string | null;
  createdAt: string;
  latestSubmission: {
    id: string;
    mediaUrl: string | null;
    notes: string | null;
    submittedAt: string;
    reviewedAt: string | null;
    reviewerNote: string | null;
    attempt: number;
  } | null;
}

type FilterTab = "ACTIVE" | "PENDING" | "COMPLETED" | "REJECTED";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeadline(dateStr: string): string {
  const deadline = new Date(dateStr);
  const diffMs = deadline.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Deadline lewat";
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  return `${diffDays} hari lagi`;
}

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  Akademik: { color: "text-bsi-orange-primary", bg: "bg-[rgba(237,139,0,0.1)]", icon: "📚" },
  "Hafalan Qur'an": { color: "text-bsi-teal-primary", bg: "bg-[rgba(0,124,128,0.1)]", icon: "📖" },
  "Pekerjaan Rumah": { color: "text-[#00bfb2]", bg: "bg-[rgba(0,191,178,0.1)]", icon: "🏠" },
  "Ibadah Rutin": { color: "text-bsi-teal-primary", bg: "bg-[rgba(0,124,128,0.1)]", icon: "🤲" },
  Lainnya: { color: "text-[#6b7280]", bg: "bg-gray-100", icon: "⭐" },
};

function toFilterTab(status: ChoreStatus): FilterTab {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "PENDING_REVIEW") return "PENDING";
  if (status === "APPROVED") return "COMPLETED";
  return "REJECTED";
}

export function ChallengesPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ACTIVE");
  const [submitModal, setSubmitModal] = useState<{ choreId: string; title: string } | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitMediaUrl, setSubmitMediaUrl] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    authFetch(`${API_BASE_URL}/api/chores`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setChores(data.data);
        else setError("Gagal memuat tantangan");
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  }, []);

  const closeModal = () => {
    setSubmitModal(null);
    setSubmitNotes("");
    setSubmitMediaUrl("");
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!submitModal) return;
    setSubmitLoading(true);
    setSubmitError(null);

    const token = localStorage.getItem("accessToken");
    const body: { notes?: string; mediaUrl?: string } = {};
    if (submitNotes.trim()) body.notes = submitNotes.trim();
    if (submitMediaUrl.trim()) body.mediaUrl = submitMediaUrl.trim();

    try {
      const res = await authFetch(`${API_BASE_URL}/api/chores/${submitModal.choreId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message ?? "Gagal submit tantangan");
        return;
      }
      setChores((prev) =>
        prev.map((c) =>
          c.id === submitModal.choreId ? { ...c, status: "PENDING_REVIEW" as ChoreStatus } : c
        )
      );
      closeModal();
    } catch {
      setSubmitError("Gagal terhubung ke server");
    } finally {
      setSubmitLoading(false);
    }
  };

  const FILTER_TABS: { id: FilterTab; label: string }[] = [
    { id: "ACTIVE", label: "Aktif" },
    { id: "PENDING", label: "Menunggu" },
    { id: "COMPLETED", label: "Selesai" },
    { id: "REJECTED", label: "Ditolak" },
  ];

  const countFor = (tab: FilterTab) => chores.filter((c) => toFilterTab(c.status) === tab).length;
  const filtered = chores.filter((c) => toFilterTab(c.status) === activeFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 lg:p-10">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <svg className="w-7 h-7 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
              Tantanganku
            </h1>
          </div>
          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm sm:text-base">
            Selesaikan tantangan untuk mendapatkan hadiah dari orang tua
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          {FILTER_TABS.map((tab) => {
            const count = countFor(tab.id);
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-sm transition-all ${
                  active
                    ? "bg-bsi-teal-primary text-white shadow-sm"
                    : "bg-white hover:bg-gray-50 border border-[#e0e7e7] text-[#4b5563]"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">
              Belum ada tantangan
            </h3>
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">
              {activeFilter === "ACTIVE"
                ? "Orang tuamu akan memberikan tantangan baru untukmu"
                : "Tidak ada tantangan di kategori ini"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((chore) => {
              const cfg = CATEGORY_CONFIG[chore.category] ?? CATEGORY_CONFIG["Lainnya"];
              const isActive = chore.status === "ACTIVE";
              const isPending = chore.status === "PENDING_REVIEW";
              const isCompleted = chore.status === "APPROVED";
              const isRevision = chore.status === "REVISION_NEEDED";
              const isExpired = chore.status === "EXPIRED" || chore.status === "CANCELLED";
              const isRejected = chore.status === "REJECTED";

              return (
                <div
                  key={chore.id}
                  className={`rounded-3xl border p-6 space-y-5 transition-all hover:shadow-lg ${
                    isCompleted
                      ? "bg-[#f8fafa] border-[#e0e7e7]"
                      : isPending
                      ? "bg-[rgba(237,139,0,0.04)] border-bsi-orange-primary/30"
                      : isRevision
                      ? "bg-amber-50 border-amber-200"
                      : isRejected || isExpired
                      ? "bg-gray-50 border-gray-200 opacity-70"
                      : "bg-white border-[rgba(189,201,201,0.3)]"
                  }`}
                >
                  {/* Category + time */}
                  <div className="flex items-center justify-between">
                    <div className={`${cfg.bg} px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                      <span className="text-sm">{cfg.icon}</span>
                      <span
                        className={`font-['Poppins',sans-serif] font-bold ${cfg.color} text-[10px] tracking-widest uppercase`}
                      >
                        {chore.category}
                      </span>
                    </div>
                    <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs">
                      {isCompleted
                        ? "Selesai ✓"
                        : isExpired
                        ? "Kedaluwarsa"
                        : formatDeadline(chore.deadline)}
                    </span>
                  </div>

                  {/* Title + description */}
                  <div className="flex items-start gap-3">
                    <div className="text-4xl leading-none flex-shrink-0">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Poppins',sans-serif] font-bold text-black text-lg mb-1">
                        {chore.title}
                      </h3>
                      {chore.description && (
                        <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">
                          {chore.description}
                        </p>
                      )}
                      {isRevision && chore.latestSubmission?.reviewerNote && (
                        <div className="mt-2 bg-amber-100 border border-amber-200 rounded-xl p-3">
                          <p className="font-['Poppins',sans-serif] text-amber-700 text-xs font-semibold">
                            Perlu revisi: {chore.latestSubmission.reviewerNote}
                          </p>
                        </div>
                      )}
                      {isRejected && chore.rejectionNote && (
                        <div className="mt-2 bg-red-100 rounded-xl p-3">
                          <p className="font-['Poppins',sans-serif] text-red-600 text-xs font-semibold">
                            Catatan: {chore.rejectionNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reward + action */}
                  <div className="flex items-center justify-between pt-4 border-t border-[rgba(189,201,201,0.2)]">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm">
                        {formatRupiah(chore.rewardAmount)}
                      </span>
                    </div>

                    {(isActive || isRevision) && (
                      <button
                        onClick={() => setSubmitModal({ choreId: chore.id, title: chore.title })}
                        className={`px-5 py-2 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors ${
                          isRevision
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark"
                        }`}
                      >
                        {isRevision ? "Revisi" : "Submit"}
                      </button>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-1.5 bg-bsi-orange-primary/10 px-3 py-1.5 rounded-xl">
                        <div className="w-2 h-2 bg-bsi-orange-primary rounded-full animate-pulse" />
                        <span className="font-['Poppins',sans-serif] font-bold text-bsi-orange-primary text-xs">
                          Menunggu
                        </span>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-center gap-1.5 text-bsi-teal-secondary">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-['Poppins',sans-serif] font-bold text-sm">
                          Reward Cair!
                        </span>
                      </div>
                    )}

                    {(isRejected || isExpired) && (
                      <span className="font-['Poppins',sans-serif] text-xs text-gray-400 italic">
                        {isExpired ? "Kedaluwarsa" : "Ditolak"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {submitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">
                Submit Tantangan
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-[#f0f9f9] rounded-2xl p-4 mb-5">
              <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-base">
                {submitModal.title}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="Ceritakan apa yang sudah kamu lakukan..."
                  maxLength={500}
                  rows={3}
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary resize-none"
                />
              </div>
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  URL Foto Bukti <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="url"
                  value={submitMediaUrl}
                  onChange={(e) => setSubmitMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                />
              </div>
            </div>

            {submitError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {submitLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  "Kirim Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
