import { prisma } from '../../config/database';
import { AppError, NotFoundError, toRupiah } from '../../types';
import type { SubmitQuizInput } from './learning.validator';

// ---- Helpers ----

type QuizOption = { text: string; isCorrect: boolean };

function calculateLevel(totalXp: number): number {
  if (totalXp >= 1000) return 5;
  if (totalXp >= 500) return 4;
  if (totalXp >= 250) return 3;
  if (totalXp >= 100) return 2;
  return 1;
}

function stripCorrectAnswers(questions: { id: string; question: string; options: unknown; explanation: string | null; order: number }[]) {
  return questions.map(q => ({
    id: q.id,
    question: q.question,
    order: q.order,
    options: (q.options as QuizOption[]).map((o, i) => ({ index: i, text: o.text })),
  }));
}

function serializeArticleSummary(a: {
  id: string;
  title: string;
  imageUrl: string | null;
  category: string;
  difficulty: string;
  readingTimeMin: number;
  xpReward: number;
  order: number;
  quiz: { id: string; xpBonus: number; coinReward: bigint } | null;
  progresses: { readCompletedAt: Date | null; quizScore: number | null; quizPassedAt: Date | null; xpEarned: number }[];
}) {
  const progress = a.progresses[0] ?? null;
  return {
    id: a.id,
    title: a.title,
    imageUrl: a.imageUrl,
    category: a.category,
    difficulty: a.difficulty,
    readingTimeMin: a.readingTimeMin,
    xpReward: a.xpReward,
    order: a.order,
    hasQuiz: !!a.quiz,
    quiz: a.quiz ? { id: a.quiz.id, xpBonus: a.quiz.xpBonus, coinReward: toRupiah(a.quiz.coinReward) } : null,
    progress: progress
      ? {
          isRead: !!progress.readCompletedAt,
          quizScore: progress.quizScore,
          quizPassed: !!progress.quizPassedAt,
          xpEarned: progress.xpEarned,
        }
      : null,
  };
}

// =============================================
// GET /api/learning/modules
// =============================================

export async function listModules(childProfileId: string) {
  const modules = await prisma.learningModule.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' },
    include: {
      articles: {
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          category: true,
          difficulty: true,
          readingTimeMin: true,
          xpReward: true,
          order: true,
          quiz: { select: { id: true, xpBonus: true, coinReward: true } },
          progresses: {
            where: { childProfileId },
            select: { readCompletedAt: true, quizScore: true, quizPassedAt: true, xpEarned: true },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  return modules.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    thumbnail: m.thumbnail,
    articleCount: m.articles.length,
    articles: m.articles.map(serializeArticleSummary),
  }));
}

// =============================================
// GET /api/learning/articles
// =============================================

export async function listArticles(
  childProfileId: string,
  filters: { category?: string; moduleId?: string },
) {
  const articles = await prisma.learningArticle.findMany({
    where: {
      isPublished: true,
      ...(filters.category && { category: filters.category as never }),
      ...(filters.moduleId && { moduleId: filters.moduleId }),
    },
    orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
    include: {
      quiz: { select: { id: true, xpBonus: true, coinReward: true } },
      progresses: {
        where: { childProfileId },
        select: { readCompletedAt: true, quizScore: true, quizPassedAt: true, xpEarned: true },
      },
    },
  });

  return articles.map(serializeArticleSummary);
}

// =============================================
// GET /api/learning/articles/:articleId
// =============================================

export async function getArticle(articleId: string, childProfileId: string) {
  const article = await prisma.learningArticle.findUnique({
    where: { id: articleId },
    include: {
      module: { select: { id: true, title: true } },
      quiz: { select: { id: true, xpBonus: true, coinReward: true } },
      progresses: {
        where: { childProfileId },
        select: { readCompletedAt: true, quizScore: true, quizPassedAt: true, xpEarned: true },
      },
    },
  });

  if (!article || !article.isPublished) throw new NotFoundError('Artikel');

  const progress = article.progresses[0] ?? null;

  return {
    id: article.id,
    title: article.title,
    content: article.content,
    imageUrl: article.imageUrl,
    category: article.category,
    difficulty: article.difficulty,
    readingTimeMin: article.readingTimeMin,
    xpReward: article.xpReward,
    module: article.module,
    hasQuiz: !!article.quiz,
    quiz: article.quiz ? { id: article.quiz.id, xpBonus: article.quiz.xpBonus, coinReward: toRupiah(article.quiz.coinReward) } : null,
    progress: progress
      ? {
          isRead: !!progress.readCompletedAt,
          quizScore: progress.quizScore,
          quizPassed: !!progress.quizPassedAt,
          xpEarned: progress.xpEarned,
        }
      : null,
  };
}

