import { prisma } from '../../config/database';
import { AppError, NotFoundError, toRupiah } from '../../types';
import type {
  CreateModuleInput,
  UpdateModuleInput,
  CreateArticleInput,
  UpdateArticleInput,
  UpsertQuizInput,
} from './admin.learning.validator';

// =============================================
// MODULE CRUD
// =============================================

export async function listModules(includeUnpublished = true) {
  const modules = await prisma.learningModule.findMany({
    where: includeUnpublished ? undefined : { isPublished: true },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { articles: true } },
    },
  });

  return modules.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    thumbnail: m.thumbnail,
    isPublished: m.isPublished,
    order: m.order,
    articleCount: m._count.articles,
    createdAt: m.createdAt,
  }));
}

export async function createModule(input: CreateModuleInput, adminUserId: string) {
  const module = await prisma.learningModule.create({
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      thumbnail: input.thumbnail,
      order: input.order,
      createdById: adminUserId,
    },
  });

  return module;
}

export async function updateModule(
  moduleId: string,
  input: UpdateModuleInput,
  adminUserId: string,
) {
  const existing = await prisma.learningModule.findUnique({ where: { id: moduleId } });
  if (!existing) throw new NotFoundError('Modul');

  const updated = await prisma.learningModule.update({
    where: { id: moduleId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.thumbnail !== undefined && { thumbnail: input.thumbnail }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_UPDATE_LEARNING_MODULE',
      entityType: 'LearningModule',
      entityId: moduleId,
      newValues: input,
    },
  });

  return updated;
}

export async function deleteModule(moduleId: string, adminUserId: string) {
  const existing = await prisma.learningModule.findUnique({
    where: { id: moduleId },
    include: { _count: { select: { articles: true } } },
  });
  if (!existing) throw new NotFoundError('Modul');

  if (existing._count.articles > 0) {
    throw new AppError(
      'Modul tidak bisa dihapus karena masih memiliki artikel. Hapus atau pindahkan artikel terlebih dahulu.',
      422,
      'MODULE_HAS_ARTICLES',
    );
  }

  await prisma.learningModule.delete({ where: { id: moduleId } });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_DELETE_LEARNING_MODULE',
      entityType: 'LearningModule',
      entityId: moduleId,
      oldValues: { title: existing.title },
    },
  });

  return { message: `Modul "${existing.title}" berhasil dihapus` };
}

// =============================================
// ARTICLE CRUD
// =============================================

export async function listArticles(filters: { moduleId?: string; isPublished?: boolean }) {
  const articles = await prisma.learningArticle.findMany({
    where: {
      ...(filters.moduleId !== undefined && { moduleId: filters.moduleId }),
      ...(filters.isPublished !== undefined && { isPublished: filters.isPublished }),
    },
    orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
    include: {
      module: { select: { id: true, title: true } },
      _count: { select: { progresses: true } },
      quiz: { select: { id: true, xpBonus: true, coinReward: true, passScore: true } },
    },
  });

  return articles.map(a => ({
    id: a.id,
    title: a.title,
    imageUrl: a.imageUrl,
    category: a.category,
    difficulty: a.difficulty,
    readingTimeMin: a.readingTimeMin,
    xpReward: a.xpReward,
    isPublished: a.isPublished,
    order: a.order,
    module: a.module,
    hasQuiz: !!a.quiz,
    quiz: a.quiz ? { ...a.quiz, coinReward: toRupiah(a.quiz.coinReward) } : null,
    completionCount: a._count.progresses,
    createdAt: a.createdAt,
  }));
}

export async function getArticleDetail(articleId: string) {
  const article = await prisma.learningArticle.findUnique({
    where: { id: articleId },
    include: {
      module: { select: { id: true, title: true } },
      quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
      _count: { select: { progresses: true } },
    },
  });

  if (!article) throw new NotFoundError('Artikel');

  return {
    ...article,
    quiz: article.quiz
      ? {
          ...article.quiz,
          coinReward: toRupiah(article.quiz.coinReward),
          questions: article.quiz.questions,
        }
      : null,
    completionCount: article._count.progresses,
  };
}

