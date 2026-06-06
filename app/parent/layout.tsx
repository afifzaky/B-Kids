"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    href: "/parent/pending-actions",
    label: "Aksi Pending",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "PARENT") {
      router.push("/auth/parent/login");
      return;
    }
    setUserName(localStorage.getItem("userName") ?? "Orang Tua");
    setAuthChecked(true);
  }, [router]);

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
        } lg:translate-x-0 lg:static lg:z-auto`}
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
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="px-4 py-4 border-t border-[#e0e7e7]">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm truncate">
              {userName}
            </span>
          </div>
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
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#e0e7e7] sticky top-0 z-10 h-14 flex items-center px-4 sm:px-6 justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="font-['Lato',sans-serif] text-gray-400">Bank Syariah Indonesia</span>
            <span className="text-gray-300">•</span>
            <span className="font-['Poppins',sans-serif] font-semibold text-bsi-teal-primary">B-Kids</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center text-white text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm">
                {userName}
              </span>
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
