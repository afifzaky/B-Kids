"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Pocket {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
  balance: string;
  targetAmount: string | null;
  isGoalCompleted: boolean;
  deadline: string | null;
}

interface Transaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  source: string;
  amount: string;
  balanceAfter: string;
  notes: string | null;
  createdAt: string;
}

interface Chore {
  id: string;
  title: string;
  category: string;
  rewardAmount: string;
  status: string;
  deadline: string;
}

interface SpendingLimit {
  period: string;
  limitAmount: string;
  excludeInfaq: boolean;
}

interface ChildDetail {
  id: string;
  fullName: string;
  username: string | null;
  dateOfBirth: string;
  childAccountNumber: string;
  isActive: boolean;
  createdAt: string;
  parent: { id: string; fullName: string; bsiAccountNumber: string } | null;
  account: {
    id: string;
    balance: string;
    currency: string;
    pockets: Pocket[];
    recentTransactions: Transaction[];
  } | null;
  spendingLimits: SpendingLimit[];
  activeChores: Chore[];
}

const PERIOD_LABELS: Record<string, string> = { DAILY: "Harian", WEEKLY: "Mingguan", MONTHLY: "Bulanan" };
const CHORE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  PENDING_REVIEW: "Menunggu Review",
  REVISION_NEEDED: "Perlu Revisi",
};
const CHORE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  REVISION_NEEDED: "bg-orange-100 text-orange-700",
};
const TX_SOURCE_LABELS: Record<string, string> = {
  PARENT_TRANSFER: "Transfer Orang Tua",
  POCKET_ALLOCATE: "Top-up Kantong",
  POCKET_DEALLOCATE: "Kembalikan dari Kantong",
  INFAQ_PAYMENT: "Pembayaran Infaq",
  CHORE_REWARD: "Reward Tantangan",
  VOUCHER_PURCHASE: "Pembelian Voucher",
  ADJUSTMENT: "Penyesuaian Admin",
};

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
}

