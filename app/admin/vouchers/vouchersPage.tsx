"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const VOUCHER_TYPE_LABELS: Record<string, string> = {
  DISCOUNT: "Diskon", GAME_TOPUP: "Top-up Game", E_WALLET: "E-Wallet", EDUCATION: "Edukasi",
};
const VOUCHER_TYPE_COLORS: Record<string, string> = {
  DISCOUNT: "bg-blue-100 text-blue-700", GAME_TOPUP: "bg-purple-100 text-purple-700",
  E_WALLET: "bg-orange-100 text-orange-700", EDUCATION: "bg-green-100 text-green-700",
};

interface Voucher {
  id: string; name: string; provider: string; category: string; voucherType: string;
  price: string; faceValue: string | null; description: string | null;
  imageUrl: string | null; stock: number | null; maxPerChild: number | null;
  validFrom: string | null; validUntil: string | null; isActive: boolean;
  createdAt: string; updatedAt: string;
}

interface Redemption {
  id: string;
  child: { id: string; fullName: string; username: string | null };
  voucher: { name: string; provider: string; voucherType: string };
  amount: string; mockCode: string; redeemedAt: string;
}

interface Meta { page: number; limit: number; total: number; totalPages: number; }

const EMPTY_FORM = {
  name: "", provider: "", category: "", voucherType: "DISCOUNT",
  price: "", faceValue: "", description: "", imageUrl: "",
  stock: "", maxPerChild: "", validFrom: "", validUntil: "", isActive: true,
};

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

