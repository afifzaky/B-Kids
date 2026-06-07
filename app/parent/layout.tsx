"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authFetch } from "../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const NAV_ITEMS = [
  {
    href: "/parent",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    href: "/parent/accounts",
    label: "Akun Anak",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
  },
  {
    href: "/parent/child-tasks",
    label: "Tugas Anak",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/parent/banking",
    label: "Rekening",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/parent/pending-actions",
    label: "Aksi Pending",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
];

interface ParentNotif {
  id: string;
  type: "pending_chore" | "transaction";
  title: string;
  subtitle: string;
  time: string;
  isCredit?: boolean;
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

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<ParentNotif[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "PARENT") {
      router.push("/auth/parent/login");
      return;
    }
    setUserName(localStorage.getItem("userName") ?? "Orang Tua");
    setAuthChecked(true);

    // Pre-fetch pending count for badge
    authFetch(`${API_BASE_URL}/api/chores`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const pending = (d.data ?? []).filter((c: { status: string }) => c.status === "PENDING_REVIEW");
          setPendingCount(pending.length);
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setNotifLoading(true);
    try {
      const [choresRes, bankingRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/chores`, { headers: { Authorization: `Bearer ${token}` } }),
        authFetch(`${API_BASE_URL}/api/parent/banking/account`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [choresData, bankingData] = await Promise.all([choresRes.json(), bankingRes.json()]);

      const items: ParentNotif[] = [];

      if (choresData.success) {
        const pending = (choresData.data ?? []).filter((c: { status: string }) => c.status === "PENDING_REVIEW");
        setPendingCount(pending.length);
        pending.forEach((c: { id: string; title: string; latestSubmission: { submittedAt: string } | null }) => {
          items.push({
            id: `chore-${c.id}`,
            type: "pending_chore",
            title: `Menunggu persetujuan`,
            subtitle: c.title,
            time: c.latestSubmission?.submittedAt ?? new Date().toISOString(),
          });
        });
      }

      if (bankingData.success) {
        (bankingData.data?.recentTransactions ?? []).forEach((tx: { id: string; type: string; source: string; notes: string | null; relatedChild: { fullName: string } | null; createdAt: string }) => {
          const label =
            tx.source === "DEPOSIT"
              ? "Top Up Saldo"
              : tx.source === "TRANSFER_TO_CHILD"
              ? `Transfer ke ${tx.relatedChild?.fullName ?? "Anak"}`
              : tx.notes ?? tx.source;
          items.push({
            id: `tx-${tx.id}`,
            type: "transaction",
            title: label,
            subtitle: tx.notes ?? "",
            time: tx.createdAt,
            isCredit: tx.type === "CREDIT",
          });
        });
      }

      // Sort newest first, cap at 5
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(items.slice(0, 5));
    } catch { /* ignore */ }
    finally { setNotifLoading(false); }
  };

  const handleNotifClick = () => {
    setProfileOpen(false);
    if (!notifOpen) fetchNotifications();
    setNotifOpen((o) => !o);
  };

  const handleProfileClick = () => {
    setNotifOpen(false);
    setProfileOpen((o) => !o);
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
    router.push("/auth/parent/login");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#f8fafa] flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const isExact = (href: string) =>
    href === "/parent" ? pathname === "/parent" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#f8fafa] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[#e0e7e7] z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e0e7e7]">
          <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary w-9 h-9 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <div>
            <span className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-lg leading-tight">
              B-Kids
            </span>
            <p className="font-['Lato',sans-serif] text-gray-400 text-[10px] leading-tight">
              Portal Orang Tua
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isExact(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-['Poppins',sans-serif] font-semibold text-sm transition-all ${
                  active
                    ? "bg-bsi-teal-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-[#f0f9f9] hover:text-bsi-teal-primary"
                }`}
              >
                {item.icon}
                {item.label}
                {item.href === "/parent/pending-actions" && pendingCount > 0 && (
                  <span className="ml-auto bg-bsi-orange-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-[#e0e7e7]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-['Poppins',sans-serif] font-semibold text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#e0e7e7] sticky top-0 z-10 h-14 flex items-center px-4 sm:px-6">
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
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-bsi-orange-primary rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1">
                    {pendingCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#e0e7e7] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#f3f4f6] flex items-center justify-between">
                    <h4 className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm">Notifikasi</h4>
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
                      <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#f3f4f6] max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-[#f9fafa] transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              n.type === "pending_chore"
                                ? "bg-amber-50"
                                : n.isCredit
                                ? "bg-green-50"
                                : "bg-red-50"
                            }`}>
                              {n.type === "pending_chore" ? (
                                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className={`w-4 h-4 ${n.isCredit ? "text-green-500" : "text-red-500"}`} fill="currentColor" viewBox="0 0 20 20">
                                  {n.isCredit ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                  ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                  )}
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-xs leading-tight">{n.title}</p>
                              {n.subtitle && (
                                <p className="font-['Lato',sans-serif] text-gray-500 text-xs truncate mt-0.5">{n.subtitle}</p>
                              )}
                              <p className="font-['Lato',sans-serif] text-gray-300 text-xs mt-0.5">{timeAgo(n.time)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-4 py-2.5 border-t border-[#f3f4f6] flex items-center justify-between">
                    <Link
                      href="/parent/pending-actions"
                      onClick={() => setNotifOpen(false)}
                      className="font-['Poppins',sans-serif] font-bold text-amber-600 text-xs hover:underline"
                    >
                      Lihat aksi pending →
                    </Link>
                    <Link
                      href="/parent/banking"
                      onClick={() => setNotifOpen(false)}
                      className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-xs hover:underline"
                    >
                      Riwayat →
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">
                  {userName}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-full min-w-[160px] bg-white rounded-2xl shadow-xl border border-[#e0e7e7] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#f3f4f6]">
                    <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm truncate">{userName}</p>
                    <p className="font-['Lato',sans-serif] text-gray-400 text-xs">Orang Tua</p>
                  </div>
                  <Link
                    href="/parent/profile"
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
