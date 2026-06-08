"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ParentResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!newPassword) return "Password baru wajib diisi";
    if (newPassword.length < 8) return "Password minimal 8 karakter";
    if (!/[A-Z]/.test(newPassword)) return "Password harus mengandung huruf besar";
    if (!/[0-9]/.test(newPassword)) return "Password harus mengandung angka";
    if (newPassword !== confirmPassword) return "Konfirmasi password tidak cocok";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token reset tidak ditemukan. Gunakan link dari email Anda.");
      return;
    }

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Token tidak valid atau sudah kedaluwarsa");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/auth/parent/login"), 3000);
    } catch {
      setError("Gagal terhubung ke server. Pastikan koneksi Anda stabil.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl mb-2">Link Tidak Valid</h2>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-6">
            Token reset tidak ditemukan. Pastikan Anda membuka link langsung dari email.
          </p>
          <Link
            href="/auth/parent/forgot-password"
            className="block w-full text-center bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white font-['Poppins',sans-serif] font-bold py-3 rounded-xl transition-colors"
          >
            Minta Link Baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute bg-[rgba(255,255,255,0.05)] blur-3xl rounded-full size-96 -top-48 -right-48 pointer-events-none" />
      <div className="absolute bg-[rgba(237,139,0,0.1)] blur-3xl rounded-full size-80 -bottom-40 -left-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl mb-2">
              Buat Password Baru
            </h1>
            <p className="font-['Lato',sans-serif] text-gray-600 text-sm">
              Masukkan password baru untuk akun Anda.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-base mb-1">Password Berhasil Diubah!</p>
                <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
                  Anda akan diarahkan ke halaman login dalam beberapa detik...
                </p>
              </div>
              <Link
                href="/auth/parent/login"
                className="block w-full text-center bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white font-['Poppins',sans-serif] font-bold py-3 rounded-xl transition-colors"
              >
                Login Sekarang
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

              <div className="bg-[#f0f9f9] border border-[#c7e8e8] rounded-xl px-4 py-3 mb-5">
                <p className="font-['Lato',sans-serif] text-bsi-teal-primary text-xs">
                  Password harus minimal <strong>8 karakter</strong>, mengandung <strong>huruf besar</strong> dan <strong>angka</strong>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (error) setError(""); }}
                      placeholder="Minimal 8 karakter"
                      className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-base focus:border-bsi-teal-primary focus:outline-none transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                      required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                      {showNew ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }}
                      placeholder="Ulangi password baru"
                      className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-base focus:border-bsi-teal-primary focus:outline-none transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                      {showConfirm ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-['Poppins',sans-serif] font-bold text-base py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Password Baru"
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
