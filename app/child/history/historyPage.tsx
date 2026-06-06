"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type TransactionType = "CREDIT" | "DEBIT";
type TransactionSource =
  | "TOP_UP_FROM_PARENT"
  | "CHORE_REWARD"
  | "POCKET_ALLOCATE"
  | "POCKET_DEALLOCATE"
  | "VOUCHER_PURCHASE"
  | "INFAQ"
  | "ADJUSTMENT";

interface Transaction {
  id: string;
  type: TransactionType;
  source: TransactionSource;
  amount: number;
  balanceAfter: number;
  notes: string | null;
  createdAt: string;
}

interface TransactionResponse {
  data: Transaction[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

const SOURCE_LABELS: Record<TransactionSource, string> = {
  TOP_UP_FROM_PARENT: "Transfer dari Orang Tua",
  CHORE_REWARD: "Reward Tantangan",
  POCKET_ALLOCATE: "Alokasi ke Kantong",
  POCKET_DEALLOCATE: "Penarikan dari Kantong",
  VOUCHER_PURCHASE: "Pembelian Voucher",
  INFAQ: "Infaq / Sedekah",
  ADJUSTMENT: "Penyesuaian Saldo",
};

const SOURCE_ICONS: Record<TransactionSource, string> = {
  TOP_UP_FROM_PARENT: "💸",
  CHORE_REWARD: "⭐",
  POCKET_ALLOCATE: "💰",
  POCKET_DEALLOCATE: "↩️",
  VOUCHER_PURCHASE: "🎫",
  INFAQ: "🤲",
  ADJUSTMENT: "⚙️",
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Hari ini, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEndpointMissing, setIsEndpointMissing] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<TransactionResponse["meta"] | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");

  const loadTransactions = (p = 1) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setIsLoading(true);

    fetch(`${API_BASE_URL}/api/child/transactions?page=${p}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 404) {
          setIsEndpointMissing(true);
          return null;
        }
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success) {
          if (p === 1) {
            setTransactions(data.data);
          } else {
            setTransactions((prev) => [...prev, ...(data.data as Transaction[])]);
          }
          setMeta(data.meta ?? null);
          setPage(p);
        } else {
          setError(data.message ?? "Gagal memuat riwayat");
        }
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadTransactions(1); }, []);

  const displayed = filterType === "ALL"
    ? transactions
    : transactions.filter((t) => t.type === filterType);

  if (isLoading && transactions.length === 0) {
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
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
              Riwayat Transaksi
            </h1>
          </div>
          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm sm:text-base">
            Semua aktivitas keuangan rekening utamamu
          </p>
        </div>

        {/* Endpoint Missing Notice */}
        {isEndpointMissing && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="font-['Montserrat',sans-serif] font-bold text-amber-800 text-lg mb-2">
              Fitur Sedang Disiapkan
            </h3>
            <p className="font-['Lato',sans-serif] text-amber-700 text-sm">
              Endpoint <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">GET /api/child/transactions</code> belum tersedia di backend.
              Hubungi developer untuk mengaktifkan fitur ini.
            </p>
          </div>
        )}

        {error && !isEndpointMissing && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!isEndpointMissing && !error && (
          <>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
              {(["ALL", "CREDIT", "DEBIT"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-5 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-sm transition-all ${
                    filterType === f
                      ? f === "CREDIT"
                        ? "bg-bsi-teal-primary text-white shadow-sm"
                        : f === "DEBIT"
                        ? "bg-[#ba1a1a] text-white shadow-sm"
                        : "bg-bsi-teal-primary text-white shadow-sm"
                      : "bg-white hover:bg-gray-50 border border-[#e0e7e7] text-[#4b5563]"
                  }`}
                >
                  {f === "ALL" ? "Semua" : f === "CREDIT" ? "Masuk" : "Keluar"}
                </button>
              ))}
            </div>

            {/* Transactions */}
            {displayed.length === 0 && !isLoading ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">
                  Belum ada transaksi
                </h3>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm">
                  Riwayat transaksimu akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm overflow-hidden">
                <div className="divide-y divide-[rgba(189,201,201,0.15)]">
                  {displayed.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-5 sm:px-8 py-5 hover:bg-[#f9fafa] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
                            tx.type === "CREDIT"
                              ? "bg-[rgba(0,124,128,0.08)]"
                              : "bg-[rgba(186,26,26,0.07)]"
                          }`}
                        >
                          {SOURCE_ICONS[tx.source]}
                        </div>
                        <div>
                          <p className="font-['Poppins',sans-serif] font-bold text-black text-sm sm:text-base">
                            {SOURCE_LABELS[tx.source]}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs">
                              {formatDateTime(tx.createdAt)}
                            </p>
                            {tx.notes && (
                              <>
                                <span className="text-gray-300">·</span>
                                <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.4)] text-xs truncate max-w-[140px]">
                                  {tx.notes}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <p
                          className={`font-['Montserrat',sans-serif] font-bold text-base sm:text-lg ${
                            tx.type === "CREDIT" ? "text-bsi-teal-primary" : "text-[#ba1a1a]"
                          }`}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}{formatRupiah(tx.amount)}
                        </p>
                        <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.4)] text-xs mt-0.5">
                          Saldo: {formatRupiah(tx.balanceAfter)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {meta && page < meta.totalPages && (
                  <div className="p-4 text-center border-t border-[rgba(189,201,201,0.15)]">
                    <button
                      onClick={() => loadTransactions(page + 1)}
                      disabled={isLoading}
                      className="bg-[#f0f9f9] hover:bg-[#e0f2f2] text-bsi-teal-primary font-['Poppins',sans-serif] font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Memuat..." : "Muat Lebih Banyak"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
