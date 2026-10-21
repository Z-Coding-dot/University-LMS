import { z } from 'zod';
import { normalizeDigits } from '../../lib/number';
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'common:required').transform(normalizeDigits).pipe(z.string().email('common:invalidEmail')),
  // Never normalize passwords: those characters are part of the user's secret.
  password: z.string().min(1, 'common:required').max(128, 'common:passwordLength'),
});
export const passwordSchema = z.object({
  current_password: z.string().min(1, 'common:required'),
  password: z.string().min(8, 'common:passwordLength').max(128, 'common:passwordLength'),
  password_confirmation: z.string().min(1, 'common:required'),
}).refine(input => input.password === input.password_confirmation, { message: 'common:passwordMismatch', path: ['password_confirmation'] })
  .refine(input => input.password !== input.current_password, { message: 'common:passwordDifferent', path: ['password'] });
