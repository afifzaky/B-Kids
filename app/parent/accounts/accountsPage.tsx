"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ChildAccount {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  isActive: boolean;
  account: {
    id: string;
    balance: number;
    currency: string;
  } | null;
}

interface ChoreCount {
  assignedToId: string;
  status: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  return `${age} tahun`;
}

export function AccountsPage() {
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [chores, setChores] = useState<ChoreCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/family/children`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/chores`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([childrenRes, choresRes]) => Promise.all([childrenRes.json(), choresRes.json()]))
      .then(([childrenData, choresData]) => {
        if (childrenData.success) setChildren(childrenData.data);
        else setError(childrenData.message ?? "Gagal memuat data anak");
        if (choresData.success) setChores(choresData.data);
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const combinedBalance = children.reduce((sum, c) => sum + (c.account?.balance ?? 0), 0);
  const activeChallengess = chores.filter((c) => c.status === "ACTIVE").length;
  const pendingApprovals = chores.filter((c) => c.status === "PENDING_REVIEW").length;

  const activeCountForChild = (childId: string) =>
    chores.filter((c) => c.assignedToId === childId && c.status === "ACTIVE").length;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-['Montserrat',sans-serif] font-bold text-2xl sm:text-3xl text-black">
            Child Accounts
          </h1>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">
            Monitor and manage your children's financial accounts
          </p>
        </div>
        <Link
          href="/parent/add-child"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light text-white font-['Poppins',sans-serif] font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all self-start sm:self-auto"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Child Account
        </Link>
      </div>

      {/* Summary Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#e0e7e7] hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-bsi-teal-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[#6b7280] text-xs uppercase tracking-wide mb-1">Total Accounts</h3>
            <p className="font-['Montserrat',sans-serif] font-bold text-2xl text-[#030213]">{children.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e0e7e7] hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[#6b7280] text-xs uppercase tracking-wide mb-1">Combined Balance</h3>
            <p className="font-['Montserrat',sans-serif] font-bold text-xl text-[#030213]">{formatRupiah(combinedBalance)}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e0e7e7] hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[#6b7280] text-xs uppercase tracking-wide mb-1">Active Challenges</h3>
            <p className="font-['Montserrat',sans-serif] font-bold text-2xl text-[#030213]">{activeChallengess}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e0e7e7] hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-['Poppins',sans-serif] text-[#6b7280] text-xs uppercase tracking-wide mb-1">Pending Approvals</h3>
            <p className="font-['Montserrat',sans-serif] font-bold text-2xl text-[#030213]">{pendingApprovals}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-['Lato',sans-serif] text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin w-8 h-8 text-bsi-teal-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-gray-500 text-sm">Memuat data anak...</p>
          </div>
        </div>
      ) : children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-bsi-teal-primary/10 rounded-full flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-gray-700 mb-2">
            Belum Ada Akun Anak
          </h3>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-6 max-w-xs">
            Tambahkan akun anak pertama Anda untuk mulai memantau keuangan mereka.
          </p>
          <Link
            href="/parent/add-child"
            className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark px-6 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-sm text-white transition-colors"
          >
            Tambah Akun Anak
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {children.map((child, index) => {
            const activeChallenges = activeCountForChild(child.id);
            return (
              <div key={child.id} className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm hover:shadow-lg transition-all overflow-hidden">
                {/* Card Top */}
                <div className={`p-5 ${index % 2 === 0 ? "bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary" : "bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                        {index % 2 === 0 ? "👦" : "👧"}
                      </div>
                      <div>
                        <h3 className="font-['Poppins',sans-serif] font-bold text-white text-lg leading-tight">
                          {child.fullName}
                        </h3>
                        <p className="font-['Lato',sans-serif] text-white/70 text-xs">
                          {getAge(child.dateOfBirth)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full ${child.isActive ? "bg-green-500/20" : "bg-gray-500/20"}`}>
                      <span className={`font-['Poppins',sans-serif] font-bold text-xs ${child.isActive ? "text-green-100" : "text-gray-200"}`}>
                        {child.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-['Poppins',sans-serif] font-bold text-[#9ca3af] text-[10px] tracking-widest uppercase mb-1">
                        SALDO
                      </p>
                      <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg">
                        {child.account ? formatRupiah(child.account.balance) : "Rp —"}
                      </p>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] font-bold text-[#9ca3af] text-[10px] tracking-widest uppercase mb-1">
                        CHALLENGES
                      </p>
                      <p className="font-['Montserrat',sans-serif] font-bold text-blue-600 text-lg">
                        {activeChallenges} aktif
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/parent/child-account/${child.id}`}
                    className="block text-center bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light text-white font-['Poppins',sans-serif] font-bold text-xs py-2.5 rounded-xl transition-all"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Add Child Card */}
          <Link
            href="/parent/add-child"
            className="bg-white rounded-2xl border border-dashed border-bsi-teal-primary/40 p-6 shadow-sm hover:shadow-lg hover:border-bsi-teal-primary transition-all flex flex-col items-center justify-center text-center gap-3 min-h-[200px]"
          >
            <div className="w-12 h-12 bg-bsi-teal-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary">Tambah Akun Anak</p>
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">Daftarkan anak baru</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
