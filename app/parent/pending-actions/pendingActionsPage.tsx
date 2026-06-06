"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Chore {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rewardAmount: number;
  deadline: string;
  status: string;
  assignedToId: string;
  latestSubmission: {
    notes: string | null;
    mediaUrl: string | null;
    submittedAt: string;
  } | null;
}

interface Child {
  id: string;
  fullName: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(str: string): string {
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  return `${mins} menit lalu`;
}

export function PendingActionsPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [rejectModal, setRejectModal] = useState<{ choreId: string; title: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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
      if (choresData.success) setChores(choresData.data.filter((c: Chore) => c.status === "PENDING_REVIEW"));
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

  const handleApprove = async (choreId: string) => {
    setActionLoading(choreId);
    setActionError((prev) => ({ ...prev, [choreId]: "" }));
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/chores/${choreId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError((prev) => ({ ...prev, [choreId]: data.message ?? "Gagal menyetujui tugas" }));
        return;
      }
      setChores((prev) => prev.filter((c) => c.id !== choreId));
      showToast(data.message ?? "Tugas berhasil disetujui!");
    } catch {
      setActionError((prev) => ({ ...prev, [choreId]: "Gagal terhubung ke server" }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReject = (chore: Chore) => {
    setRejectModal({ choreId: chore.id, title: chore.title });
    setRejectNote("");
    setRejectError("");
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectNote.trim() || rejectNote.trim().length < 5) {
      setRejectError("Alasan penolakan minimal 5 karakter");
      return;
    }
    setActionLoading(rejectModal.choreId);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/chores/${rejectModal.choreId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rejectionNote: rejectNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRejectError(data.message ?? "Gagal menolak tugas");
        return;
      }
      setChores((prev) => prev.filter((c) => c.id !== rejectModal.choreId));
      setRejectModal(null);
      showToast(data.message ?? "Tugas berhasil ditolak.");
    } catch {
      setRejectError("Gagal terhubung ke server");
    } finally {
      setActionLoading(null);
    }
  };

  const childName = (id: string) => children.find((c) => c.id === id)?.fullName ?? "—";

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-['Poppins',sans-serif] font-semibold text-sm text-white transition-all ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Montserrat',sans-serif] font-bold text-2xl sm:text-3xl text-black">
          Aksi Pending
        </h1>
        <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">
          Review dan setujui bukti penyelesaian tugas anak
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-['Lato',sans-serif] text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : chores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-['Montserrat',sans-serif] font-bold text-gray-600 text-lg mb-1">
            Semua Beres!
          </p>
          <p className="font-['Lato',sans-serif] text-gray-400 text-sm">
            Tidak ada tugas yang menunggu review saat ini
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
            {chores.length} tugas menunggu review Anda
          </p>

          {chores.map((chore) => (
            <div key={chore.id} className="bg-white rounded-2xl border-l-4 border-bsi-orange-primary shadow-sm p-5 sm:p-6">
              {/* Error per-chore */}
              {actionError[chore.id] && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 font-['Lato',sans-serif] text-xs">
                  {actionError[chore.id]}
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-[rgba(237,139,0,0.1)] px-2.5 py-0.5 rounded-full font-['Poppins',sans-serif] font-bold text-bsi-orange-primary text-[10px] tracking-widest uppercase">
                      PERSETUJUAN REWARD
                    </span>
                    <span className="bg-[rgba(0,124,128,0.1)] px-2.5 py-0.5 rounded-full font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-[10px] tracking-widest uppercase">
                      {chore.category}
                    </span>
                  </div>

                  <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-base mb-1">
                    {chore.title}
                  </p>
                  <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
                    <strong>{childName(chore.assignedToId)}</strong> mengumpulkan bukti penyelesaian tugas ini.
                  </p>
                  {chore.description && (
                    <p className="font-['Lato',sans-serif] text-gray-400 text-sm mt-1">{chore.description}</p>
                  )}

                  {/* Reward & time */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-bsi-teal-primary">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span className="font-['Poppins',sans-serif] font-bold text-sm">{formatRupiah(chore.rewardAmount)}</span>
                    </div>
                    {chore.latestSubmission && (
                      <span className="font-['Lato',sans-serif] text-gray-400 text-xs">
                        Dikumpulkan {timeAgo(chore.latestSubmission.submittedAt)}
                      </span>
                    )}
                  </div>

                  {/* Submission note */}
                  {chore.latestSubmission?.notes && (
                    <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <p className="font-['Poppins',sans-serif] font-semibold text-amber-700 text-xs mb-0.5">Catatan dari anak:</p>
                      <p className="font-['Lato',sans-serif] text-amber-700 text-sm">{chore.latestSubmission.notes}</p>
                    </div>
                  )}

                  {/* Media link */}
                  {chore.latestSubmission?.mediaUrl && (
                    <a
                      href={chore.latestSubmission.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 font-['Poppins',sans-serif] font-semibold text-bsi-teal-primary text-xs hover:underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Lihat Bukti
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row lg:flex-col gap-2 lg:w-36">
                  <button
                    onClick={() => handleApprove(chore.id)}
                    disabled={actionLoading === chore.id}
                    className="flex-1 lg:flex-none bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-60 px-4 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    {actionLoading === chore.id ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Setujui
                  </button>
                  <button
                    onClick={() => handleOpenReject(chore)}
                    disabled={actionLoading === chore.id}
                    className="flex-1 lg:flex-none bg-white hover:bg-red-50 border border-red-300 disabled:opacity-60 px-4 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-red-600 text-sm transition-colors"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl mb-1">
              Tolak Tugas
            </h2>
            <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-4">
              Berikan alasan penolakan untuk tugas "<strong>{rejectModal.title}</strong>".
              Anak dapat memperbaiki dan submit ulang (jika masih tersisa kesempatan).
            </p>

            {rejectError && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 font-['Lato',sans-serif] text-xs">
                {rejectError}
              </div>
            )}

            <textarea
              value={rejectNote}
              onChange={(e) => { setRejectNote(e.target.value); setRejectError(""); }}
              placeholder="Contoh: Foto bukti tidak terlihat jelas. Tolong foto ulang dengan pencahayaan lebih baik."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-sm text-gray-900 bg-white focus:border-bsi-teal-primary focus:outline-none transition-colors placeholder:text-gray-400 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectNote(""); setRejectError(""); }}
                className="flex-1 bg-white border border-[#e0e7e7] hover:bg-gray-50 text-gray-600 font-['Poppins',sans-serif] font-bold text-sm py-3 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-['Poppins',sans-serif] font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : null}
                Tolak Tugas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
