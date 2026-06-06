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

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ParentDashboard() {
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.profile) setProfile(data.data.profile);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

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

        {/* Hero Card: BSI Account Balance */}
        <div className="bg-bsi-teal-primary rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 mb-6 lg:mb-10 relative overflow-hidden">
          <div className="absolute bg-[rgba(0,191,178,0.2)] blur-[32px] -bottom-16 -right-16 rounded-full size-48 pointer-events-none" />
          <div className="absolute bg-[rgba(237,139,0,0.1)] blur-[32px] size-24 -left-8 top-4 rounded-full pointer-events-none" />

          <div className="relative">
            <p className="font-['Poppins',sans-serif] font-semibold text-white/80 text-xs tracking-widest uppercase mb-1">
              SALDO REKENING BSI
            </p>
            {profile?.bsiAccountNumber && (
              <p className="font-['Lato',sans-serif] text-white/60 text-xs mb-3">
                No. Rek: {profile.bsiAccountNumber}
              </p>
            )}
            <h2 className="font-['League_Spartan',sans-serif] font-extrabold text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-5">
              {isLoading ? "Rp —" : profile ? formatRupiah(profile.balance) : "Rp —"}
            </h2>
            <button className="bg-bsi-orange-primary hover:bg-[#d47a00] shadow-lg px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-sm sm:text-base text-white transition-all hover:shadow-xl flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Alokasikan
            </button>
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

            {/* Child Account Cards — quick preview, full list in /parent/accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Link href="/parent/accounts" className="bg-white rounded-2xl border border-[#e0e7e7] p-6 shadow-sm hover:shadow-lg hover:border-bsi-teal-primary/30 transition-all group cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-['Poppins',sans-serif] font-bold text-lg text-black group-hover:text-bsi-teal-primary transition-colors">
                      Lihat Semua Akun Anak
                    </h4>
                    <p className="font-['Poppins',sans-serif] text-[#6b7280] text-xs">Kelola dan pantau anak Anda</p>
                  </div>
                </div>
                <div className="bg-[#f0f9f9] text-bsi-teal-primary font-['Poppins',sans-serif] font-bold text-xs rounded-lg py-2.5 text-center">
                  Buka Daftar Akun Anak →
                </div>
              </Link>

              <Link href="/parent/add-child" className="bg-white rounded-2xl border border-dashed border-bsi-teal-primary/40 p-6 shadow-sm hover:shadow-lg hover:border-bsi-teal-primary transition-all group cursor-pointer flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-bsi-teal-primary/10 flex items-center justify-center group-hover:bg-bsi-teal-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary">Tambah Akun Anak</p>
                  <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">Daftarkan anak baru ke B-Kids</p>
                </div>
              </Link>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">Aktivitas Terbaru</h3>
                <Link href="/parent/pending-actions" className="flex items-center gap-1 font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm hover:underline">
                  Aksi Pending
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-[#e0e7e7]">
                      <th className="font-['Poppins',sans-serif] font-bold text-[#9ca3af] text-[10px] tracking-widest uppercase text-left pb-4">ANAK</th>
                      <th className="font-['Poppins',sans-serif] font-bold text-[#9ca3af] text-[10px] tracking-widest uppercase text-left pb-4">KATEGORI</th>
                      <th className="font-['Poppins',sans-serif] font-bold text-[#9ca3af] text-[10px] tracking-widest uppercase text-left pb-4">MERCHANT</th>
                      <th className="font-['Poppins',sans-serif] font-bold text-[#9ca3af] text-[10px] tracking-widest uppercase text-left pb-4">TANGGAL</th>
                      <th className="font-['Poppins',sans-serif] font-bold text-[#9ca3af] text-[10px] tracking-widest uppercase text-right pb-4">JUMLAH</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#f9fafb]">
                      <td className="font-['Lato',sans-serif] font-bold text-black text-sm py-5">Ahmad</td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <div className="bg-[rgba(0,124,128,0.1)] rounded-lg p-1.5">
                            <svg className="w-4 h-4 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                            </svg>
                          </div>
                          <span className="font-['Poppins',sans-serif] font-medium text-black text-sm">Pendidikan</span>
                        </div>
                      </td>
                      <td className="font-['Lato',sans-serif] text-[#4b5563] text-sm py-5">Toko Buku</td>
                      <td className="font-['Lato',sans-serif] text-[#6b7280] text-sm py-5">Hari ini, 10:45</td>
                      <td className="font-['Montserrat',sans-serif] font-bold text-black text-sm text-right py-5">-Rp 675.000</td>
                    </tr>
                    <tr className="border-b border-[#f9fafb]">
                      <td className="font-['Lato',sans-serif] font-bold text-black text-sm py-5">Sarah</td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <div className="bg-[rgba(237,139,0,0.1)] rounded-lg p-1.5">
                            <svg className="w-4 h-4 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-['Poppins',sans-serif] font-medium text-black text-sm">Jajan</span>
                        </div>
                      </td>
                      <td className="font-['Lato',sans-serif] text-[#4b5563] text-sm py-5">Kantin Sekolah</td>
                      <td className="font-['Lato',sans-serif] text-[#6b7280] text-sm py-5">Hari ini, 09:12</td>
                      <td className="font-['Montserrat',sans-serif] font-bold text-black text-sm text-right py-5">-Rp 127.500</td>
                    </tr>
                    <tr>
                      <td className="font-['Lato',sans-serif] font-bold text-black text-sm py-5">Sarah</td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#f3f4f6] rounded-lg p-1.5">
                            <svg className="w-4 h-4 text-[#4b5563]" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-2a4 4 0 00-4-4h-3V4a1 1 0 00-1-1H3z" />
                            </svg>
                          </div>
                          <span className="font-['Poppins',sans-serif] font-medium text-black text-sm">Transportasi</span>
                        </div>
                      </td>
                      <td className="font-['Lato',sans-serif] text-[#4b5563] text-sm py-5">KRL / Transjakarta</td>
                      <td className="font-['Lato',sans-serif] text-[#6b7280] text-sm py-5">Kemarin</td>
                      <td className="font-['Montserrat',sans-serif] font-bold text-black text-sm text-right py-5">-Rp 300.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-6">
            {/* Pending Actions Widget */}
            <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-bsi-orange-primary rounded-full" />
                  <h3 className="font-['Montserrat',sans-serif] font-bold text-xl text-black">Aksi Perlu Disetujui</h3>
                </div>
                <Link href="/parent/pending-actions" className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-xs hover:underline">
                  Lihat Semua
                </Link>
              </div>

              <div className="bg-[#f8fafa] border-l-4 border-bsi-orange-primary rounded-2xl p-5">
                <p className="font-['Poppins',sans-serif] font-bold text-bsi-orange-primary text-[10px] tracking-widest uppercase mb-2">
                  PERSETUJUAN HADIAH
                </p>
                <p className="font-['Lato',sans-serif] text-black text-sm mb-4">
                  Anak mengumpulkan bukti tugas untuk mendapat reward.
                </p>
                <Link href="/parent/pending-actions" className="block bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark rounded-lg px-4 py-2.5 font-['Poppins',sans-serif] font-bold text-white text-xs transition-colors text-center">
                  Cek Aksi Pending →
                </Link>
              </div>
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
                  <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm group-hover:text-bsi-teal-primary transition-colors">Tugas Anak</span>
                  <svg className="w-4 h-4 text-gray-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="/parent/pending-actions" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0f9f9] transition-colors group">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm group-hover:text-bsi-teal-primary transition-colors">Aksi Pending</span>
                  <svg className="w-4 h-4 text-gray-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
