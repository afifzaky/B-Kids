"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const CATEGORIES = ["MENABUNG", "BELANJA_BIJAK", "INFAQ_SEDEKAH", "KEUANGAN_DASAR", "INVESTASI", "LAINNYA"] as const;
const DIFFICULTIES = ["MUDAH", "SEDANG", "SULIT"] as const;

type Category = typeof CATEGORIES[number];
type Difficulty = typeof DIFFICULTIES[number];

const CATEGORY_LABELS: Record<Category, string> = {
  MENABUNG: "Menabung", BELANJA_BIJAK: "Belanja Bijak", INFAQ_SEDEKAH: "Infaq & Sedekah",
  KEUANGAN_DASAR: "Keuangan Dasar", INVESTASI: "Investasi", LAINNYA: "Lainnya",
};
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  MUDAH: "Mudah", SEDANG: "Sedang", SULIT: "Sulit",
};
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  MUDAH: "bg-green-100 text-green-700", SEDANG: "bg-yellow-100 text-yellow-700", SULIT: "bg-red-100 text-red-700",
};

interface LearningModule {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  isPublished: boolean;
  order: number;
  articleCount: number;
  createdAt: string;
}

interface Article {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  readingTimeMin: number;
  xpReward: number;
  order: number;
  isPublished: boolean;
  hasQuiz: boolean;
  moduleId: string | null;
}

interface LearningStats {
  totalModules: number;
  publishedModules: number;
  totalArticles: number;
  publishedArticles: number;
  articlesWithQuiz: number;
  totalProgressRecords: number;
  totalXpAwarded: number;
}

const EMPTY_MODULE_FORM = {
  title: "", description: "", category: "MENABUNG" as Category, thumbnail: "", order: 0,
};
const EMPTY_ARTICLE_FORM = {
  title: "", content: "", imageUrl: "", category: "KEUANGAN_DASAR" as Category,
  difficulty: "MUDAH" as Difficulty, readingTimeMin: 5, xpReward: 10, order: 0, moduleId: "",
};

type Tab = "modules" | "articles";

