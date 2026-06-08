import { z } from 'zod';

const CATEGORIES = ['MENABUNG', 'BELANJA_BIJAK', 'INFAQ_SEDEKAH', 'KEUANGAN_DASAR', 'INVESTASI', 'LAINNYA'] as const;
const DIFFICULTIES = ['MUDAH', 'SEDANG', 'SULIT'] as const;

export const createModuleSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(CATEGORIES),
  thumbnail: z.string().url('URL thumbnail tidak valid').optional(),
  order: z.number().int().min(0).default(0),
});

export const updateModuleSchema = createModuleSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

const quizOptionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const quizQuestionSchema = z.object({
  question: z.string().min(5),
  options: z
    .array(quizOptionSchema)
    .min(2, 'Minimal 2 pilihan jawaban')
    .max(5, 'Maksimal 5 pilihan jawaban')
    .refine(opts => opts.filter(o => o.isCorrect).length === 1, 'Harus ada tepat 1 jawaban benar'),
  explanation: z.string().max(500).optional(),
  order: z.number().int().min(0).default(0),
});

export const upsertQuizSchema = z.object({
  xpBonus: z.number().int().min(0).default(20),
  coinReward: z.number().min(0).default(0),
  passScore: z.number().int().min(1).max(100).default(70),
  questions: z
    .array(quizQuestionSchema)
    .min(1, 'Minimal 1 pertanyaan')
    .max(10, 'Maksimal 10 pertanyaan'),
});

export const createArticleSchema = z.object({
  moduleId: z.string().uuid('ID modul tidak valid').optional(),
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  imageUrl: z.string().url('URL gambar tidak valid').optional(),
  category: z.enum(CATEGORIES),
  difficulty: z.enum(DIFFICULTIES),
  readingTimeMin: z.number().int().min(1).max(120).default(5),
  xpReward: z.number().int().min(1).max(1000).default(10),
  order: z.number().int().min(0).default(0),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type UpsertQuizInput = z.infer<typeof upsertQuizSchema>;
