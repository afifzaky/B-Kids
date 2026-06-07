"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ParentProfile {
  id: string;
  fullName: string;
  bsiAccountNumber: string;
  balance: number;
  currency: string;
}

interface ChildAccount {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  isActive: boolean;
  account: { id: string; balance: number; currency: string } | null;
}

interface PendingChore {
  id: string;
  title: string;
  rewardAmount: number;
  assignedToId: string;
  latestSubmission: { submittedAt: string; notes: string | null } | null;
}

interface ParentTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  source: string;
  amount: number;
  relatedChild: { fullName: string } | null;
  notes: string | null;
  createdAt: string;
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

function txDescription(tx: ParentTransaction): string {
  switch (tx.source) {
    case "DEPOSIT": return "Top Up Saldo";
    case "TRANSFER_TO_CHILD": return `Transfer ke ${tx.relatedChild?.fullName ?? "Anak"}`;
    default: return tx.notes ?? tx.source;
  }
}

function timeAgo(str: string): string {
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  return `${mins} menit lalu`;
}

export function ParentDashboard() {
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [pendingChores, setPendingChores] = useState<PendingChore[]>([]);
  const [recentTx, setRecentTx] = useState<ParentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Top Up Modal
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNotes, setTopUpNotes] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);

  // Allocate Money Modal
  const [showAllocate, setShowAllocate] = useState(false);
  const [allocateChildId, setAllocateChildId] = useState("");
  const [allocateAmount, setAllocateAmount] = useState("");
  const [allocateNotes, setAllocateNotes] = useState("");
  const [allocateLoading, setAllocateLoading] = useState(false);
  const [allocateError, setAllocateError] = useState<string | null>(null);
  const [allocateSuccess, setAllocateSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    Promise.all([
      fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/family/children`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/chores`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/parent/banking/account`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([profileRes, childrenRes, choresRes, bankingRes]) =>
        Promise.all([profileRes.json(), childrenRes.json(), choresRes.json(), bankingRes.json()])
      )
      .then(([profileData, childrenData, choresData, bankingData]) => {
        if (profileData.data?.profile) setProfile(profileData.data.profile);
        if (childrenData.success) setChildren(childrenData.data);
        if (choresData.success)
          setPendingChores(choresData.data.filter((c: PendingChore & { status: string }) => c.status === "PENDING_REVIEW"));
        if (bankingData.success) setRecentTx(bankingData.data.recentTransactions ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const openTopUp = () => {
    setTopUpAmount("");
    setTopUpNotes("");
    setTopUpError(null);
    setTopUpSuccess(null);
    setShowTopUp(true);
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) { setTopUpError("Masukkan nominal yang valid"); return; }
    if (amount > 100_000_000) { setTopUpError("Maksimal top up Rp 100.000.000 per transaksi"); return; }
    setTopUpLoading(true);
    setTopUpError(null);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/parent/banking/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, ...(topUpNotes.trim() ? { notes: topUpNotes.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setTopUpError(data.message ?? "Gagal melakukan top up"); return; }
      setTopUpSuccess(data.message ?? "Top up berhasil!");
      setProfile((prev) => prev ? { ...prev, balance: data.data.newBalance } : prev);
      const newTx: ParentTransaction = {
        id: data.data.transactionId ?? String(Date.now()),
        type: "CREDIT",
        source: "DEPOSIT",
        amount,
        relatedChild: null,
        notes: topUpNotes.trim() || null,
        createdAt: new Date().toISOString(),
      };
      setRecentTx((prev) => [newTx, ...prev].slice(0, 5));
    } catch {
      setTopUpError("Gagal terhubung ke server");
    } finally {
      setTopUpLoading(false);
    }
  };

  const openAllocate = () => {
    setShowAllocate(true);
    setAllocateChildId(children[0]?.id ?? "");
    setAllocateAmount("");
    setAllocateNotes("");
    setAllocateError(null);
    setAllocateSuccess(null);
  };

  const handleAllocate = async () => {
    const amount = parseFloat(allocateAmount);
    if (!allocateChildId) { setAllocateError("Pilih anak terlebih dahulu"); return; }
    if (!amount || amount <= 0) { setAllocateError("Masukkan nominal yang valid"); return; }
    setAllocateLoading(true);
    setAllocateError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const body: Record<string, unknown> = { childProfileId: allocateChildId, amount };
      if (allocateNotes.trim()) body.notes = allocateNotes.trim();
      const res = await fetch(`${API_BASE_URL}/api/parent/banking/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setAllocateError(data.message ?? "Gagal melakukan transfer"); return; }
      setAllocateSuccess(data.message ?? "Transfer berhasil!");
      setProfile((prev) => prev ? { ...prev, balance: prev.balance - amount } : prev);
      setChildren((prev) =>
        prev.map((c) =>
          c.id === allocateChildId && c.account
            ? { ...c, account: { ...c.account, balance: c.account.balance + amount } }
            : c
        )
      );
      const newTx: ParentTransaction = {
        id: data.data?.transactionId ?? String(Date.now()),
        type: "DEBIT",
        source: "TRANSFER_TO_CHILD",
        amount,
        relatedChild: { fullName: childName(allocateChildId) },
        notes: allocateNotes.trim() || null,
        createdAt: new Date().toISOString(),
      };
      setRecentTx((prev) => [newTx, ...prev].slice(0, 5));
      setAllocateAmount("");
      setAllocateNotes("");
    } catch {
      setAllocateError("Gagal terhubung ke server");
    } finally {
      setAllocateLoading(false);
    }
  };

  const childName = (id: string) => children.find((c) => c.id === id)?.fullName ?? "—";
  const totalFamilyBalance =
    (profile?.balance ?? 0) + children.reduce((sum, c) => sum + (c.account?.balance ?? 0), 0);

  return (
    <div className="relative overflow-hidden p-4 sm:p-6 lg:p-10">
      {/* Background Decorative Elements */}
      <div className="absolute bg-[rgba(0,124,128,0.05)] blur-[60px] h-[534.8px] right-0 rounded-full top-0 w-[512px] pointer-events-none" />
      <div className="absolute bg-[rgba(237,139,0,0.05)] blur-[50px] bottom-0 h-[401.09px] left-0 rounded-full w-[384px] pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto">
        {/* Greeting */}
        <div className="mb-6">
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm">Selamat datang kembali,</p>
          <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl sm:text-2xl">
            {isLoading ? "..." : (profile?.fullName ?? "Orang Tua")} 👋
          </h2>
        </div>

        {/* Hero Card: Total Family Balance */}
        <div className="bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 mb-6 lg:mb-10 relative overflow-hidden">
          <div className="absolute bg-[rgba(0,191,178,0.2)] blur-[32px] -bottom-16 -right-16 rounded-full size-48 pointer-events-none" />
          <div className="absolute bg-[rgba(237,139,0,0.1)] blur-[32px] size-24 -left-8 top-4 rounded-full pointer-events-none" />

          <div className="relative">
            <p className="font-['Poppins',sans-serif] font-semibold text-white/80 text-xs tracking-widest uppercase mb-1">
              SALDO REKENING SAYA
            </p>
            {profile?.bsiAccountNumber && (
              <p className="font-['Lato',sans-serif] text-white/60 text-xs mb-3">
                No. Rek BSI: {profile.bsiAccountNumber}
              </p>
            )}
            <h2 className="font-['League_Spartan',sans-serif] font-extrabold text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-1">
              {isLoading ? "Rp —" : formatRupiah(profile?.balance ?? 0)}
            </h2>
            <p className="font-['Lato',sans-serif] text-white/60 text-xs mb-5">
              Total keluarga: {isLoading ? "—" : formatRupiah(totalFamilyBalance)}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openTopUp}
                className="bg-white/20 hover:bg-white/30 shadow-lg px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-sm sm:text-base text-white transition-all hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Top Up Saldo
              </button>
              <button
                onClick={openAllocate}
                className="bg-bsi-orange-primary hover:bg-[#d47a00] shadow-lg px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-sm sm:text-base text-white transition-all hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Allocate Money
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-8 space-y-6">
            {/* Child Accounts Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-xl sm:text-2xl text-black">
                Akun Anak
              </h3>
              <Link
                href="/parent/add-child"
                className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark shadow-sm px-4 sm:px-5 py-2.5 rounded-lg font-['Poppins',sans-serif] font-semibold text-sm sm:text-base text-white transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Tambah Akun Anak
              </Link>
            </div>

            {/* Child Account Cards */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin w-6 h-6 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {children.map((child, index) => (
                  <div key={child.id} className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm hover:shadow-lg transition-all overflow-hidden">
                    <div className={`p-5 ${index % 2 === 0 ? "bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary" : "bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                            {index % 2 === 0 ? "👦" : "👧"}
                          </div>
                          <div>
                            <h4 className="font-['Poppins',sans-serif] font-bold text-white text-base">{child.fullName}</h4>
                            <p className="font-['Lato',sans-serif] text-white/70 text-xs">{child.isActive ? "Aktif" : "Nonaktif"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="font-['Poppins',sans-serif] text-[#9ca3af] text-[10px] tracking-widest uppercase mb-1">SALDO</p>
                      <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-xl mb-3">
                        {child.account ? formatRupiah(child.account.balance) : "Rp —"}
                      </p>
                      <Link
                        href={`/parent/child-account/${child.id}`}
                        className="block text-center bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white font-['Poppins',sans-serif] font-bold text-xs py-2.5 rounded-xl transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}

              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">Aktivitas Terbaru</h3>
                <Link href="/parent/banking" className="flex items-center gap-1 font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm hover:underline">
                  Lihat Semua
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>

              {recentTx.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentTx.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3.5 border-b border-[#f3f4f6] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === "CREDIT" ? "bg-green-50" : "bg-orange-50"}`}>
                          <svg className={`w-5 h-5 ${tx.type === "CREDIT" ? "text-green-500" : "text-bsi-orange-primary"}`} fill="currentColor" viewBox="0 0 20 20">
                            {tx.type === "CREDIT" ? (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{txDescription(tx)}</p>
                          <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <p className={`font-['Montserrat',sans-serif] font-bold text-sm ml-3 shrink-0 ${tx.type === "CREDIT" ? "text-green-600" : "text-bsi-orange-primary"}`}>
                        {tx.type === "CREDIT" ? "+" : "-"}{formatRupiah(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-6">
            {/* Pending Actions Widget */}
            <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-bsi-orange-primary rounded-full" />
                  <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">Aksi Pending</h3>
                </div>
                <Link href="/parent/pending-actions" className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-xs hover:underline">
                  Lihat Semua
                </Link>
              </div>

              {pendingChores.length === 0 ? (
                <div className="bg-[#f8fafa] rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-['Poppins',sans-serif] font-bold text-green-600 text-sm">Semua beres!</p>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">Tidak ada review yang tertunda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingChores.slice(0, 3).map((chore) => (
                    <div key={chore.id} className="bg-[#f8fafa] border-l-4 border-bsi-orange-primary rounded-xl p-4">
                      <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm mb-1 truncate">{chore.title}</p>
                      <p className="font-['Lato',sans-serif] text-gray-500 text-xs">
                        {childName(chore.assignedToId)}
                        {chore.latestSubmission && ` · ${timeAgo(chore.latestSubmission.submittedAt)}`}
                      </p>
                      <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-xs mt-1">
                        {formatRupiah(chore.rewardAmount)}
                      </p>
                    </div>
                  ))}
                  {pendingChores.length > 3 && (
                    <Link href="/parent/pending-actions" className="block text-center text-bsi-teal-primary font-['Poppins',sans-serif] font-bold text-xs py-2 hover:underline">
                      +{pendingChores.length - 3} lagi →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-lg text-black mb-4">Menu Cepat</h3>
              <div className="space-y-2">
                <Link href="/parent/accounts" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0f9f9] transition-colors group">
                  <div className="w-8 h-8 bg-bsi-teal-primary/10 rounded-lg flex items-center justify-center group-hover:bg-bsi-teal-primary/20 transition-colors">
                    <svg className="w-4 h-4 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm group-hover:text-bsi-teal-primary transition-colors">Akun Anak</span>
                  <svg className="w-4 h-4 text-gray-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="/parent/child-tasks" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0f9f9] transition-colors group">
                  <div className="w-8 h-8 bg-bsi-orange-primary/10 rounded-lg flex items-center justify-center group-hover:bg-bsi-orange-primary/20 transition-colors">
                    <svg className="w-4 h-4 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm group-hover:text-bsi-teal-primary transition-colors">Tugas & Tantangan</span>
                  <svg className="w-4 h-4 text-gray-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="/parent/pending-actions" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0f9f9] transition-colors group">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm group-hover:text-bsi-teal-primary transition-colors">Aksi Pending</span>
                  {pendingChores.length > 0 && (
                    <span className="ml-auto bg-bsi-orange-primary text-white font-['Poppins',sans-serif] font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {pendingChores.length}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">Top Up Saldo</h3>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm mt-0.5">Tambah saldo rekening B-Kids Anda</p>
              </div>
              <button onClick={() => setShowTopUp(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl p-4 mb-5">
              <p className="font-['Poppins',sans-serif] text-white/80 text-xs uppercase tracking-wide mb-1">Saldo Saat Ini</p>
              <p className="font-['Montserrat',sans-serif] font-bold text-white text-2xl">
                {profile ? formatRupiah(profile.balance) : "—"}
              </p>
            </div>

            {topUpSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-['Poppins',sans-serif] font-bold text-green-600 text-base">{topUpSuccess}</p>
                <p className="font-['Lato',sans-serif] text-gray-400 text-sm mt-1">
                  Saldo baru: {profile ? formatRupiah(profile.balance) : ""}
                </p>
                <button onClick={() => setShowTopUp(false)} className="mt-4 bg-bsi-teal-primary text-white font-['Poppins',sans-serif] font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-bsi-teal-hover-dark transition-colors">
                  Tutup
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">Nominal Cepat</p>
                  <div className="flex flex-wrap gap-2">
                    {[100000, 250000, 500000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopUpAmount(String(amt))}
                        className={`px-4 py-2 rounded-xl text-sm font-['Poppins',sans-serif] font-bold transition-colors ${
                          topUpAmount === String(amt)
                            ? "bg-bsi-teal-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Nominal Lainnya
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-['Poppins',sans-serif]">Rp</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => { setTopUpAmount(e.target.value); setTopUpError(null); }}
                      placeholder="0"
                      min="1"
                      max="100000000"
                      className="w-full border border-[#e0e7e7] rounded-xl pl-12 pr-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                    />
                  </div>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">Maks. Rp 100.000.000 per transaksi</p>
                </div>

                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={topUpNotes}
                    onChange={(e) => setTopUpNotes(e.target.value)}
                    placeholder="Contoh: Top up bulan Juni"
                    className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                  />
                </div>

                {topUpError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{topUpError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowTopUp(false)}
                    className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleTopUp}
                    disabled={topUpLoading}
                    className="flex-1 bg-bsi-orange-primary hover:bg-[#d47a00] disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {topUpLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Memproses...
                      </>
                    ) : "Top Up Sekarang"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Allocate Money Modal */}
      {showAllocate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">Allocate Money</h3>
              <button onClick={() => setShowAllocate(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Parent Balance */}
            <div className="bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl p-4 mb-5">
              <p className="font-['Poppins',sans-serif] text-white/80 text-xs uppercase tracking-wide mb-1">Saldo Anda</p>
              <p className="font-['Montserrat',sans-serif] font-bold text-white text-2xl">
                {profile ? formatRupiah(profile.balance) : "—"}
              </p>
            </div>

            {allocateSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-['Poppins',sans-serif] font-bold text-green-600 text-base">{allocateSuccess}</p>
                <button onClick={() => setShowAllocate(false)} className="mt-4 bg-bsi-teal-primary text-white font-['Poppins',sans-serif] font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-bsi-teal-hover-dark transition-colors">
                  Tutup
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Child Selection */}
                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Pilih Anak
                  </label>
                  <select
                    value={allocateChildId}
                    onChange={(e) => setAllocateChildId(e.target.value)}
                    className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary bg-white"
                  >
                    <option value="">-- Pilih Anak --</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Nominal
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-gray-400 text-sm">Rp</span>
                    <input
                      type="number"
                      value={allocateAmount}
                      onChange={(e) => { setAllocateAmount(e.target.value); setAllocateError(null); }}
                      placeholder="0"
                      min="1"
                      className="w-full border border-[#e0e7e7] rounded-xl pl-12 pr-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                    Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={allocateNotes}
                    onChange={(e) => setAllocateNotes(e.target.value)}
                    placeholder="Contoh: Uang jajan mingguan"
                    className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                  />
                </div>

                {/* Summary */}
                {allocateChildId && allocateAmount && parseFloat(allocateAmount) > 0 && (
                  <div className="bg-[#f8fafa] rounded-xl p-4 border border-[#e0e7e7]">
                    <p className="font-['Poppins',sans-serif] text-gray-500 text-xs mb-2">Ringkasan Transfer</p>
                    <div className="flex justify-between text-sm">
                      <span className="font-['Lato',sans-serif] text-gray-600">Ke:</span>
                      <span className="font-['Poppins',sans-serif] font-bold text-gray-800">{childName(allocateChildId)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="font-['Lato',sans-serif] text-gray-600">Nominal:</span>
                      <span className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary">{formatRupiah(parseFloat(allocateAmount))}</span>
                    </div>
                  </div>
                )}

                {allocateError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{allocateError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAllocate(false)}
                    className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAllocate}
                    disabled={allocateLoading}
                    className="flex-1 bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {allocateLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Mengirim...
                      </>
                    ) : "Transfer Sekarang"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
