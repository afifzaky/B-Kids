"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

export function ParentLogin() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    savingsPin: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSavingsPin, setShowSavingsPin] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) return;
    const script = document.createElement("script");
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      if (captchaRef.current && (window as { hcaptcha?: { render: (el: HTMLElement, opts: object) => void } }).hcaptcha) {
        (window as { hcaptcha?: { render: (el: HTMLElement, opts: object) => void } }).hcaptcha!.render(captchaRef.current, {
          sitekey: HCAPTCHA_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(""),
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password || !formData.savingsPin) {
      setError("Semua field wajib diisi");
      return;
    }

    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setError("Selesaikan verifikasi CAPTCHA terlebih dahulu");
      return;
    }

    setIsLoading(true);
    try {
      // Coba login Admin terlebih dahulu (PIN diabaikan untuk Admin)
      const adminBody: Record<string, string> = { email: formData.email, password: formData.password };
      if (captchaToken) adminBody.captchaToken = captchaToken;
      const adminRes = await fetch(`${API_BASE_URL}/api/auth/login/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminBody),
      });
      const adminData = await adminRes.json();
      if (adminRes.ok) {
        localStorage.setItem("accessToken", adminData.data.accessToken);
        localStorage.setItem("refreshToken", adminData.data.refreshToken);
        localStorage.setItem("userRole", "SUPER_ADMIN");
        localStorage.setItem("userName", adminData.data.user?.email ?? "Admin");
        localStorage.setItem("loginOrigin", "parent");
        router.push("/admin");
        return;
      }

      // Bukan Admin — login sebagai Orang Tua dengan PIN Tabungan
      const body: Record<string, string> = { ...formData };
      if (captchaToken) body.captchaToken = captchaToken;
      const res = await fetch(`${API_BASE_URL}/api/auth/login/parent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Email, password, atau PIN Tabungan salah");
        return;
      }

      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("userRole", "PARENT");
      localStorage.setItem("userName", data.data.profile?.fullName ?? "");

      router.push("/parent");
    } catch {
      setError("Gagal terhubung ke server. Pastikan koneksi Anda stabil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute bg-[rgba(255,255,255,0.05)] blur-3xl rounded-full size-96 -top-48 -right-48 pointer-events-none" />
      <div className="absolute bg-[rgba(237,139,0,0.1)] blur-3xl rounded-full size-80 -bottom-40 -left-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white font-['Poppins',sans-serif] mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-3xl mb-2">
              Login Orang Tua
            </h1>
            <p className="font-['Lato',sans-serif] text-gray-600 text-base">
              Selamat datang kembali! Masuk ke akun Anda
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-['Lato',sans-serif] text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
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
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="orang.tua@contoh.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-base focus:border-bsi-teal-primary focus:outline-none transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-base focus:border-bsi-teal-primary focus:outline-none transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
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


            {/* Savings PIN Field */}
            <div>
              <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1">
                PIN Tabungan
              </label>
              <p className="font-['Lato',sans-serif] text-gray-500 text-xs mb-2">
                6 digit PIN yang dibuat saat registrasi
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  type={showSavingsPin ? "text" : "password"}
                  value={formData.savingsPin}
                  onChange={(e) => handleChange("savingsPin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 digit angka"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-base focus:border-bsi-teal-primary focus:outline-none transition-colors text-gray-900 bg-white placeholder:text-gray-400 tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSavingsPin(!showSavingsPin)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showSavingsPin ? (
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

            {/* hCaptcha Widget */}
            {HCAPTCHA_SITE_KEY && (
              <div className="flex justify-center">
                <div ref={captchaRef} />
              </div>
            )}

            {/* Login Button */}
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
                  Memproses...
                </>
              ) : (
                "Masuk ke Akun"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="font-['Lato',sans-serif] text-gray-600 text-sm">
              Belum punya akun?{" "}
              <Link
                href="/auth/parent/register"
                className="font-['Poppins',sans-serif] text-bsi-teal-primary font-semibold hover:underline"
              >
                Daftar Akun Orang Tua
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="font-['Poppins',sans-serif] text-white/60 text-xs">Bank Syariah Indonesia</p>
        </div>
      </div>
    </div>
  );
}
