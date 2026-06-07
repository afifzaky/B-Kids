"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface LedgerEntry {
  id: string;
  type: "CREDIT" | "DEBIT";
  source: string;
  amount: number;
  balanceAfter: number;
  notes: string | null;
  createdAt: string;
}

interface PocketDetail {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
  balance: number;
  targetAmount: number | null;
  isGoalCompleted: boolean;
  intentionText: string | null;
  deadline: string | null;
  ledger: LedgerEntry[];
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

function ledgerDescription(entry: LedgerEntry): string {
  switch (entry.source) {
    case "TRANSFER_FROM_PARENT": return "Transfer dari Orang Tua";
    case "CHORE_REWARD": return "Hadiah Tantangan";
    case "WITHDRAWAL": return "Penarikan";
    case "TRANSFER_BETWEEN_POCKETS": return "Transfer antar Kantong";
    default: return entry.notes ?? entry.source;
  }
}

export function PocketDetailPage() {
  const { childId, pocketId } = useParams<{ childId: string; pocketId: string }>();
  const [pocket, setPocket] = useState<PocketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!childId || !pocketId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/parent/children/${childId}/pockets/${pocketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPocket(data.data);
        else setError(data.message ?? "Gagal memuat detail kantong");
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  }, [childId, pocketId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-bsi-teal-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="font-['Poppins',sans-serif] text-gray-400 text-sm">Memuat kantong...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto">
        <Link
          href={`/parent/child-account/${childId}`}
          className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark font-['Poppins',sans-serif] font-semibold text-sm mb-6 transition-colors"
        >
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

  if (!pocket) return null;

  const progressPercent =
    pocket.targetAmount && pocket.targetAmount > 0
      ? Math.min(100, Math.round((pocket.balance / pocket.targetAmount) * 100))
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`/parent/child-account/${childId}`}
        className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark font-['Poppins',sans-serif] font-bold transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Detail Anak
      </Link>

      {/* Pocket Header Card */}
      <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute bg-[rgba(0,191,178,0.2)] blur-[40px] -bottom-12 -right-12 rounded-full size-52 pointer-events-none" />
        <div className="absolute bg-[rgba(237,139,0,0.1)] blur-[32px] size-24 -left-6 top-4 rounded-full pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
              {pocket.emoji ?? "💰"}
            </div>
            <div>
              <p className="font-['Poppins',sans-serif] text-white/70 text-xs tracking-widest uppercase mb-1">
                {pocket.category}
              </p>
              <h1 className="font-['Montserrat',sans-serif] font-bold text-white text-2xl sm:text-3xl">
                {pocket.name}
              </h1>
              {pocket.isGoalCompleted && (
                <span className="inline-flex items-center gap-1 mt-1 bg-white/20 text-white font-['Poppins',sans-serif] font-bold text-xs px-2.5 py-1 rounded-full">
                  Tujuan Tercapai 🎉
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <p className="font-['Poppins',sans-serif] text-white/70 text-xs tracking-widest uppercase mb-1">SALDO</p>
              <p className="font-['Montserrat',sans-serif] font-bold text-white text-4xl sm:text-5xl">
                {formatRupiah(pocket.balance)}
              </p>
            </div>

            {pocket.targetAmount !== null && (
              <div className="sm:text-right min-w-0">
                <p className="font-['Lato',sans-serif] text-white/60 text-xs mb-1">
                  Target: {formatRupiah(pocket.targetAmount)}
                </p>
                <div className="bg-white/20 rounded-full h-2.5 w-full sm:w-48 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all"
                    style={{ width: `${progressPercent ?? 0}%` }}
                  />
                </div>
                <p className="font-['Poppins',sans-serif] font-bold text-white text-sm mt-1">
                  {progressPercent ?? 0}% tercapai
                </p>
              </div>
            )}
          </div>

          {pocket.intentionText && (
            <p className="font-['Lato',sans-serif] text-white/60 text-sm mt-4 italic">
              "{pocket.intentionText}"
            </p>
          )}
          {pocket.deadline && (
            <p className="font-['Lato',sans-serif] text-white/50 text-xs mt-1">
              Batas: {new Date(pocket.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-4 text-center">
          <p className="font-['Poppins',sans-serif] text-gray-400 text-xs tracking-widest uppercase mb-1">SALDO</p>
          <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg">{formatRupiah(pocket.balance)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-4 text-center">
          <p className="font-['Poppins',sans-serif] text-gray-400 text-xs tracking-widest uppercase mb-1">TARGET</p>
          <p className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-lg">
            {pocket.targetAmount !== null ? formatRupiah(pocket.targetAmount) : "—"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-4 text-center">
          <p className="font-['Poppins',sans-serif] text-gray-400 text-xs tracking-widest uppercase mb-1">PROGRES</p>
          <p className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-lg">
            {progressPercent !== null ? `${progressPercent}%` : "—"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-4 text-center">
          <p className="font-['Poppins',sans-serif] text-gray-400 text-xs tracking-widest uppercase mb-1">TRANSAKSI</p>
          <p className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-lg">{pocket.ledger.length}</p>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-['Montserrat',sans-serif] font-bold text-lg text-black">Riwayat Kantong</h3>
          <span className="font-['Lato',sans-serif] text-gray-400 text-xs">{pocket.ledger.length} entri</span>
        </div>

        {pocket.ledger.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada riwayat transaksi</p>
          </div>
        ) : (
          <div className="space-y-1">
            {pocket.ledger.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3.5 border-b border-[#f3f4f6] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${entry.type === "CREDIT" ? "bg-green-50" : "bg-red-50"}`}>
                    <svg className={`w-5 h-5 ${entry.type === "CREDIT" ? "text-green-500" : "text-red-500"}`} fill="currentColor" viewBox="0 0 20 20">
                      {entry.type === "CREDIT" ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">
                      {ledgerDescription(entry)}
                    </p>
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{formatDate(entry.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className={`font-['Montserrat',sans-serif] font-bold text-sm ${entry.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                    {entry.type === "CREDIT" ? "+" : "-"}{formatRupiah(entry.amount)}
                  </p>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-xs">Saldo: {formatRupiah(entry.balanceAfter)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