export async function createArticle(input: CreateArticleInput, adminUserId: string) {
  if (input.moduleId) {
    const module = await prisma.learningModule.findUnique({ where: { id: input.moduleId } });
    if (!module) throw new NotFoundError('Modul');
  }

  const article = await prisma.learningArticle.create({
    data: {
      moduleId: input.moduleId,
      title: input.title,
      content: input.content,
      imageUrl: input.imageUrl,
      category: input.category,
      difficulty: input.difficulty,
      readingTimeMin: input.readingTimeMin,
      xpReward: input.xpReward,
      order: input.order,
      createdById: adminUserId,
    },
  });

  return article;
}

export async function updateArticle(
  articleId: string,
  input: UpdateArticleInput,
  adminUserId: string,
) {
  const existing = await prisma.learningArticle.findUnique({ where: { id: articleId } });
  if (!existing) throw new NotFoundError('Artikel');

  if (input.moduleId) {
    const module = await prisma.learningModule.findUnique({ where: { id: input.moduleId } });
    if (!module) throw new NotFoundError('Modul');
  }

  const updated = await prisma.learningArticle.update({
    where: { id: articleId },
    data: {
      ...(input.moduleId !== undefined && { moduleId: input.moduleId }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
      ...(input.readingTimeMin !== undefined && { readingTimeMin: input.readingTimeMin }),
      ...(input.xpReward !== undefined && { xpReward: input.xpReward }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_UPDATE_LEARNING_ARTICLE',
      entityType: 'LearningArticle',
      entityId: articleId,
      newValues: input,
    },
  });

  return updated;
}

export async function deleteArticle(articleId: string, adminUserId: string) {
  const existing = await prisma.learningArticle.findUnique({ where: { id: articleId } });
  if (!existing) throw new NotFoundError('Artikel');

  // Cascade: quiz, quiz questions, and progresses are deleted automatically (onDelete: Cascade)
  await prisma.learningArticle.delete({ where: { id: articleId } });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_DELETE_LEARNING_ARTICLE',
      entityType: 'LearningArticle',
      entityId: articleId,
      oldValues: { title: existing.title },
    },
  });

  return { message: `Artikel "${existing.title}" berhasil dihapus` };
}

// =============================================
// QUIZ UPSERT
// =============================================

export async function upsertQuiz(
  articleId: string,
  input: UpsertQuizInput,
  adminUserId: string,
) {
  const article = await prisma.learningArticle.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError('Artikel');

  const coinRewardSen = BigInt(Math.round(input.coinReward * 100));

  const quiz = await prisma.quiz.upsert({
    where: { articleId },
    create: {
      articleId,
      xpBonus: input.xpBonus,
      coinReward: coinRewardSen,
      passScore: input.passScore,
    },
    update: {
      xpBonus: input.xpBonus,
      coinReward: coinRewardSen,
      passScore: input.passScore,
    },
  });

  // Replace all questions
  await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
  await prisma.quizQuestion.createMany({
    data: input.questions.map((q, i) => ({
      quizId: quiz.id,
      question: q.question,
      options: q.options,
      explanation: q.explanation ?? null,
      order: q.order ?? i,
    })),
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_UPSERT_QUIZ',
      entityType: 'Quiz',
      entityId: quiz.id,
      newValues: { articleId, questionCount: input.questions.length },
    },
  });

  return { quizId: quiz.id, message: 'Kuis berhasil disimpan' };
}

export async function deleteQuiz(articleId: string, adminUserId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { articleId } });
  if (!quiz) throw new NotFoundError('Kuis');

  await prisma.quiz.delete({ where: { articleId } });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'ADMIN_DELETE_QUIZ',
      entityType: 'Quiz',
      entityId: quiz.id,
    },
  });

  return { message: 'Kuis berhasil dihapus' };
}

// =============================================
// LEARNING STATS
// =============================================

export async function getLearningStats() {
  const [totalModules, publishedModules, totalArticles, publishedArticles, totalProgresses, totalXpGranted] =
    await Promise.all([
      prisma.learningModule.count(),
      prisma.learningModule.count({ where: { isPublished: true } }),
      prisma.learningArticle.count(),
      prisma.learningArticle.count({ where: { isPublished: true } }),
      prisma.learningProgress.count({ where: { readCompletedAt: { not: null } } }),
      prisma.learningProgress.aggregate({ _sum: { xpEarned: true } }),
    ]);

  return {
    modules: { total: totalModules, published: publishedModules },
    articles: { total: totalArticles, published: publishedArticles },
    engagement: {
      totalCompletions: totalProgresses,
      totalXpGranted: totalXpGranted._sum.xpEarned ?? 0,
    },
    generatedAt: new Date().toISOString(),
  };
}
