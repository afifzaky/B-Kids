"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authFetch } from "../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TX_LABELS: Record<string, string> = {
  TOP_UP_FROM_PARENT: "Transfer dari Orang Tua",
  CHORE_REWARD: "Reward Tantangan",
  POCKET_ALLOCATE: "Alokasi ke Kantong",
  POCKET_DEALLOCATE: "Penarikan dari Kantong",
  VOUCHER_PURCHASE: "Pembelian Voucher",
  INFAQ: "Infaq / Sedekah",
  ADJUSTMENT: "Penyesuaian Saldo",
};

const NAV_ITEMS = [
  {
    href: "/child",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    href: "/child/challenges",
    label: "Tantangan",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    href: "/child/pockets",
    label: "Kantongku",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/child/history",
    label: "Riwayat",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/child/voucher",
    label: "Voucher",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
        <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
      </svg>
    ),
  },
  {
    href: "/child/infaq",
    label: "Infaq",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/child/learning",
    label: "E-Learning",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
  },
];

interface ChildNotif {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  isCredit: boolean;
}

interface HealthService {
  status: string;
  latencyMs?: number;
}

interface HealthData {
  status: string;
  statusLabel: string;
  uptimeSeconds: number;
  services: {
    database: HealthService;
    storage: HealthService;
  };
}

