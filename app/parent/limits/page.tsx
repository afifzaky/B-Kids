"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ChildAccount {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  isActive: boolean;
  account: { balance: number } | null;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export default function LimitsIndexPage() {
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    authFetch(`${API_BASE_URL}/api/family/children`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setChildren(d.data ?? []);
        else setError(d.message ?? "Gagal memuat data anak");
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  }, []);

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
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <svg className="w-7 h-7 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
              Batas Pengeluaran
            </h1>
          </div>
          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm sm:text-base">
            Pilih akun anak untuk mengatur batas pengeluaran
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

        {children.length === 0 && !error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">Belum ada akun anak</h3>
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm mb-4">
              Tambah akun anak terlebih dahulu untuk mengatur batas pengeluaran
            </p>
            <Link href="/parent/accounts" className="text-bsi-teal-primary font-['Poppins',sans-serif] font-bold text-sm hover:underline">
              Ke Akun Anak →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/parent/limits/${child.id}`}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem(`child_name_${child.id}`, child.fullName);
                  }
                }}
                className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 hover:shadow-md hover:border-bsi-teal-primary/30 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {child.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-base group-hover:text-bsi-teal-primary transition-colors">
                      {child.fullName}
                    </p>
                    <span className={`text-xs font-['Poppins',sans-serif] font-semibold px-2 py-0.5 rounded-full ${child.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {child.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
                {child.account && (
                  <div className="bg-[#f9fafa] rounded-xl p-3">
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs mb-0.5">Saldo Tabungan</p>
                    <p className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-base">
                      {formatRupiah(child.account.balance)}
                    </p>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-end gap-1 text-bsi-teal-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-['Poppins',sans-serif] font-bold text-xs">Atur Batas</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
