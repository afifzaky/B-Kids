import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types';
import { submitQuizSchema } from './learning.validator';
import * as LearningService from './learning.service';

export async function getModules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await LearningService.listModules(req.user.profileId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getArticles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { category, moduleId } = req.query as { category?: string; moduleId?: string };
    const data = await LearningService.listArticles(req.user.profileId, { category, moduleId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await LearningService.getArticle(req.params.articleId, req.user.profileId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function completeArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await LearningService.completeArticle(req.params.articleId, req.user.profileId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await LearningService.getQuiz(req.params.articleId, req.user.profileId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function submitQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = submitQuizSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    const data = await LearningService.submitQuiz(req.params.articleId, req.user.profileId, parsed.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getMyProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await LearningService.getMyProgress(req.user.profileId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
