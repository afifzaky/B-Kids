"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authFetch } from "../../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type PocketCategory = "JAJAN" | "HAJI" | "QURBAN" | "INFAQ" | "CUSTOM";

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
  ledger: LedgerEntry[];
}

const CATEGORY_LABELS: Record<PocketCategory, string> = {
  JAJAN: "Uang Jajan",
  HAJI: "Tabungan Haji",
  QURBAN: "Tabungan Qurban",
  INFAQ: "Alokasi Infaq",
  CUSTOM: "Kantong Pribadi",
};

const SOURCE_LABELS: Record<string, string> = {
  POCKET_ALLOCATE: "Top-up dari Saldo Utama",
  POCKET_DEALLOCATE: "Dikembalikan ke Saldo Utama",
  INFAQ_PAYMENT: "Pembayaran Infaq",
  CHORE_REWARD: "Hadiah Tantangan",
  PARENT_TRANSFER: "Transfer dari Orang Tua",
};

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

export function PocketDetailPage() {
  const params = useParams();
  const pocketId = params.id as string;

  const [pocket, setPocket] = useState<PocketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    authFetch(`${API_BASE_URL}/api/pockets/${pocketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPocket(d.data);
        else setError("Gagal memuat data kantong");
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  }, [pocketId]);

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

  if (error || !pocket) {
    return (
      <div className="p-4 sm:p-8 lg:p-10">
        <div className="max-w-[1280px] mx-auto">
          <Link
            href="/child/pockets"
            className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark mb-6 font-['Poppins',sans-serif] font-bold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Kantongku
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="font-['Poppins',sans-serif] text-red-600">{error ?? "Kantong tidak ditemukan"}</p>
          </div>
        </div>
      </div>
    );
  }

  const remaining = pocket.targetAmount ? pocket.targetAmount - pocket.balance : 0;
  const weeksToGo = remaining > 0 ? Math.ceil(remaining / 100000) : 0;

  return (
    <div className="p-4 sm:p-8 lg:p-10">
      <div className="max-w-[1280px] mx-auto">
        {/* Back button */}
        <Link
          href="/child/pockets"
          className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark mb-6 font-['Poppins',sans-serif] font-bold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Kantongku
        </Link>

        {/* Pocket Header */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <div className="w-20 h-20 rounded-2xl bg-bsi-orange-primary/10 flex items-center justify-center text-4xl flex-shrink-0">
            {pocket.emoji}
          </div>
          <div>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-2xl sm:text-3xl mb-1">
              {pocket.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block bg-[#f0f9f9] text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-xs tracking-widest uppercase px-3 py-1 rounded-full">
                {CATEGORY_LABELS[pocket.category]}
              </span>
              {pocket.isGoalCompleted && (
                <span className="inline-block bg-green-100 text-green-700 font-['Poppins',sans-serif] font-semibold text-xs px-3 py-1 rounded-full">
                  Tujuan Tercapai 🎉
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 sm:p-8 mb-6">
          <h2 className="font-['Poppins',sans-serif] font-bold text-[#6b7280] text-xs uppercase tracking-wide mb-3">
            Saldo Saat Ini
          </h2>
          <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-4xl sm:text-5xl mb-6">
            {formatRupiah(pocket.balance)}
          </p>

          {pocket.targetAmount !== null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Poppins',sans-serif] text-[#6b7280] text-sm">Target</span>
                <span className="font-['Poppins',sans-serif] font-bold text-[#030213] text-sm">
                  {formatRupiah(pocket.targetAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-['Poppins',sans-serif] font-bold text-[#6b7280] text-sm">Progres</span>
                <span className="font-['Poppins',sans-serif] font-bold text-black text-lg">
                  {pocket.progressPercent ?? 0}%
                </span>
              </div>
              <div className="bg-[#f3f4f6] h-4 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, pocket.progressPercent ?? 0)}%` }}
                />
              </div>
              {pocket.deadline && (
                <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs mt-2">
                  Tenggat: {formatDate(pocket.deadline)}
                </p>
              )}
            </div>
          )}

          {pocket.intentionText && (
            <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-sm italic border-l-2 border-bsi-teal-secondary/30 pl-3 mt-4">
              {pocket.intentionText}
            </p>
          )}
        </div>

        {/* Goal Insights */}
        {pocket.targetAmount !== null && !pocket.isGoalCompleted && remaining > 0 && (
          <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary rounded-3xl shadow-lg p-6 sm:p-8 mb-6 text-white">
            <h2 className="font-['Montserrat',sans-serif] font-bold text-xl sm:text-2xl mb-6">
              Info Tujuan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <p className="font-['Poppins',sans-serif] text-white/80 text-xs uppercase tracking-wide mb-2">
                  Sisa Target
                </p>
                <p className="font-['Montserrat',sans-serif] font-bold text-2xl sm:text-3xl">
                  {formatRupiah(remaining)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <p className="font-['Poppins',sans-serif] text-white/80 text-xs uppercase tracking-wide mb-2">
                  Estimasi Selesai
                </p>
                <p className="font-['Montserrat',sans-serif] font-bold text-2xl sm:text-3xl">
                  ~{weeksToGo} minggu
                </p>
                <p className="font-['Lato',sans-serif] text-white/70 text-xs mt-1">
                  Dengan Rp 100.000/minggu
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pocket Activity */}
        <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 sm:p-8">
          <h2 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-xl sm:text-2xl mb-6">
            Aktivitas Kantong
          </h2>

          {pocket.ledger.length > 0 ? (
            <div className="space-y-4">
              {pocket.ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-[#f8fafa] hover:bg-white border border-[#e0e7e7] rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      entry.type === "CREDIT" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      <svg className={`w-6 h-6 ${entry.type === "CREDIT" ? "text-green-600" : "text-red-600"}`} fill="currentColor" viewBox="0 0 20 20">
                        {entry.type === "CREDIT" ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] font-bold text-[#030213] text-base">
                        {entry.notes ?? SOURCE_LABELS[entry.source] ?? entry.source}
                      </p>
                      <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-['Montserrat',sans-serif] font-bold text-lg ${
                      entry.type === "CREDIT" ? "text-green-600" : "text-red-600"
                    }`}>
                      {entry.type === "CREDIT" ? "+" : "-"}{formatRupiah(entry.amount)}
                    </p>
                    <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.4)] text-xs">
                      Saldo: {formatRupiah(entry.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#f8fafa] flex items-center justify-center">
                <svg className="w-10 h-10 text-[#9ca3af]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-['Poppins',sans-serif] font-bold text-[#030213] text-lg mb-2">
                Belum ada aktivitas
              </h3>
              <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">
                Isi kantong ini untuk mulai menabung
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