export function ChildAdminDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status toggle modal
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  const token = () => localStorage.getItem("accessToken") ?? "";

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/children/${childId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { setChild(data.data); setError(""); }
      else setError(data.message ?? "Gagal memuat detail");
    } catch { setError("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDetail(); }, [childId]);

  const handleStatusToggle = async () => {
    if (!child) return;
    setStatusLoading(true); setStatusError("");
    try {
      const newStatus = !child.isActive;
      const body: Record<string, unknown> = { isActive: newStatus };
      if (statusReason.trim()) body.reason = statusReason.trim();
      const res = await authFetch(`${API_BASE_URL}/api/admin/children/${childId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setChild(prev => prev ? { ...prev, isActive: newStatus } : null);
        setStatusOpen(false); setStatusReason("");
      } else {
        setStatusError(data.message ?? "Gagal mengubah status");
      }
    } catch { setStatusError("Gagal terhubung ke server"); }
    finally { setStatusLoading(false); }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatDeadline = (dateStr: string) => {
    const diffDays = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (diffDays < 0) return "Kedaluwarsa";
    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Besok";
    return `${diffDays} hari lagi`;
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  if (error || !child) return (
    <div className="p-6 sm:p-8">
      <Link href="/admin/parents" className="inline-flex items-center gap-2 text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-sm hover:underline mb-4">
        ← Kembali ke Daftar Orang Tua
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="font-['Poppins',sans-serif] text-red-700 font-semibold">{error || "Data tidak ditemukan"}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-['Poppins',sans-serif]">
        <Link href="/admin/parents" className="text-bsi-teal-primary hover:underline font-semibold">
          Orang Tua
        </Link>
        {child.parent && (
          <>
            <span className="text-gray-400">/</span>
            <Link href={`/admin/parents/${child.parent.id}`} className="text-bsi-teal-primary hover:underline font-semibold">
              {child.parent.fullName}
            </Link>
          </>
        )}
        <span className="text-gray-400">/</span>
        <span className="text-gray-500">{child.fullName}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0">
              {child.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl">{child.fullName}</h1>
                <StatusBadge isActive={child.isActive} />
              </div>
              <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-0.5">
                @{child.username ?? "—"} · Rek. {child.childAccountNumber}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setStatusOpen(true); setStatusReason(""); setStatusError(""); }}
            className={`px-4 py-2 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl transition-colors self-start ${
              child.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {child.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#f3f4f6]">
          {[
            { label: "Tanggal Lahir", value: formatDate(child.dateOfBirth) },
            { label: "No. Rekening", value: child.childAccountNumber },
            { label: "Saldo Utama", value: child.account?.balance ?? "—" },
            { label: "Bergabung", value: formatDate(child.createdAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs mb-0.5">{label}</p>
              <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Parent Info */}
      {child.parent && (
        <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-5">
          <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm mb-3">Orang Tua</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-white text-sm font-bold shrink-0">
                {child.parent.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{child.parent.fullName}</p>
                <p className="font-['Lato',sans-serif] text-gray-400 text-xs">Rek. {child.parent.bsiAccountNumber}</p>
              </div>
            </div>
            <Link
              href={`/admin/parents/${child.parent.id}`}
              className="text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-xs hover:underline"
            >
              Lihat Detail →
            </Link>
          </div>
        </div>
      )}

      {/* Pockets + Spending Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pockets */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-5">
          <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm mb-4">
            Kantong ({child.account?.pockets.length ?? 0})
          </h2>
          {(child.account?.pockets.length ?? 0) > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {child.account!.pockets.map((pocket) => (
                <div key={pocket.id} className={`p-4 rounded-xl border ${pocket.isGoalCompleted ? "bg-green-50 border-green-200" : "bg-[#f8fafa] border-[#e0e7e7]"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{pocket.emoji ?? "💰"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm truncate">{pocket.name}</p>
                      <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{pocket.category}</p>
                    </div>
                  </div>
                  <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-base">{pocket.balance}</p>
                  {pocket.targetAmount && (
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">Target: {pocket.targetAmount}</p>
                  )}
                  {pocket.isGoalCompleted && (
                    <p className="font-['Poppins',sans-serif] font-semibold text-green-600 text-xs mt-1">Tujuan Tercapai 🎉</p>
                  )}
                  {pocket.deadline && (
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5">Tenggat: {formatDeadline(pocket.deadline)}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm text-center py-6">Belum ada kantong</p>
          )}
        </div>

        {/* Spending Limits */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-5">
          <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm mb-4">Batas Pengeluaran</h2>
          {child.spendingLimits.length > 0 ? (
            <div className="space-y-3">
              {child.spendingLimits.map((limit) => (
                <div key={limit.period} className="p-3 bg-[#f8fafa] rounded-xl border border-[#e0e7e7]">
                  <div className="flex justify-between items-center">
                    <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">
                      {PERIOD_LABELS[limit.period] ?? limit.period}
                    </span>
                    <span className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-sm">
                      {limit.limitAmount}
                    </span>
                  </div>
                  {limit.excludeInfaq && (
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">Infaq dikecualikan</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm text-center py-6">Tidak ada batas</p>
          )}
        </div>
      </div>

      {/* Active Chores */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">
            Tantangan Aktif ({child.activeChores.length})
          </h2>
        </div>
        {child.activeChores.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Tidak ada tantangan aktif</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f3f4f6]">
            {child.activeChores.map((chore) => (
              <div key={chore.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full font-['Poppins',sans-serif] font-bold text-[10px] ${CHORE_STATUS_COLORS[chore.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {CHORE_STATUS_LABELS[chore.status] ?? chore.status}
                    </span>
                    <span className="font-['Lato',sans-serif] text-gray-400 text-xs">{chore.category}</span>
                  </div>
                  <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm truncate">{chore.title}</p>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5">Tenggat: {formatDeadline(chore.deadline)}</p>
                </div>
                <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-sm shrink-0">
                  {chore.rewardAmount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">Transaksi Terbaru (20 terakhir)</h2>
        </div>
        {(child.account?.recentTransactions.length ?? 0) === 0 ? (
          <div className="py-8 text-center">
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                  {["Waktu", "Jenis", "Sumber", "Nominal", "Saldo Setelah", "Catatan"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {child.account!.recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#f9fafa] transition-colors">
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${tx.type === "CREDIT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {tx.type === "CREDIT" ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-xs">{TX_SOURCE_LABELS[tx.source] ?? tx.source}</td>
                    <td className={`px-4 py-3 font-['Poppins',sans-serif] font-semibold text-sm ${tx.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "DEBIT" ? "−" : "+"}{tx.amount}
                    </td>
                    <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">{tx.balanceAfter}</td>
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-400 text-xs max-w-[160px] truncate">{tx.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Toggle Modal */}
      {statusOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-1">
              {child.isActive ? "Nonaktifkan" : "Aktifkan"} Akun Anak
            </h3>
            <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-5">
              {child.isActive
                ? `Akun ${child.fullName} akan dinonaktifkan. Anak tidak dapat login sampai diaktifkan kembali.`
                : `Akun ${child.fullName} akan diaktifkan kembali.`}
            </p>
            <div>
              <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                Alasan <span className="font-normal text-gray-400">(opsional)</span>
              </label>
              <input
                value={statusReason}
                onChange={e => setStatusReason(e.target.value)}
                placeholder="Masukkan alasan..."
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none"
              />
            </div>
            {statusError && <p className="text-red-500 text-sm font-['Lato',sans-serif] mt-3">{statusError}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setStatusOpen(false)}
                disabled={statusLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={statusLoading}
                className={`flex-1 py-2.5 text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl transition-opacity disabled:opacity-60 ${
                  child.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {statusLoading ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
