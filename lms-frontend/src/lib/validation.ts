import { z } from 'zod';
import { normalizeDigits } from './number';
import { parseISO } from './date';
z.setErrorMap(() => ({ message: 'common:validationError' }));
export const requiredText = z.string().trim().min(1, 'common:required');
export const numeric = (min = 0, max = Number.MAX_SAFE_INTEGER) => z.preprocess(value => typeof value === 'string' ? normalizeDigits(value.trim()) || undefined : value, z.coerce.number({ invalid_type_error: 'academic:invalidNumber' }).finite('academic:invalidNumber').min(min, 'academic:outOfRange').max(max, 'academic:outOfRange'));
export const positiveId = numeric(1).refine(Number.isInteger, 'academic:invalidNumber');
export const isoDay = requiredText.refine(value => { try { return value.length === 10 && !!parseISO(value); } catch { return false; } }, 'academic:invalidDate');
export const localizedName = z.object({ fa: requiredText.max(150), en: requiredText.max(150) });
