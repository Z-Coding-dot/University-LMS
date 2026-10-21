import { z } from 'zod';
import { normalizeDigits } from '../../lib/number';
import { TEACHER_PERMISSIONS } from '../../lib/permissions';
import { USER_STATUSES } from '../../config/constants';

export const accountIdentitySchema = z.object({
  name: z.string().trim().min(2, 'common:nameLength').max(100, 'common:nameLength'),
  email: z.string().trim().transform(value => normalizeDigits(value).toLowerCase()).pipe(z.string().email('common:invalidEmail').max(254, 'common:invalidEmail')),
}).strict();
export const createAccountSchema = accountIdentitySchema.extend({ locale: z.enum(['fa', 'en']) });
export const accountStatusSchema = z.object({ status: z.enum(USER_STATUSES) }).strict();
export const teacherPermissionsSchema = z.object({ permissions: z.array(z.enum(TEACHER_PERMISSIONS)).max(TEACHER_PERMISSIONS.length).refine(values => new Set(values).size === values.length, 'common:validationError') }).strict();
export type AccountIdentityInput = z.infer<typeof accountIdentitySchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
