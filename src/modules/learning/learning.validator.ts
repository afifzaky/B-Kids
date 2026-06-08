import { z } from 'zod';

export const submitQuizSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid('ID pertanyaan tidak valid'),
        optionIndex: z.number().int().min(0),
      }),
    )
    .min(1, 'Jawaban tidak boleh kosong'),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
