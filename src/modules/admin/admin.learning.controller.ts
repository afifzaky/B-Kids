import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types';
import {
  createModuleSchema,
  updateModuleSchema,
  createArticleSchema,
  updateArticleSchema,
  upsertQuizSchema,
} from './admin.learning.validator';
import * as AdminLearningService from './admin.learning.service';

// =============================================
// MODULES
// =============================================

export async function listModules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const includeUnpublished = req.query.includeUnpublished !== 'false';
    const data = await AdminLearningService.listModules(includeUnpublished);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createModule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createModuleSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    const data = await AdminLearningService.createModule(parsed.data, req.user.sub);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateModule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateModuleSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    const data = await AdminLearningService.updateModule(req.params.moduleId, parsed.data, req.user.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteModule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await AdminLearningService.deleteModule(req.params.moduleId, req.user.sub);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// =============================================
// ARTICLES
// =============================================

export async function listArticles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { moduleId, isPublished } = req.query as { moduleId?: string; isPublished?: string };
    const data = await AdminLearningService.listArticles({
      moduleId,
      isPublished: isPublished === undefined ? undefined : isPublished === 'true',
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getArticleDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await AdminLearningService.getArticleDetail(req.params.articleId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createArticleSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    const data = await AdminLearningService.createArticle(parsed.data, req.user.sub);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateArticleSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    const data = await AdminLearningService.updateArticle(req.params.articleId, parsed.data, req.user.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await AdminLearningService.deleteArticle(req.params.articleId, req.user.sub);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// =============================================
// QUIZ
// =============================================

export async function upsertQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = upsertQuizSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    const data = await AdminLearningService.upsertQuiz(req.params.articleId, parsed.data, req.user.sub);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await AdminLearningService.deleteQuiz(req.params.articleId, req.user.sub);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

// =============================================
// STATS
// =============================================

export async function getLearningStats(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await AdminLearningService.getLearningStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