// =============================================
// POST /api/learning/articles/:articleId/complete
// =============================================

export async function completeArticle(articleId: string, childProfileId: string) {
  const article = await prisma.learningArticle.findUnique({
    where: { id: articleId },
    select: { id: true, title: true, xpReward: true, isPublished: true },
  });
  if (!article || !article.isPublished) throw new NotFoundError('Artikel');

  const existing = await prisma.learningProgress.findUnique({
    where: { childProfileId_articleId: { childProfileId, articleId } },
  });

  if (existing?.readCompletedAt) {
    return { message: 'Artikel sudah pernah diselesaikan', xpEarned: 0, alreadyCompleted: true };
  }

  const xp = article.xpReward;

  await prisma.$transaction(async tx => {
    await tx.learningProgress.upsert({
      where: { childProfileId_articleId: { childProfileId, articleId } },
      create: { childProfileId, articleId, readCompletedAt: new Date(), xpEarned: xp },
      update: { readCompletedAt: new Date(), xpEarned: xp },
    });

    await tx.childXpBalance.upsert({
      where: { childProfileId },
      create: { childProfileId, totalXp: xp, level: calculateLevel(xp) },
      update: {
        totalXp: { increment: xp },
      },
    });
    // Recalculate level after increment
    const updated = await tx.childXpBalance.findUnique({ where: { childProfileId } });
    if (updated) {
      await tx.childXpBalance.update({
        where: { childProfileId },
        data: { level: calculateLevel(updated.totalXp) },
      });
    }
  });

  const xpBalance = await prisma.childXpBalance.findUnique({ where: { childProfileId } });

  return {
    message: `Selamat! Kamu mendapat ${xp} XP dari artikel "${article.title}"`,
    xpEarned: xp,
    totalXp: xpBalance?.totalXp ?? xp,
    level: xpBalance?.level ?? 1,
    alreadyCompleted: false,
  };
}

// =============================================
// GET /api/learning/articles/:articleId/quiz
// =============================================

export async function getQuiz(articleId: string, childProfileId: string) {
  const article = await prisma.learningArticle.findUnique({
    where: { id: articleId },
    select: { isPublished: true, quiz: { include: { questions: { orderBy: { order: 'asc' } } } } },
  });

  if (!article || !article.isPublished) throw new NotFoundError('Artikel');
  if (!article.quiz) throw new NotFoundError('Kuis');

  const progress = await prisma.learningProgress.findUnique({
    where: { childProfileId_articleId: { childProfileId, articleId } },
  });

  if (progress?.quizScore !== null && progress?.quizScore !== undefined) {
    throw new AppError('Kuis sudah pernah dikerjakan dan tidak bisa diulang', 422, 'QUIZ_ALREADY_TAKEN');
  }

  return {
    quizId: article.quiz.id,
    xpBonus: article.quiz.xpBonus,
    coinReward: toRupiah(article.quiz.coinReward),
    passScore: article.quiz.passScore,
    questionCount: article.quiz.questions.length,
    questions: stripCorrectAnswers(article.quiz.questions),
  };
}

// =============================================
// POST /api/learning/articles/:articleId/quiz/submit
// =============================================

