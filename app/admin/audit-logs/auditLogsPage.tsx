"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface AuditActor {
  userId: string;
  email: string;
  role: string;
  fullName: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: AuditActor;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  createdAt: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 rounded-lg text-sm font-['Poppins',sans-serif] font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        ← Prev
      </button>
      <span className="font-['Lato',sans-serif] text-gray-500 text-sm px-2">{page} / {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 rounded-lg text-sm font-['Poppins',sans-serif] font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next →
      </button>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls = role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-700" :
    role === "PARENT" ? "bg-teal-100 text-bsi-teal-primary" : "bg-orange-100 text-bsi-orange-primary";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${cls}`}>{role}</span>;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = async (p: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (filterAction) params.set("action", filterAction);
      if (filterEntity) params.set("entityType", filterEntity);
      if (filterFrom) params.set("from", new Date(filterFrom).toISOString());
      if (filterTo) params.set("to", new Date(filterTo + "T23:59:59").toISOString());

      const res = await authFetch(`${API_BASE_URL}/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs ?? []);
        setMeta(data.meta);
        setError("");
      } else {
        setError(data.message ?? "Gagal memuat audit log");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  const handleSearch = () => { setPage(1); fetchLogs(1); };
  const handleReset = () => {
    setFilterAction(""); setFilterEntity(""); setFilterFrom(""); setFilterTo("");
    setPage(1); setTimeout(() => fetchLogs(1), 0);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-2xl">Audit Log</h1>
        <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">Riwayat seluruh aksi yang dilakukan di platform</p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-['Poppins',sans-serif] font-semibold text-gray-600 text-xs mb-1">Action</label>
            <input value={filterAction} onChange={e => setFilterAction(e.target.value)}
              placeholder="Contoh: BALANCE_ADJUST"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] font-semibold text-gray-600 text-xs mb-1">Entity Type</label>
            <input value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
              placeholder="Contoh: ParentProfile"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] font-semibold text-gray-600 text-xs mb-1">Dari Tanggal</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] font-semibold text-gray-600 text-xs mb-1">Sampai Tanggal</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleSearch}
            className="px-4 py-2 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity">
            Cari
          </button>
          <button onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
          <span className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">
            {meta.total.toLocaleString("id-ID")} entri
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <svg className="animate-spin w-6 h-6 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="font-['Lato',sans-serif] text-red-500 text-sm">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Tidak ada log ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                  {["Waktu", "Aktor", "Action", "Entity", "Entity ID", "IP"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#f9fafa] transition-colors">
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-xs whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-xs">{log.actor.fullName ?? log.actor.email}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <RoleBadge role={log.actor.role} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-['Poppins',sans-serif] font-semibold text-bsi-teal-primary text-xs bg-[rgba(0,124,128,0.08)] px-2 py-0.5 rounded-lg">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-xs">{log.entityType}</td>
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-400 text-xs font-mono">
                      {log.entityId ? log.entityId.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-400 text-xs">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="px-5 py-3 border-t border-[#f3f4f6]">
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={p => setPage(p)} />
          </div>
        )}
      </div>
    </div>
  );
}
