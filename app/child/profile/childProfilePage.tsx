"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const AVATAR_OPTIONS = [
  "🐱","🐶","🐼","🐸","🦊","🐨","🐯","🦁","🐻","🐺",
  "🐙","🦋","🦄","🐲","🐬","🦅","🐧","🐥","🦊","🦝",
  "🌟","⭐","🌈","🎮","🎨","🎵","🚀","🏆","🎯","🎲",
];

interface ChildProfile {
  id: string;
  fullName: string;
  username: string;
  dateOfBirth: string | null;
  avatar: string | null;
  childAccountNumber: string;
  isActive: boolean;
  createdAt: string;
  user: { email: string } | null;
  parent: { id: string; fullName: string } | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function ChildProfilePage() {
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Avatar state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setLoading(true);
    authFetch(`${API_BASE_URL}/api/child/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data);
          setSelectedAvatar(d.data.avatar ?? "🐱");
        } else {
          setError(d.message ?? "Gagal memuat profil");
        }
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveAvatar = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token || !selectedAvatar) return;
    setAvatarLoading(true);
    setAvatarError("");
    setAvatarSuccess("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/child/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: selectedAvatar }),
      });
      const d = await res.json();
      if (!res.ok) { setAvatarError(d.message ?? "Gagal menyimpan avatar"); return; }
      setProfile((prev) => prev ? { ...prev, avatar: selectedAvatar } : prev);
      localStorage.setItem("userName", profile?.fullName ?? "");
      setAvatarSuccess("Avatar berhasil diperbarui!");
      setShowAvatarPicker(false);
    } catch {
      setAvatarError("Gagal terhubung ke server");
    } finally {
      setAvatarLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-10 h-10 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-10 max-w-2xl mx-auto">
        <Link href="/child" className="inline-flex items-center gap-2 text-bsi-teal-primary font-['Poppins',sans-serif] font-bold text-sm mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 font-['Lato',sans-serif] text-sm">{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  const currentAvatar = profile.avatar ?? "🐱";

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/child"
        className="inline-flex items-center gap-2 text-bsi-teal-primary hover:text-bsi-teal-hover-dark font-['Poppins',sans-serif] font-bold text-sm transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Dashboard
      </Link>

      {/* Hero avatar card */}
      <div className="bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="absolute bg-[rgba(255,255,255,0.1)] blur-[32px] -bottom-10 -right-10 rounded-full size-40 pointer-events-none" />
        <div className="absolute bg-[rgba(237,139,0,0.2)] blur-[24px] size-20 -left-6 top-4 rounded-full pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-5xl shadow-lg">
              {currentAvatar}
            </div>
            <button
              onClick={() => { setShowAvatarPicker(true); setSelectedAvatar(currentAvatar); setAvatarError(""); setAvatarSuccess(""); }}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
              title="Ganti avatar"
            >
              <svg className="w-3.5 h-3.5 text-bsi-orange-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-white text-2xl sm:text-3xl leading-tight">
              {profile.fullName}
            </h1>
            <p className="font-['Lato',sans-serif] text-white/70 text-sm mt-0.5">@{profile.username}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-semibold ${profile.isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-700"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? "bg-white" : "bg-red-500"}`} />
              {profile.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {avatarSuccess && (
        <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="font-['Poppins',sans-serif] text-green-700 text-sm">{avatarSuccess}</p>
        </div>
      )}

      {/* Profile Info Card */}
      <div className="bg-white rounded-2xl border border-[#e0e7e7] shadow-sm p-6 sm:p-8 space-y-5">
        <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg">Informasi Profil</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Nama Lengkap" value={profile.fullName} />
          <InfoRow label="Username" value={`@${profile.username}`} />
          <InfoRow label="No. Rekening" value={profile.childAccountNumber} mono />
          {profile.dateOfBirth && (
            <InfoRow label="Tanggal Lahir" value={formatDate(profile.dateOfBirth)} />
          )}
          {profile.parent && (
            <InfoRow label="Orang Tua" value={profile.parent.fullName} />
          )}
          <InfoRow label="Bergabung Sejak" value={formatDate(profile.createdAt)} />
        </div>
      </div>

      {/* Security Note Card */}
      <div className="mt-5 bg-[#f8fafa] rounded-2xl border border-[#e0e7e7] p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-bsi-teal-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <p className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm mb-1">Password & PIN</p>
          <p className="font-['Lato',sans-serif] text-gray-500 text-sm">
            Perubahan password dan PIN hanya bisa dilakukan oleh orang tua. Minta orang tuamu untuk mengubahnya melalui menu Akun Anak di aplikasi mereka.
          </p>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-lg">Pilih Avatar</h3>
                <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-0.5">Pilih emoji yang paling kamu suka!</p>
              </div>
              <button onClick={() => setShowAvatarPicker(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview */}
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 bg-bsi-orange-primary/10 rounded-2xl flex items-center justify-center text-5xl shadow-inner">
                {selectedAvatar}
              </div>
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-6 gap-2 mb-5">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`h-10 w-10 rounded-xl text-2xl flex items-center justify-center transition-all ${
                    selectedAvatar === emoji
                      ? "bg-bsi-orange-primary/20 ring-2 ring-bsi-orange-primary scale-110"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {avatarError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-red-600 text-xs">{avatarError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="flex-1 bg-white border border-[#e0e7e7] py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAvatar}
                disabled={avatarLoading || selectedAvatar === currentAvatar}
                className="flex-1 bg-bsi-orange-primary hover:bg-[#d47a00] disabled:opacity-50 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {avatarLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : "Simpan Avatar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-[#f8fafa] rounded-xl p-4 border border-[#e0e7e7]">
      <p className="font-['Poppins',sans-serif] text-gray-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-gray-800 text-sm font-semibold ${mono ? "font-mono" : "font-['Poppins',sans-serif]"}`}>{value}</p>
    </div>
  );
}
