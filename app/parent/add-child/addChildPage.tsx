"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const INITIAL_FORM = {
  fullName: "",
  username: "",
  dateOfBirth: "",
  password: "",
  pin: "",
  parentPin: "",
};

function EyeOff() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function EyeOpen() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export function AddChildPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showParentPin, setShowParentPin] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!showSuccess) return;
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/parent/accounts");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showSuccess, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Nama wajib diisi";
    if (!formData.username.trim()) newErrors.username = "Username wajib diisi";
    else if (!/^[a-z0-9_]+$/.test(formData.username)) newErrors.username = "Username hanya huruf kecil, angka, dan underscore";
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Tanggal lahir wajib diisi";
    } else {
      const today = new Date();
      const dob = new Date(formData.dateOfBirth);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 12) newErrors.dateOfBirth = "Usia anak minimal 12 tahun";
      else if (age >= 17) newErrors.dateOfBirth = "Usia anak harus di bawah 17 tahun";
    }
    if (!formData.password) newErrors.password = "Password wajib diisi";
    else if (formData.password.length < 6) newErrors.password = "Password minimal 6 karakter";
    if (!formData.pin) newErrors.pin = "PIN wajib diisi";
    else if (formData.pin.length !== 6) newErrors.pin = "PIN harus 6 digit";
    if (!formData.parentPin) newErrors.parentPin = "PIN Tabungan Anda wajib diisi";
    else if (formData.parentPin.length !== 6) newErrors.parentPin = "PIN harus 6 digit";
    return newErrors;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("accessToken");
      const dob = new Date(formData.dateOfBirth);
      dob.setUTCHours(0, 0, 0, 0);

      const res = await authFetch(`${API_BASE_URL}/api/auth/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          username: formData.username.trim(),
          dateOfBirth: dob.toISOString(),
          password: formData.password,
          pin: formData.pin,
          parentPin: formData.parentPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Pendaftaran gagal, coba lagi");
        return;
      }

      setSuccessName(data.data?.fullName ?? formData.fullName);
      setShowSuccess(true);
    } catch {
      setError("Gagal terhubung ke server. Pastikan koneksi Anda stabil.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = "w-full py-3 border-2 border-gray-200 rounded-xl font-['Lato',sans-serif] text-base focus:border-bsi-teal-primary focus:outline-none transition-colors text-gray-900 bg-white placeholder:text-gray-400";

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/parent/accounts"
        className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark font-['Poppins',sans-serif] font-semibold text-sm transition-colors mb-6"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Akun Anak
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e0e7e7] p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
          <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl mb-1">
            Daftarkan Akun Anak
          </h1>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
            Isi data anak Anda untuk membuat akun B-Kids
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-['Lato',sans-serif] text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-2">
              Nama Lengkap Anak
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Contoh: Ahmad Fauzan"
              className={`${inputBase} px-4`}
            />
            {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1">
              Username
            </label>
            <p className="font-['Lato',sans-serif] text-gray-400 text-xs mb-2">
              Huruf kecil, angka, dan underscore saja. Minimal 3 karakter.
            </p>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="contoh: ahmad_fauzan"
              className={`${inputBase} px-4`}
            />
            {fieldErrors.username && <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>}
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
              min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 17); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()}
              max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 12); return d.toISOString().split("T")[0]; })()}
              className={`${inputBase} px-4`}
            />
            {fieldErrors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1">
              Password Anak
            </label>
            <p className="font-['Lato',sans-serif] text-gray-400 text-xs mb-2">
              Minimal 6 karakter. Anak akan menggunakan ini untuk login.
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Minimal 6 karakter"
                className={`${inputBase} pl-4 pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
          </div>

          {/* PIN Anak */}
          <div>
            <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1">
              PIN Anak
            </label>
            <p className="font-['Lato',sans-serif] text-gray-400 text-xs mb-2">
              6 digit angka. Anak akan menggunakan PIN ini bersama password untuk login.
            </p>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={formData.pin}
                onChange={(e) => handleChange("pin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 digit angka"
                inputMode="numeric"
                maxLength={6}
                className={`${inputBase} pl-4 pr-12 tracking-widest`}
              />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                {showPin ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            {fieldErrors.pin && <p className="text-red-500 text-xs mt-1">{fieldErrors.pin}</p>}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="font-['Lato',sans-serif] text-amber-700 text-xs">
                Masukkan PIN Tabungan Anda sebagai konfirmasi otorisasi pembuatan akun anak.
              </p>
            </div>

            {/* Parent PIN */}
            <div>
              <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1">
                PIN Tabungan Anda (Konfirmasi)
              </label>
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs mb-2">
                PIN 6 digit yang Anda buat saat registrasi.
              </p>
              <div className="relative">
                <input
                  type={showParentPin ? "text" : "password"}
                  value={formData.parentPin}
                  onChange={(e) => handleChange("parentPin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 digit angka"
                  inputMode="numeric"
                  maxLength={6}
                  className={`${inputBase} pl-4 pr-12 tracking-widest`}
                />
                <button type="button" onClick={() => setShowParentPin(!showParentPin)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                  {showParentPin ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
              {fieldErrors.parentPin && <p className="text-red-500 text-xs mt-1">{fieldErrors.parentPin}</p>}
            </div>
          </div>

          {/* Submit */}
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
                Memproses...
              </>
            ) : (
              "Lanjut & Konfirmasi"
            )}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
            <h2 className="font-['Montserrat',sans-serif] font-bold text-xl text-bsi-teal-primary mb-2">
              Konfirmasi Data Anak
            </h2>
            <p className="font-['Lato',sans-serif] text-gray-500 text-sm mb-5">
              Pastikan data berikut sudah benar sebelum mendaftar.
            </p>

            <div className="space-y-3 bg-[#f8fafa] rounded-xl p-4 mb-5">
              {[
                { label: "Nama Lengkap", value: formData.fullName },
                { label: "Username", value: `@${formData.username}` },
                { label: "Tanggal Lahir", value: formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="font-['Poppins',sans-serif] font-semibold text-gray-500 text-sm">{item.label}</span>
                  <span className="font-['Lato',sans-serif] text-gray-800 text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-white border border-[#e0e7e7] hover:bg-gray-50 text-gray-600 font-['Poppins',sans-serif] font-bold text-sm py-3 rounded-xl transition-colors"
              >
                Ubah Data
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white font-['Poppins',sans-serif] font-bold text-sm py-3 rounded-xl transition-colors"
              >
                Ya, Daftarkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl mb-2">
              Akun Berhasil Dibuat!
            </h2>
            <p className="font-['Lato',sans-serif] text-gray-600 text-sm mb-5">
              Akun B-Kids untuk <strong>{successName}</strong> telah berhasil didaftarkan. Anak Anda sekarang bisa login menggunakan username dan password yang sudah dibuat.
            </p>

            <div className="bg-[#f0f9f9] rounded-xl p-4 mb-5">
              <p className="font-['Lato',sans-serif] text-bsi-teal-primary text-sm">
                Dialihkan ke halaman Akun Anak dalam{" "}
                <span className="font-['Montserrat',sans-serif] font-bold text-lg">{countdown}</span> detik...
              </p>
            </div>

            <button
              onClick={() => router.push("/parent/accounts")}
              className="w-full bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark text-white font-['Poppins',sans-serif] font-bold py-3 rounded-xl transition-colors"
            >
              Lihat Akun Anak
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
