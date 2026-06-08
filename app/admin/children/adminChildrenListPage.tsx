"use client";

export function AdminChildrenListPage() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-2xl">Manajemen Anak</h1>
        <p className="font-['Lato',sans-serif] text-gray-500 text-sm mt-1">Kelola akun anak yang terdaftar</p>
      </div>

      {/* Pending backend notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-['Poppins',sans-serif] font-bold text-amber-800 text-sm mb-1">
            Menunggu Penambahan Endpoint Backend
          </p>
          <p className="font-['Lato',sans-serif] text-amber-700 text-sm leading-relaxed">
            Fitur daftar anak memerlukan endpoint{" "}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">GET /api/admin/children</code>{" "}
            yang belum tersedia di backend saat ini. Endpoint ini perlu ditambahkan ke{" "}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">admin.routes.ts</code>.
          </p>
          <p className="font-['Lato',sans-serif] text-amber-600 text-xs mt-2">
            Sementara itu, Anda dapat melihat daftar anak melalui halaman{" "}
            <span className="font-semibold">Detail Parent</span> di menu Manajemen Parent.
          </p>
        </div>
      </div>

      {/* Alternative hint */}
      <div className="bg-white rounded-2xl border border-[#e8eeed] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-bsi-teal-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h2 className="font-['Poppins',sans-serif] font-bold text-gray-700 text-sm">
            Cara alternatif melihat data anak
          </h2>
        </div>
        <ol className="list-decimal list-inside space-y-2">
          {[
            "Buka menu Manajemen Parent di sidebar kiri.",
            "Pilih salah satu parent dari daftar.",
            "Di halaman detail parent, daftar anak beserta status dan saldo akan ditampilkan.",
            "Klik tombol Detail pada anak untuk melihat informasi lengkap, transaksi, dan batas pengeluaran.",
          ].map((step, i) => (
            <li key={i} className="font-['Lato',sans-serif] text-gray-600 text-sm">
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
