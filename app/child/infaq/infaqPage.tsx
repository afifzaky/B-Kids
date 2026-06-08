"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Institution {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logoUrl: string | null;
  bankInfo: string | null;
}

interface InfaqLog {
  id: string;
  institution: { name: string; code: string; logoUrl: string | null };
  amount: number;
  notes: string | null;
  createdAt: string;
}

interface InfaqData {
  monthlyTotal: number;
  logs: InfaqLog[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return `Hari ini, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function InfaqPage() {
  const [data, setData] = useState<InfaqData | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const loadData = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setIsLoading(true);
    try {
      const [infaqRes, instRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/infaq`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/infaq/institutions`),
      ]);
      const [infaqJson, instJson] = await Promise.all([infaqRes.json(), instRes.json()]);
      if (infaqJson.success) setData(infaqJson.data);
      else setError(infaqJson.message ?? "Gagal memuat data infaq");
      if (Array.isArray(instJson)) setInstitutions(instJson);
      else if (instJson.data) setInstitutions(instJson.data);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const amountNum = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!selectedInstitutionId) { setSubmitError("Pilih lembaga infaq terlebih dahulu"); return; }
    if (!amountNum || amountNum <= 0) { setSubmitError("Masukkan jumlah infaq yang valid"); return; }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/infaq`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ institutionId: selectedInstitutionId, amount: amountNum, notes: notes || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitSuccess(`Infaq berhasil! ${formatRupiah(json.data?.amount ?? amountNum)} telah dikirim.`);
        setShowForm(false);
        setAmount("");
        setNotes("");
        setSelectedInstitutionId("");
        loadData();
      } else {
        setSubmitError(json.message ?? "Gagal mengirim infaq");
      }
    } catch {
      setSubmitError("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
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

  return (
    <div className="p-4 sm:p-8 lg:p-10">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🤲</span>
              <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
                Infaq & Sedekah
              </h1>
            </div>
            <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm sm:text-base">
              Berbagi kebaikan melalui infaq kepada lembaga terpercaya
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setSubmitError(null); setSubmitSuccess(null); }}
            className="flex items-center gap-2 bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Infaq Sekarang
          </button>
        </div>

        {/* Success Banner */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-green-700 text-sm font-semibold">{submitSuccess}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Infaq Form */}
        {showForm && (
          <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 mb-6">
            <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-5">
              Form Infaq Baru
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Institution */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                  Lembaga Infaq <span className="text-red-500">*</span>
                </label>
                {institutions.length === 0 ? (
                  <div className="text-sm text-gray-400 font-['Lato',sans-serif] py-2">
                    Tidak ada lembaga tersedia
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {institutions.map((inst) => (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => setSelectedInstitutionId(inst.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                          selectedInstitutionId === inst.id
                            ? "border-bsi-teal-primary bg-[rgba(0,97,100,0.06)]"
                            : "border-[#e0e7e7] hover:border-bsi-teal-primary/50"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#f0f9f9] flex items-center justify-center shrink-0 overflow-hidden">
                          {inst.logoUrl ? (
                            <img src={inst.logoUrl} alt={inst.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">🏛️</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm truncate">{inst.name}</p>
                          {inst.description && (
                            <p className="font-['Lato',sans-serif] text-gray-400 text-xs truncate">{inst.description}</p>
                          )}
                        </div>
                        {selectedInstitutionId === inst.id && (
                          <svg className="w-5 h-5 text-bsi-teal-primary shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                  Jumlah Infaq (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 10000"
                  className="w-full px-4 py-3 rounded-xl border border-[#e0e7e7] font-['Poppins',sans-serif] text-gray-800 text-sm focus:outline-none focus:border-bsi-teal-primary focus:ring-1 focus:ring-bsi-teal-primary"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[5000, 10000, 25000, 50000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="px-3 py-1.5 rounded-lg bg-[#f0f9f9] hover:bg-[#e0f2f2] text-bsi-teal-primary font-['Poppins',sans-serif] font-bold text-xs transition-colors"
                    >
                      {formatRupiah(v)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Untuk pembangunan masjid"
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-[#e0e7e7] font-['Poppins',sans-serif] text-gray-800 text-sm focus:outline-none focus:border-bsi-teal-primary focus:ring-1 focus:ring-bsi-teal-primary"
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{submitError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-[#e0e7e7] font-['Poppins',sans-serif] font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm transition-colors disabled:opacity-60"
                >
                  {submitting ? "Mengirim..." : "Kirim Infaq"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats Card */}
        {data && (
          <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary rounded-3xl p-6 mb-6 text-white">
            <p className="font-['Lato',sans-serif] text-white/80 text-sm mb-1">Total Infaq Bulan Ini</p>
            <p className="font-['Montserrat',sans-serif] font-bold text-3xl sm:text-4xl">
              {formatRupiah(data.monthlyTotal)}
            </p>
            <p className="font-['Lato',sans-serif] text-white/70 text-xs mt-2">
              {data.logs.length} total transaksi infaq
            </p>
          </div>
        )}

        {/* Logs */}
        <div>
          <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl mb-4">
            Riwayat Infaq
          </h2>

          {!data || data.logs.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🤲</div>
              <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">
                Belum ada infaq
              </h3>
              <p className="font-['Lato',sans-serif] text-gray-400 text-sm">
                Mulai berbagi kebaikan dengan infaq pertamamu
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm overflow-hidden">
              <div className="divide-y divide-[rgba(189,201,201,0.15)]">
                {data.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between px-5 sm:px-8 py-5 hover:bg-[#f9fafa] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[rgba(0,97,100,0.08)] flex items-center justify-center shrink-0 overflow-hidden">
                        {log.institution.logoUrl ? (
                          <img src={log.institution.logoUrl} alt={log.institution.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-xl">🤲</span>
                        )}
                      </div>
                      <div>
                        <p className="font-['Poppins',sans-serif] font-bold text-black text-sm sm:text-base">
                          {log.institution.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs">
                            {formatDate(log.createdAt)}
                          </p>
                          {log.notes && (
                            <>
                              <span className="text-gray-300">·</span>
                              <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.4)] text-xs truncate max-w-[140px]">
                                {log.notes}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-['Montserrat',sans-serif] font-bold text-base sm:text-lg text-bsi-teal-primary">
                        {formatRupiah(log.amount)}
                      </p>
                      <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.4)] text-xs mt-0.5">
                        {log.institution.code}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
