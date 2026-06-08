"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "../../../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ArticleDetail {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  category: string;
  difficulty: string;
  readingTimeMin: number;
  xpReward: number;
  module: { id: string; title: string };
  hasQuiz: boolean;
  quiz: { id: string; xpBonus: number; coinReward: number } | null;
  progress: { isRead: boolean; quizScore: number | null; quizPassed: boolean; xpEarned: number } | null;
}

interface QuizQuestion {
  id: string;
  question: string;
  order: number;
  options: { index: number; text: string }[];
}

interface QuizData {
  quizId: string;
  xpBonus: number;
  coinReward: number;
  passScore: number;
  questionCount: number;
  questions: QuizQuestion[];
}

interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  passScore: number;
  xpEarned: number;
  coinRewardRp: number;
  totalXp: number;
  level: number;
  message: string;
  answers: {
    questionId: string;
    question: string;
    explanation: string | null;
    submittedIndex: number | null;
    correctIndex: number;
    options: { index: number; text: string; isCorrect: boolean }[];
  }[];
}

const DIFFICULTY_LABELS: Record<string, string> = {
  MUDAH: "Mudah",
  SEDANG: "Sedang",
  SULIT: "Sulit",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  MUDAH: "bg-green-100 text-green-700",
  SEDANG: "bg-yellow-100 text-yellow-700",
  SULIT: "bg-red-100 text-red-700",
};

type PageState = "article" | "quiz" | "result";

