"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface InstitutionStats { totalDonors: number; totalRp: string; }
interface Institution {
  id: string; code: string; name: string; description: string | null;
  logoUrl: string | null; bankInfo: string | null; isActive: boolean; createdAt: string;
  stats: InstitutionStats;
}
interface InfaqSummary { allTime: { totalRp: string; count: number }; thisMonth: { totalRp: string; count: number }; thisYear: { totalRp: string; count: number }; }
interface ByInstitution { id: string; code: string; name: string; isActive: boolean; totalRp: string; count: number; }
interface InfaqLog {
  id: string; amount: string; notes: string | null; createdAt: string;
  child: { id: string; fullName: string; username: string | null };
  institution: { name: string; code: string };
}
interface Meta { page: number; limit: number; total: number; totalPages: number; }

const EMPTY_FORM = { code: "", name: "", description: "", logoUrl: "", bankInfo: "" };

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 rounded-lg text-sm font-['Poppins',sans-serif] font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Prev</button>
      <span className="font-['Lato',sans-serif] text-gray-500 text-sm px-2">{page} / {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 rounded-lg text-sm font-['Poppins',sans-serif] font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
    </div>
  );
}

export function AdminInfaqPage() {
  const [tab, setTab] = useState<"stats" | "lembaga" | "log">("stats");

  // Stats
  const [summary, setSummary] = useState<InfaqSummary | null>(null);
  const [byInstitution, setByInstitution] = useState<ByInstitution[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Institutions
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [instLoading, setInstLoading] = useState(false);

  // Logs
  const [logs, setLogs] = useState<InfaqLog[]>([]);
  const [logMeta, setLogMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [logLoading, setLogLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logFilterInst, setLogFilterInst] = useState("");
  const [logFrom, setLogFrom] = useState("");
  const [logTo, setLogTo] = useState("");

  // Institution modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Institution | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Status toggle
  const [toggleTarget, setToggleTarget] = useState<Institution | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState("");

  const token = () => localStorage.getItem("accessToken") ?? "";

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/infaq/stats`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setByInstitution(data.data.byInstitution ?? []);
      }
    } catch { /* ignore */ }
    finally { setStatsLoading(false); }
  };

  const fetchInstitutions = async () => {
    setInstLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/infaq/institutions?includeInactive=true`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setInstitutions(data.data ?? []);
    } catch { /* ignore */ }
    finally { setInstLoading(false); }
  };

  const fetchLogs = async (p: number) => {
    setLogLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (logFilterInst) params.set("institutionId", logFilterInst);
      if (logFrom) params.set("from", new Date(logFrom).toISOString());
      if (logTo) params.set("to", new Date(logTo + "T23:59:59").toISOString());
      const res = await authFetch(`${API_BASE_URL}/api/admin/infaq?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { setLogs(data.logs ?? []); setLogMeta(data.meta); }
    } catch { /* ignore */ }
    finally { setLogLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (tab === "lembaga") fetchInstitutions(); }, [tab]);
  useEffect(() => { if (tab === "log") fetchLogs(logPage); }, [tab, logPage]);

  const openCreate = () => { setEditTarget(null); setForm({ ...EMPTY_FORM }); setFormError(""); setModalOpen(true); };
  const openEdit = (inst: Institution) => {
    setEditTarget(inst);
    setForm({ code: inst.code, name: inst.name, description: inst.description ?? "", logoUrl: inst.logoUrl ?? "", bankInfo: inst.bankInfo ?? "" });
    setFormError(""); setModalOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!form.name.trim()) { setFormError("Nama lembaga wajib diisi"); return; }
    if (!editTarget && !form.code.trim()) { setFormError("Kode lembaga wajib diisi"); return; }
    setFormLoading(true); setFormError("");
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      ...(form.description && { description: form.description.trim() }),
      ...(form.logoUrl && { logoUrl: form.logoUrl.trim() }),
      ...(form.bankInfo && { bankInfo: form.bankInfo.trim() }),
    };
    if (!editTarget) body.code = form.code.trim().toUpperCase();
    try {
      const url = editTarget
        ? `${API_BASE_URL}/api/admin/infaq/institutions/${editTarget.id}`
        : `${API_BASE_URL}/api/admin/infaq/institutions`;
      const res = await authFetch(url, {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { setModalOpen(false); fetchInstitutions(); fetchStats(); }
      else setFormError(data.message ?? "Gagal menyimpan lembaga");
    } catch { setFormError("Gagal terhubung ke server"); }
    finally { setFormLoading(false); }
  };

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true); setToggleError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/infaq/institutions/${toggleTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ isActive: !toggleTarget.isActive }),
      });
      const data = await res.json();
      if (data.success) { setToggleTarget(null); fetchInstitutions(); }
      else setToggleError(data.message ?? "Gagal mengubah status");
    } catch { setToggleError("Gagal terhubung ke server"); }
    finally { setToggleLoading(false); }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-2xl">Manajemen Infaq</h1>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">Kelola lembaga dan log infaq & sedekah anak</p>
        </div>
        {tab === "lembaga" && (
          <button onClick={openCreate}
            className="px-4 py-2.5 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Lembaga
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#f1f4f4] rounded-xl w-fit">
        {(["stats", "lembaga", "log"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-['Poppins',sans-serif] font-semibold transition-all ${
              tab === t ? "bg-white text-bsi-teal-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "stats" ? "Statistik" : t === "lembaga" ? "Lembaga" : "Log Infaq"}
          </button>
        ))}
      </div>

      {/* STATISTIK TAB */}
      {tab === "stats" && (
        <>
          {statsLoading ? (
            <div className="py-16 text-center">
              <svg className="animate-spin w-6 h-6 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Total Infaq Sepanjang Waktu", ...summary.allTime, color: "from-bsi-teal-primary to-bsi-teal-secondary" },
                    { label: "Infaq Bulan Ini", ...summary.thisMonth, color: "from-bsi-orange-primary to-bsi-orange-secondary" },
                    { label: "Infaq Tahun Ini", ...summary.thisYear, color: "from-emerald-500 to-emerald-400" },
                  ].map(({ label, totalRp, count, color }) => (
                    <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-sm`}>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <p className="font-['Poppins',sans-serif] font-semibold text-sm opacity-90">{label}</p>
                      </div>
                      <p className="font-['Poppins',sans-serif] font-bold text-2xl">{totalRp}</p>
                      <p className="font-['Lato',sans-serif] text-white/70 text-xs mt-1">{count.toLocaleString("id-ID")} transaksi</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#f3f4f6]">
                  <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">Per Lembaga</h2>
                </div>
                {byInstitution.length === 0 ? (
                  <div className="py-10 text-center"><p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada data infaq</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                          {["Lembaga", "Kode", "Total Infaq", "Jumlah Transaksi", "Status"].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f3f4f6]">
                        {byInstitution.map(inst => (
                          <tr key={inst.id} className="hover:bg-[#f9fafa] transition-colors">
                            <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{inst.name}</td>
                            <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs font-mono">{inst.code}</td>
                            <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-emerald-600 text-sm">{inst.totalRp}</td>
                            <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-sm">{inst.count.toLocaleString("id-ID")}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${inst.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {inst.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* LEMBAGA TAB */}
      {tab === "lembaga" && (
        <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f3f4f6]">
            <span className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">{institutions.length} lembaga</span>
          </div>
          {instLoading ? (
            <div className="py-16 text-center">
              <svg className="animate-spin w-6 h-6 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : institutions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🕌</div>
              <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada lembaga terdaftar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                    {["Nama Lembaga", "Kode", "Info Bank", "Total Donatur", "Total Infaq", "Status", "Aksi"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {institutions.map(inst => (
                    <tr key={inst.id} className="hover:bg-[#f9fafa] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{inst.name}</p>
                        {inst.description && <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5 max-w-[200px] truncate">{inst.description}</p>}
                      </td>
                      <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs font-mono">{inst.code}</td>
                      <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs max-w-[160px] truncate">{inst.bankInfo ?? "—"}</td>
                      <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-sm">{inst.stats.totalDonors}</td>
                      <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-emerald-600 text-sm">{inst.stats.totalRp}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${inst.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {inst.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(inst)}
                            className="px-3 py-1.5 bg-[rgba(0,124,128,0.08)] text-bsi-teal-primary text-xs font-['Poppins',sans-serif] font-semibold rounded-lg hover:bg-[rgba(0,124,128,0.15)] transition-colors">
                            Edit
                          </button>
                          <button onClick={() => { setToggleTarget(inst); setToggleError(""); }}
                            className={`px-3 py-1.5 text-xs font-['Poppins',sans-serif] font-semibold rounded-lg transition-colors ${
                              inst.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}>
                            {inst.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LOG INFAQ TAB */}
      {tab === "log" && (
        <>
          <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              <select value={logFilterInst} onChange={e => setLogFilterInst(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Poppins',sans-serif] text-gray-600 focus:border-bsi-teal-primary focus:outline-none bg-white">
                <option value="">Semua Lembaga</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input type="date" value={logFrom} onChange={e => setLogFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
              <input type="date" value={logTo} onChange={e => setLogTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
              <button onClick={() => { setLogPage(1); fetchLogs(1); }}
                className="px-4 py-2 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity">
                Filter
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f3f4f6]">
              <span className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">{logMeta.total} log</span>
            </div>
            {logLoading ? (
              <div className="py-16 text-center">
                <svg className="animate-spin w-6 h-6 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3">❤️</div>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada log infaq</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                        {["Waktu", "Anak", "Lembaga", "Jumlah", "Catatan"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-[#f9fafa] transition-colors">
                          <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                          <td className="px-4 py-3">
                            <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{log.child.fullName}</p>
                            <p className="font-['Lato',sans-serif] text-gray-400 text-xs">@{log.child.username ?? "—"}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">{log.institution.name}</p>
                            <p className="font-['Lato',sans-serif] text-gray-400 text-xs font-mono">{log.institution.code}</p>
                          </td>
                          <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-emerald-600 text-sm">{log.amount}</td>
                          <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-400 text-xs max-w-[200px] truncate">{log.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-[#f3f4f6]">
                  <Pagination page={logPage} totalPages={logMeta.totalPages} onPageChange={p => setLogPage(p)} />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Institution Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#f3f4f6]">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg">
                {editTarget ? "Edit Lembaga" : "Tambah Lembaga Baru"}
              </h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!editTarget && (
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                    Kode Lembaga * <span className="font-normal text-gray-400 text-xs">(huruf besar & angka)</span>
                  </label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: BSI_MASLAHAT"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] font-mono focus:border-bsi-teal-primary focus:outline-none" />
                </div>
              )}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Nama Lembaga *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: BSI Maslahat"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
              </div>
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Info Rekening Bank</label>
                <input value={form.bankInfo} onChange={e => setForm(f => ({ ...f, bankInfo: e.target.value }))}
                  placeholder="Contoh: BSI - 7155555001 a.n. BSI Maslahat"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
              </div>
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Deskripsi singkat lembaga..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none resize-none" />
              </div>
              {formError && <p className="text-red-500 text-sm font-['Lato',sans-serif]">{formError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-[#f3f4f6] flex gap-3">
              <button onClick={() => setModalOpen(false)} disabled={formLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleFormSubmit} disabled={formLoading}
                className="flex-1 py-2.5 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 disabled:opacity-60">
                {formLoading ? "Menyimpan..." : editTarget ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Modal */}
      {toggleTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-2">
              {toggleTarget.isActive ? "Nonaktifkan" : "Aktifkan"} Lembaga?
            </h3>
            <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-5">
              Lembaga <strong>{toggleTarget.name}</strong> akan {toggleTarget.isActive ? "dinonaktifkan dan tidak muncul sebagai pilihan infaq anak." : "diaktifkan kembali."}
            </p>
            {toggleError && <p className="text-red-500 text-sm mb-3 font-['Lato',sans-serif]">{toggleError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setToggleTarget(null)} disabled={toggleLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleToggleStatus} disabled={toggleLoading}
                className={`flex-1 py-2.5 text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl transition-colors disabled:opacity-60 ${
                  toggleTarget.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}>
                {toggleLoading ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
