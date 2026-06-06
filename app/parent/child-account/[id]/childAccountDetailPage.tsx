"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Pocket {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
  balance: number;
  targetAmount: number | null;
  progressPercent: number | null;
  isGoalCompleted: boolean;
}

interface Transaction {
  id: string;
  pocket: { name: string; emoji: string | null } | null;
  type: "CREDIT" | "DEBIT";
  source: string;
  amount: number;
  notes: string | null;
  createdAt: string;
}

interface ChildSummary {
  profile: { id: string; fullName: string; isActive: boolean };
  account: {
    id: string;
    balance: number;
    currency: string;
    pockets: Pocket[];
  } | null;
  monthlyStats: { infaqTotal: number; choreRewards: number };
  pendingChoreReviews: number;
  limits: { period: string; limitAmount: number; excludeInfaq: boolean }[];
  recentTransactions: Transaction[];
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
  });
}

export function ChildAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<ChildSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/parent/summary/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSummary(data.data);
        else setError(data.message ?? "Gagal memuat data");
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-bsi-teal-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="font-['Poppins',sans-serif] text-gray-500 text-sm">Memuat data anak...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto">
        <Link href="/parent/accounts" className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark font-['Poppins',sans-serif] font-semibold text-sm mb-6 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 font-['Lato',sans-serif] text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/parent/accounts"
        className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark font-['Poppins',sans-serif] font-semibold text-sm transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Akun Anak
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-3xl border-2 border-white shadow-lg">
            👦
          </div>
          <div>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
              {summary.profile.fullName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${summary.profile.isActive ? "bg-green-500" : "bg-gray-400"}`} />
              <span className={`font-['Poppins',sans-serif] font-semibold text-sm ${summary.profile.isActive ? "text-green-600" : "text-gray-500"}`}>
                {summary.profile.isActive ? "Aktif" : "Nonaktif"}
              </span>
              {summary.pendingChoreReviews > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <Link href="/parent/pending-actions" className="font-['Poppins',sans-serif] font-semibold text-bsi-orange-primary text-sm hover:underline">
                    {summary.pendingChoreReviews} tugas menunggu review
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/parent/child-tasks"
          className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark px-4 py-2.5 rounded-xl font-['Poppins',sans-serif] font-semibold text-white text-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Buat Tugas
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl shadow-lg p-5 text-white">
          <p className="font-['Poppins',sans-serif] font-semibold text-white/70 text-xs tracking-widest uppercase mb-1">
            SALDO TABUNGAN
          </p>
          <p className="font-['Montserrat',sans-serif] font-bold text-2xl">
            {summary.account ? formatRupiah(summary.account.balance) : "Rp —"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-5">
          <p className="font-['Poppins',sans-serif] font-semibold text-gray-400 text-xs tracking-widest uppercase mb-1">
            TOTAL KANTONG
          </p>
          <p className="font-['Montserrat',sans-serif] font-bold text-gray-900 text-2xl">
            {summary.account ? summary.account.pockets.length : 0}
          </p>
          <p className="font-['Lato',sans-serif] text-gray-500 text-xs mt-0.5">kantong aktif</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-5">
          <p className="font-['Poppins',sans-serif] font-semibold text-gray-400 text-xs tracking-widest uppercase mb-1">
            REWARD BULAN INI
          </p>
          <p className="font-['Montserrat',sans-serif] font-bold text-green-600 text-2xl">
            {formatRupiah(summary.monthlyStats.choreRewards)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-5">
          <p className="font-['Poppins',sans-serif] font-semibold text-gray-400 text-xs tracking-widest uppercase mb-1">
            INFAQ BULAN INI
          </p>
          <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl">
            {formatRupiah(summary.monthlyStats.infaqTotal)}
          </p>
        </div>
      </div>

      {/* Grid: Pockets + Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pockets */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
          <h3 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg mb-4">
            Kantong Tabungan
          </h3>
          {summary.account && summary.account.pockets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.account.pockets.map((pocket) => (
                <div key={pocket.id} className="bg-[#f0f9f9] rounded-xl border border-[rgba(0,124,128,0.1)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{pocket.emoji ?? "💰"}</span>
                    <h4 className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm truncate">{pocket.name}</h4>
                  </div>
                  <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-xl mb-2">
                    {formatRupiah(pocket.balance)}
                  </p>
                  {pocket.targetAmount !== null && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-['Lato',sans-serif] text-gray-400 text-xs">Target: {formatRupiah(pocket.targetAmount)}</span>
                        <span className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-xs">{pocket.progressPercent ?? 0}%</span>
                      </div>
                      <div className="bg-white h-1.5 rounded-full overflow-hidden">
                        <div className="bg-bsi-teal-secondary h-full rounded-full" style={{ width: `${pocket.progressPercent ?? 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm text-center py-8">
              Belum ada kantong tabungan
            </p>
          )}
        </div>

        {/* Spending Limits */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
          <h3 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg mb-4">
            Batas Pengeluaran
          </h3>
          {summary.limits.length > 0 ? (
            <div className="space-y-4">
              {summary.limits.map((limit) => (
                <div key={limit.period}>
                  <div className="flex justify-between mb-1">
                    <span className="font-['Poppins',sans-serif] font-semibold text-gray-600 text-sm capitalize">
                      {limit.period === "DAILY" ? "Harian" : limit.period === "WEEKLY" ? "Mingguan" : "Bulanan"}
                    </span>
                    <span className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-sm">
                      {formatRupiah(limit.limitAmount)}
                    </span>
                  </div>
                  <div className="bg-[#f3f4f6] h-2 rounded-full overflow-hidden">
                    <div className="bg-bsi-teal-secondary h-full w-[30%]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm text-center py-4">
              Belum ada batas pengeluaran
            </p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
          <h3 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg mb-4">
            Transaksi Terbaru
          </h3>
          {summary.recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {summary.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-[#f3f4f6] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === "CREDIT" ? "bg-green-50" : "bg-red-50"}`}>
                      <svg className={`w-4 h-4 ${tx.type === "CREDIT" ? "text-green-500" : "text-red-500"}`} fill="currentColor" viewBox="0 0 20 20">
                        {tx.type === "CREDIT" ? (
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">
                        {tx.pocket?.name ?? tx.source}
                        {tx.pocket?.emoji ? ` ${tx.pocket.emoji}` : ""}
                      </p>
                      <p className="font-['Lato',sans-serif] text-gray-400 text-xs">
                        {tx.notes ?? tx.source} • {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className={`font-['Montserrat',sans-serif] font-bold text-sm ${tx.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                    {tx.type === "CREDIT" ? "+" : "-"}{formatRupiah(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm text-center py-8">
              Belum ada transaksi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
