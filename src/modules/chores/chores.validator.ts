import { z } from 'zod';

const CHORE_CATEGORIES = [
  'Akademik',
  "Hafalan Qur'an",
  'Pekerjaan Rumah',
  'Ibadah Rutin',
  'Lainnya',
] as const;

export const createChoreSchema = z.object({
  assignedToId: z.string().uuid('ID anak tidak valid'),
  title: z.string().min(3, 'Judul minimal 3 karakter').max(100),
  description: z.string().max(500).optional(),
  category: z.enum(CHORE_CATEGORIES, { errorMap: () => ({ message: 'Kategori tidak valid' }) }),
  rewardAmount: z.number().positive('Reward harus lebih dari 0'),
  deadline: z.string().datetime({ message: 'Format deadline tidak valid (ISO 8601)' }),
  // targetPocketId dihapus — reward SELALU masuk ke Tabungan Utama anak
});

export const updateChoreSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(CHORE_CATEGORIES).optional(),
  rewardAmount: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
});

export const submitChoreSchema = z.object({
  notes: z.string().max(500).optional(),
  mediaUrl: z.string().url('URL foto tidak valid').optional(),
});

export const rejectChoreSchema = z.object({
  rejectionNote: z.string().min(5, 'Alasan penolakan minimal 5 karakter').max(500),
});

export type CreateChoreInput = z.infer<typeof createChoreSchema>;
export type UpdateChoreInput = z.infer<typeof updateChoreSchema>;
export type SubmitChoreInput = z.infer<typeof submitChoreSchema>;
export type RejectChoreInput = z.infer<typeof rejectChoreSchema>;
