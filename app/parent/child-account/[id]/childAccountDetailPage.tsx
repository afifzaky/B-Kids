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

interface Chore {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rewardAmount: number;
  deadline: string;
  status: string;
  assignedToId: string;
}

interface SpendingLimit {
  period: string;
  limitAmount: number;
  excludeInfaq: boolean;
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
  limits: SpendingLimit[];
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

function formatDeadline(dateStr: string): string {
  const diffDays = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return "Kedaluwarsa";
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  return `${diffDays} hari lagi`;
}

const CHORE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  REVISION_NEEDED: "bg-orange-100 text-orange-700",
};

export function ChildAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<ChildSummary | null>(null);
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    Promise.all([
      fetch(`${API_BASE_URL}/api/parent/summary/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/chores`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([summaryRes, choresRes]) => Promise.all([summaryRes.json(), choresRes.json()]))
      .then(([summaryData, choresData]) => {
        if (summaryData.success) setSummary(summaryData.data);
        else setError(summaryData.message ?? "Gagal memuat data");
        if (choresData.success) setChores(choresData.data.filter((c: Chore) => c.assignedToId === id));
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

  const totalPocketBalance = summary.account?.pockets.reduce((sum, p) => sum + p.balance, 0) ?? 0;
  const activeChores = chores.filter((c) => ["ACTIVE", "PENDING_REVIEW", "REVISION_NEEDED"].includes(c.status));

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/parent/accounts"
        className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark font-['Poppins',sans-serif] font-bold transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Child Accounts
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-3xl border-4 border-white shadow-lg">
              👦
            </div>
            <div>
              <h1 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-2xl sm:text-3xl">
                {summary.profile.fullName}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${summary.profile.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${summary.profile.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                  {summary.profile.isActive ? "Aktif" : "Nonaktif"}
                </span>
                {summary.pendingChoreReviews > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-['Poppins',sans-serif] font-semibold bg-yellow-100 text-yellow-700">
                    {summary.pendingChoreReviews} tugas pending
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/parent/child-tasks"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-semibold text-sm px-4 py-2.5 rounded-xl hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Challenge
            </Link>
            <Link
              href="/parent/pending-actions"
              className="inline-flex items-center gap-2 bg-white border border-[#e0e7e7] text-gray-600 font-['Poppins',sans-serif] font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Pending Actions
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl shadow-lg p-5 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-['Poppins',sans-serif] font-semibold text-white/70 text-xs tracking-widest uppercase mb-1">MAIN BALANCE</p>
          <p className="font-['Montserrat',sans-serif] font-bold text-2xl">
            {summary.account ? formatRupiah(summary.account.balance) : "Rp —"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-5">
          <div className="w-10 h-10 bg-bsi-orange-primary/10 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-['Poppins',sans-serif] font-semibold text-gray-400 text-xs tracking-widest uppercase mb-1">POCKET BALANCE</p>
          <p className="font-['Montserrat',sans-serif] font-bold text-gray-900 text-2xl">{formatRupiah(totalPocketBalance)}</p>
          <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5">{summary.account?.pockets.length ?? 0} kantong aktif</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-5">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p className="font-['Poppins',sans-serif] font-semibold text-gray-400 text-xs tracking-widest uppercase mb-1">ACTIVE CHALLENGES</p>
          <p className="font-['Montserrat',sans-serif] font-bold text-blue-600 text-2xl">{activeChores.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-5">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-['Poppins',sans-serif] font-semibold text-gray-400 text-xs tracking-widest uppercase mb-1">MONTHLY REWARDS</p>
          <p className="font-['Montserrat',sans-serif] font-bold text-green-600 text-2xl">{formatRupiah(summary.monthlyStats.choreRewards)}</p>
        </div>
      </div>

      {/* Active Challenges + Spending Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-lg">Active Challenges</h3>
            <Link href="/parent/child-tasks" className="text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-xs hover:underline">
              View All →
            </Link>
          </div>
          {activeChores.length > 0 ? (
            <div className="space-y-3">
              {activeChores.map((chore) => (
                <div key={chore.id} className="flex items-center justify-between p-4 bg-[#f8fafa] rounded-xl border border-[#e0e7e7]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full font-['Poppins',sans-serif] font-bold text-[10px] ${CHORE_STATUS_COLORS[chore.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {chore.status === "ACTIVE" ? "Active" : chore.status === "PENDING_REVIEW" ? "Pending Review" : "Needs Revision"}
                      </span>
                    </div>
                    <p className="font-['Poppins',sans-serif] font-bold text-[#030213] text-sm truncate">{chore.title}</p>
                    <p className="font-['Lato',sans-serif] text-[#6b7280] text-xs mt-0.5">
                      {chore.category} · Due {formatDeadline(chore.deadline)}
                    </p>
                  </div>
                  <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-sm ml-4 shrink-0">
                    {formatRupiah(chore.rewardAmount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🎯</div>
              <p className="font-['Poppins',sans-serif] font-bold text-gray-500 text-sm">Belum ada tantangan aktif</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
          <h3 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-lg mb-5">Spending Limits</h3>
          {summary.limits.length > 0 ? (
            <div className="space-y-4">
              {summary.limits.map((limit) => (
                <div key={limit.period} className="p-4 bg-[#f8fafa] rounded-xl border border-[#e0e7e7]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm capitalize">
                      {limit.period === "DAILY" ? "Daily" : limit.period === "WEEKLY" ? "Weekly" : "Monthly"}
                    </span>
                    <span className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-sm">
                      {formatRupiah(limit.limitAmount)}
                    </span>
                  </div>
                  <div className="bg-white h-2 rounded-full overflow-hidden">
                    <div className="bg-bsi-teal-secondary h-full w-[40%] rounded-full" />
                  </div>
                  {limit.excludeInfaq && (
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">Infaq excluded</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada batas pengeluaran</p>
            </div>
          )}
        </div>
      </div>

      {/* Pockets Grid */}
      <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-lg">My Pockets</h3>
          <span className="font-['Lato',sans-serif] text-[#6b7280] text-sm">{summary.account?.pockets.length ?? 0} kantong</span>
        </div>
        {summary.account && summary.account.pockets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.account.pockets.map((pocket) => (
              <div key={pocket.id} className={`rounded-xl border p-4 ${pocket.isGoalCompleted ? "bg-green-50 border-green-200" : "bg-[#f8fafa] border-[#e0e7e7]"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-bsi-orange-primary/10 flex items-center justify-center text-xl">
                    {pocket.emoji ?? "💰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins',sans-serif] font-bold text-[#030213] text-sm truncate">{pocket.name}</p>
                    <p className="font-['Lato',sans-serif] text-[#6b7280] text-xs">{pocket.category}</p>
                  </div>
                </div>
                <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg mb-2">
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
                {pocket.isGoalCompleted && (
                  <p className="font-['Poppins',sans-serif] font-semibold text-green-600 text-xs mt-2">Tujuan Tercapai 🎉</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-['Lato',sans-serif] text-gray-400 text-sm text-center py-8">Belum ada kantong tabungan</p>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
        <h3 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-lg mb-5">Recent Transactions</h3>
        {summary.recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {summary.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-[#f3f4f6] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === "CREDIT" ? "bg-green-50" : "bg-red-50"}`}>
                    <svg className={`w-5 h-5 ${tx.type === "CREDIT" ? "text-green-500" : "text-red-500"}`} fill="currentColor" viewBox="0 0 20 20">
                      {tx.type === "CREDIT" ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] font-semibold text-[#030213] text-sm">
                      {tx.pocket?.name ?? tx.source}
                      {tx.pocket?.emoji ? ` ${tx.pocket.emoji}` : ""}
                    </p>
                    <p className="font-['Lato',sans-serif] text-[#6b7280] text-xs">
                      {tx.notes ?? tx.source} · {formatDate(tx.createdAt)}
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
          <p className="font-['Lato',sans-serif] text-gray-400 text-sm text-center py-8">Belum ada transaksi</p>
        )}
      </div>
    </div>
  );
}
