"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    href: "/admin/parents",
    label: "Manajemen Parent",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
  },
  {
    href: "/admin/children",
    label: "Manajemen Anak",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/admin/vouchers",
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
    href: "/admin/infaq",
    label: "Infaq",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/admin/learning",
    label: "E-Learning",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Log",
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
];

interface HealthService {
  status: string;
  latencyMs?: number;
}

interface HealthData {
  status: string;
  statusLabel: string;
  uptimeSeconds: number;
  services?: {
    database?: HealthService;
    storage?: HealthService;
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminEmail, setAdminEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthStatus, setHealthStatus] = useState<ServiceStatus>("unknown");
  const profileRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "SUPER_ADMIN") {
      router.push("/auth/parent/login");
      return;
    }
    setAdminEmail(localStorage.getItem("userName") ?? "Admin");
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (healthRef.current && !healthRef.current.contains(e.target as Node)) setHealthOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE_URL}/health/detailed`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken") ?? "";
    const origin = localStorage.getItem("loginOrigin");
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch { /* ignore */ }
    localStorage.clear();
    router.push(origin === "child" ? "/auth/child/login" : "/auth/parent/login");
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
    exact ? pathname === href : pathname.startsWith(href) && href !== "/admin";

  const isDashboardActive = pathname === "/admin";

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
            const active = item.exact ? isDashboardActive : isActive(item.href, item.exact);
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

          {/* Admin badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(0,124,128,0.08)] text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-xs">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Super Admin
          </span>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-1">

            {/* System Health Indicator */}
            <div ref={healthRef} className="relative">
              <button
                onClick={() => { setProfileOpen(false); setHealthOpen((o) => !o); }}
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
                      {([
                        { key: "database" as const, label: "Database" },
                        { key: "storage" as const, label: "Storage" },
                      ]).map(({ key, label }) => {
                        const svc = healthData.services?.[key];
                        if (!svc) return null;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex rounded-full h-2.5 w-2.5 ${statusDotClass(svc.status)}`} />
                              <span className="font-['Poppins',sans-serif] text-sm text-gray-700">{label}</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-['Poppins',sans-serif] font-semibold ${
                                svc.status === "operational" ? "text-green-600" :
                                svc.status === "degraded" ? "text-yellow-600" : "text-red-600"
                              }`}>
                                {svc.status}
                              </span>
                              {svc.latencyMs != null && (
                                <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{svc.latencyMs}ms</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
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

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => { setHealthOpen(false); setProfileOpen((o) => !o); }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="hidden sm:block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm max-w-[140px] truncate">
                  {adminEmail}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 min-w-[200px] bg-white rounded-2xl shadow-xl border border-[#e0e7e7] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#f3f4f6]">
                    <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm truncate">{adminEmail}</p>
                    <p className="font-['Lato',sans-serif] text-bsi-teal-primary text-xs font-semibold">Super Admin</p>
                  </div>
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