export function AdminVouchersPage() {
  const [tab, setTab] = useState<"katalog" | "penukaran">("katalog");

  // Katalog state
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vMeta, setVMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [vLoading, setVLoading] = useState(true);
  const [vError, setVError] = useState("");
  const [vPage, setVPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterProvider, setFilterProvider] = useState("");

  // Redemption state
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [rMeta, setRMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [rLoading, setRLoading] = useState(false);
  const [rPage, setRPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Voucher | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const token = () => localStorage.getItem("accessToken") ?? "";

  const fetchVouchers = async (p: number) => {
    setVLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (filterType) params.set("voucherType", filterType);
      if (filterActive) params.set("isActive", filterActive);
      if (filterProvider) params.set("provider", filterProvider);
      const res = await authFetch(`${API_BASE_URL}/api/admin/vouchers?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { setVouchers(data.vouchers ?? []); setVMeta(data.meta); setVError(""); }
      else setVError(data.message ?? "Gagal memuat voucher");
    } catch { setVError("Gagal terhubung ke server"); }
    finally { setVLoading(false); }
  };

  const fetchRedemptions = async (p: number) => {
    setRLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/vouchers/redemptions?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { setRedemptions(data.redemptions ?? []); setRMeta(data.meta); }
    } catch { /* ignore */ }
    finally { setRLoading(false); }
  };

  useEffect(() => { fetchVouchers(vPage); }, [vPage]);
  useEffect(() => { if (tab === "penukaran") fetchRedemptions(rPage); }, [tab, rPage]);

  const openCreate = () => { setEditTarget(null); setForm({ ...EMPTY_FORM }); setFormError(""); setModalOpen(true); };
  const openEdit = (v: Voucher) => {
    setEditTarget(v);
    setForm({
      name: v.name, provider: v.provider, category: v.category,
      voucherType: v.voucherType, price: v.price.replace(/[^0-9]/g, ""),
      faceValue: v.faceValue?.replace(/[^0-9]/g, "") ?? "",
      description: v.description ?? "", imageUrl: v.imageUrl ?? "",
      stock: v.stock != null ? String(v.stock) : "",
      maxPerChild: v.maxPerChild != null ? String(v.maxPerChild) : "",
      validFrom: v.validFrom ? v.validFrom.slice(0, 10) : "",
      validUntil: v.validUntil ? v.validUntil.slice(0, 10) : "",
      isActive: v.isActive,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!form.name.trim() || !form.provider.trim() || !form.category.trim() || !form.price) {
      setFormError("Nama, provider, kategori, dan harga wajib diisi"); return;
    }
    setFormLoading(true); setFormError("");
    const body: Record<string, unknown> = {
      name: form.name.trim(), provider: form.provider.trim(), category: form.category.trim(),
      voucherType: form.voucherType, price: Number(form.price),
    };
    if (form.faceValue) body.faceValue = Number(form.faceValue);
    if (form.description) body.description = form.description.trim();
    if (form.imageUrl) body.imageUrl = form.imageUrl.trim();
    if (form.stock) body.stock = Number(form.stock);
    if (form.maxPerChild) body.maxPerChild = Number(form.maxPerChild);
    if (form.validFrom) body.validFrom = new Date(form.validFrom).toISOString();
    if (form.validUntil) body.validUntil = new Date(form.validUntil + "T23:59:59").toISOString();
    if (editTarget) body.isActive = form.isActive;

    try {
      const url = editTarget ? `${API_BASE_URL}/api/admin/vouchers/${editTarget.id}` : `${API_BASE_URL}/api/admin/vouchers`;
      const res = await authFetch(url, {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { setModalOpen(false); fetchVouchers(1); setVPage(1); }
      else setFormError(data.message ?? "Gagal menyimpan voucher");
    } catch { setFormError("Gagal terhubung ke server"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true); setDeleteError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/vouchers/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { setDeleteTarget(null); fetchVouchers(vPage); }
      else setDeleteError(data.message ?? "Gagal menghapus voucher");
    } catch { setDeleteError("Gagal terhubung ke server"); }
    finally { setDeleteLoading(false); }
  };

  const formatDate = (iso: string | null) => iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-2xl">Manajemen Voucher</h1>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">Kelola katalog dan riwayat penukaran voucher</p>
        </div>
        {tab === "katalog" && (
          <button onClick={openCreate}
            className="px-4 py-2.5 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Voucher
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#f1f4f4] rounded-xl w-fit">
        {(["katalog", "penukaran"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-['Poppins',sans-serif] font-semibold transition-all capitalize ${
              tab === t ? "bg-white text-bsi-teal-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "katalog" ? "Katalog" : "Riwayat Penukaran"}
          </button>
        ))}
      </div>

      {/* KATALOG TAB */}
      {tab === "katalog" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Poppins',sans-serif] font-semibold text-gray-600 focus:border-bsi-teal-primary focus:outline-none bg-white">
                <option value="">Semua Tipe</option>
                {Object.entries(VOUCHER_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Poppins',sans-serif] font-semibold text-gray-600 focus:border-bsi-teal-primary focus:outline-none bg-white">
                <option value="">Semua Status</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
              <input value={filterProvider} onChange={e => setFilterProvider(e.target.value)}
                placeholder="Filter provider..."
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
              <button onClick={() => { setVPage(1); fetchVouchers(1); }}
                className="px-4 py-2 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity">
                Filter
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f3f4f6]">
              <span className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">{vMeta.total} voucher</span>
            </div>
            {vLoading ? (
              <div className="py-16 text-center">
                <svg className="animate-spin w-6 h-6 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : vError ? (
              <div className="py-10 text-center"><p className="text-red-500 text-sm font-['Lato',sans-serif]">{vError}</p></div>
            ) : vouchers.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3">🎟️</div>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada voucher</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                      {["Nama / Provider", "Tipe", "Harga", "Nilai", "Stok", "Max/Anak", "Berlaku s/d", "Status", "Aksi"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {vouchers.map(v => (
                      <tr key={v.id} className="hover:bg-[#f9fafa] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{v.name}</p>
                          <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{v.provider} · {v.category}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${VOUCHER_TYPE_COLORS[v.voucherType] ?? "bg-gray-100 text-gray-600"}`}>
                            {VOUCHER_TYPE_LABELS[v.voucherType] ?? v.voucherType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-bsi-teal-primary text-sm">{v.price}</td>
                        <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-sm">{v.faceValue ?? "—"}</td>
                        <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-sm">{v.stock ?? "∞"}</td>
                        <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-sm">{v.maxPerChild ?? "∞"}</td>
                        <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs">{formatDate(v.validUntil)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${v.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {v.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(v)}
                              className="px-3 py-1.5 bg-[rgba(0,124,128,0.08)] text-bsi-teal-primary text-xs font-['Poppins',sans-serif] font-semibold rounded-lg hover:bg-[rgba(0,124,128,0.15)] transition-colors">
                              Edit
                            </button>
                            <button onClick={() => { setDeleteTarget(v); setDeleteError(""); }}
                              className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-['Poppins',sans-serif] font-semibold rounded-lg hover:bg-red-100 transition-colors">
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!vLoading && !vError && (
              <div className="px-5 py-3 border-t border-[#f3f4f6]">
                <Pagination page={vPage} totalPages={vMeta.totalPages} onPageChange={p => setVPage(p)} />
              </div>
            )}
          </div>
        </>
      )}

      {/* PENUKARAN TAB */}
      {tab === "penukaran" && (
        <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f3f4f6]">
            <span className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">{rMeta.total} riwayat penukaran</span>
          </div>
          {rLoading ? (
            <div className="py-16 text-center">
              <svg className="animate-spin w-6 h-6 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : redemptions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada penukaran</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f9fafa] border-b border-[#f3f4f6]">
                      {["Anak", "Voucher", "Tipe", "Jumlah", "Kode", "Waktu"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-['Poppins',sans-serif] font-semibold text-gray-500 text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {redemptions.map(r => (
                      <tr key={r.id} className="hover:bg-[#f9fafa] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{r.child.fullName}</p>
                          <p className="font-['Lato',sans-serif] text-gray-400 text-xs">@{r.child.username ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">{r.voucher.name}</p>
                          <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{r.voucher.provider}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${VOUCHER_TYPE_COLORS[r.voucher.voucherType] ?? "bg-gray-100 text-gray-600"}`}>
                            {VOUCHER_TYPE_LABELS[r.voucher.voucherType] ?? r.voucher.voucherType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-['Poppins',sans-serif] font-semibold text-bsi-teal-primary text-sm">{r.amount}</td>
                        <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-600 text-xs font-mono">{r.mockCode}</td>
                        <td className="px-4 py-3 font-['Lato',sans-serif] text-gray-500 text-xs whitespace-nowrap">{formatDate(r.redeemedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-[#f3f4f6]">
                <Pagination page={rPage} totalPages={rMeta.totalPages} onPageChange={p => setRPage(p)} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="px-6 py-4 border-b border-[#f3f4f6]">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg">
                {editTarget ? "Edit Voucher" : "Tambah Voucher Baru"}
              </h3>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {[
                { label: "Nama Voucher *", key: "name", placeholder: "Contoh: Voucher Shopee Rp 10.000" },
                { label: "Provider *", key: "provider", placeholder: "Contoh: Shopee" },
                { label: "Kategori *", key: "category", placeholder: "Contoh: Belanja Online" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">{label}</label>
                  <input value={form[key as keyof typeof form] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Tipe Voucher *</label>
                <select value={form.voucherType} onChange={e => setForm(f => ({ ...f, voucherType: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Poppins',sans-serif] focus:border-bsi-teal-primary focus:outline-none bg-white">
                  {Object.entries(VOUCHER_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Harga (Rp) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="10000"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Nilai Nominal</label>
                  <input type="number" value={form.faceValue} onChange={e => setForm(f => ({ ...f, faceValue: e.target.value }))}
                    placeholder="10000"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Stok</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    placeholder="100 (kosong = tak terbatas)"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Maks per Anak</label>
                  <input type="number" value={form.maxPerChild} onChange={e => setForm(f => ({ ...f, maxPerChild: e.target.value }))}
                    placeholder="3"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Berlaku Dari</label>
                  <input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Berlaku Sampai</label>
                  <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Deskripsi singkat voucher..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] focus:border-bsi-teal-primary focus:outline-none resize-none" />
              </div>
              {editTarget && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-bsi-teal-primary" />
                  <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">Voucher aktif</span>
                </label>
              )}
              {formError && <p className="text-red-500 text-sm font-['Lato',sans-serif]">{formError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-[#f3f4f6] flex gap-3">
              <button onClick={() => setModalOpen(false)} disabled={formLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleFormSubmit} disabled={formLoading}
                className="flex-1 py-2.5 bg-bsi-teal-primary text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                {formLoading ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah Voucher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg mb-2">Hapus Voucher?</h3>
            <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-1">
              Voucher <strong>{deleteTarget.name}</strong> akan dihapus.
            </p>
            <p className="font-['Lato',sans-serif] text-gray-400 text-xs mb-5">
              Jika sudah ada penukaran, voucher akan dinonaktifkan saja.
            </p>
            {deleteError && <p className="text-red-500 text-sm mb-3 font-['Lato',sans-serif]">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-['Poppins',sans-serif] font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleteLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
