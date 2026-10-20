import { z } from 'zod';
import { isoDay, localizedName, numeric, positiveId, requiredText } from '../../lib/validation';
import { ATTENDANCE_STATUSES } from '../../config/constants';
export const attendanceSchema = z.object({ date: isoDay, records: z.array(z.object({ student_id: positiveId, status: z.enum(ATTENDANCE_STATUSES) })).min(1, 'common:required') });
export const gradeBatchSchema = z.object({ entries: z.array(z.object({ student_id: positiveId, component_id: positiveId, score: numeric(0), feedback: z.string().max(2000).nullable().optional() })).min(1, 'common:required') });
export const componentSchema = z.object({ components: z.array(z.object({ id: positiveId.optional(), name: localizedName, max_score: numeric(0.01), weight: numeric(0, 100) })).min(1).refine(items => Math.abs(items.reduce((sum, item) => sum + item.weight, 0) - 100) < 0.000001, 'academic:weightsTotal') });
export const assignmentSchema = z.object({ offering_id: positiveId, title: requiredText.max(200), description: requiredText.max(10000), due_date: isoDay, attachment_ids: z.array(positiveId).default([]) });
export const submissionGradeSchema = z.object({ score: numeric(0, 100), feedback: z.string().max(2000).default('') });