type ServiceStatus = "operational" | "degraded" | "down" | "unknown";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}h ${h}j ${m}m`;
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

function statusDotClass(status: ServiceStatus | string): string {
  if (status === "operational") return "bg-green-500";
  if (status === "degraded") return "bg-yellow-400";
  if (status === "down") return "bg-red-500";
  return "bg-gray-400";
}

function timeAgo(str: string): string {
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  if (mins > 0) return `${mins} mnt lalu`;
  return "Baru saja";
}

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthStatus, setHealthStatus] = useState<ServiceStatus>("unknown");
  const [notifications, setNotifications] = useState<ChildNotif[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "CHILD") {
      router.push("/auth/child/login");
      return;
    }
    setUserName(localStorage.getItem("userName") ?? "Anak");
    setAuthChecked(true);
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (healthRef.current && !healthRef.current.contains(e.target as Node)) setHealthOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        const data: HealthData = await res.json();
        setHealthData(data);
        const s = data.status as ServiceStatus;
        setHealthStatus(["operational", "degraded", "down"].includes(s) ? s : "unknown");
      } catch {
        setHealthStatus("down");
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 60000);
    return () => clearInterval(id);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setNotifLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/chores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const chores = (data.data ?? [])
          .filter((c: { status: string }) => ["ACTIVE", "PENDING_REVIEW"].includes(c.status))
          .slice(0, 5);
        setNotifications(
          chores.map((c: { id: string; title: string; category: string; status: string; deadline: string; rewardAmount: number }) => ({
            id: c.id,
            title: c.title,
            subtitle: c.status === "PENDING_REVIEW"
              ? "Menunggu review orang tua"
              : `Kategori: ${c.category}`,
            time: c.deadline,
            isCredit: c.status === "PENDING_REVIEW",
          }))
        );
      }
    } catch { /* ignore */ }
    finally { setNotifLoading(false); }
  };

  const handleNotifClick = () => {
    setProfileOpen(false);
    setHealthOpen(false);
    if (!notifOpen) fetchNotifications();
    setNotifOpen((o) => !o);
  };

  const handleProfileClick = () => {
    setNotifOpen(false);
    setHealthOpen(false);
    setProfileOpen((o) => !o);
  };

  const handleHealthClick = () => {
    setNotifOpen(false);
    setProfileOpen(false);
    setHealthOpen((o) => !o);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") ?? "";
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch { /* biarkan logout tetap jalan */ }
    localStorage.clear();
    router.push("/auth/child/login");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#f1f4f4] flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#f1f4f4] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#f6fafa] border-r border-[#bdc9c9] z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex justify-center items-center px-6 py-5 border-b border-[#bdc9c9]">
          <img src="/logo-bkids.png" alt="B-Kids" className="h-14 w-auto object-contain" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-['Poppins',sans-serif] font-semibold text-sm transition-all ${
                  active
                    ? "bg-[rgba(0,124,128,0.12)] text-bsi-teal-primary border-r-4 border-bsi-teal-primary"
                    : "text-[rgba(0,0,0,0.6)] hover:bg-white/70 hover:text-bsi-teal-primary"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-[#bdc9c9]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-['Poppins',sans-serif] font-semibold text-sm text-[rgba(0,0,0,0.5)] hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#bdc9c9] sticky top-0 z-10 h-14 flex items-center px-4 sm:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 mr-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-1">

            {/* System Health Indicator */}
            <div ref={healthRef} className="relative">
              <button
                onClick={handleHealthClick}
                className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Status Sistem"
              >
                <span className="relative flex h-3 w-3">
                  {healthStatus !== "operational" && healthStatus !== "unknown" && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${statusDotClass(healthStatus)}`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${statusDotClass(healthStatus)}`} />
                </span>
              </button>

              {healthOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#e0e7e7] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#f3f4f6] flex items-center justify-between">
                    <h4 className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm">Status Sistem</h4>
                    {healthData && (
                      <span className={`text-xs font-['Poppins',sans-serif] font-semibold px-2 py-0.5 rounded-full ${
                        healthStatus === "operational" ? "bg-green-100 text-green-700" :
                        healthStatus === "degraded" ? "bg-yellow-100 text-yellow-700" :
                        healthStatus === "down" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {healthData.statusLabel ?? healthData.status}
                      </span>
                    )}
                  </div>

                  {!healthData ? (
                    <div className="py-6 text-center">
                      <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Mengambil data...</p>
                    </div>
                  ) : (
                    <div className="px-4 py-3 space-y-3">
                      {/* Database */}
                      {healthData.services?.database && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full h-2.5 w-2.5 ${statusDotClass(healthData.services.database.status)}`} />
                            <span className="font-['Poppins',sans-serif] text-sm text-gray-700">Database</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-['Poppins',sans-serif] font-semibold ${
                              healthData.services.database.status === "operational" ? "text-green-600" :
                              healthData.services.database.status === "degraded" ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {healthData.services.database.status}
                            </span>
                            {healthData.services.database.latencyMs != null && (
                              <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{healthData.services.database.latencyMs}ms</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Storage */}
                      {healthData.services?.storage && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full h-2.5 w-2.5 ${statusDotClass(healthData.services.storage.status)}`} />
                            <span className="font-['Poppins',sans-serif] text-sm text-gray-700">Storage</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-['Poppins',sans-serif] font-semibold ${
                              healthData.services.storage.status === "operational" ? "text-green-600" :
                              healthData.services.storage.status === "degraded" ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {healthData.services.storage.status}
                            </span>
                            {healthData.services.storage.latencyMs != null && (
                              <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{healthData.services.storage.latencyMs}ms</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Uptime */}
                      <div className="pt-2 border-t border-[#f3f4f6]">
                        <p className="font-['Lato',sans-serif] text-gray-400 text-xs">
                          Uptime: <span className="text-gray-600 font-semibold">{formatUptime(healthData.uptimeSeconds)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={handleNotifClick}
                className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Notifikasi"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-bsi-orange-primary rounded-full" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#e0e7e7] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#f3f4f6] flex items-center justify-between">
                    <h4 className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm">Tantanganku</h4>
                    <span className="font-['Lato',sans-serif] text-gray-400 text-xs">5 terbaru</span>
                  </div>
                  {notifLoading ? (
                    <div className="py-8 text-center">
                      <svg className="animate-spin w-5 h-5 text-bsi-teal-primary mx-auto" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <div className="text-3xl mb-2">🔔</div>
                      <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada aktivitas</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#f3f4f6] max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-[#f9fafa] transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.isCredit ? "bg-green-50" : "bg-red-50"}`}>
                              <svg className={`w-4 h-4 ${n.isCredit ? "text-green-500" : "text-red-500"}`} fill="currentColor" viewBox="0 0 20 20">
                                {n.isCredit ? (
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                ) : (
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                )}
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-xs leading-tight">{n.title}</p>
                              {n.subtitle && (
                                <p className="font-['Lato',sans-serif] text-gray-400 text-xs truncate mt-0.5">{n.subtitle}</p>
                              )}
                              <p className="font-['Lato',sans-serif] text-gray-300 text-xs mt-0.5">{timeAgo(n.time)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-4 py-2.5 border-t border-[#f3f4f6]">
                    <Link
                      href="/child/challenges"
                      onClick={() => setNotifOpen(false)}
                      className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-xs hover:underline"
                    >
                      Lihat semua tantangan →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bsi-orange-primary to-bsi-orange-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">
                  {userName}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-full min-w-[160px] bg-white rounded-2xl shadow-xl border border-[#e0e7e7] z-50 overflow-hidden">
                  <Link
                    href="/child/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-['Poppins',sans-serif] font-semibold text-gray-700 hover:bg-[#f0f9f9] hover:text-bsi-teal-primary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Edit Profil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-['Poppins',sans-serif] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