export function AdminLearningPage() {
  const [tab, setTab] = useState<Tab>("modules");
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Module form
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE_FORM);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleSubmitting, setModuleSubmitting] = useState(false);
  const [moduleFormError, setModuleFormError] = useState<string | null>(null);

  // Article form
  const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE_FORM);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  const [articleFormError, setArticleFormError] = useState<string | null>(null);

  const [filterModuleId, setFilterModuleId] = useState<string>("all");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const authHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [statsRes, modulesRes, articlesRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/admin/learning/stats`, { headers: authHeaders() }),
        authFetch(`${API_BASE_URL}/api/admin/learning/modules`, { headers: authHeaders() }),
        authFetch(`${API_BASE_URL}/api/admin/learning/articles`, { headers: authHeaders() }),
      ]);
      const [statsJson, modulesJson, articlesJson] = await Promise.all([
        statsRes.json(), modulesRes.json(), articlesRes.json(),
      ]);
      if (statsJson.success) setStats(statsJson.data);
      if (modulesJson.success) setModules(modulesJson.data ?? []);
      if (articlesJson.success) setArticles(articlesJson.data ?? []);
      if (!modulesJson.success) setError(modulesJson.message ?? "Gagal memuat data");
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // --- MODULE ACTIONS ---
  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModuleSubmitting(true);
    setModuleFormError(null);
    try {
      const body = {
        title: moduleForm.title,
        description: moduleForm.description || undefined,
        category: moduleForm.category,
        thumbnail: moduleForm.thumbnail || undefined,
        order: Number(moduleForm.order),
      };
      const url = editingModuleId
        ? `${API_BASE_URL}/api/admin/learning/modules/${editingModuleId}`
        : `${API_BASE_URL}/api/admin/learning/modules`;
      const method = editingModuleId ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) {
        showSuccess(editingModuleId ? "Modul diperbarui" : "Modul dibuat");
        setShowModuleForm(false);
        setEditingModuleId(null);
        setModuleForm(EMPTY_MODULE_FORM);
        loadAll();
      } else {
        setModuleFormError(json.message ?? "Gagal menyimpan modul");
      }
    } catch {
      setModuleFormError("Gagal terhubung ke server");
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleToggleModulePublish = async (mod: LearningModule) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/learning/modules/${mod.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ isPublished: !mod.isPublished }),
      });
      const json = await res.json();
      if (json.success) {
        showSuccess(mod.isPublished ? "Modul disembunyikan" : "Modul dipublikasikan");
        setModules((prev) => prev.map((m) => m.id === mod.id ? { ...m, isPublished: !m.isPublished } : m));
      }
    } catch { /* ignore */ }
  };

  const handleDeleteModule = async (mod: LearningModule) => {
    if (!confirm(`Hapus modul "${mod.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/learning/modules/${mod.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        showSuccess("Modul dihapus");
        setModules((prev) => prev.filter((m) => m.id !== mod.id));
      } else {
        alert(json.message ?? "Gagal menghapus modul");
      }
    } catch { /* ignore */ }
  };

  const openEditModule = (mod: LearningModule) => {
    setModuleForm({
      title: mod.title,
      description: mod.description ?? "",
      category: mod.category as Category,
      thumbnail: mod.thumbnail ?? "",
      order: mod.order,
    });
    setEditingModuleId(mod.id);
    setShowModuleForm(true);
    setModuleFormError(null);
  };

  // --- ARTICLE ACTIONS ---
  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setArticleSubmitting(true);
    setArticleFormError(null);
    try {
      const body = {
        title: articleForm.title,
        content: articleForm.content,
        imageUrl: articleForm.imageUrl || undefined,
        category: articleForm.category,
        difficulty: articleForm.difficulty,
        readingTimeMin: Number(articleForm.readingTimeMin),
        xpReward: Number(articleForm.xpReward),
        order: Number(articleForm.order),
        moduleId: articleForm.moduleId || undefined,
      };
      const url = editingArticleId
        ? `${API_BASE_URL}/api/admin/learning/articles/${editingArticleId}`
        : `${API_BASE_URL}/api/admin/learning/articles`;
      const method = editingArticleId ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) {
        showSuccess(editingArticleId ? "Artikel diperbarui" : "Artikel dibuat");
        setShowArticleForm(false);
        setEditingArticleId(null);
        setArticleForm(EMPTY_ARTICLE_FORM);
        loadAll();
      } else {
        setArticleFormError(json.message ?? "Gagal menyimpan artikel");
      }
    } catch {
      setArticleFormError("Gagal terhubung ke server");
    } finally {
      setArticleSubmitting(false);
    }
  };

  const handleToggleArticlePublish = async (article: Article) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/learning/articles/${article.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });
      const json = await res.json();
      if (json.success) {
        showSuccess(article.isPublished ? "Artikel disembunyikan" : "Artikel dipublikasikan");
        setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, isPublished: !a.isPublished } : a));
      }
    } catch { /* ignore */ }
  };

  const handleDeleteArticle = async (article: Article) => {
    if (!confirm(`Hapus artikel "${article.title}"?`)) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/learning/articles/${article.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        showSuccess("Artikel dihapus");
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
      } else {
        alert(json.message ?? "Gagal menghapus artikel");
      }
    } catch { /* ignore */ }
  };

  const openEditArticle = (article: Article) => {
    setArticleForm({
      title: article.title,
      content: "",
      imageUrl: "",
      category: article.category as Category,
      difficulty: article.difficulty as Difficulty,
      readingTimeMin: article.readingTimeMin,
      xpReward: article.xpReward,
      order: article.order,
      moduleId: article.moduleId ?? "",
    });
    setEditingArticleId(article.id);
    setShowArticleForm(true);
    setArticleFormError(null);
  };

  const filteredArticles = filterModuleId === "all"
    ? articles
    : articles.filter((a) => a.moduleId === filterModuleId);

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

  return (
    <div className="p-4 sm:p-8 lg:p-10">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">📚</span>
            <h1 className="font-['Montserrat',sans-serif] font-bold text-bsi-teal-primary text-2xl sm:text-3xl">
              Manajemen E-Learning
            </h1>
          </div>
          <p className="font-['Lato',sans-serif] text-[rgba(0,0,0,0.6)] text-sm">
            Kelola modul dan artikel konten pembelajaran untuk anak
          </p>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-green-700 text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Total Modul", value: stats.totalModules, sub: `${stats.publishedModules} published` },
              { label: "Total Artikel", value: stats.totalArticles, sub: `${stats.publishedArticles} published` },
              { label: "Ada Kuis", value: stats.articlesWithQuiz, sub: "artikel" },
              { label: "Progress Records", value: stats.totalProgressRecords, sub: "entri" },
              { label: "Total XP Awarded", value: stats.totalXpAwarded, sub: "XP" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-[rgba(189,201,201,0.3)] p-4">
                <p className="font-['Montserrat',sans-serif] font-bold text-2xl text-bsi-teal-primary">{s.value}</p>
                <p className="font-['Poppins',sans-serif] font-semibold text-gray-700 text-xs mt-0.5">{s.label}</p>
                <p className="font-['Lato',sans-serif] text-gray-400 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["modules", "articles"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-['Poppins',sans-serif] font-bold text-sm transition-all ${
                tab === t ? "bg-bsi-teal-primary text-white shadow-sm" : "bg-white border border-[#e0e7e7] text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "modules" ? `📁 Modul (${modules.length})` : `📄 Artikel (${articles.length})`}
            </button>
          ))}
        </div>

        {/* ---- MODULES TAB ---- */}
        {tab === "modules" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl">Daftar Modul</h2>
              <button
                onClick={() => { setShowModuleForm((v) => !v); setEditingModuleId(null); setModuleForm(EMPTY_MODULE_FORM); setModuleFormError(null); }}
                className="flex items-center gap-2 bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Modul
              </button>
            </div>

            {/* Module Form */}
            {showModuleForm && (
              <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 mb-5">
                <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-base mb-4">
                  {editingModuleId ? "Edit Modul" : "Tambah Modul Baru"}
                </h3>
                <form onSubmit={handleModuleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Judul Modul *</label>
                    <input
                      required value={moduleForm.title}
                      onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary"
                      placeholder="Misal: Dasar-dasar Menabung"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Deskripsi</label>
                    <textarea
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary resize-none"
                      placeholder="Deskripsi modul..."
                    />
                  </div>
                  <div>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Kategori *</label>
                    <select
                      value={moduleForm.category}
                      onChange={(e) => setModuleForm((f) => ({ ...f, category: e.target.value as Category }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary bg-white"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Order</label>
                    <input
                      type="number" min={0} value={moduleForm.order}
                      onChange={(e) => setModuleForm((f) => ({ ...f, order: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">URL Thumbnail</label>
                    <input
                      type="url" value={moduleForm.thumbnail}
                      onChange={(e) => setModuleForm((f) => ({ ...f, thumbnail: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary"
                      placeholder="https://..."
                    />
                  </div>
                  {moduleFormError && (
                    <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{moduleFormError}</p>
                    </div>
                  )}
                  <div className="sm:col-span-2 flex gap-3">
                    <button type="button" onClick={() => setShowModuleForm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-[#e0e7e7] font-['Poppins',sans-serif] font-bold text-sm text-gray-600 hover:bg-gray-50">
                      Batal
                    </button>
                    <button type="submit" disabled={moduleSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm disabled:opacity-60">
                      {moduleSubmitting ? "Menyimpan..." : editingModuleId ? "Simpan Perubahan" : "Buat Modul"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Module List */}
            {modules.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📁</div>
                <p className="font-['Lato',sans-serif] text-gray-400">Belum ada modul. Buat modul pertama!</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm overflow-hidden">
                <div className="divide-y divide-[rgba(189,201,201,0.15)]">
                  {modules.map((mod) => (
                    <div key={mod.id} className="flex items-center justify-between px-5 sm:px-8 py-4 hover:bg-[#f9fafa] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#f0f9f9] flex items-center justify-center shrink-0 overflow-hidden">
                          {mod.thumbnail ? <img src={mod.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" /> : <span>📁</span>}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm truncate">{mod.title}</p>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-bold ${mod.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {mod.isPublished ? "Published" : "Draft"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="font-['Lato',sans-serif] text-gray-400 text-xs">{CATEGORY_LABELS[mod.category as Category] ?? mod.category}</span>
                            <span className="font-['Lato',sans-serif] text-gray-400 text-xs">{mod.articleCount} artikel</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button onClick={() => handleToggleModulePublish(mod)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-['Poppins',sans-serif] font-bold transition-colors ${mod.isPublished ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                          {mod.isPublished ? "Sembunyikan" : "Publish"}
                        </button>
                        <button onClick={() => openEditModule(mod)}
                          className="p-2 rounded-lg text-gray-400 hover:text-bsi-teal-primary hover:bg-[#f0f9f9] transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteModule(mod)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- ARTICLES TAB ---- */}
        {tab === "articles" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-xl">Daftar Artikel</h2>
                <select
                  value={filterModuleId}
                  onChange={(e) => setFilterModuleId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary bg-white"
                >
                  <option value="all">Semua Modul</option>
                  {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                  <option value="">Tanpa Modul</option>
                </select>
              </div>
              <button
                onClick={() => { setShowArticleForm((v) => !v); setEditingArticleId(null); setArticleForm(EMPTY_ARTICLE_FORM); setArticleFormError(null); }}
                className="flex items-center gap-2 bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Artikel
              </button>
            </div>

            {/* Article Form */}
            {showArticleForm && (
              <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm p-6 mb-5">
                <h3 className="font-['Montserrat',sans-serif] font-bold text-gray-800 text-base mb-4">
                  {editingArticleId ? "Edit Artikel" : "Tambah Artikel Baru"}
                </h3>
                <form onSubmit={handleArticleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Judul Artikel *</label>
                    <input
                      required value={articleForm.title}
                      onChange={(e) => setArticleForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary"
                      placeholder="Judul artikel..."
                    />
                  </div>

                  <div>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Modul</label>
                    <select
                      value={articleForm.moduleId}
                      onChange={(e) => setArticleForm((f) => ({ ...f, moduleId: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary bg-white"
                    >
                      <option value="">Tanpa Modul</option>
                      {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Kategori *</label>
                    <select
                      value={articleForm.category}
                      onChange={(e) => setArticleForm((f) => ({ ...f, category: e.target.value as Category }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary bg-white"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Tingkat Kesulitan *</label>
                    <select
                      value={articleForm.difficulty}
                      onChange={(e) => setArticleForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary bg-white"
                    >
                      {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Waktu Baca (menit)</label>
                    <input type="number" min={1} max={120} value={articleForm.readingTimeMin}
                      onChange={(e) => setArticleForm((f) => ({ ...f, readingTimeMin: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary" />
                  </div>

                  <div>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">XP Reward</label>
                    <input type="number" min={1} max={1000} value={articleForm.xpReward}
                      onChange={(e) => setArticleForm((f) => ({ ...f, xpReward: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary" />
                  </div>

                  <div>
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">Order</label>
                    <input type="number" min={0} value={articleForm.order}
                      onChange={(e) => setArticleForm((f) => ({ ...f, order: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">URL Gambar</label>
                    <input type="url" value={articleForm.imageUrl}
                      onChange={(e) => setArticleForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary"
                      placeholder="https://..." />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-['Poppins',sans-serif] font-semibold text-gray-700 text-sm mb-1.5">
                      Konten Artikel {!editingArticleId && <span className="text-red-500">*</span>}
                      {editingArticleId && <span className="text-gray-400 font-normal"> (kosongkan untuk tidak mengubah konten)</span>}
                    </label>
                    <textarea
                      required={!editingArticleId}
                      value={articleForm.content}
                      onChange={(e) => setArticleForm((f) => ({ ...f, content: e.target.value }))}
                      rows={8}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e0e7e7] text-sm font-['Poppins',sans-serif] focus:outline-none focus:border-bsi-teal-primary resize-y"
                      placeholder="Tulis konten artikel di sini (mendukung HTML dasar)..."
                    />
                  </div>

                  {articleFormError && (
                    <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="font-['Poppins',sans-serif] text-red-600 text-sm">{articleFormError}</p>
                    </div>
                  )}

                  <div className="sm:col-span-2 flex gap-3">
                    <button type="button" onClick={() => setShowArticleForm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-[#e0e7e7] font-['Poppins',sans-serif] font-bold text-sm text-gray-600 hover:bg-gray-50">
                      Batal
                    </button>
                    <button type="submit" disabled={articleSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-bsi-teal-primary hover:bg-bsi-teal-secondary text-white font-['Poppins',sans-serif] font-bold text-sm disabled:opacity-60">
                      {articleSubmitting ? "Menyimpan..." : editingArticleId ? "Simpan Perubahan" : "Buat Artikel"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Article List */}
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📄</div>
                <p className="font-['Lato',sans-serif] text-gray-400">Belum ada artikel. Buat artikel pertama!</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[rgba(189,201,201,0.3)] shadow-sm overflow-hidden">
                <div className="divide-y divide-[rgba(189,201,201,0.15)]">
                  {filteredArticles.map((article) => (
                    <div key={article.id} className="flex items-center justify-between px-5 sm:px-8 py-4 hover:bg-[#f9fafa] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <p className="font-['Poppins',sans-serif] font-bold text-gray-800 text-sm truncate">{article.title}</p>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-bold ${article.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {article.isPublished ? "Published" : "Draft"}
                            </span>
                            {article.hasQuiz && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-bold bg-blue-100 text-blue-700">
                                Kuis
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-['Poppins',sans-serif] font-bold ${DIFFICULTY_COLORS[article.difficulty as Difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                              {DIFFICULTY_LABELS[article.difficulty as Difficulty] ?? article.difficulty}
                            </span>
                            <span className="font-['Lato',sans-serif] text-gray-400 text-xs">{article.readingTimeMin} mnt</span>
                            <span className="font-['Poppins',sans-serif] text-bsi-teal-primary text-xs font-semibold">+{article.xpReward} XP</span>
                            {article.moduleId && (
                              <span className="font-['Lato',sans-serif] text-gray-400 text-xs truncate max-w-[120px]">
                                {modules.find((m) => m.id === article.moduleId)?.title ?? "Unknown modul"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button onClick={() => handleToggleArticlePublish(article)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-['Poppins',sans-serif] font-bold transition-colors ${article.isPublished ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                          {article.isPublished ? "Sembunyikan" : "Publish"}
                        </button>
                        <button onClick={() => openEditArticle(article)}
                          className="p-2 rounded-lg text-gray-400 hover:text-bsi-teal-primary hover:bg-[#f0f9f9] transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteArticle(article)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
