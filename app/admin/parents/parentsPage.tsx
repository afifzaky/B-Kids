"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ParentItem {
  id: string;
  fullName: string;
  nik: string;
  bsiAccountNumber: string;
  balance: string;
  user: { id: string; email: string; phone: string | null; isActive: boolean; createdAt: string };
  childrenCount: number;
  children: { id: string; fullName: string; isActive: boolean }[];
}

interface Meta { page: number; limit: number; total: number; totalPages: number; }

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

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
}

export function AdminParentsPage() {
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [page, setPage] = useState(1);

  // Status toggle modal
  const [toggleTarget, setToggleTarget] = useState<ParentItem | null>(null);
  const [toggleReason, setToggleReason] = useState("");
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState("");

  const fetchParents = async (p: number, s: string, a: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (s) params.set("search", s);
      if (a) params.set("isActive", a);
      const res = await authFetch(`${API_BASE_URL}/api/admin/parents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setParents(data.parents ?? []);
        setMeta(data.meta);
        setError("");
      } else {
        setError(data.message ?? "Gagal memuat data");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParents(page, search, filterActive); }, [page]);

  const handleSearch = () => { setPage(1); fetchParents(1, search, filterActive); };

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setToggleLoading(true);
    setToggleError("");
    try {
      const newStatus = !toggleTarget.user.isActive;
      const body: Record<string, unknown> = { isActive: newStatus };
      if (toggleReason.trim()) body.reason = toggleReason.trim();
      const res = await authFetch(`${API_BASE_URL}/api/admin/parents/${toggleTarget.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setParents(prev => prev.map(p => p.id === toggleTarget.id
          ? { ...p, user: { ...p.user, isActive: newStatus } } : p));
        setToggleTarget(null);
        setToggleReason("");
      } else {
        setToggleError(data.message ?? "Gagal mengubah status");
      }
    } catch {
      setToggleError("Gagal terhubung ke server");
    } finally {
      setToggleLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-2xl">Manajemen Parent</h1>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">Kelola akun orang tua yang terdaftar</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Cari nama, email, NIK, atau no. rekening..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
          <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-['Poppins',sans-serif] font-semibold text-gray-600 focus:border-bsi-teal-primary focus:outline-none bg-white">
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
          <button onClick={handleSearch}
            className="px-5 py-2.5 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
            Cari
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3f4f6]">
          <span className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">{meta.total.toLocaleString("id-ID")} orang tua</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <svg className="animate-spin w-6 h-6 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <div className="py-10 text-center"><p className="font-['Lato',sans-serif] text-red-500 text-sm">{error}</p></div>
        ) : parents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Tidak ada orang tua ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                  {["Nama", "Email", "No. Rekening BSI", "Saldo", "Anak", "Status", "Bergabung", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {parents.map(parent => (
                  <tr key={parent.id} className="hover:bg-[#f9fafa] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{parent.fullName}</p>
                    </td>
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-sm">{parent.user.email}</td>
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-sm font-mono">{parent.bsiAccountNumber}</td>
                    <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-bsi-teal-primary text-sm">{parent.balance}</td>
                    <td className="px-4 py-3">
                      <span className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">{parent.childrenCount}</span>
                      <span className="font-['Lato',sans-serif] text-gray-400 text-xs ml-1">anak</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge isActive={parent.user.isActive} /></td>
                    <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(parent.user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/parents/${parent.id}`}
                          className="px-3 py-1.5 bg-[rgba(0,124,128,0.08)] text-bsi-teal-primary text-xs font-['Poppins',sans-serif] font-semibold rounded-lg hover:bg-[rgba(0,124,128,0.15)] transition-colors whitespace-nowrap">
                          Detail
                        </Link>
                        <button onClick={() => { setToggleTarget(parent); setToggleReason(""); setToggleError(""); }}
                          className={`px-3 py-1.5 text-xs font-['Poppins',sans-serif] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                            parent.user.isActive
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}>
                          {parent.user.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </div>
                    </td>
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

      {/* Toggle Status Modal */}
      {toggleTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-1">
              {toggleTarget.user.isActive ? "Nonaktifkan" : "Aktifkan"} Akun
            </h3>
            <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-5">
              {toggleTarget.user.isActive
                ? `Akun ${toggleTarget.fullName} akan dinonaktifkan. Orang tua tidak dapat login.`
                : `Akun ${toggleTarget.fullName} akan diaktifkan kembali.`}
            </p>
            <div className="mb-4">
              <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                Alasan <span className="font-normal text-gray-400">(opsional)</span>
              </label>
              <input value={toggleReason} onChange={e => setToggleReason(e.target.value)}
                placeholder="Masukkan alasan perubahan status..."
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
            </div>
            {toggleError && <p className="text-red-500 text-sm font-['Lato',sans-serif] mb-3">{toggleError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setToggleTarget(null)} disabled={toggleLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleToggleStatus} disabled={toggleLoading}
                className={`flex-1 py-2.5 text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl transition-opacity disabled:opacity-60 ${
                  toggleTarget.user.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
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
