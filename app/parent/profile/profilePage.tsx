"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Tab = "info" | "email" | "password" | "pin";

interface ParentProfile {
  fullName: string;
  email: string;
  phone: string;
  nik: string;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function PinInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="password"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
        onChange(v);
      }}
      placeholder={placeholder ?? "••••••"}
      maxLength={6}
      className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
    />
  );
}

function SuccessBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <p className="font-['Poppins',sans-serif] text-green-700 text-sm flex-1">{message}</p>
      <button onClick={onClose} className="text-green-500 hover:text-green-700">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{message}</p>
    </div>
  );
}

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Info tab
  const [infoName, setInfoName] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState("");
  const [infoError, setInfoError] = useState("");

  // Email tab
  const [emailNew, setEmailNew] = useState("");
  const [emailPin, setEmailPin] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailError, setEmailError] = useState("");

  // Password tab
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwShowOld, setPwShowOld] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  // PIN tab
  const [pinOld, setPinOld] = useState("");
  const [pinNew, setPinNew] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setProfileLoading(true);
    authFetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.profile) {
          const p = d.data.profile;
          setProfile({ fullName: p.fullName, email: d.data.email ?? "", phone: p.phone ?? "", nik: p.nik ?? "" });
          setInfoName(p.fullName ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const token = () => localStorage.getItem("accessToken") ?? "";

  const handleInfoSave = async () => {
    if (!infoName.trim()) { setInfoError("Nama tidak boleh kosong"); return; }
    setInfoLoading(true);
    setInfoError("");
    setInfoSuccess("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ fullName: infoName.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setInfoError(d.message ?? "Gagal menyimpan profil"); return; }
      setInfoSuccess("Nama berhasil diperbarui!");
      setProfile((prev) => prev ? { ...prev, fullName: infoName.trim() } : prev);
      localStorage.setItem("userName", infoName.trim());
    } catch { setInfoError("Gagal terhubung ke server"); }
    finally { setInfoLoading(false); }
  };

  const handleEmailSave = async () => {
    if (!emailNew.trim()) { setEmailError("Email baru wajib diisi"); return; }
    if (emailPin.length !== 6) { setEmailError("PIN tabungan harus 6 digit"); return; }
    setEmailLoading(true);
    setEmailError("");
    setEmailSuccess("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/me/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ newEmail: emailNew.trim(), savingsPin: emailPin }),
      });
      const d = await res.json();
      if (!res.ok) { setEmailError(d.message ?? "Gagal mengubah email"); return; }
      setEmailSuccess("Email berhasil diperbarui!");
      setProfile((prev) => prev ? { ...prev, email: emailNew.trim() } : prev);
      setEmailNew("");
      setEmailPin("");
    } catch { setEmailError("Gagal terhubung ke server"); }
    finally { setEmailLoading(false); }
  };

  const handlePasswordSave = async () => {
    if (!pwOld) { setPwError("Password lama wajib diisi"); return; }
    if (!pwNew) { setPwError("Password baru wajib diisi"); return; }
    if (pwNew !== pwConfirm) { setPwError("Konfirmasi password tidak cocok"); return; }
    if (pwNew.length < 8) { setPwError("Password minimal 8 karakter"); return; }
    if (!/[A-Z]/.test(pwNew)) { setPwError("Password harus mengandung huruf kapital"); return; }
    if (!/[0-9]/.test(pwNew)) { setPwError("Password harus mengandung angka"); return; }
    setPwLoading(true);
    setPwError("");
    setPwSuccess("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ oldPassword: pwOld, newPassword: pwNew }),
      });
      const d = await res.json();
      if (!res.ok) { setPwError(d.message ?? "Gagal mengubah password"); return; }
      setPwSuccess("Password berhasil diperbarui!");
      setPwOld("");
      setPwNew("");
      setPwConfirm("");
    } catch { setPwError("Gagal terhubung ke server"); }
    finally { setPwLoading(false); }
  };

  const handlePinSave = async () => {
    if (pinOld.length !== 6) { setPinError("PIN lama harus 6 digit"); return; }
    if (pinNew.length !== 6) { setPinError("PIN baru harus 6 digit"); return; }
    if (pinNew !== pinConfirm) { setPinError("Konfirmasi PIN tidak cocok"); return; }
    setPinLoading(true);
    setPinError("");
    setPinSuccess("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/me/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ oldPin: pinOld, newPin: pinNew }),
      });
      const d = await res.json();
      if (!res.ok) { setPinError(d.message ?? "Gagal mengubah PIN"); return; }
      setPinSuccess("PIN berhasil diperbarui!");
      setPinOld("");
      setPinNew("");
      setPinConfirm("");
    } catch { setPinError("Gagal terhubung ke server"); }
    finally { setPinLoading(false); }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "info",
      label: "Informasi",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "email",
      label: "Email",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "password",
      label: "Password",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: "pin",
      label: "PIN Tabungan",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  if (profileLoading) {
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
    <div className="p-4 sm:p-8 lg:p-10 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/parent"
        className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark font-['Poppins',sans-serif] font-bold text-sm transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {(profile?.fullName ?? "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-2xl sm:text-3xl">
            {profile?.fullName ?? "—"}
          </h1>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-0.5">{profile?.email ?? ""}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f3f4f6] rounded-2xl p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-['Poppins',sans-serif] font-semibold text-sm whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-white text-bsi-teal-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6 sm:p-8">

        {/* ── Informasi ── */}
        {activeTab === "info" && (
          <div className="space-y-5">
            <div>
              <h2 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-lg mb-1">Informasi Profil</h2>
              <p className="font-['Lato',sans-serif] text-gray-500 text-sm">Perbarui nama tampilan akun kamu.</p>
            </div>

            {infoSuccess && <SuccessBanner message={infoSuccess} onClose={() => setInfoSuccess("")} />}
            {infoError && <ErrorBanner message={infoError} />}

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#f8fafa] rounded-xl border border-[#e0e7e7]">
              <div>
                <p className="font-['Poppins',sans-serif] text-gray-400 text-xs uppercase tracking-wide mb-1">Email</p>
                <p className="font-['Lato',sans-serif] text-gray-700 text-sm">{profile?.email ?? "—"}</p>
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] text-gray-400 text-xs uppercase tracking-wide mb-1">Nomor HP</p>
                <p className="font-['Lato',sans-serif] text-gray-700 text-sm">{profile?.phone ?? "—"}</p>
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] text-gray-400 text-xs uppercase tracking-wide mb-1">NIK</p>
                <p className="font-['Lato',sans-serif] text-gray-700 text-sm">{profile?.nik ?? "—"}</p>
              </div>
            </div>

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={infoName}
                onChange={(e) => setInfoName(e.target.value)}
                maxLength={100}
                className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
              />
            </div>

            <button
              onClick={handleInfoSave}
              disabled={infoLoading || infoName.trim() === (profile?.fullName ?? "")}
              className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 px-6 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center gap-2"
            >
              {infoLoading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {infoLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        )}

        {/* ── Email ── */}
        {activeTab === "email" && (
          <div className="space-y-5">
            <div>
              <h2 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-lg mb-1">Ubah Email</h2>
              <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
                Email saat ini: <span className="font-semibold text-gray-700">{profile?.email ?? "—"}</span>
              </p>
            </div>

            {emailSuccess && <SuccessBanner message={emailSuccess} onClose={() => setEmailSuccess("")} />}
            {emailError && <ErrorBanner message={emailError} />}

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Email Baru <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={emailNew}
                onChange={(e) => setEmailNew(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
              />
            </div>

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Konfirmasi dengan PIN Tabungan <span className="text-red-400">*</span>
              </label>
              <PinInput value={emailPin} onChange={setEmailPin} placeholder="6 digit PIN tabungan" />
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">
                PIN tabungan 6 digit yang dibuat saat registrasi
              </p>
            </div>

            <button
              onClick={handleEmailSave}
              disabled={emailLoading}
              className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 px-6 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center gap-2"
            >
              {emailLoading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {emailLoading ? "Memproses..." : "Ubah Email"}
            </button>
          </div>
        )}

        {/* ── Password ── */}
        {activeTab === "password" && (
          <div className="space-y-5">
            <div>
              <h2 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-lg mb-1">Ubah Password</h2>
              <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
                Password minimal 8 karakter, mengandung huruf kapital dan angka.
              </p>
            </div>

            {pwSuccess && <SuccessBanner message={pwSuccess} onClose={() => setPwSuccess("")} />}
            {pwError && <ErrorBanner message={pwError} />}

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Password Lama <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={pwShowOld ? "text" : "password"}
                  value={pwOld}
                  onChange={(e) => setPwOld(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 pr-12 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                />
                <button type="button" onClick={() => setPwShowOld((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {pwShowOld ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Password Baru <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={pwShowNew ? "text" : "password"}
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  placeholder="Minimal 8 karakter, huruf kapital, angka"
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 pr-12 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                />
                <button type="button" onClick={() => setPwShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {pwShowNew ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Konfirmasi Password Baru <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="Ulangi password baru"
                className={`w-full border rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-bsi-teal-primary ${
                  pwConfirm && pwNew !== pwConfirm
                    ? "border-red-300 focus:ring-red-200"
                    : "border-[#e0e7e7] focus:ring-bsi-teal-primary/30"
                }`}
              />
              {pwConfirm && pwNew !== pwConfirm && (
                <p className="text-red-500 text-xs mt-1">Password tidak cocok</p>
              )}
            </div>

            <button
              onClick={handlePasswordSave}
              disabled={pwLoading}
              className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 px-6 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center gap-2"
            >
              {pwLoading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {pwLoading ? "Memproses..." : "Ubah Password"}
            </button>
          </div>
        )}

        {/* ── PIN ── */}
        {activeTab === "pin" && (
          <div className="space-y-5">
            <div>
              <h2 className="font-['Montserrat',sans-serif] font-bold text-[#030213] text-lg mb-1">Ubah PIN Tabungan</h2>
              <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
                PIN tabungan 6 digit digunakan sebagai faktor kedua saat login dan konfirmasi transaksi.
              </p>
            </div>

            {pinSuccess && <SuccessBanner message={pinSuccess} onClose={() => setPinSuccess("")} />}
            {pinError && <ErrorBanner message={pinError} />}

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                PIN Lama <span className="text-red-400">*</span>
              </label>
              <PinInput value={pinOld} onChange={setPinOld} />
            </div>

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                PIN Baru <span className="text-red-400">*</span>
              </label>
              <PinInput value={pinNew} onChange={setPinNew} />
            </div>

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                Konfirmasi PIN Baru <span className="text-red-400">*</span>
              </label>
              <PinInput value={pinConfirm} onChange={setPinConfirm} />
              {pinConfirm && pinNew !== pinConfirm && (
                <p className="text-red-500 text-xs mt-1">PIN tidak cocok</p>
              )}
            </div>

            <button
              onClick={handlePinSave}
              disabled={pinLoading}
              className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 px-6 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center gap-2"
            >
              {pinLoading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {pinLoading ? "Memproses..." : "Ubah PIN"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
