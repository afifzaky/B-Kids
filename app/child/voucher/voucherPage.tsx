"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Voucher {
  id: string;
  name: string;
  provider: string;
  category: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
}

interface Redemption {
  id: string;
  voucher: { name: string; provider: string; category: string };
  amount: number;
  mockCode: string | null;
  sourcePocketId: string;
  redeemedAt: string;
}

interface Pocket {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  category: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  all: "🎯",
  food: "🍔",
  education: "📚",
  entertainment: "🎮",
  shopping: "🛍️",
  clothing: "👕",
  health: "💊",
  travel: "✈️",
  other: "⭐",
};

const CATEGORY_LABELS: Record<string, string> = {
  food: "Makanan",
  education: "Pendidikan",
  entertainment: "Hiburan",
  shopping: "Belanja",
  clothing: "Pakaian",
  health: "Kesehatan",
  travel: "Perjalanan",
  other: "Lainnya",
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

function getVoucherIcon(category: string, imageUrl: string | null): string {
  if (imageUrl) return imageUrl;
  return CATEGORY_ICONS[category.toLowerCase()] ?? "🎁";
}

export function VoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [accountBalance, setAccountBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"available" | "my-vouchers">("available");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Detail modal
  const [detailVoucher, setDetailVoucher] = useState<Voucher | null>(null);
  // Buy modal
  const [buyVoucher, setBuyVoucher] = useState<Voucher | null>(null);
  const [selectedPocketId, setSelectedPocketId] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  // Success modal
  const [successRedemption, setSuccessRedemption] = useState<{
    voucher: Voucher;
    mockCode: string | null;
  } | null>(null);

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    "Content-Type": "application/json",
  });

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const [vRes, rRes, pRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/vouchers`, { headers: authHeader() }),
        authFetch(`${API_BASE_URL}/api/vouchers/history`, { headers: authHeader() }),
        authFetch(`${API_BASE_URL}/api/pockets`, { headers: authHeader() }),
      ]);

      const [vData, rData, pData] = await Promise.all([
        vRes.json(),
        rRes.json(),
        pRes.json(),
      ]);

      if (vData.success) setVouchers(vData.data ?? []);
      if (rData.success) setRedemptions(rData.data ?? []);
      if (pData.success) {
        setPockets(pData.data?.pockets ?? []);
        setAccountBalance(pData.data?.account?.balance ?? 0);
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Derive unique categories from available vouchers
  const categories = [
    { id: "all", label: "Semua" },
    ...Array.from(new Set(vouchers.map((v) => v.category.toLowerCase()))).map((c) => ({
      id: c,
      label: CATEGORY_LABELS[c] ?? c,
    })),
  ];

  const filteredVouchers =
    selectedCategory === "all"
      ? vouchers
      : vouchers.filter((v) => v.category.toLowerCase() === selectedCategory);

  const totalPocketBalance = pockets.reduce((s, p) => s + p.balance, 0);

  const handleBuyClick = (voucher: Voucher) => {
    setDetailVoucher(null);
    setBuyVoucher(voucher);
    setBuyError(null);
    const affordable = pockets.find((p) => p.balance >= voucher.price);
    setSelectedPocketId(affordable?.id ?? pockets[0]?.id ?? "");
  };

  const handleConfirmBuy = async () => {
    if (!buyVoucher || !selectedPocketId) return;
    setBuyLoading(true);
    setBuyError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/vouchers/buy`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ voucherId: buyVoucher.id, sourcePocketId: selectedPocketId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBuyError(data.message ?? "Gagal membeli voucher");
        return;
      }
      setSuccessRedemption({ voucher: buyVoucher, mockCode: data.data?.mockCode ?? null });
      setBuyVoucher(null);
      fetchAll();
    } catch {
      setBuyError("Gagal terhubung ke server");
    } finally {
      setBuyLoading(false);
    }
  };

  const selectedPocket = pockets.find((p) => p.id === selectedPocketId);

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
        <div className="mb-6 sm:mb-8">
          <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl mb-1">
            Voucher & Hadiah
          </h1>
          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm sm:text-base">
            Tukarkan saldo kantongmu dengan voucher menarik
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

        {/* Balance Banner */}
        <div className="bg-gradient-to-r from-bsi-orange-primary to-bsi-orange-secondary rounded-3xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute bg-white/10 blur-[40px] -right-10 -top-10 rounded-full w-40 h-40 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="font-['Poppins',sans-serif] text-white/80 text-xs uppercase tracking-wide mb-2">
                Total Saldo Kantong
              </p>
              <div className="flex items-center gap-3">
                <svg className="w-7 h-7 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                <p className="font-['Montserrat',sans-serif] font-bold text-3xl sm:text-4xl">
                  {formatRupiah(totalPocketBalance)}
                </p>
              </div>
              <p className="font-['Lato',sans-serif] text-white/70 text-xs mt-2">
                Saldo Utama: {formatRupiah(accountBalance)}
              </p>
            </div>
            <button
              onClick={() => setActiveTab("my-vouchers")}
              className="bg-white/20 hover:bg-white/30 px-5 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors"
            >
              Voucher Saya
            </button>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-6 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-sm transition-colors ${
              activeTab === "available"
                ? "bg-bsi-teal-primary text-white shadow-sm"
                : "bg-white border border-[#e0e7e7] text-[#4b5563] hover:bg-gray-50"
            }`}
          >
            Voucher Tersedia
          </button>
          <button
            onClick={() => setActiveTab("my-vouchers")}
            className={`px-6 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-sm transition-colors flex items-center gap-2 ${
              activeTab === "my-vouchers"
                ? "bg-bsi-teal-primary text-white shadow-sm"
                : "bg-white border border-[#e0e7e7] text-[#4b5563] hover:bg-gray-50"
            }`}
          >
            Voucher Saya
            {redemptions.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                activeTab === "my-vouchers" ? "bg-white/20" : "bg-bsi-teal-primary/10 text-bsi-teal-primary"
              }`}>
                {redemptions.length}
              </span>
            )}
          </button>
        </div>

        {/* Available Vouchers Tab */}
        {activeTab === "available" && (
          <>
            {/* Category Filter */}
            {categories.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap font-['Poppins',sans-serif] font-semibold text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-bsi-teal-primary text-white"
                        : "bg-white border border-[#e0e7e7] text-[#4b5563] hover:bg-gray-50"
                    }`}
                  >
                    <span>{CATEGORY_ICONS[cat.id] ?? "🎁"}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredVouchers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">
                  Belum ada voucher
                </h3>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm">
                  Saat ini belum ada voucher tersedia. Cek lagi nanti ya!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVouchers.map((voucher) => {
                  const icon = getVoucherIcon(voucher.category, voucher.imageUrl);
                  const canAfford = pockets.some((p) => p.balance >= voucher.price);
                  const isUrl = icon.startsWith("http");
                  return (
                    <div
                      key={voucher.id}
                      className="bg-white rounded-2xl border border-[#e0e7e7] overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary p-8 text-center">
                        {isUrl ? (
                          <img src={icon} alt={voucher.name} className="w-16 h-16 object-contain mx-auto mb-3 rounded-xl" />
                        ) : (
                          <div className="text-6xl mb-3">{icon}</div>
                        )}
                        <h3 className="font-['Montserrat',sans-serif] font-bold text-white text-lg mb-1 line-clamp-2">
                          {voucher.name}
                        </h3>
                        <p className="font-['Poppins',sans-serif] text-white/80 text-xs">{voucher.provider}</p>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">Harga:</span>
                          <span className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg">
                            {formatRupiah(voucher.price)}
                          </span>
                        </div>
                        {voucher.description && (
                          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs line-clamp-2">
                            {voucher.description}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDetailVoucher(voucher)}
                            className="flex-1 bg-white hover:bg-gray-50 border border-[#e0e7e7] rounded-xl py-2.5 font-['Poppins',sans-serif] font-bold text-[#4b5563] text-sm transition-colors"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => handleBuyClick(voucher)}
                            disabled={!canAfford || pockets.length === 0}
                            className={`flex-1 rounded-xl py-2.5 font-['Poppins',sans-serif] font-bold text-sm transition-colors ${
                              canAfford && pockets.length > 0
                                ? "bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {pockets.length === 0 ? "Buat Kantong" : canAfford ? "Beli" : "Saldo Kurang"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* My Vouchers Tab */}
        {activeTab === "my-vouchers" && (
          <>
            {redemptions.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎫</div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">
                  Belum ada voucher
                </h3>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm mb-6">
                  Beli voucher dari tab Voucher Tersedia
                </p>
                <button
                  onClick={() => setActiveTab("available")}
                  className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark px-6 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors"
                >
                  Lihat Voucher Tersedia
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {redemptions.map((r) => {
                  const icon = CATEGORY_ICONS[r.voucher.category.toLowerCase()] ?? "🎁";
                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl border-2 border-[#e0e7e7] p-6"
                    >
                      <div className="flex items-start gap-5">
                        <div className="text-5xl shrink-0">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="font-['Poppins',sans-serif] font-bold text-[#030213] text-lg leading-snug">
                                {r.voucher.name}
                              </h3>
                              <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-sm">
                                {r.voucher.provider}
                              </p>
                            </div>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-['Poppins',sans-serif] font-bold shrink-0">
                              Aktif
                            </span>
                          </div>
                          <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-xl mb-4">
                            {formatRupiah(r.amount)}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {r.mockCode && (
                              <div className="bg-[#f0f9f9] rounded-xl p-3">
                                <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs mb-0.5">
                                  Kode Voucher
                                </p>
                                <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary tracking-widest">
                                  {r.mockCode}
                                </p>
                              </div>
                            )}
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs mb-0.5">
                                Tanggal Pembelian
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[#030213] text-sm">
                                {formatDate(r.redeemedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {detailVoucher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary p-8 text-center">
              {detailVoucher.imageUrl ? (
                <img src={detailVoucher.imageUrl} alt={detailVoucher.name} className="w-20 h-20 object-contain mx-auto mb-4 rounded-xl" />
              ) : (
                <div className="text-7xl mb-4">
                  {getVoucherIcon(detailVoucher.category, null)}
                </div>
              )}
              <h3 className="font-['Montserrat',sans-serif] font-bold text-white text-2xl mb-1">
                {detailVoucher.name}
              </h3>
              <p className="font-['Poppins',sans-serif] text-white/80 text-sm">{detailVoucher.provider}</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)]">Harga Voucher</span>
                <span className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-xl">
                  {formatRupiah(detailVoucher.price)}
                </span>
              </div>
              {detailVoucher.description && (
                <div>
                  <p className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1">Deskripsi</p>
                  <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">
                    {detailVoucher.description}
                  </p>
                </div>
              )}
              <div className="bg-[#f8fafa] border border-[#e0e7e7] rounded-xl p-4 text-sm">
                <p className="font-['Poppins',sans-serif] font-semibold text-gray-700 mb-1">Saldo Kantong Tersedia</p>
                {pockets.length === 0 ? (
                  <p className="font-['Lato',sans-serif] text-gray-400">Belum ada kantong. Buat kantong dulu!</p>
                ) : (
                  pockets.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-1">
                      <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)]">
                        {p.emoji} {p.name}
                      </span>
                      <span className={`font-['Poppins',sans-serif] font-bold text-sm ${
                        p.balance >= detailVoucher.price ? "text-green-600" : "text-red-400"
                      }`}>
                        {formatRupiah(p.balance)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDetailVoucher(null)}
                  className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-[#4b5563] text-sm hover:bg-gray-50 transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={() => handleBuyClick(detailVoucher)}
                  disabled={!pockets.some((p) => p.balance >= detailVoucher.price)}
                  className={`flex-1 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-sm transition-colors ${
                    pockets.some((p) => p.balance >= detailVoucher.price)
                      ? "bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Beli Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy / Confirm Modal */}
      {buyVoucher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">
                Konfirmasi Pembelian
              </h3>
              <button
                onClick={() => setBuyVoucher(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Voucher summary */}
            <div className="bg-[#f0f9f9] border border-[#e0e7e7] rounded-2xl p-4 mb-5 flex items-center gap-4">
              <div className="text-4xl">
                {getVoucherIcon(buyVoucher.category, null)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-['Poppins',sans-serif] font-bold text-[#030213] text-base truncate">
                  {buyVoucher.name}
                </h4>
                <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-sm">{buyVoucher.provider}</p>
                <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg">
                  {formatRupiah(buyVoucher.price)}
                </p>
              </div>
            </div>

            {/* Pocket selector */}
            <div className="mb-5">
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Bayar dari kantong
              </label>
              <select
                value={selectedPocketId}
                onChange={(e) => setSelectedPocketId(e.target.value)}
                className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary bg-white"
              >
                {pockets.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.balance < buyVoucher.price}>
                    {p.emoji} {p.name} — {formatRupiah(p.balance)}
                    {p.balance < buyVoucher.price ? " (saldo kurang)" : ""}
                  </option>
                ))}
              </select>
              {selectedPocket && (
                <div className="mt-2 flex justify-between text-xs font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)]">
                  <span>Saldo kantong: {formatRupiah(selectedPocket.balance)}</span>
                  <span className={selectedPocket.balance >= buyVoucher.price ? "text-green-600" : "text-red-500"}>
                    Sisa: {formatRupiah(selectedPocket.balance - buyVoucher.price)}
                  </span>
                </div>
              )}
            </div>

            {buyError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{buyError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setBuyVoucher(null)}
                className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-[#4b5563] text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={
                  buyLoading ||
                  !selectedPocketId ||
                  !selectedPocket ||
                  selectedPocket.balance < buyVoucher.price
                }
                className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
              >
                {buyLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  "Konfirmasi Beli"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successRedemption && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl mb-1">
                  Berhasil Dibeli!
                </h3>
                <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)]">
                  Voucher kamu sudah siap digunakan
                </p>
              </div>

              <div className="bg-[#f0f9f9] border-2 border-bsi-teal-primary rounded-2xl p-5 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">
                    {getVoucherIcon(successRedemption.voucher.category, null)}
                  </div>
                  <div>
                    <h4 className="font-['Poppins',sans-serif] font-bold text-[#030213] text-base">
                      {successRedemption.voucher.name}
                    </h4>
                    <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary">
                      {formatRupiah(successRedemption.voucher.price)}
                    </p>
                  </div>
                </div>
                {successRedemption.mockCode && (
                  <div className="bg-white rounded-xl p-4 text-center border border-bsi-teal-primary/30">
                    <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.5)] text-xs mb-1">Kode Voucher</p>
                    <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-xl tracking-widest">
                      {successRedemption.mockCode}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSuccessRedemption(null);
                    setActiveTab("my-vouchers");
                  }}
                  className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-[#4b5563] text-sm hover:bg-gray-50 transition-colors"
                >
                  Lihat Voucher Saya
                </button>
                <button
                  onClick={() => setSuccessRedemption(null)}
                  className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors"
                >
                  Kembali
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
