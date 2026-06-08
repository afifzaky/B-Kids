"use client";

import Link from "next/link";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ParentForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Email wajib diisi"); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Terjadi kesalahan, coba lagi");
        return;
      }
      setSent(true);
    } catch {
      setError("Gagal terhubung ke server. Pastikan koneksi Anda stabil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute bg-[rgba(255,255,255,0.05)] blur-3xl rounded-full size-96 -top-48 -right-48 pointer-events-none" />
      <div className="absolute bg-[rgba(237,139,0,0.1)] blur-3xl rounded-full size-80 -bottom-40 -left-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/auth/parent/login"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white font-['Poppins',sans-serif] mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Login
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl mb-2">
              Lupa Password
            </h1>
            <p className="font-['Lato',sans-serif] text-gray-600 text-sm">
              Masukkan email akun Anda. Kami akan mengirimkan link reset password.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-base mb-1">
                  Email Terkirim!
                </p>
                <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
                  Jika email <span className="font-semibold text-bsi-teal-primary">{email}</span> terdaftar, Anda akan menerima link reset password dalam beberapa menit.
                </p>
              </div>
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs">
                Tidak menerima email? Periksa folder spam atau coba lagi.
              </p>
              <Link
                href="/auth/parent/login"
                className="block w-full text-center bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white font-['Poppins',sans-serif] font-bold py-3 rounded-xl transition-colors"
              >
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-['Lato',sans-serif] text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                      placeholder="orang.tua@contoh.com"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-base focus:border-bsi-teal-primary focus:outline-none transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-['Poppins',sans-serif] font-bold text-base py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Link Reset"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="font-['Poppins',sans-serif] text-white/60 text-xs">Bank Syariah Indonesia</p>
        </div>
      </div>
    </div>
  );
}
