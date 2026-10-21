import { z } from 'zod';
import { requiredText, positiveId } from '../../lib/validation';
export const announcementSchema = z.object({ title: requiredText.max(200), body: requiredText.max(10000), audience: z.enum(['all', 'role', 'offering']), role: z.enum(['admin', 'teacher', 'student']).nullable().optional(), offering_id: positiveId.nullable().optional() }).refine(item => item.audience !== 'role' || !!item.role, { message: 'common:required', path: ['role'] }).refine(item => item.audience !== 'offering' || !!item.offering_id, { message: 'common:required', path: ['offering_id'] });
