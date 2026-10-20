import { z } from 'zod';
import { normalizeDigits } from '../../lib/number';

export const studentIdentitySchema = z.object({
  name: z.string().trim().min(2, 'common:nameLength').max(100, 'common:nameLength'),
  email: z.string().trim().transform(value => normalizeDigits(value).toLowerCase()).pipe(z.string().email('common:invalidEmail').max(254, 'common:invalidEmail')),
}).strict();
export const createStudentSchema = studentIdentitySchema.extend({ locale: z.enum(['fa', 'en']) });
export type StudentIdentityInput = z.infer<typeof studentIdentitySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
