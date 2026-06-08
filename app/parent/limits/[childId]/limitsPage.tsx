"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "../../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface SpendingLimit {
  id: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  limitAmount: number;
  voucherType: string | null;
  excludeInfaq: boolean;
  updatedAt: string;
}

const PERIOD_LABELS: Record<string, string> = {
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
};

const PERIOD_ICONS: Record<string, string> = {
  DAILY: "📅",
  WEEKLY: "📆",
  MONTHLY: "🗓️",
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function LimitsPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params?.childId as string;

  const [limits, setLimits] = useState<SpendingLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [daily, setDaily] = useState<string>("");
  const [weekly, setWeekly] = useState<string>("");
  const [monthly, setMonthly] = useState<string>("");
  const [excludeInfaq, setExcludeInfaq] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>("Anak");

  const loadLimits = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/auth/parent/login"); return; }
    setIsLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/limits/${childId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const data: SpendingLimit[] = json.data ?? [];
        setLimits(data);
        // Pre-fill form from existing limits
        const d = data.find((l) => l.period === "DAILY" && !l.voucherType);
        const w = data.find((l) => l.period === "WEEKLY" && !l.voucherType);
        const m = data.find((l) => l.period === "MONTHLY" && !l.voucherType);
        setDaily(d ? String(d.limitAmount) : "");
        setWeekly(w ? String(w.limitAmount) : "");
        setMonthly(m ? String(m.limitAmount) : "");
        if (d) setExcludeInfaq(d.excludeInfaq);
      } else {
        setError(json.message ?? "Gagal memuat batas pengeluaran");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (childId) {
      loadLimits();
      // Try to get child name from accounts page cache
      const stored = localStorage.getItem(`child_name_${childId}`);
      if (stored) setChildName(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const body: Record<string, number | null | boolean> = { excludeInfaq };
      body.daily = daily !== "" ? parseFloat(daily) : null;
      body.weekly = weekly !== "" ? parseFloat(weekly) : null;
      body.monthly = monthly !== "" ? parseFloat(monthly) : null;

      const res = await authFetch(`${API_BASE_URL}/api/limits/${childId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setLimits(json.data ?? []);
        setSaveSuccess("Batas pengeluaran berhasil disimpan");
      } else {
        setSaveError(json.message ?? "Gagal menyimpan batas pengeluaran");
      }
    } catch {
      setSaveError("Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
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

  const generalLimits = limits.filter((l) => !l.voucherType);
  const categoryLimits = limits.filter((l) => l.voucherType);

  return (
    <div className="p-4 sm:p-8 lg:p-10">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Link href="/parent/accounts" className="text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold hover:underline">
              Akun Anak
            </Link>
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-['Lato',sans-serif] text-gray-400">Batas Pengeluaran</span>
          </div>
          <div className="flex items-center gap-3 mb-1">
            <svg className="w-7 h-7 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
              Batas Pengeluaran
            </h1>
          </div>
          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm sm:text-base">
            Atur batas pengeluaran untuk <span className="font-semibold">{childName}</span>. Kosongkan field untuk menonaktifkan batas.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Edit Form */}
          <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6">
            <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-5">
              Atur Batas Umum
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
              {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((period) => {
                const val = period === "DAILY" ? daily : period === "WEEKLY" ? weekly : monthly;
                const setter = period === "DAILY" ? setDaily : period === "WEEKLY" ? setWeekly : setMonthly;
                return (
                  <div key={period}>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                      {PERIOD_ICONS[period]} Batas {PERIOD_LABELS[period]} (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-gray-400 text-sm">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={val}
                        onChange={(e) => setter(e.target.value)}
                        placeholder="Kosongkan untuk nonaktif"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e0e7e7] font-['Poppins',sans-serif] text-gray-800 text-sm focus:outline-none focus:border-bsi-teal-primary focus:ring-1 focus:ring-bsi-teal-primary"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Exclude Infaq toggle */}
              <div className="flex items-start gap-3 p-4 bg-[#f9fafa] rounded-xl">
                <button
                  type="button"
                  onClick={() => setExcludeInfaq((v) => !v)}
                  className={`relative w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${excludeInfaq ? "bg-bsi-teal-primary" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${excludeInfaq ? "translate-x-5" : "translate-x-1"}`} />
                </button>
                <div>
                  <p className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">Kecualikan Infaq</p>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5">
                    Jika aktif, pembayaran infaq tidak dihitung dalam batas pengeluaran
                  </p>
                </div>
              </div>

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="font-['Poppins',sans-serif] text-green-700 text-sm">{saveSuccess}</p>
                </div>
              )}

              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{saveError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Batas Pengeluaran"}
              </button>
            </form>
          </div>

          {/* Current Limits */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6">
              <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-4">
                Batas Aktif Saat Ini
              </h2>

              {generalLimits.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🔓</div>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada batas pengeluaran yang diatur</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generalLimits.map((limit) => (
                    <div key={limit.id} className="flex items-center justify-between p-4 bg-[#f9fafa] rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{PERIOD_ICONS[limit.period]}</span>
                        <div>
                          <p className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">
                            {PERIOD_LABELS[limit.period]}
                          </p>
                          <p className="font-['Lato',sans-serif] text-gray-400 text-xs">
                            Diperbarui {formatDate(limit.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-base">
                          {formatRupiah(limit.limitAmount)}
                        </p>
                        {limit.excludeInfaq && (
                          <p className="font-['Lato',sans-serif] text-gray-400 text-xs">Infaq dikecualikan</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Limits (read-only display) */}
            {categoryLimits.length > 0 && (
              <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6">
                <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-4">
                  Batas per Kategori Voucher
                </h2>
                <div className="space-y-3">
                  {categoryLimits.map((limit) => (
                    <div key={limit.id} className="flex items-center justify-between p-4 bg-[#f9fafa] rounded-2xl">
                      <div>
                        <p className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm capitalize">
                          {limit.voucherType}
                        </p>
                        <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{PERIOD_LABELS[limit.period]}</p>
                      </div>
                      <p className="font-['Montserrat',sans-serif] font-bold text-bsi-orange-primary text-base">
                        {formatRupiah(limit.limitAmount)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-3">
                  Batas per kategori dikelola melalui pengaturan lanjutan
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
