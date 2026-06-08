"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

export function ParentRegister() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    savingsPin: "",
    confirmSavingsPin: "",
    nik: "",
    bsiAccountNumber: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSavingsPin, setShowSavingsPin] = useState(false);
  const [showConfirmSavingsPin, setShowConfirmSavingsPin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successUserName, setSuccessUserName] = useState("");
  const [countdown, setCountdown] = useState(5);

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

  useEffect(() => {
    if (!showSuccessModal) return;
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/auth/parent/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showSuccessModal, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Nama lengkap wajib diisi";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Nama minimal 2 karakter";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Tanggal lahir wajib diisi";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    if (!formData.phone) {
      newErrors.phone = "Nomor HP wajib diisi";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Format nomor HP tidak valid (contoh: 081234567890)";
    }

    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password harus mengandung huruf besar";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password harus mengandung angka";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
    }

    const pinRegex = /^\d{6}$/;
    if (!formData.savingsPin) {
      newErrors.savingsPin = "PIN Tabungan wajib diisi";
    } else if (!pinRegex.test(formData.savingsPin)) {
      newErrors.savingsPin = "PIN Tabungan harus tepat 6 digit angka";
    }

    if (!formData.confirmSavingsPin) {
      newErrors.confirmSavingsPin = "Konfirmasi PIN Tabungan wajib diisi";
    } else if (formData.savingsPin !== formData.confirmSavingsPin) {
      newErrors.confirmSavingsPin = "PIN Tabungan tidak cocok";
    }

    const nikRegex = /^\d{16}$/;
    if (!formData.nik) {
      newErrors.nik = "NIK wajib diisi";
    } else if (!nikRegex.test(formData.nik)) {
      newErrors.nik = "NIK harus 16 digit angka";
    }

    const bsiRegex = /^7\d{9}$/;
    if (!formData.bsiAccountNumber) {
      newErrors.bsiAccountNumber = "Nomor rekening BSI wajib diisi";
    } else if (!bsiRegex.test(formData.bsiAccountNumber)) {
      newErrors.bsiAccountNumber = "Nomor rekening BSI harus 10 digit diawali angka 7";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validateForm()) return;

    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setApiError("Selesaikan verifikasi CAPTCHA terlebih dahulu");
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, string> = {
        fullName: formData.fullName,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        savingsPin: formData.savingsPin,
        nik: formData.nik,
        bsiAccountNumber: formData.bsiAccountNumber,
      };
      if (captchaToken) body.captchaToken = captchaToken;

      const response = await fetch(`${API_BASE_URL}/api/auth/register/parent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "DUPLICATE_USER") {
          setErrors((prev) => ({ ...prev, email: "Email atau nomor HP sudah terdaftar" }));
        } else if (data.code === "DUPLICATE_NIK") {
          setErrors((prev) => ({ ...prev, nik: "NIK sudah terdaftar" }));
        } else if (data.code === "DUPLICATE_BSI_ACCOUNT") {
          setErrors((prev) => ({
            ...prev,
            bsiAccountNumber: "Nomor rekening BSI sudah terdaftar dalam sistem",
          }));
        } else {
          setApiError(data.message ?? "Terjadi kesalahan, silakan coba lagi");
        }
        return;
      }

      const userName = data.data?.profile?.fullName ?? "";
      if (data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        localStorage.setItem("userRole", "PARENT");
        localStorage.setItem("userName", userName);
      }

      setSuccessUserName(userName);
      setShowSuccessModal(true);
    } catch {
      setApiError("Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const inputBase = (hasError: boolean) =>
    `w-full px-4 py-3 border-2 ${hasError ? "border-red-500" : "border-gray-200"} rounded-xl font-['Lato',sans-serif] text-base text-gray-900 bg-white placeholder:text-gray-400 focus:border-bsi-teal-primary focus:outline-none transition-colors`;

  const inputWithIcon = (hasError: boolean) =>
    `w-full pl-12 pr-4 py-3 border-2 ${hasError ? "border-red-500" : "border-gray-200"} rounded-xl font-['Lato',sans-serif] text-base text-gray-900 bg-white placeholder:text-gray-400 focus:border-bsi-teal-primary focus:outline-none transition-colors`;

  const inputWithBothIcons = (hasError: boolean) =>
    `w-full pl-12 pr-12 py-3 border-2 ${hasError ? "border-red-500" : "border-gray-200"} rounded-xl font-['Lato',sans-serif] text-base text-gray-900 bg-white placeholder:text-gray-400 focus:border-bsi-teal-primary focus:outline-none transition-colors`;

  const EyeOpen = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOff = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <>
      {/* ── SUCCESS MODAL ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md z-10">
            <div className="text-center">
              {/* Success Icon */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-3xl mb-2">
                Pendaftaran Berhasil!
              </h1>
              {successUserName && (
                <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-lg mb-3">
                  Halo, {successUserName}!
                </p>
              )}
              <p className="font-['Lato',sans-serif] text-gray-600 text-base mb-6">
                Akun orang tua Anda telah berhasil dibuat. Sekarang Anda dapat login dan mulai mengelola keuangan anak.
              </p>

              {/* Countdown */}
              <div className="bg-bsi-teal-primary/5 border border-bsi-teal-primary/20 rounded-xl p-4 mb-6">
                <p className="font-['Poppins',sans-serif] text-bsi-teal-primary text-sm">
                  Mengalihkan ke halaman login dalam{" "}
                  <span className="font-bold text-lg">{countdown}</span> detik...
                </p>
              </div>

              {/* Next Steps */}
              <div className="bg-gray-50 rounded-xl p-5 text-left mb-6">
                <h2 className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm mb-3">
                  Langkah Selanjutnya:
                </h2>
                <ul className="space-y-2.5 font-['Lato',sans-serif] text-gray-600 text-sm">
                  {[
                    "Login ke akun orang tua Anda",
                    "Tambahkan akun anak-anak Anda",
                    "Atur batas pengeluaran dan buat tantangan",
                    "Mulai pantau keuangan keluarga",
                  ].map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-bsi-teal-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Login Button */}
              <button
                onClick={() => router.push("/auth/parent/login")}
                className="w-full bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light text-white font-['Poppins',sans-serif] font-bold text-base py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Login Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTER FORM ── */}
      <div className="min-h-screen bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute bg-[rgba(255,255,255,0.05)] blur-3xl rounded-full size-96 -top-48 -right-48 pointer-events-none" />
        <div className="absolute bg-[rgba(237,139,0,0.1)] blur-3xl rounded-full size-80 -bottom-40 -left-40 pointer-events-none" />

        <div className="w-full max-w-2xl relative z-10">
          {/* Back Button */}
          <Link
            href="/auth/parent/login"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-['Poppins',sans-serif] mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Login
          </Link>

          {/* Registration Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-3xl mb-2">
                Buat Akun Orang Tua
              </h1>
              <p className="font-['Lato',sans-serif] text-gray-600 text-base">
                Bergabung dengan B-Kids dan mulai kelola keuangan anak Anda
              </p>
            </div>

            {/* API Error Banner */}
            {apiError && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-['Lato',sans-serif] text-red-600 text-sm">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className={inputBase(!!errors.fullName)}
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.fullName}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  className={inputBase(!!errors.dateOfBirth)}
                />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.dateOfBirth}</p>}
              </div>

              {/* Email */}
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
                    className={inputWithIcon(!!errors.email)}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Nomor HP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="081234567890"
                    className={inputWithIcon(!!errors.phone)}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.phone}</p>}
              </div>

              {/* Password */}
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
                    placeholder="Min. 8 karakter, huruf besar & angka"
                    className={inputWithBothIcons(!!errors.password)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    placeholder="Ulangi password Anda"
                    className={inputWithBothIcons(!!errors.confirmPassword)}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.confirmPassword}</p>}
              </div>

              {/* Savings PIN */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1">
                  PIN Tabungan
                </label>
                <p className="font-['Lato',sans-serif] text-gray-500 text-xs mb-2">
                  PIN 6 digit ini digunakan sebagai verifikasi tambahan saat login
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
                    className={`${inputWithBothIcons(!!errors.savingsPin)} tracking-widest`}
                  />
                  <button type="button" onClick={() => setShowSavingsPin(!showSavingsPin)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                    {showSavingsPin ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
                {errors.savingsPin && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.savingsPin}</p>}
              </div>

              {/* Confirm Savings PIN */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Konfirmasi PIN Tabungan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type={showConfirmSavingsPin ? "text" : "password"}
                    value={formData.confirmSavingsPin}
                    onChange={(e) => handleChange("confirmSavingsPin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Ulangi PIN Tabungan"
                    maxLength={6}
                    inputMode="numeric"
                    className={`${inputWithBothIcons(!!errors.confirmSavingsPin)} tracking-widest`}
                  />
                  <button type="button" onClick={() => setShowConfirmSavingsPin(!showConfirmSavingsPin)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                    {showConfirmSavingsPin ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
                {errors.confirmSavingsPin && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.confirmSavingsPin}</p>}
              </div>

              {/* NIK */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
                  Nomor Induk Kependudukan (NIK)
                </label>
                <input
                  type="text"
                  value={formData.nik}
                  onChange={(e) => handleChange("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="16 digit NIK"
                  maxLength={16}
                  inputMode="numeric"
                  className={inputBase(!!errors.nik)}
                />
                {errors.nik && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.nik}</p>}
              </div>

              {/* BSI Account Number */}
              <div>
                <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1">
                  Nomor Rekening BSI
                </label>
                <p className="font-['Lato',sans-serif] text-gray-500 text-xs mb-2">
                  10 digit diawali angka 7 (contoh: 7123456789)
                </p>
                <input
                  type="text"
                  value={formData.bsiAccountNumber}
                  onChange={(e) => handleChange("bsiAccountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="7XXXXXXXXX"
                  maxLength={10}
                  inputMode="numeric"
                  className={inputBase(!!errors.bsiAccountNumber)}
                />
                {errors.bsiAccountNumber && <p className="mt-1 text-sm text-red-500 font-['Lato',sans-serif]">{errors.bsiAccountNumber}</p>}
              </div>

              {/* hCaptcha Widget */}
              {HCAPTCHA_SITE_KEY && (
                <div className="flex justify-center mt-2">
                  <div ref={captchaRef} />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-['Poppins',sans-serif] font-bold text-base py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all mt-6 flex items-center justify-center gap-2"
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
                  "Buat Akun"
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="font-['Lato',sans-serif] text-gray-600 text-sm">
                Sudah punya akun?{" "}
                <Link href="/auth/parent/login" className="font-['Poppins',sans-serif] text-bsi-teal-primary font-semibold hover:underline">
                  Login di sini
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
    </>
  );
}
