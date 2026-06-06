import Link from "next/link";

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-['Montserrat',sans-serif] font-bold text-white text-4xl sm:text-5xl lg:text-6xl mb-4">
            B-Kids
          </h1>
          <p className="font-['Lato',sans-serif] text-white/90 text-base sm:text-lg lg:text-xl px-4">
            Smart Financial Companion for Parents and Children
          </p>
          <p className="font-['Poppins',sans-serif] text-white/80 text-xs sm:text-sm mt-2">
            Bank Syariah Indonesia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Parent Login Card */}
          <Link href="/auth/parent/login">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1 cursor-pointer group">
              <div className="bg-bsi-teal-primary w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-['Montserrat',sans-serif] font-bold text-2xl text-bsi-teal-primary mb-3">
                Parent Login
              </h2>
              <p className="font-['Lato',sans-serif] text-gray-600 text-base">
                Monitor and manage your children's finances, set limits, and create reward challenges
              </p>
              <div className="mt-6 flex items-center text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold">
                Continue
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Child Login Card */}
          <Link href="/auth/child/login">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1 cursor-pointer group">
              <div className="bg-bsi-orange-primary w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-['Montserrat',sans-serif] font-bold text-2xl text-bsi-teal-primary mb-3">
                Child Login
              </h2>
              <p className="font-['Lato',sans-serif] text-gray-600 text-base">
                View your balance, manage pockets, complete challenges, and learn financial responsibility
              </p>
              <div className="mt-6 flex items-center text-bsi-orange-primary font-['Poppins',sans-serif] font-semibold">
                Continue
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12 text-white/80 text-sm font-['Lato',sans-serif]">
          <p>Helping children develop healthy financial habits through budgeting, saving, and goal setting</p>
        </div>
      </div>
    </div>
  );
}
