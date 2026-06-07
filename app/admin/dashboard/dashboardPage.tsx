"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface PlatformStats {
  users: {
    totalParents: number;
    activeParents: number;
    inactiveParents: number;
    totalChildren: number;
    activeChildren: number;
    inactiveChildren: number;
    newUsersToday: number;
  };
  financial: {
    totalChildBalanceRp: string;
    totalParentBalanceRp: string;
  };
  activity: {
    transactionsThisMonth: number;
    choresThisMonth: number;
    choresPendingReview: number;
    infaqThisMonthRp: string;
  };
  generatedAt: string;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e8eeed] p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-['Lato',sans-serif] text-gray-500 text-xs mb-0.5">{label}</p>
        <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-xl leading-tight truncate">{value}</p>
        {sub && <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">{title}</h2>
      {subtitle && <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        setLastUpdated(new Date());
        setError("");
      } else {
        setError(data.message ?? "Gagal memuat statistik");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 120000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="font-['Poppins',sans-serif] text-gray-400 text-sm">Memuat data platform...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 sm:p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-['Poppins',sans-serif] font-bold text-red-700 text-sm">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchStats(); }}
              className="mt-2 font-['Poppins',sans-serif] text-red-600 text-xs font-semibold hover:underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-2xl">Dashboard Admin</h1>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">
            Ringkasan platform B-Kids secara keseluruhan
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="font-['Lato',sans-serif] text-gray-400 text-xs">
              Diperbarui: {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-[#e0e7e7] text-gray-500 hover:text-bsi-teal-primary transition-all"
            title="Refresh data"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Pengguna */}
          <section>
            <SectionHeader title="Pengguna" subtitle="Total akun yang terdaftar di platform" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Orang Tua"
                value={stats.users.totalParents}
                sub={`${stats.users.activeParents} aktif · ${stats.users.inactiveParents} nonaktif`}
                accent="bg-[rgba(0,124,128,0.1)]"
                icon={
                  <svg className="w-5 h-5 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                }
              />
              <StatCard
                label="Total Anak"
                value={stats.users.totalChildren}
                sub={`${stats.users.activeChildren} aktif · ${stats.users.inactiveChildren} nonaktif`}
                accent="bg-[rgba(237,139,0,0.1)]"
                icon={
                  <svg className="w-5 h-5 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                }
              />
              <StatCard
                label="Pengguna Baru Hari Ini"
                value={stats.users.newUsersToday}
                accent="bg-blue-50"
                icon={
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                }
              />
              <StatCard
                label="Tantangan Pending Review"
                value={stats.activity.choresPendingReview}
                sub="Menunggu persetujuan orang tua"
                accent="bg-yellow-50"
                icon={
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                }
              />
            </div>
          </section>

          {/* Finansial */}
          <section>
            <SectionHeader title="Finansial" subtitle="Total saldo yang tersimpan di platform" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="font-['Poppins',sans-serif] font-semibold text-sm opacity-90">Total Saldo Anak</span>
                </div>
                <p className="font-['Poppins',sans-serif] font-bold text-2xl sm:text-3xl">
                  {stats.financial.totalChildBalanceRp}
                </p>
                <p className="font-['Lato',sans-serif] text-white/60 text-xs mt-1">Seluruh rekening tabungan anak</p>
              </div>
              <div className="bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary rounded-2xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span className="font-['Poppins',sans-serif] font-semibold text-sm opacity-90">Total Saldo Orang Tua</span>
                </div>
                <p className="font-['Poppins',sans-serif] font-bold text-2xl sm:text-3xl">
                  {stats.financial.totalParentBalanceRp}
                </p>
                <p className="font-['Lato',sans-serif] text-white/60 text-xs mt-1">Rekening BSI yang terhubung</p>
              </div>
            </div>
          </section>

          {/* Aktivitas Bulan Ini */}
          <section>
            <SectionHeader
              title="Aktivitas Bulan Ini"
              subtitle={`Data sejak awal ${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Transaksi"
                value={stats.activity.transactionsThisMonth.toLocaleString("id-ID")}
                sub="Seluruh jenis transaksi ledger"
                accent="bg-green-50"
                icon={
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                }
              />
              <StatCard
                label="Tantangan Dibuat"
                value={stats.activity.choresThisMonth.toLocaleString("id-ID")}
                sub="Chores yang dibuat orang tua"
                accent="bg-purple-50"
                icon={
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                }
              />
              <StatCard
                label="Total Infaq"
                value={stats.activity.infaqThisMonthRp}
                sub="Infaq & sedekah seluruh anak"
                accent="bg-emerald-50"
                icon={
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                }
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
