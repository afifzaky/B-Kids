"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ChildSummary {
  id: string;
  fullName: string;
  childAccountNumber: string;
  isActive: boolean;
  balance: number;
}

interface ParentTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  source: string;
  amount: number;
  balanceAfter: number;
  relatedChild: { fullName: string; childAccountNumber: string } | null;
  notes: string | null;
  createdAt: string;
}

interface ParentAccount {
  id: string;
  fullName: string;
  bsiAccountNumber: string;
  balance: number;
  currency: string;
  children: ChildSummary[];
  recentTransactions: ParentTransaction[];
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function txDescription(tx: ParentTransaction): string {
  switch (tx.source) {
    case "DEPOSIT": return "Top Up Saldo";
    case "TRANSFER_TO_CHILD": return `Transfer ke ${tx.relatedChild?.fullName ?? "Anak"}`;
    default: return tx.notes ?? tx.source;
  }
}

export function BankingPage() {
  const [account, setAccount] = useState<ParentAccount | null>(null);
  const [transactions, setTransactions] = useState<ParentTransaction[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState("");

  // Top Up Modal
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNotes, setTopUpNotes] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);

  const fetchAccount = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/parent/banking/account`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAccount(data.data);
      else setError(data.message ?? "Gagal memuat rekening");
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (p = 1) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/parent/banking/transactions?page=${p}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions ?? []);
        setMeta(data.meta ?? null);
      }
    } catch { /* ignore */ }
    finally { setTxLoading(false); }
  };

  useEffect(() => {
    fetchAccount();
    fetchTransactions(1);
  }, []);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchTransactions(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTopUp = () => {
    setTopUpAmount("");
    setTopUpNotes("");
    setTopUpError(null);
    setTopUpSuccess(null);
    setShowTopUp(true);
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) { setTopUpError("Masukkan nominal yang valid"); return; }
    if (amount > 100_000_000) { setTopUpError("Maksimal top up Rp 100.000.000 per transaksi"); return; }
    setTopUpLoading(true);
    setTopUpError(null);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/parent/banking/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, ...(topUpNotes.trim() ? { notes: topUpNotes.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setTopUpError(data.message ?? "Gagal melakukan top up"); return; }
      setTopUpSuccess(data.message ?? "Top up berhasil!");
      setAccount((prev) => prev ? { ...prev, balance: data.data.newBalance } : prev);
      fetchTransactions(1);
      setPage(1);
    } catch {
      setTopUpError("Gagal terhubung ke server");
    } finally {
      setTopUpLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-bsi-teal-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="font-['Poppins',sans-serif] text-gray-400 text-sm">Memuat rekening...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-10">
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 font-['Lato',sans-serif] text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Montserrat',sans-serif] font-bold text-2xl sm:text-3xl text-black">Rekening Saya</h1>
        <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">Kelola saldo dan riwayat transaksi rekening Anda</p>
      </div>

      {/* Balance Card */}
      {account && (
        <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute bg-[rgba(0,191,178,0.2)] blur-[40px] -bottom-12 -right-12 rounded-full size-52 pointer-events-none" />
          <div className="absolute bg-[rgba(237,139,0,0.1)] blur-[32px] size-24 -left-6 top-4 rounded-full pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="font-['Poppins',sans-serif] font-semibold text-white/70 text-xs tracking-widest uppercase mb-1">SALDO REKENING</p>
                {account.bsiAccountNumber && (
                  <p className="font-['Lato',sans-serif] text-white/50 text-xs mb-2">No. Rek BSI: {account.bsiAccountNumber}</p>
                )}
                <h2 className="font-['Montserrat',sans-serif] font-bold text-white text-3xl sm:text-4xl lg:text-5xl mb-4">
                  {formatRupiah(account.balance)}
                </h2>
                <p className="font-['Lato',sans-serif] text-white/60 text-sm">{account.fullName}</p>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <button
                  onClick={openTopUp}
                  className="bg-bsi-orange-primary hover:bg-[#d47a00] px-6 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-sm text-white transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Top Up Saldo
                </button>
                <Link
                  href="/parent"
                  className="bg-white/20 hover:bg-white/30 px-6 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-sm text-white transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Allocate Money
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Children Balances */}
      {account && account.children.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
          <h3 className="font-['Montserrat',sans-serif] font-bold text-lg text-black mb-4">Saldo Anak</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {account.children.map((child, i) => (
              <Link
                key={child.id}
                href={`/parent/child-account/${child.id}`}
                className="flex items-center justify-between p-4 bg-[#f8fafa] rounded-xl border border-[#e0e7e7] hover:border-bsi-teal-primary/30 hover:bg-[#f0f9f9] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${i % 2 === 0 ? "bg-bsi-teal-primary/10" : "bg-bsi-orange-primary/10"}`}>
                    {i % 2 === 0 ? "👦" : "👧"}
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm group-hover:text-bsi-teal-primary transition-colors">{child.fullName}</p>
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{child.isActive ? "Aktif" : "Nonaktif"}</p>
                  </div>
                </div>
                <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-sm">{formatRupiah(child.balance)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-['Montserrat',sans-serif] font-bold text-lg text-black">Riwayat Transaksi</h3>
          {meta && (
            <span className="font-['Lato',sans-serif] text-gray-400 text-xs">{meta.total} transaksi</span>
          )}
        </div>

        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-6 h-6 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3.5 border-b border-[#f3f4f6] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === "CREDIT" ? "bg-green-50" : "bg-orange-50"}`}>
                    <svg className={`w-5 h-5 ${tx.type === "CREDIT" ? "text-green-500" : "text-bsi-orange-primary"}`} fill="currentColor" viewBox="0 0 20 20">
                      {tx.type === "CREDIT" ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{txDescription(tx)}</p>
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className={`font-['Montserrat',sans-serif] font-bold text-sm ${tx.type === "CREDIT" ? "text-green-600" : "text-bsi-orange-primary"}`}>
                    {tx.type === "CREDIT" ? "+" : "-"}{formatRupiah(tx.amount)}
                  </p>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-xs">Saldo: {formatRupiah(tx.balanceAfter)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#f3f4f6]">
            <p className="font-['Lato',sans-serif] text-gray-400 text-xs">
              Halaman {meta.page} dari {meta.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#e0e7e7] font-['Poppins',sans-serif] font-semibold text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                const p = meta.page <= 3 ? i + 1 : meta.page - 2 + i;
                if (p < 1 || p > meta.totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg font-['Poppins',sans-serif] font-semibold text-xs transition-colors ${
                      p === page ? "bg-bsi-teal-primary text-white" : "border border-[#e0e7e7] text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= meta.totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#e0e7e7] font-['Poppins',sans-serif] font-semibold text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">Top Up Saldo</h3>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm mt-0.5">Tambah saldo rekening B-Kids Anda</p>
              </div>
              <button onClick={() => setShowTopUp(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl p-4 mb-5">
              <p className="font-['Poppins',sans-serif] text-white/80 text-xs uppercase tracking-wide mb-1">Saldo Saat Ini</p>
              <p className="font-['Montserrat',sans-serif] font-bold text-white text-2xl">
                {account ? formatRupiah(account.balance) : "—"}
              </p>
            </div>

            {topUpSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-['Poppins',sans-serif] font-bold text-green-600 text-base">{topUpSuccess}</p>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm mt-1">
                  Saldo baru: {account ? formatRupiah(account.balance) : ""}
                </p>
                <button
                  onClick={() => setShowTopUp(false)}
                  className="mt-4 bg-bsi-teal-primary text-white font-['Poppins',sans-serif] font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-bsi-teal-hover-dark transition-colors"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">Nominal Cepat</p>
                  <div className="flex flex-wrap gap-2">
                    {[100000, 250000, 500000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopUpAmount(String(amt))}
                        className={`px-4 py-2 rounded-xl text-sm font-['Poppins',sans-serif] font-bold transition-colors ${
                          topUpAmount === String(amt)
                            ? "bg-bsi-teal-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Nominal Lainnya
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-['Poppins',sans-serif]">Rp</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => { setTopUpAmount(e.target.value); setTopUpError(null); }}
                      placeholder="0"
                      min="1"
                      max="100000000"
                      className="w-full border border-[#e0e7e7] rounded-xl pl-12 pr-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                    />
                  </div>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">Maks. Rp 100.000.000 per transaksi</p>
                </div>

                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={topUpNotes}
                    onChange={(e) => setTopUpNotes(e.target.value)}
                    placeholder="Contoh: Top up bulan Juni"
                    className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                  />
                </div>

                {topUpError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{topUpError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowTopUp(false)}
                    className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleTopUp}
                    disabled={topUpLoading}
                    className="flex-1 bg-bsi-orange-primary hover:bg-[#d47a00] disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {topUpLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Memproses...
                      </>
                    ) : "Top Up Sekarang"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