export function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params?.articleId as string;

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeResult, setCompleteResult] = useState<{ message: string; xpEarned: number; alreadyCompleted: boolean } | null>(null);

  const [pageState, setPageState] = useState<PageState>("article");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const loadArticle = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/auth/child/login"); return; }
    setIsLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/learning/articles/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setArticle(json.data);
      else setError(json.message ?? "Gagal memuat artikel");
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (articleId) loadArticle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const handleComplete = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setCompleting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/learning/articles/${articleId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setCompleteResult(json.data);
        setArticle((prev) => prev ? { ...prev, progress: { isRead: true, quizScore: prev.progress?.quizScore ?? null, quizPassed: prev.progress?.quizPassed ?? false, xpEarned: (prev.progress?.xpEarned ?? 0) + (json.data?.xpEarned ?? 0) } } : prev);
      }
    } catch { /* ignore */ }
    finally { setCompleting(false); }
  };

  const loadQuiz = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setQuizLoading(true);
    setQuizError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/learning/articles/${articleId}/quiz`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setQuizData(json.data);
        setAnswers({});
        setPageState("quiz");
      } else {
        setQuizError(json.message ?? "Gagal memuat kuis");
      }
    } catch {
      setQuizError("Gagal terhubung ke server");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const answerList = quizData.questions.map((q) => ({
      questionId: q.id,
      optionIndex: answers[q.id] ?? 0,
    }));
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/learning/articles/${articleId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: answerList }),
      });
      const json = await res.json();
      if (json.success) {
        setQuizResult(json.data);
        setPageState("result");
        loadArticle();
      } else {
        setQuizError(json.message ?? "Gagal mengirim jawaban");
      }
    } catch {
      setQuizError("Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-xl mb-2">Artikel tidak ditemukan</h2>
        <p className="font-['Lato',sans-serif] text-gray-400 text-sm mb-4">{error}</p>
        <Link href="/child/learning" className="text-bsi-teal-primary font-['Poppins',sans-serif] font-bold text-sm hover:underline">
          ← Kembali ke E-Learning
        </Link>
      </div>
    );
  }

  if (!article) return null;

  // ---- QUIZ STATE ----
  if (pageState === "quiz" && quizData) {
    const allAnswered = quizData.questions.every((q) => answers[q.id] !== undefined);
    return (
      <div className="p-4 sm:p-8 lg:p-10">
        <div className="max-w-[800px] mx-auto">
          <button onClick={() => setPageState("article")} className="flex items-center gap-2 text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold text-sm mb-6 hover:underline">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Artikel
          </button>

          <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🧠</span>
              <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl sm:text-2xl">Kuis: {article.title}</h1>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="font-['Poppins',sans-serif] text-sm text-bsi-teal-primary font-semibold">+{quizData.xpBonus} XP jika lulus</span>
              {quizData.coinReward > 0 && (
                <span className="font-['Poppins',sans-serif] text-sm text-bsi-orange-primary font-semibold">+Rp {quizData.coinReward.toLocaleString("id-ID")} reward</span>
              )}
              <span className="font-['Lato',sans-serif] text-sm text-gray-400">Nilai lulus: {quizData.passScore}%</span>
            </div>

            <div className="space-y-6">
              {quizData.questions.map((q, qi) => (
                <div key={q.id} className="border border-[rgba(189,201,201,0.3)] rounded-2xl p-5">
                  <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm mb-4">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt.index}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.index }))}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                          answers[q.id] === opt.index
                            ? "border-bsi-teal-primary bg-[rgba(0,97,100,0.06)]"
                            : "border-[#e0e7e7] hover:border-bsi-teal-primary/40"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          answers[q.id] === opt.index ? "border-bsi-teal-primary bg-bsi-teal-primary" : "border-gray-300"
                        }`}>
                          {answers[q.id] === opt.index && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="font-['Poppins',sans-serif] text-gray-700 text-sm">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {quizError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
                <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{quizError}</p>
              </div>
            )}

            <button
              onClick={handleSubmitQuiz}
              disabled={!allAnswered || submitting}
              className="w-full mt-6 py-3.5 rounded-xl bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? "Mengirim..." : `Kirim Jawaban (${Object.keys(answers).length}/${quizData.questionCount} dijawab)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- RESULT STATE ----
  if (pageState === "result" && quizResult) {
    return (
      <div className="p-4 sm:p-8 lg:p-10">
        <div className="max-w-[800px] mx-auto">
          <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">{quizResult.passed ? "🎉" : "📖"}</div>
              <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-2xl sm:text-3xl mb-2">
                {quizResult.passed ? "Selamat, Kamu Lulus!" : "Hampir Berhasil!"}
              </h2>
              <p className="font-['Lato',sans-serif] text-gray-500 text-sm">{quizResult.message}</p>
            </div>

            {/* Score */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="text-center">
                <p className={`font-['Montserrat',sans-serif] font-bold text-4xl ${quizResult.passed ? "text-bsi-teal-primary" : "text-gray-600"}`}>
                  {quizResult.score}%
                </p>
                <p className="font-['Lato',sans-serif] text-gray-400 text-xs">Skor Kamu</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <p className="font-['Montserrat',sans-serif] font-bold text-4xl text-gray-400">{quizResult.passScore}%</p>
                <p className="font-['Lato',sans-serif] text-gray-400 text-xs">Nilai Lulus</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <p className="font-['Montserrat',sans-serif] font-bold text-4xl text-bsi-orange-primary">{quizResult.correctCount}/{quizResult.totalQuestions}</p>
                <p className="font-['Lato',sans-serif] text-gray-400 text-xs">Jawaban Benar</p>
              </div>
            </div>

            {quizResult.passed && (
              <div className="bg-[#f0f9f9] rounded-2xl p-4 mb-6 flex flex-wrap gap-4 justify-center">
                {quizResult.xpEarned > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <span className="font-['Poppins',sans-serif] font-bold text-bsi-teal-primary">+{quizResult.xpEarned} XP</span>
                  </div>
                )}
                {quizResult.coinRewardRp > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <span className="font-['Poppins',sans-serif] font-bold text-bsi-orange-primary">
                      +Rp {quizResult.coinRewardRp.toLocaleString("id-ID")} masuk tabungan
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <span className="font-['Poppins',sans-serif] font-bold text-gray-700">
                    Total {quizResult.totalXp} XP · Level {quizResult.level}
                  </span>
                </div>
              </div>
            )}

            {/* Answer Review */}
            <div className="space-y-4 mb-6">
              <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-700 text-lg">Pembahasan Jawaban</h3>
              {quizResult.answers.map((a, i) => (
                <div key={a.questionId} className="border border-[rgba(189,201,201,0.3)] rounded-2xl p-5">
                  <p className="font-['Poppins',sans-serif] font-semibold text-gray-800 text-sm mb-3">
                    {i + 1}. {a.question}
                  </p>
                  <div className="space-y-2">
                    {a.options.map((opt) => {
                      const isSubmitted = a.submittedIndex === opt.index;
                      const isCorrect = a.correctIndex === opt.index;
                      return (
                        <div
                          key={opt.index}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${
                            isCorrect
                              ? "border-green-300 bg-green-50"
                              : isSubmitted && !isCorrect
                              ? "border-red-300 bg-red-50"
                              : "border-[#e0e7e7]"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isCorrect ? "bg-green-500" : isSubmitted ? "bg-red-400" : "bg-gray-200"
                          }`}>
                            {isCorrect ? (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : isSubmitted ? (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            ) : null}
                          </div>
                          <span className={`font-['Poppins',sans-serif] text-sm ${
                            isCorrect ? "font-semibold text-green-700" : isSubmitted ? "text-red-600" : "text-gray-600"
                          }`}>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                  {a.explanation && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="font-['Lato',sans-serif] text-blue-700 text-sm"><strong>Penjelasan:</strong> {a.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/child/learning"
              className="block w-full text-center py-3.5 rounded-xl bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm transition-colors"
            >
              ← Kembali ke E-Learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- ARTICLE STATE ----
  return (
    <div className="p-4 sm:p-8 lg:p-10">
      <div className="max-w-[800px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/child/learning" className="text-bsi-teal-primary font-['Poppins',sans-serif] font-semibold hover:underline">
            E-Learning
          </Link>
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-['Lato',sans-serif] text-gray-400 truncate">{article.module.title}</span>
        </div>

        <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm overflow-hidden">
          {/* Cover image */}
          {article.imageUrl && (
            <div className="h-52 sm:h-64 overflow-hidden">
              <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-['Poppins',sans-serif] font-bold ${DIFFICULTY_COLORS[article.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                {DIFFICULTY_LABELS[article.difficulty] ?? article.difficulty}
              </span>
              <span className="font-['Lato',sans-serif] text-gray-400 text-xs">{article.readingTimeMin} menit baca</span>
              <span className="font-['Poppins',sans-serif] text-bsi-teal-primary text-xs font-semibold">+{article.xpReward} XP</span>
              {article.progress?.isRead && (
                <span className="px-3 py-1 rounded-full text-xs font-['Poppins',sans-serif] font-bold bg-[rgba(0,97,100,0.1)] text-bsi-teal-primary flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sudah dibaca
                </span>
              )}
            </div>

            <h1 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-2xl sm:text-3xl mb-6">
              {article.title}
            </h1>

            {/* Content */}
            <div
              className="font-['Lato',sans-serif] text-gray-700 text-base leading-relaxed space-y-4 mb-8 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Complete Banner */}
            {completeResult && !completeResult.alreadyCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <p className="font-['Poppins',sans-serif] text-green-700 text-sm font-semibold">{completeResult.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {!article.progress?.isRead && (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="w-full py-3.5 rounded-xl bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {completing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Tandai Selesai Dibaca (+{article.xpReward} XP)
                    </>
                  )}
                </button>
              )}

              {article.hasQuiz && article.progress?.isRead && article.progress.quizScore === null && (
                <button
                  onClick={loadQuiz}
                  disabled={quizLoading}
                  className="w-full py-3.5 rounded-xl bg-bsi-orange-primary hover:bg-bsi-orange-secondary text-white font-['Poppins',sans-serif] font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {quizLoading ? "Memuat Kuis..." : `🧠 Mulai Kuis (+${article.quiz?.xpBonus ?? 0} XP)`}
                </button>
              )}

              {article.hasQuiz && article.progress?.quizScore !== null && article.progress?.quizScore !== undefined && (
                <div className={`w-full py-3 rounded-xl text-center font-['Poppins',sans-serif] font-bold text-sm ${
                  article.progress.quizPassed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  {article.progress.quizPassed ? `✓ Kuis Lulus - Nilai ${article.progress.quizScore}%` : `✗ Kuis Gagal - Nilai ${article.progress.quizScore}% (tidak bisa diulang)`}
                </div>
              )}

              {quizError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{quizError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
