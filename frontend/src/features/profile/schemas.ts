import { z } from 'zod';
export const profileSchema = z.object({ name: z.string().trim().min(2, 'common:nameLength').max(100, 'common:nameLength').optional(), locale: z.enum(['fa', 'en']) }).strict();
export type ProfileInput = z.infer<typeof profileSchema>;
