"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ChildDetail {
  id: string;
  fullName: string;
  dateOfBirth: string;
  username: string | null;
  childAccountNumber: string;
  isActive: boolean;
  createdAt: string;
  account: {
    id: string;
    balance: string;
    currency: string;
    pockets: { id: string; name: string; category: string; emoji: string | null; balance: string }[];
  } | null;
  spendingLimits: { period: string; limitAmount: string; excludeInfaq: boolean }[];
}

interface LedgerEntry {
  id: string;
  type: "CREDIT" | "DEBIT";
  source: string;
  amount: string;
  balanceAfter: string;
  relatedChild: { fullName: string; childAccountNumber: string } | null;
  notes: string | null;
  createdAt: string;
}

interface ParentDetail {
  id: string;
  fullName: string;
  nik: string;
  dateOfBirth: string;
  bsiAccountNumber: string;
  balance: string;
  user: { id: string; email: string; phone: string | null; isActive: boolean; createdAt: string };
  children: ChildDetail[];
  recentLedger: LedgerEntry[];
}

interface LedgerMeta { page: number; limit: number; total: number; totalPages: number; }

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 rounded-lg text-sm font-['Poppins',sans-serif] font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        ← Prev
      </button>
      <span className="font-['Lato',sans-serif] text-gray-500 text-sm px-2">{page} / {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 rounded-lg text-sm font-['Poppins',sans-serif] font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next →
      </button>
    </div>
  );
}

const TX_SOURCE_LABELS: Record<string, string> = {
  INITIAL_BALANCE: "Saldo Awal", DEPOSIT: "Deposit", TRANSFER_TO_CHILD: "Transfer ke Anak",
  CHORE_REWARD: "Reward Tantangan", ADJUSTMENT: "Penyesuaian",
};