export async function submitQuiz(
  articleId: string,
  childProfileId: string,
  input: SubmitQuizInput,
) {
  const article = await prisma.learningArticle.findUnique({
    where: { id: articleId },
    select: { isPublished: true, title: true, quiz: { include: { questions: { orderBy: { order: 'asc' } } } } },
  });

  if (!article || !article.isPublished) throw new NotFoundError('Artikel');
  if (!article.quiz) throw new NotFoundError('Kuis');

  // Ensure article is completed first
  const progress = await prisma.learningProgress.findUnique({
    where: { childProfileId_articleId: { childProfileId, articleId } },
  });

  if (!progress?.readCompletedAt) {
    throw new AppError('Selesaikan membaca artikel terlebih dahulu', 422, 'ARTICLE_NOT_READ');
  }

  if (progress.quizScore !== null && progress.quizScore !== undefined) {
    throw new AppError('Kuis sudah pernah dikerjakan dan tidak bisa diulang', 422, 'QUIZ_ALREADY_TAKEN');
  }

  const quiz = article.quiz;
  const questions = quiz.questions;

  // Validate all question IDs are present
  const questionIds = new Set(questions.map(q => q.id));
  for (const ans of input.answers) {
    if (!questionIds.has(ans.questionId)) {
      throw new AppError(`ID pertanyaan tidak valid: ${ans.questionId}`, 422, 'INVALID_QUESTION_ID');
    }
  }

  // Calculate score
  let correctCount = 0;
  for (const ans of input.answers) {
    const question = questions.find(q => q.id === ans.questionId)!;
    const options = question.options as QuizOption[];
    if (options[ans.optionIndex]?.isCorrect === true) {
      correctCount++;
    }
  }
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= quiz.passScore;

  let xpGained = 0;
  let coinRewarded = 0;

  if (passed) {
    xpGained = quiz.xpBonus;

    // Auto-credit reward dari saldo parent ke tabungan anak
    if (quiz.coinReward > 0n) {
      await creditLearningReward(childProfileId, quiz.coinReward, quiz.id, article.title);
      coinRewarded = toRupiah(quiz.coinReward);
    }

    await prisma.$transaction(async tx => {
      await tx.learningProgress.update({
        where: { childProfileId_articleId: { childProfileId, articleId } },
        data: {
          quizScore: score,
          quizPassedAt: new Date(),
          rewardPaidAt: quiz.coinReward > 0n ? new Date() : null,
          xpEarned: { increment: xpGained },
        },
      });

      await tx.childXpBalance.upsert({
        where: { childProfileId },
        create: { childProfileId, totalXp: xpGained, level: calculateLevel(xpGained) },
        update: { totalXp: { increment: xpGained } },
      });
      const updated = await tx.childXpBalance.findUnique({ where: { childProfileId } });
      if (updated) {
        await tx.childXpBalance.update({
          where: { childProfileId },
          data: { level: calculateLevel(updated.totalXp) },
        });
      }
    });
  } else {
    await prisma.learningProgress.update({
      where: { childProfileId_articleId: { childProfileId, articleId } },
      data: { quizScore: score },
    });
  }

  const xpBalance = await prisma.childXpBalance.findUnique({ where: { childProfileId } });

  return {
    score,
    correctCount,
    totalQuestions: questions.length,
    passed,
    passScore: quiz.passScore,
    xpEarned: xpGained,
    coinRewardRp: coinRewarded,
    totalXp: xpBalance?.totalXp ?? 0,
    level: xpBalance?.level ?? 1,
    message: passed
      ? `Keren! Kamu lulus dengan nilai ${score}%! +${xpGained} XP${coinRewarded > 0 ? ` & Rp ${coinRewarded.toLocaleString('id-ID')} masuk tabungan` : ''}`
      : `Skor kamu ${score}%. Minimal ${quiz.passScore}% untuk lulus. Coba baca lagi artikelnya!`,
    // Show correct answers after submission
    answers: questions.map(q => {
      const options = q.options as QuizOption[];
      const submitted = input.answers.find(a => a.questionId === q.id);
      return {
        questionId: q.id,
        question: q.question,
        explanation: q.explanation,
        submittedIndex: submitted?.optionIndex ?? null,
        correctIndex: options.findIndex(o => o.isCorrect),
        options: options.map((o, i) => ({ index: i, text: o.text, isCorrect: o.isCorrect })),
      };
    }),
  };
}

