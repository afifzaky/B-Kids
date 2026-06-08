"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ArticleSummary {
  id: string;
  title: string;
  imageUrl: string | null;
  category: string;
  difficulty: string;
  readingTimeMin: number;
  xpReward: number;
  order: number;
  hasQuiz: boolean;
  quiz: { id: string; xpBonus: number; coinReward: number } | null;
  progress: { isRead: boolean; quizScore: number | null; quizPassed: boolean; xpEarned: number } | null;
}

interface LearningModule {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  articleCount: number;
  articles: ArticleSummary[];
}

interface ProgressData {
  xp: { total: number; level: number; nextLevelXp: number | null };
  completion: { articlesRead: number; totalArticles: number; percentage: number };
  quizzes: { taken: number; passed: number; passRate: number };
  totalXpEarned: number;
  recentActivity: { articleId: string; title: string; category: string; completedAt: string; quizScore: number | null; xpEarned: number }[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  MUDAH: "bg-green-100 text-green-700",
  SEDANG: "bg-yellow-100 text-yellow-700",
  SULIT: "bg-red-100 text-red-700",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  MUDAH: "Mudah",
  SEDANG: "Sedang",
  SULIT: "Sulit",
};

export function LearningPage() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setIsLoading(true);
    Promise.all([
      authFetch(`${API_BASE_URL}/api/learning/modules`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      authFetch(`${API_BASE_URL}/api/learning/my-progress`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([modulesJson, progressJson]) => {
        if (modulesJson.success) {
          setModules(modulesJson.data ?? []);
          if ((modulesJson.data ?? []).length > 0) setExpandedModule(modulesJson.data[0].id);
        }
        if (progressJson.success) setProgress(progressJson.data);
        if (!modulesJson.success) setError(modulesJson.message ?? "Gagal memuat modul");
      })
      .catch(() => setError("Gagal terhubung ke server"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-8 h-8 text-bsi-teal-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const levelColors = ["", "bg-gray-100 text-gray-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-red-100 text-red-700"];

  return (
    <div className="p-4 sm:p-8 lg:p-10">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">📚</span>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
              E-Learning
            </h1>
          </div>
          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm sm:text-base">
            Belajar literasi keuangan dan raih XP untuk naik level
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Progress Overview */}
        {progress && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* XP / Level */}
            <div className="bg-gradient-to-br from-bsi-teal-primary to-bsi-teal-secondary rounded-2xl p-5 text-white col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Lato',sans-serif] text-white/80 text-xs uppercase tracking-wide">Level & XP</span>
                <span className={`text-xs font-['Poppins',sans-serif] font-bold px-2 py-0.5 rounded-full ${levelColors[progress.xp.level] ?? "bg-white/20 text-white"}`}>
                  Lv. {progress.xp.level}
                </span>
              </div>
              <p className="font-['Montserrat',sans-serif] font-bold text-2xl">{progress.xp.total} XP</p>
              {progress.xp.nextLevelXp && (
                <>
                  <div className="mt-2 h-1.5 rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${Math.min(100, (progress.xp.total / progress.xp.nextLevelXp) * 100)}%` }}
                    />
                  </div>
                  <p className="font-['Lato',sans-serif] text-white/70 text-xs mt-1">{progress.xp.nextLevelXp - progress.xp.total} XP lagi ke level berikutnya</p>
                </>
              )}
            </div>

            {/* Completion */}
            <div className="bg-white rounded-2xl border border-[rgba(189,201,201,0.3)] p-5">
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs uppercase tracking-wide mb-2">Artikel Dibaca</p>
              <p className="font-['Montserrat',sans-serif] font-bold text-2xl text-gray-800">
                {progress.completion.articlesRead}<span className="text-base font-normal text-gray-400">/{progress.completion.totalArticles}</span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-bsi-teal-primary"
                  style={{ width: `${progress.completion.percentage}%` }}
                />
              </div>
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">{progress.completion.percentage}% selesai</p>
            </div>

            {/* Quizzes */}
            <div className="bg-white rounded-2xl border border-[rgba(189,201,201,0.3)] p-5">
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs uppercase tracking-wide mb-2">Kuis Lulus</p>
              <p className="font-['Montserrat',sans-serif] font-bold text-2xl text-gray-800">
                {progress.quizzes.passed}<span className="text-base font-normal text-gray-400">/{progress.quizzes.taken}</span>
              </p>
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">
                {progress.quizzes.taken > 0 ? `${progress.quizzes.passRate}% pass rate` : "Belum ada kuis"}
              </p>
            </div>

            {/* Total XP Earned */}
            <div className="bg-white rounded-2xl border border-[rgba(189,201,201,0.3)] p-5">
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs uppercase tracking-wide mb-2">Total XP Diraih</p>
              <p className="font-['Montserrat',sans-serif] font-bold text-2xl text-bsi-orange-primary">
                {progress.totalXpEarned} <span className="text-base font-normal text-gray-400">XP</span>
              </p>
              <p className="font-['Lato',sans-serif] text-gray-400 text-xs mt-1">dari semua aktivitas</p>
            </div>
          </div>
        )}

        {/* Modules */}
        {modules.length === 0 && !error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">
              Belum ada modul
            </h3>
            <p className="font-['Lato',sans-serif] text-gray-400 text-sm">
              Modul e-learning akan segera tersedia
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((mod) => {
              const readCount = mod.articles.filter((a) => a.progress?.isRead).length;
              const isExpanded = expandedModule === mod.id;
              return (
                <div key={mod.id} className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm overflow-hidden">
                  {/* Module header */}
                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                    className="w-full flex items-center gap-4 px-5 sm:px-8 py-5 hover:bg-[#f9fafa] transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#f0f9f9] flex items-center justify-center shrink-0 overflow-hidden">
                      {mod.thumbnail ? (
                        <img src={mod.thumbnail} alt={mod.title} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span className="text-2xl">📚</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-base sm:text-lg">{mod.title}</p>
                      {mod.description && (
                        <p className="font-['Lato',sans-serif] text-gray-400 text-sm truncate">{mod.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary text-sm">{readCount}/{mod.articleCount}</p>
                        <p className="font-['Lato',sans-serif] text-gray-400 text-xs">artikel</p>
                      </div>
                      {mod.articleCount > 0 && (
                        <div className="w-10 h-10 rounded-full relative">
                          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#f0f9f9" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="15" fill="none"
                              stroke="#006164" strokeWidth="3"
                              strokeDasharray={`${Math.round((readCount / mod.articleCount) * 94)} 94`}
                            />
                          </svg>
                        </div>
                      )}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Articles list */}
                  {isExpanded && (
                    <div className="border-t border-[rgba(189,201,201,0.15)]">
                      {mod.articles.length === 0 ? (
                        <div className="px-8 py-6 text-center">
                          <p className="font-['Lato',sans-serif] text-gray-400 text-sm">Belum ada artikel di modul ini</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[rgba(189,201,201,0.1)]">
                          {mod.articles.map((article) => (
                            <Link
                              key={article.id}
                              href={`/child/learning/articles/${article.id}`}
                              className="flex items-center gap-4 px-5 sm:px-8 py-4 hover:bg-[#f9fafa] transition-colors"
                            >
                              {/* Read indicator */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                article.progress?.isRead
                                  ? "bg-bsi-teal-primary"
                                  : "bg-gray-100"
                              }`}>
                                {article.progress?.isRead ? (
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span className="font-['Montserrat',sans-serif] font-bold text-gray-400 text-xs">{article.order}</span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm">{article.title}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-bold ${DIFFICULTY_COLORS[article.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                                    {DIFFICULTY_LABELS[article.difficulty] ?? article.difficulty}
                                  </span>
                                  <span className="font-['Lato',sans-serif] text-gray-400 text-xs">
                                    {article.readingTimeMin} menit baca
                                  </span>
                                  <span className="font-['Lato',sans-serif] text-bsi-teal-primary text-xs font-semibold">
                                    +{article.xpReward} XP
                                  </span>
                                  {article.hasQuiz && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-bold ${
                                      article.progress?.quizPassed
                                        ? "bg-green-100 text-green-700"
                                        : article.progress?.quizScore != null
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}>
                                      {article.progress?.quizPassed
                                        ? `Kuis ✓ ${article.progress.quizScore}%`
                                        : article.progress?.quizScore != null
                                        ? `Kuis ✗ ${article.progress.quizScore}%`
                                        : "Ada Kuis"}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