export function ParentDetailPage() {
  const { parentId } = useParams<{ parentId: string }>();
  const [parent, setParent] = useState<ParentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ledger state
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerMeta, setLedgerMeta] = useState<LedgerMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Balance adjust modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");
  const [adjustSuccess, setAdjustSuccess] = useState("");

  // Status toggle modal
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  const token = () => localStorage.getItem("accessToken") ?? "";

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/parents/${parentId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { setParent(data.data); setError(""); }
      else setError(data.message ?? "Gagal memuat detail");
    } catch { setError("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  };

  const fetchLedger = async (p: number) => {
    setLedgerLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/parents/${parentId}/ledger?page=${p}&limit=10`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { setLedger(data.transactions ?? []); setLedgerMeta(data.meta); }
    } catch { /* ignore */ }
    finally { setLedgerLoading(false); }
  };

  useEffect(() => { fetchDetail(); }, [parentId]);
  useEffect(() => { if (parentId) fetchLedger(ledgerPage); }, [ledgerPage, parentId]);

  const handleAdjust = async () => {
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt === 0) { setAdjustError("Jumlah tidak valid"); return; }
    if (!adjustNotes.trim() || adjustNotes.trim().length < 5) { setAdjustError("Catatan minimal 5 karakter"); return; }
    setAdjustLoading(true); setAdjustError(""); setAdjustSuccess("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/parents/${parentId}/balance/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ amount: amt, notes: adjustNotes.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAdjustSuccess(`Berhasil! Saldo baru: ${data.data.newBalance}`);
        setAdjustAmount(""); setAdjustNotes("");
        fetchDetail(); fetchLedger(1);
      } else {
        setAdjustError(data.message ?? "Gagal menyesuaikan saldo");
      }
    } catch { setAdjustError("Gagal terhubung ke server"); }
    finally { setAdjustLoading(false); }
  };

  const handleStatusToggle = async () => {
    if (!parent) return;
    setStatusLoading(true); setStatusError("");
    try {
      const newStatus = !parent.user.isActive;
      const body: Record<string, unknown> = { isActive: newStatus };
      if (statusReason.trim()) body.reason = statusReason.trim();
      const res = await authFetch(`${API_BASE_URL}/api/admin/parents/${parentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setParent(prev => prev ? { ...prev, user: { ...prev.user, isActive: newStatus } } : null);
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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  if (error || !parent) return (
    <div className="p-6 sm:p-8">
      <Link href="/admin/parents" className="inline-flex items-center gap-2 text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-sm hover:underline mb-4">
        ← Kembali ke Daftar
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="font-['Poppins',sans-serif] text-red-700 font-semibold">{error || "Data tidak ditemukan"}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link href="/admin/parents" className="inline-flex items-center gap-2 text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-sm hover:underline">
        ← Kembali ke Daftar
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0">
              {parent.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl">{parent.fullName}</h1>
                <StatusBadge isActive={parent.user.isActive} />
              </div>
              <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-0.5">{parent.user.email}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setAdjustOpen(true); setAdjustError(""); setAdjustSuccess(""); }}
              className="px-4 py-2 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Sesuaikan Saldo
            </button>
            <button onClick={() => { setStatusOpen(true); setStatusReason(""); setStatusError(""); }}
              className={`px-4 py-2 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl transition-colors ${
                parent.user.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}>
              {parent.user.isActive ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#f3f4f6]">
          {[
            { label: "NIK", value: parent.nik },
            { label: "No. Rekening BSI", value: parent.bsiAccountNumber },
            { label: "Saldo", value: parent.balance },
            { label: "Bergabung", value: formatDate(parent.user.createdAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs mb-0.5">{label}</p>
              <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Children */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">
            Anak ({parent.children.length})
          </h2>
        </div>
        {parent.children.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada anak terdaftar</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f3f4f6]">
            {parent.children.map(child => (
              <div key={child.id} className="px-5 py-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {child.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{child.fullName}</p>
                        <StatusBadge isActive={child.isActive} />
                      </div>
                      <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5">
                        @{child.username ?? "—"} · Rek. {child.childAccountNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm">
                      {child.account?.balance ?? "—"}
                    </p>
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs">
                      {child.account?.pockets.length ?? 0} kantong
                    </p>
                  </div>
                </div>
                {(child.account?.pockets.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-13">
                    {child.account!.pockets.map(pocket => (
                      <span key={pocket.id} className="flex items-center gap-1 px-2.5 py-1 bg-[#f1f4f4] rounded-lg text-xs font-['Lato',sans-serif] text-gray-600">
                        <span>{pocket.emoji}</span>
                        <span>{pocket.name}</span>
                        <span className="font-semibold text-bsi-teal-primary ml-1">{pocket.balance}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
          <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">
            Riwayat Transaksi ({ledgerMeta.total})
          </h2>
        </div>
        {ledgerLoading ? (
          <div className="py-10 text-center">
            <svg className="animate-spin w-5 h-5 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : ledger.length === 0 ? (
          <div className="py-8 text-center"><p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada transaksi</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                    {["Waktu", "Jenis", "Sumber", "Nominal", "Saldo Setelah", "Terkait", "Catatan"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {ledger.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#f9fafa] transition-colors">
                      <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${tx.type === "CREDIT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {tx.type === "CREDIT" ? "Masuk" : "Keluar"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-xs">
                        {TX_SOURCE_LABELS[tx.source] ?? tx.source}
                      </td>
                      <td className={`px-4 py-3 font-['Poppins',sans-serif] font-semibold text-sm ${tx.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "DEBIT" ? "−" : "+"}{tx.amount}
                      </td>
                      <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">{tx.balanceAfter}</td>
                      <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs">
                        {tx.relatedChild ? `${tx.relatedChild.fullName}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-400 text-xs max-w-[160px] truncate">{tx.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-[#f3f4f6]">
              <Pagination page={ledgerPage} totalPages={ledgerMeta.totalPages} onPageChange={p => setLedgerPage(p)} />
            </div>
          </>
        )}
      </div>

      {/* Adjust Balance Modal */}
      {adjustOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-1">Sesuaikan Saldo</h3>
            <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-5">
              Saldo saat ini: <span className="font-semibold text-bsi-teal-primary">{parent.balance}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                  Jumlah Penyesuaian <span className="font-normal text-gray-400 text-xs">(positif = tambah, negatif = kurang)</span>
                </label>
                <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="Contoh: 50000 atau -25000"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
              </div>
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Catatan <span className="text-red-500">*</span></label>
                <input value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="Alasan penyesuaian saldo (min. 5 karakter)"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
              </div>
            </div>
            {adjustError && <p className="text-red-500 text-sm font-['Lato',sans-serif] mt-3">{adjustError}</p>}
            {adjustSuccess && <p className="text-green-600 text-sm font-['Poppins',sans-serif] font-semibold mt-3">{adjustSuccess}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setAdjustOpen(false); setAdjustSuccess(""); }} disabled={adjustLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                {adjustSuccess ? "Tutup" : "Batal"}
              </button>
              {!adjustSuccess && (
                <button onClick={handleAdjust} disabled={adjustLoading}
                  className="flex-1 py-2.5 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                  {adjustLoading ? "Memproses..." : "Konfirmasi"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Modal */}
      {statusOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-1">
              {parent.user.isActive ? "Nonaktifkan" : "Aktifkan"} Akun
            </h3>
            <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-5">
              {parent.user.isActive ? `Akun ${parent.fullName} akan dinonaktifkan.` : `Akun ${parent.fullName} akan diaktifkan kembali.`}
            </p>
            <div>
              <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                Alasan <span className="font-normal text-gray-400">(opsional)</span>
              </label>
              <input value={statusReason} onChange={e => setStatusReason(e.target.value)}
                placeholder="Masukkan alasan..."
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
            </div>
            {statusError && <p className="text-red-500 text-sm font-['Lato',sans-serif] mt-3">{statusError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStatusOpen(false)} disabled={statusLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleStatusToggle} disabled={statusLoading}
                className={`flex-1 py-2.5 text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl transition-opacity disabled:opacity-60 ${
                  parent.user.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}>
                {statusLoading ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
