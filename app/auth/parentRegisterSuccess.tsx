"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ParentRegisterSuccess() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("userName") ?? "");

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
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute bg-[rgba(255,255,255,0.05)] blur-3xl rounded-full size-96 -top-48 -right-48 pointer-events-none" />
      <div className="absolute bg-[rgba(237,139,0,0.1)] blur-3xl rounded-full size-80 -bottom-40 -left-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
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
            {userName && (
              <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-lg mb-3">
                Halo, {userName}!
              </p>
            )}
            <p className="font-['Lato',sans-serif] text-gray-600 text-base mb-6">
              Akun orang tua Anda telah berhasil dibuat. Sekarang Anda dapat login dan mulai mengelola keuangan anak.
            </p>

            {/* Auto-redirect message */}
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

            {/* Manual Login Button */}
            <Link
              href="/auth/parent/login"
              className="w-full inline-block bg-gradient-to-r from-bsi-teal-primary to-bsi-teal-secondary hover:from-bsi-teal-hover-dark hover:to-bsi-teal-hover-light text-white font-['Poppins',sans-serif] font-bold text-base py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all text-center"
            >
              Login Sekarang
            </Link>
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
