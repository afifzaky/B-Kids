import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { checkRole } from '../../middleware/role';
import { asAuth } from '../../utils/as-auth';
import * as LearningController from './learning.controller';

const router = Router();

// Semua route learning: wajib token + role CHILD
router.use(verifyToken, checkRole('CHILD'));

// Modul
router.get('/modules', asAuth(LearningController.getModules));

// Artikel
router.get('/articles', asAuth(LearningController.getArticles));
router.get('/articles/:articleId', asAuth(LearningController.getArticle));

// Tandai artikel selesai dibaca → dapat XP
router.post('/articles/:articleId/complete', asAuth(LearningController.completeArticle));

// Kuis
router.get('/articles/:articleId/quiz', asAuth(LearningController.getQuiz));
router.post('/articles/:articleId/quiz/submit', asAuth(LearningController.submitQuiz));

// Progress & XP anak
router.get('/my-progress', asAuth(LearningController.getMyProgress));

export default router;
