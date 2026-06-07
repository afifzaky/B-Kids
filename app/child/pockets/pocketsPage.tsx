"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type PocketCategory = "JAJAN" | "HAJI" | "QURBAN" | "INFAQ" | "CUSTOM";

interface Pocket {
  id: string;
  name: string;
  category: PocketCategory;
  balance: number;
  targetAmount: number | null;
  progressPercent: number | null;
  intentionText: string | null;
  emoji: string;
  deadline: string | null;
  isActive: boolean;
  isGoalCompleted: boolean;
  createdAt: string;
}

interface PocketsData {
  account: { id: string; balance: number; currency: string };
  pockets: Pocket[];
}

const CATEGORY_LABELS: Record<PocketCategory, string> = {
  JAJAN: "Uang Jajan",
  HAJI: "Tabungan Haji",
  QURBAN: "Tabungan Qurban",
  INFAQ: "Alokasi Infaq",
  CUSTOM: "Kantong Pribadi",
};

const PRESET_EMOJIS = ["💰", "🎯", "🚲", "📚", "🎮", "🏠", "✈️", "🍕", "⭐", "🏆", "🤲", "❤️"];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PocketsPage() {
  const [data, setData] = useState<PocketsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create pocket modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCategory, setCreateCategory] = useState<PocketCategory>("CUSTOM");
  const [createEmoji, setCreateEmoji] = useState("💰");
  const [createTarget, setCreateTarget] = useState("");
  const [createDeadline, setCreateDeadline] = useState("");
  const [createIntention, setCreateIntention] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Topup modal
  const [topupPocket, setTopupPocket] = useState<Pocket | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  // Edit pocket modal
  const [editPocket, setEditPocket] = useState<Pocket | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("💰");
  const [editTarget, setEditTarget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editIntention, setEditIntention] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [deletePocketId, setDeletePocketId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPockets = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setIsLoading(true);
    fetch(`${API_BASE_URL}/api/pockets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError("Gagal memuat data kantong");
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchPockets(); }, []);

  const resetCreate = () => {
    setShowCreate(false);
    setCreateName("");
    setCreateCategory("CUSTOM");
    setCreateEmoji("💰");
    setCreateTarget("");
    setCreateDeadline("");
    setCreateIntention("");
    setCreateError(null);
  };

  const handleCreate = async () => {
    if (!createName.trim()) { setCreateError("Nama kantong wajib diisi"); return; }
    setCreateLoading(true);
    setCreateError(null);

    const token = localStorage.getItem("accessToken");
    const body: Record<string, unknown> = {
      name: createName.trim(),
      category: createCategory,
      emoji: createEmoji,
    };
    if (createTarget) body.targetAmount = parseFloat(createTarget);
    if (createDeadline) body.deadline = new Date(createDeadline).toISOString();
    if (createIntention.trim()) body.intentionText = createIntention.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/api/pockets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setCreateError(d.message ?? "Gagal membuat kantong"); return; }
      resetCreate();
      fetchPockets();
    } catch {
      setCreateError("Gagal terhubung ke server");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!topupPocket) return;
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) { setTopupError("Masukkan nominal yang valid"); return; }
    setTopupLoading(true);
    setTopupError(null);
    setTopupSuccess(null);

    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/pockets/${topupPocket.id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const d = await res.json();
      if (!res.ok) { setTopupError(d.message ?? "Gagal mengisi kantong"); return; }
      setTopupSuccess(d.message ?? "Berhasil mengisi kantong!");
      setTopupAmount("");
      fetchPockets();
    } catch {
      setTopupError("Gagal terhubung ke server");
    } finally {
      setTopupLoading(false);
    }
  };

  const openEditModal = (pocket: Pocket) => {
    setEditPocket(pocket);
    setEditName(pocket.name);
    setEditEmoji(pocket.emoji);
    setEditTarget(pocket.targetAmount != null ? String(pocket.targetAmount) : "");
    setEditDeadline(pocket.deadline ? pocket.deadline.split("T")[0] : "");
    setEditIntention(pocket.intentionText ?? "");
    setEditError(null);
  };

  const handleEdit = async () => {
    if (!editPocket) return;
    if (!editName.trim()) { setEditError("Nama kantong tidak boleh kosong"); return; }
    setEditLoading(true);
    setEditError(null);
    const token = localStorage.getItem("accessToken");
    const body: Record<string, unknown> = {
      name: editName.trim(),
      emoji: editEmoji,
      targetAmount: editTarget ? parseFloat(editTarget) : null,
      deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
      intentionText: editIntention.trim() || null,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/pockets/${editPocket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setEditError(d.message ?? "Gagal menyimpan perubahan"); return; }
      setEditPocket(null);
      fetchPockets();
    } catch {
      setEditError("Gagal terhubung ke server");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (pocketId: string) => {
    setDeleteLoading(true);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/pockets/${pocketId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setDeletePocketId(null); fetchPockets(); }
    } catch { /* ignore */ }
    finally { setDeleteLoading(false); }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <svg className="w-7 h-7 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
                Kantongku
              </h1>
            </div>
            <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm sm:text-base">
              Atur uangmu untuk berbagai tujuan
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark shadow-sm px-5 py-2.5 rounded-2xl font-['Poppins',sans-serif] font-bold text-sm text-white transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Buat Kantong Baru
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Account Balance Banner */}
        {data && (
          <div className="bg-bsi-teal-primary rounded-2xl p-5 sm:p-6 mb-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute bg-[rgba(0,191,178,0.2)] blur-[32px] -right-8 -top-8 rounded-full size-32 pointer-events-none" />
            <div className="relative">
              <p className="font-['Poppins',sans-serif] text-white/70 text-xs tracking-widest uppercase mb-1">
                SALDO UTAMA TERSEDIA
              </p>
              <p className="font-['Montserrat',sans-serif] font-bold text-white text-2xl sm:text-3xl">
                {formatRupiah(data.account.balance)}
              </p>
            </div>
            <div className="relative bg-white/20 rounded-xl p-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* Pockets Grid */}
        {!data || data.pockets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">
              Belum ada kantong
            </h3>
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm mb-6">
              Buat kantong pertamamu untuk mulai mengelola uang
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark px-6 py-3 rounded-2xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Buat Kantong Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {data.pockets.map((pocket) => (
              <div
                key={pocket.id}
                className={`bg-white rounded-3xl border shadow-sm p-6 sm:p-8 hover:shadow-lg transition-shadow ${
                  pocket.isGoalCompleted
                    ? "border-bsi-teal-secondary/50 bg-[#f0fefb]"
                    : "border-[rgba(189,201,201,0.3)]"
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-bsi-orange-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl">
                      {pocket.emoji}
                    </div>
                    <div>
                      <h3 className="font-['Poppins',sans-serif] font-bold text-black text-xl">
                        {pocket.name}
                      </h3>
                      <span className="inline-block bg-[#f0f9f9] text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-[10px] tracking-widest uppercase px-2 py-1 rounded-full mt-1">
                        {CATEGORY_LABELS[pocket.category]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(pocket)}
                      className="text-gray-300 hover:text-bsi-teal-primary transition-colors p-1"
                      title="Edit kantong"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletePocketId(pocket.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      title="Hapus kantong"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div className="space-y-4">
                  <div>
                    <p className="font-['Poppins',sans-serif] font-bold text-[#9ca3af] text-xs tracking-widest uppercase mb-1">
                      SALDO KANTONG
                    </p>
                    <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-3xl">
                      {formatRupiah(pocket.balance)}
                    </p>
                  </div>

                  {/* Goal progress */}
                  {pocket.targetAmount !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-['Poppins',sans-serif] font-semibold text-[#6b7280] text-sm">
                          {pocket.isGoalCompleted ? "Target Tercapai! 🎉" : "Progress Tujuan"}
                        </span>
                        <span className="font-['Poppins',sans-serif] font-bold text-black text-sm">
                          {pocket.progressPercent ?? 0}%
                        </span>
                      </div>
                      <div className="bg-[#f3f4f6] h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pocket.isGoalCompleted ? "bg-bsi-teal-primary" : "bg-bsi-teal-secondary"
                          }`}
                          style={{ width: `${Math.min(100, pocket.progressPercent ?? 0)}%` }}
                        />
                      </div>
                      <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs mt-2">
                        Target: {formatRupiah(pocket.targetAmount)}
                        {pocket.deadline && ` · Deadline: ${formatDate(pocket.deadline)}`}
                      </p>
                    </div>
                  )}

                  {pocket.intentionText && (
                    <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-sm italic border-l-2 border-bsi-teal-secondary/30 pl-3">
                      {pocket.intentionText}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setTopupPocket(pocket);
                        setTopupAmount("");
                        setTopupError(null);
                        setTopupSuccess(null);
                      }}
                      disabled={pocket.isGoalCompleted}
                      className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-2.5 font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors"
                    >
                      {pocket.isGoalCompleted ? "Terpenuhi ✓" : "Add Money"}
                    </button>
                    <Link
                      href={`/child/pockets/${pocket.id}`}
                      className="flex-1 bg-white border border-bsi-teal-primary text-bsi-teal-primary hover:bg-bsi-teal-primary/5 rounded-xl py-2.5 font-['Poppins',sans-serif] font-bold text-sm transition-colors text-center"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new pocket card */}
            <button
              onClick={() => setShowCreate(true)}
              className="bg-white rounded-3xl border-2 border-dashed border-bsi-teal-primary/30 p-8 hover:border-bsi-teal-primary/60 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-bsi-teal-primary/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-base">
                  Buat Kantong Baru
                </p>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm mt-1">
                  Maks. 5 kantong aktif
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Create Pocket Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">
                Buat Kantong Baru
              </h3>
              <button onClick={resetCreate} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Emoji */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Pilih Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setCreateEmoji(e)}
                      className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        createEmoji === e
                          ? "bg-bsi-teal-primary/20 ring-2 ring-bsi-teal-primary scale-110"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Nama Kantong <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Contoh: Dana Buku, Uang Jajan"
                  maxLength={50}
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                />
              </div>

              {/* Category */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Kategori
                </label>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value as PocketCategory)}
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary bg-white"
                >
                  {(Object.keys(CATEGORY_LABELS) as PocketCategory[]).map((k) => (
                    <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                  ))}
                </select>
              </div>

              {/* Target amount */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Target Tabungan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-gray-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={createTarget}
                    onChange={(e) => setCreateTarget(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full border border-[#e0e7e7] rounded-xl pl-12 pr-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                  />
                </div>
              </div>

              {/* Deadline */}
              {createTarget && (
                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Deadline <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="date"
                    value={createDeadline}
                    onChange={(e) => setCreateDeadline(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                  />
                </div>
              )}

              {/* Intention */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Niat / Tujuan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={createIntention}
                  onChange={(e) => setCreateIntention(e.target.value)}
                  placeholder="Kenapa kamu menabung di sini?"
                  maxLength={500}
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                />
              </div>
            </div>

            {createError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{createError}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetCreate}
                className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={createLoading}
                className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Membuat...
                  </>
                ) : (
                  "Buat Kantong"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topup Modal */}
      {topupPocket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">
                Isi Kantong
              </h3>
              <button
                onClick={() => setTopupPocket(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Pocket info */}
            <div className="bg-[#f0f9f9] rounded-2xl p-4 mb-5 flex items-center gap-3">
              <span className="text-2xl">{topupPocket.emoji}</span>
              <div>
                <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-base">
                  {topupPocket.name}
                </p>
                <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
                  Saldo: {formatRupiah(topupPocket.balance)}
                </p>
              </div>
            </div>

            {/* Available balance */}
            {data && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center">
                <p className="font-['Poppins',sans-serif] text-gray-500 text-xs">Saldo Utama Tersedia</p>
                <p className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg">
                  {formatRupiah(data.account.balance)}
                </p>
              </div>
            )}

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Nominal
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-gray-400 text-sm">Rp</span>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full border border-[#e0e7e7] rounded-xl pl-12 pr-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary text-lg"
                />
              </div>
            </div>

            {topupError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{topupError}</p>
              </div>
            )}
            {topupSuccess && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-green-700 text-sm">{topupSuccess}</p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setTopupPocket(null)}
                className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleTopup}
                disabled={topupLoading || !!topupSuccess}
                className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {topupLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengisi...
                  </>
                ) : topupSuccess ? (
                  "Berhasil ✓"
                ) : (
                  "Isi Sekarang"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pocket Modal */}
      {editPocket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">Edit Kantong</h3>
              <button onClick={() => setEditPocket(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Emoji */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">Pilih Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEditEmoji(e)}
                      className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        editEmoji === e
                          ? "bg-bsi-teal-primary/20 ring-2 ring-bsi-teal-primary scale-110"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Nama Kantong <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                />
              </div>

              {/* Target amount */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Target Tabungan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-gray-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    placeholder="Kosongkan untuk hapus target"
                    min="0"
                    className="w-full border border-[#e0e7e7] rounded-xl pl-12 pr-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                  />
                </div>
              </div>

              {/* Deadline */}
              {editTarget && (
                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Deadline <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                  />
                </div>
              )}

              {/* Intention */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Niat / Tujuan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={editIntention}
                  onChange={(e) => setEditIntention(e.target.value)}
                  placeholder="Kenapa kamu menabung di sini?"
                  maxLength={500}
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                />
              </div>
            </div>

            {editError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{editError}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditPocket(null)}
                className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleEdit}
                disabled={editLoading}
                className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletePocketId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black mb-2">
                Hapus Kantong?
              </h3>
              <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
                Saldo di kantong ini akan dikembalikan ke saldo utama.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePocketId(null)}
                className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deletePocketId)}
                disabled={deleteLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors"
              >
                {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
