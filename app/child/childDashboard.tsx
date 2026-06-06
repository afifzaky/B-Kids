"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

interface Pocket {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  category: string;
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
    <div className="flex items-center justify-center py-32">
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

  // Move Money Modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movePockets, setMovePockets] = useState<Pocket[]>([]);
  const [moveSelectedPocket, setMoveSelectedPocket] = useState("");
  const [moveAmount, setMoveAmount] = useState("");
  const [moveNotes, setMoveNotes] = useState("");
  const [moveLoading, setMovePocketsLoading] = useState(false);
  const [moveSubmitLoading, setMoveSubmitLoading] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moveSuccess, setMoveSuccess] = useState<string | null>(null);

  // Infaq Modal
  const [showInfaqModal, setShowInfaqModal] = useState(false);
  const [infaqPockets, setInfaqPockets] = useState<Pocket[]>([]);
  const [infaqSourcePocket, setInfaqSourcePocket] = useState("");
  const [infaqAmount, setInfaqAmount] = useState("");
  const [infaqInstitution, setInfaqInstitution] = useState<string>("BSI_MASLAHAT");
  const [infaqLoading, setInfaqLoading] = useState(false);
  const [infaqError, setInfaqError] = useState<string | null>(null);
  const [infaqSuccess, setInfaqSuccess] = useState<string | null>(null);

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

  const fetchPockets = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setMovePocketsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pockets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMovePockets(data.data.pockets ?? []);
        setInfaqPockets(data.data.pockets ?? []);
      }
    } catch { /* ignore */ }
    finally { setMovePocketsLoading(false); }
  };

  const openMoveModal = () => {
    setShowMoveModal(true);
    setMoveSelectedPocket("");
    setMoveAmount("");
    setMoveNotes("");
    setMoveError(null);
    setMoveSuccess(null);
    fetchPockets();
  };

  const closeMoveModal = () => {
    setShowMoveModal(false);
    setMoveError(null);
    setMoveSuccess(null);
  };

  const handleMoveMoney = async () => {
    if (!moveSelectedPocket) { setMoveError("Pilih kantong tujuan"); return; }
    const amount = parseFloat(moveAmount);
    if (!amount || amount <= 0) { setMoveError("Masukkan nominal yang valid"); return; }
    setMoveSubmitLoading(true);
    setMoveError(null);
    setMoveSuccess(null);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/pockets/${moveSelectedPocket}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, ...(moveNotes.trim() ? { notes: moveNotes.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setMoveError(data.message ?? "Gagal memindahkan uang"); return; }
      setMoveSuccess("Uang berhasil dipindahkan ke kantong!");
      setMoveAmount("");
      setMoveNotes("");
      // Refresh balance
      const me = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meData = await me.json();
      if (meData.data?.profile) setProfile(meData.data.profile);
    } catch {
      setMoveError("Gagal terhubung ke server");
    } finally {
      setMoveSubmitLoading(false);
    }
  };

  const openInfaqModal = (presetAmount?: number) => {
    setShowInfaqModal(true);
    setInfaqSourcePocket("");
    setInfaqAmount(presetAmount ? String(presetAmount) : "");
    setInfaqInstitution("BSI_MASLAHAT");
    setInfaqError(null);
    setInfaqSuccess(null);
    fetchPockets();
  };

  const closeInfaqModal = () => {
    setShowInfaqModal(false);
    setInfaqError(null);
    setInfaqSuccess(null);
  };

  const handleInfaq = async () => {
    if (!infaqSourcePocket) { setInfaqError("Pilih sumber kantong"); return; }
    const amount = parseFloat(infaqAmount);
    if (!amount || amount <= 0) { setInfaqError("Masukkan nominal yang valid"); return; }
    setInfaqLoading(true);
    setInfaqError(null);
    setInfaqSuccess(null);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/infaq`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ institution: infaqInstitution, amount, sourcePocketId: infaqSourcePocket }),
      });
      const data = await res.json();
      if (!res.ok) { setInfaqError(data.message ?? "Gagal memproses infaq"); return; }
      setInfaqSuccess("Alhamdulillah! Infaq kamu berhasil dikirim.");
      setInfaqAmount("");
    } catch {
      setInfaqError("Gagal terhubung ke server");
    } finally {
      setInfaqLoading(false);
    }
  };

  const firstName = profile?.fullName?.split(" ")[0] ?? "Kamu";
  const balance = profile?.account?.balance ?? 0;
  const movePocketData = movePockets.find((p) => p.id === moveSelectedPocket);
  const moveAmountNum = parseFloat(moveAmount) || 0;

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="p-4 sm:p-8 lg:p-10">
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

            <button
              onClick={openMoveModal}
              className="relative z-10 bg-bsi-orange-primary hover:bg-[#d47a00] shadow-[0px_4px_0px_#a05e00] rounded-2xl py-4 font-['League_Spartan',sans-serif] font-bold text-white text-xl transition-all hover:shadow-[0px_2px_0px_#a05e00] hover:translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              Move Money
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
              <Link href="/child/challenges" className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm hover:underline">Lihat Semua</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Link href="/child/challenges" className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark px-4 py-2 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-xs transition-colors">Detail</Link>
                </div>
              </div>

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
                  <Link href="/child/challenges" className="bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark px-4 py-2 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-xs transition-colors">Detail</Link>
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
              <Link href="/child/pockets" className="bg-[#e5e9e8] hover:bg-[#d5d9d8] px-4 py-2 rounded-full font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Kantong Baru
              </Link>
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

          {/* Recent Fun-sactions */}
          <div className="lg:col-span-12 bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-bsi-orange-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <h3 className="font-['Montserrat',sans-serif] font-semibold text-bsi-teal-primary text-2xl">Recent Fun-sactions</h3>
              </div>
              <Link href="/child/history" className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm hover:underline">Lihat Semua</Link>
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

          {/* Infaq Section */}
          <div className="lg:col-span-12 bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-lg">
                ❤️
              </div>
              <h3 className="font-['Montserrat',sans-serif] font-semibold text-bsi-teal-primary text-2xl">
                Berbagi dengan Infaq
              </h3>
            </div>

            <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-base mb-6">
              Sisihkan sedikit saldumu untuk membantu sesama.
            </p>

            <div className="mb-6">
              <p className="font-['Poppins',sans-serif] font-bold text-[rgba(0,0,0,0.6)] text-xs uppercase tracking-wide mb-3">
                Nominal Infaq Tersarankan
              </p>
              <div className="flex flex-wrap gap-3">
                {[1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => openInfaqModal(amt)}
                    className="bg-[#e5e9e8] hover:bg-bsi-teal-primary hover:text-white px-5 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm transition-colors"
                  >
                    Rp {amt.toLocaleString("id-ID")}
                  </button>
                ))}
                <button
                  onClick={() => openInfaqModal()}
                  className="bg-[#e5e9e8] hover:bg-bsi-teal-primary hover:text-white px-5 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm transition-colors"
                >
                  Nominal Lain
                </button>
              </div>
            </div>

            <button
              onClick={() => openInfaqModal()}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-2xl py-3.5 px-8 font-['Poppins',sans-serif] font-bold text-white text-base transition-all shadow-lg hover:shadow-xl"
            >
              Infaq Sekarang
            </button>
          </div>

          {/* Voucher Banner */}
          <div className="lg:col-span-12 bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary rounded-3xl shadow-lg p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute bg-[rgba(0,191,178,0.3)] blur-[32px] -bottom-8 -right-8 rounded-full size-32 pointer-events-none" />
            <div className="absolute bg-[rgba(237,139,0,0.2)] blur-[24px] size-24 -left-8 top-4 rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L13 9.586l-1.293-1.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-['Montserrat',sans-serif] font-bold text-white text-xl sm:text-2xl mb-1">
                    Tukar Voucher Keren
                  </h3>
                  <p className="font-['Lato',sans-serif] text-white/80 text-sm sm:text-base">
                    Gunakan bintangmu untuk mendapatkan hadiah menarik
                  </p>
                </div>
              </div>
              <Link
                href="/child/voucher"
                className="bg-white hover:bg-gray-100 px-8 py-3 rounded-2xl font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-base transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                Lihat Voucher
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Move Money Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl">Move Money</h3>
                <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm mt-1">Pindahkan uang dari saldo utama ke kantong</p>
              </div>
              <button onClick={closeMoveModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Balance */}
            <div className="bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl p-5 text-white mb-6">
              <p className="font-['Poppins',sans-serif] text-white/80 text-xs uppercase tracking-wide mb-1">Saldo Utama</p>
              <p className="font-['Montserrat',sans-serif] font-bold text-3xl">{formatRupiah(balance)}</p>
            </div>

            <div className="space-y-4">
              {/* Destination Pocket */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Kantong Tujuan <span className="text-red-400">*</span>
                </label>
                {moveLoading ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Memuat kantong...</div>
                ) : movePockets.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Belum ada kantong. <Link href="/child/pockets" className="text-bsi-teal-primary underline">Buat kantong</Link> dulu.</div>
                ) : (
                  <select
                    value={moveSelectedPocket}
                    onChange={(e) => setMoveSelectedPocket(e.target.value)}
                    className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary bg-white"
                  >
                    <option value="">Pilih kantong...</option>
                    {movePockets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.emoji} {p.name} — Saldo: {formatRupiah(p.balance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Nominal (IDR) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-gray-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={moveAmount}
                    onChange={(e) => setMoveAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full border border-[#e0e7e7] rounded-xl pl-12 pr-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                  />
                </div>
                {moveAmountNum > balance && (
                  <p className="text-red-500 text-xs mt-1">Melebihi saldo utama</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={moveNotes}
                  onChange={(e) => setMoveNotes(e.target.value)}
                  placeholder="Contoh: Tabungan mingguan"
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsi-teal-primary/30 focus:border-bsi-teal-primary"
                />
              </div>
            </div>

            {/* Transaction Summary */}
            {moveSelectedPocket && moveAmountNum > 0 && moveAmountNum <= balance && (
              <div className="mt-4 bg-[#f8fafa] border border-[#e0e7e7] rounded-2xl p-4 space-y-2">
                <h4 className="font-['Poppins',sans-serif] font-bold text-black text-sm mb-3">Ringkasan Transaksi</h4>
                <div className="flex justify-between text-sm">
                  <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)]">Dari:</span>
                  <span className="font-['Poppins',sans-serif] font-bold text-black">Saldo Utama</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)]">Ke:</span>
                  <span className="font-['Poppins',sans-serif] font-bold text-black">{movePocketData?.emoji} {movePocketData?.name}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#e0e7e7]">
                  <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">Jumlah:</span>
                  <span className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg">{formatRupiah(moveAmountNum)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)]">Sisa Saldo:</span>
                  <span className="font-['Poppins',sans-serif] font-bold text-black">{formatRupiah(balance - moveAmountNum)}</span>
                </div>
              </div>
            )}

            {moveError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{moveError}</p>
              </div>
            )}
            {moveSuccess && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-green-700 text-sm">{moveSuccess}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeMoveModal}
                className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleMoveMoney}
                disabled={moveSubmitLoading || !!moveSuccess || moveAmountNum > balance}
                className="flex-1 bg-bsi-teal-primary hover:bg-bsi-teal-hover-dark disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {moveSubmitLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : moveSuccess ? "Berhasil ✓" : "Pindahkan Uang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Infaq Modal */}
      {showInfaqModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl">Berikan Infaq</h3>
                <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm mt-1">Sisihkan sebagian uangmu untuk kebaikan</p>
              </div>
              <button onClick={closeInfaqModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-5 text-white mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">❤️</div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-white/80 text-xs uppercase tracking-wide">Infaq dari Kantong</p>
                  <p className="font-['Montserrat',sans-serif] font-bold text-lg">Sedekah adalah ibadah</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Source Pocket */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Sumber Kantong <span className="text-red-400">*</span>
                </label>
                {infaqPockets.length === 0 ? (
                  <div className="text-center py-3 text-gray-400 text-sm">Belum ada kantong.</div>
                ) : (
                  <select
                    value={infaqSourcePocket}
                    onChange={(e) => setInfaqSourcePocket(e.target.value)}
                    className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 bg-white"
                  >
                    <option value="">Pilih kantong...</option>
                    {infaqPockets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.emoji} {p.name} — Saldo: {formatRupiah(p.balance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Institution */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Lembaga Penerima <span className="text-red-400">*</span>
                </label>
                <select
                  value={infaqInstitution}
                  onChange={(e) => setInfaqInstitution(e.target.value)}
                  className="w-full border border-[#e0e7e7] rounded-xl px-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 bg-white"
                >
                  <option value="BSI_MASLAHAT">BSI Maslahat</option>
                  <option value="BAZNAS">BAZNAS</option>
                  <option value="LAZISNU">LAZISNU</option>
                  <option value="LAZISMU">LAZISMU</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm block mb-2">
                  Nominal <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[1000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInfaqAmount(String(amt))}
                      className={`px-4 py-2 rounded-xl text-sm font-['Poppins',sans-serif] font-bold transition-colors ${
                        infaqAmount === String(amt)
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Rp {amt.toLocaleString("id-ID")}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-gray-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={infaqAmount}
                    onChange={(e) => setInfaqAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full border border-[#e0e7e7] rounded-xl pl-12 pr-4 py-3 font-['Lato',sans-serif] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600"
                  />
                </div>
              </div>
            </div>

            {infaqError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{infaqError}</p>
              </div>
            )}
            {infaqSuccess && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="font-['Poppins',sans-serif] text-green-700 text-sm">{infaqSuccess}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeInfaqModal}
                className="flex-1 bg-white border border-[#e0e7e7] py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleInfaq}
                disabled={infaqLoading || !!infaqSuccess}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 py-3 rounded-xl font-['Poppins',sans-serif] font-bold text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {infaqLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : infaqSuccess ? "Berhasil ✓" : "Kirim Infaq"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
