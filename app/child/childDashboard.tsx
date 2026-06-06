"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ChildProfile {
  id: string;
  fullName: string;
  username: string;
  childAccountNumber: string;
  account: {
    balance: number;
    currency: string;
  } | null;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f1f4f4] flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin w-10 h-10 text-bsi-teal-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="font-['Poppins',sans-serif] text-bsi-teal-primary text-sm">Memuat dashboard...</p>
      </div>
    </div>
  );
}

export function ChildDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth/child/login");
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.clear();
          router.push("/auth/child/login");
          throw new Error("unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        if (data.data?.role !== "CHILD") {
          router.push("/auth/child/login");
          return;
        }
        setProfile(data.data.profile);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") ?? "";
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch { /* biarkan logout tetap jalan */ }
    localStorage.clear();
    router.push("/auth/child/login");
  };

  const firstName = profile?.fullName?.split(" ")[0] ?? "Kamu";
  const balance = profile?.account?.balance ?? 0;

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#f1f4f4]">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[rgba(189,201,201,0.3)] sticky top-0 z-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary w-7 h-7 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-base">B-Kids</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary flex items-center justify-center text-white text-xs font-bold">
                {profile?.fullName?.charAt(0)?.toUpperCase() ?? "A"}
              </div>
              <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">
                {profile?.fullName ?? "Anak"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-['Poppins',sans-serif] font-semibold text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 sm:p-8 lg:p-16">
        <div className="max-w-[1280px] mx-auto space-y-8 lg:space-y-12">
          {/* Welcome Header */}
          <div>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-3xl sm:text-4xl lg:text-5xl mb-2">
              Hei, {firstName}! 👋
            </h1>
            <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-base sm:text-lg lg:text-xl">
              Kamu hebat banget menabung minggu ini!
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Balance Card */}
            <div className="lg:col-span-4 bg-bsi-teal-primary rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[280px] sm:min-h-[300px] relative overflow-hidden">
              <div className="absolute bg-[rgba(0,191,178,0.3)] blur-[32px] -bottom-8 -right-8 rounded-full size-48 pointer-events-none" />
              <div className="absolute bg-[rgba(255,255,255,0.1)] blur-3 left-[-16px] rounded-full size-24 top-4 pointer-events-none" />

              <div className="relative z-10">
                <p className="font-['Poppins',sans-serif] font-semibold text-white/80 text-xs tracking-widest uppercase mb-2">
                  TOTAL SALDOKU
                </p>
                <h2 className="font-['Montserrat',sans-serif] font-bold text-white text-3xl sm:text-4xl lg:text-5xl mb-3">
                  {formatRupiah(balance)}
                </h2>
                <div className="bg-[rgba(0,0,0,0.2)] inline-flex items-center gap-2 px-3 py-1 rounded-full">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="font-['Lato',sans-serif] font-bold text-white text-xs tracking-tight uppercase">
                    BATAS HARIAN: Rp 750.000
                  </span>
                </div>
              </div>

              <button className="relative z-10 bg-bsi-orange-primary hover:bg-[#d47a00] shadow-[0px_4px_0px_#a05e00] rounded-2xl py-4 font-['League_Spartan',sans-serif] font-bold text-white text-xl transition-all hover:shadow-[0px_2px_0px_#a05e00] hover:translate-y-0.5 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                Kirim Uang
              </button>
            </div>

            {/* Active Challenges */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <h3 className="font-['Montserrat',sans-serif] font-semibold text-bsi-teal-primary text-2xl">Tantangan Aktif</h3>
                </div>
                <button className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm hover:underline">Lihat Semua</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Challenge Card 1 */}
                <div className="bg-[#e5e9e8] rounded-2xl border border-[rgba(189,201,201,0.2)] p-5 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-[rgba(237,139,0,0.1)] px-3 py-1 rounded-full">
                        <span className="font-['Poppins',sans-serif] font-bold text-bsi-orange-primary text-[10px] tracking-widest uppercase">PENDIDIKAN</span>
                      </div>
                      <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-xs">3 hari lagi</span>
                    </div>
                    <h4 className="font-['Poppins',sans-serif] font-bold text-black text-base mb-1">Jagoan Matematika</h4>
                    <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">Raih nilai 90 di ujian berikutnya</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm">Rp 150.000</span>
                    </div>
                    <button className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark px-4 py-2 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-xs transition-colors">Detail</button>
                  </div>
                </div>

                {/* Challenge Card 2 */}
                <div className="bg-[#e5e9e8] rounded-2xl border border-[rgba(189,201,201,0.2)] p-5 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-[rgba(0,124,128,0.1)] px-3 py-1 rounded-full">
                        <span className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-[10px] tracking-widest uppercase">MENABUNG</span>
                      </div>
                      <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-xs">Terus berjalan</span>
                    </div>
                    <h4 className="font-['Poppins',sans-serif] font-bold text-black text-base mb-1">Rajin Nabung</h4>
                    <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">Nabung setiap hari selama 7 hari</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm">50 Bintang</span>
                    </div>
                    <button className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark px-4 py-2 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-xs transition-colors">Detail</button>
                  </div>
                </div>
              </div>
            </div>

            {/* My Pockets */}
            <div className="lg:col-span-12 bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 sm:p-8 lg:p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-['Montserrat',sans-serif] font-semibold text-bsi-teal-primary text-2xl">Kantongku</h3>
                </div>
                <button className="bg-[#e5e9e8] hover:bg-[#d5d9d8] px-4 py-2 rounded-full font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-base transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Kantong Baru
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#f6fafa] rounded-2xl border border-[rgba(189,201,201,0.2)] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-[rgba(237,139,0,0.1)] w-12 h-12 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-['Poppins',sans-serif] font-bold text-black text-base">Dana Jajan</h4>
                      <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-xs">Terakhir dipakai 2 jam lalu</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-xl">Rp 225.000</p>
                    <p className="font-['Poppins',sans-serif] font-bold text-[rgba(0,0,0,0.6)] text-[10px] tracking-widest uppercase">ISI ULANG: SEN</p>
                  </div>
                </div>

                <div className="bg-[#f6fafa] rounded-2xl border border-[rgba(189,201,201,0.2)] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-[rgba(0,124,128,0.1)] w-12 h-12 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-['Poppins',sans-serif] font-bold text-black text-base">Uang Saku</h4>
                      <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-xs">Isi ulang dalam 5 hari</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-xl">Rp 682.500</p>
                    <p className="font-['Poppins',sans-serif] font-bold text-[rgba(0,0,0,0.6)] text-[10px] tracking-widest uppercase">ISI ULANG: JUM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="lg:col-span-12 bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-['Montserrat',sans-serif] font-semibold text-bsi-teal-primary text-2xl">Transaksi Terbaru</h3>
                </div>
                <button className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm hover:underline">Lihat Semua</button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[rgba(189,201,201,0.1)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-[rgba(0,124,128,0.1)] w-10 h-10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] font-bold text-black text-sm">Kantin Sekolah</p>
                      <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-xs">Kemarin</p>
                    </div>
                  </div>
                  <p className="font-['Poppins',sans-serif] font-bold text-[#ba1a1a] text-base">-Rp 63.000</p>
                </div>

                <div className="flex items-center justify-between border-b border-[rgba(189,201,201,0.1)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-[rgba(237,139,0,0.1)] w-10 h-10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] font-bold text-black text-sm">Uang Saku Mingguan</p>
                      <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-xs">2 hari lalu</p>
                    </div>
                  </div>
                  <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-base">+Rp 225.000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Infaq Banner */}
          <div className="bg-[rgba(0,124,128,0.05)] border-2 border-[rgba(0,124,128,0.2)] rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-bsi-teal-primary w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-['Montserrat',sans-serif] font-semibold text-bsi-teal-primary text-lg sm:text-xl lg:text-2xl">
                  Berbagi dengan Infaq
                </h3>
                <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-xs sm:text-sm">
                  Sisihkan sebagian saldumu untuk membantu sesama.
                </p>
              </div>
            </div>
            <button className="bg-bsi-orange-primary hover:bg-[#d47a00] shadow-[0px_4px_0px_#a05e00] px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-2xl font-['League_Spartan',sans-serif] font-bold text-white text-base sm:text-lg lg:text-xl transition-all w-full sm:w-auto">
              Infaq Sekarang
            </button>
          </div>

          {/* Voucher Banner */}
          <div className="bg-bsi-teal-primary rounded-3xl sm:rounded-[40px] shadow-2xl p-6 sm:p-8 lg:p-12 relative overflow-hidden min-h-[200px] sm:min-h-[220px] flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left w-full">
              <div className="bg-white w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-2xl -rotate-3 flex items-center justify-center flex-shrink-0">
                <svg className="w-12 h-12 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L13 9.586l-1.293-1.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="bg-bsi-orange-primary inline-block px-3 py-1 rounded-full mb-2">
                  <span className="font-['Poppins',sans-serif] font-bold text-white text-[10px] tracking-widest uppercase">FLASH DEAL</span>
                </div>
                <h3 className="font-['League_Spartan',sans-serif] font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-1">
                  Diskon 20% Gamer Pass
                </h3>
                <p className="font-['Lato',sans-serif] text-white/80 text-sm sm:text-base lg:text-lg">
                  Tukar bintangmu untuk voucher gaming keren hari ini!
                </p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3 w-full sm:w-auto">
              <button className="bg-white hover:bg-gray-100 shadow-[0px_4px_0px_#a05e00] px-8 sm:px-10 lg:px-12 py-3 sm:py-4 rounded-2xl font-['League_Spartan',sans-serif] font-bold text-bsi-teal-primary text-base sm:text-lg lg:text-xl transition-all w-full sm:w-auto">
                Klaim Voucher
              </button>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="w-2 h-2 bg-white/40 rounded-full" />
                <div className="w-2 h-2 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