async function creditLearningReward(
  childProfileId: string,
  coinReward: bigint,
  quizId: string,
  articleTitle: string,
) {
  // Find parent via FamilyLink
  const link = await prisma.familyLink.findFirst({
    where: { childProfileId },
    include: { parentProfile: true },
  });
  if (!link) throw new AppError('Tidak ada orang tua terdaftar untuk akun ini', 422, 'NO_PARENT');

  const parent = link.parentProfile;
  if (parent.dummyBalance < coinReward) {
    // Reward tetap dicatat sebagai lulus, tapi saldo tidak ditransfer
    return;
  }

  const childAccount = await prisma.childAccount.findUnique({ where: { childProfileId } });
  if (!childAccount) return;

  const parentNewBalance = parent.dummyBalance - coinReward;
  const childNewBalance = childAccount.balance + coinReward;

  await prisma.$transaction(async tx => {
    await tx.parentProfile.update({
      where: { id: parent.id },
      data: { dummyBalance: parentNewBalance },
    });

    await tx.parentLedger.create({
      data: {
        parentProfileId: parent.id,
        type: 'DEBIT',
        source: 'LEARNING_REWARD',
        amount: coinReward,
        balanceAfter: parentNewBalance,
        relatedChildId: childProfileId,
        notes: `Reward kuis e-learning: "${articleTitle}"`,
      },
    });

    await tx.childAccount.update({
      where: { id: childAccount.id },
      data: { balance: childNewBalance },
    });

    await tx.accountLedger.create({
      data: {
        accountId: childAccount.id,
        type: 'CREDIT',
        source: 'LEARNING_REWARD',
        amount: coinReward,
        balanceAfter: childNewBalance,
        referenceId: quizId,
        triggeredBy: 'SYSTEM',
        notes: `Reward kuis e-learning: "${articleTitle}"`,
      },
    });
  });
}

// =============================================
// GET /api/learning/my-progress
// =============================================

export async function getMyProgress(childProfileId: string) {
  const [xpBalance, totalPublished, progresses] = await Promise.all([
    prisma.childXpBalance.findUnique({ where: { childProfileId } }),
    prisma.learningArticle.count({ where: { isPublished: true } }),
    prisma.learningProgress.findMany({
      where: { childProfileId },
      include: {
        article: { select: { id: true, title: true, category: true, xpReward: true, quiz: { select: { id: true } } } },
      },
    }),
  ]);

  const articlesRead = progresses.filter(p => p.readCompletedAt).length;
  const quizzesTaken = progresses.filter(p => p.quizScore !== null).length;
  const quizzesPassed = progresses.filter(p => p.quizPassedAt).length;
  const totalXpEarned = progresses.reduce((sum, p) => sum + p.xpEarned, 0);

  return {
    xp: {
      total: xpBalance?.totalXp ?? 0,
      level: xpBalance?.level ?? 1,
      nextLevelXp: getNextLevelXp(xpBalance?.level ?? 1),
    },
    completion: {
      articlesRead,
      totalArticles: totalPublished,
      percentage: totalPublished > 0 ? Math.round((articlesRead / totalPublished) * 100) : 0,
    },
    quizzes: {
      taken: quizzesTaken,
      passed: quizzesPassed,
      passRate: quizzesTaken > 0 ? Math.round((quizzesPassed / quizzesTaken) * 100) : 0,
    },
    totalXpEarned,
    recentActivity: progresses
      .filter(p => p.readCompletedAt)
      .sort((a, b) => (b.readCompletedAt?.getTime() ?? 0) - (a.readCompletedAt?.getTime() ?? 0))
      .slice(0, 5)
      .map(p => ({
        articleId: p.article.id,
        title: p.article.title,
        category: p.article.category,
        completedAt: p.readCompletedAt,
        quizScore: p.quizScore,
        xpEarned: p.xpEarned,
      })),
  };
}

function getNextLevelXp(level: number): number | null {
  const thresholds: Record<number, number> = { 1: 100, 2: 250, 3: 500, 4: 1000 };
  return thresholds[level] ?? null;
}
