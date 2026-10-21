import { z } from 'zod';
import { isoDay, localizedName, numeric, positiveId, requiredText } from '../../lib/validation';
import { ATTENDANCE_STATUSES } from '../../config/constants';
import { validLetterScale } from '../../lib/academic-rules';
const dates = { starts_at: isoDay, ends_at: isoDay };
const chronological = (row: { starts_at: string; ends_at: string }) => row.starts_at <= row.ends_at;
export const structureSchemas = {
  faculties: z.object({ name: localizedName }).strict(),
  departments: z.object({ name: localizedName, faculty_id: positiveId }).strict(),
  'academic-years': z.object({ name: requiredText.max(150), ...dates }).strict().refine(chronological, { path: ['ends_at'], message: 'admin:invalidDates' }),
  semesters: z.object({ name: localizedName, academic_year_id: positiveId, ...dates }).strict().refine(chronological, { path: ['ends_at'], message: 'admin:invalidDates' }),
  courses: z.object({ name: localizedName, department_id: positiveId, code: requiredText.max(30), credits: numeric(1, 30).refine(Number.isInteger) }).strict(),
};
export const offeringSchema = z.object({ course_id: positiveId, semester_id: positiveId, teacher_id: positiveId, capacity: numeric(1, 1000).refine(Number.isInteger) }).strict();
const time = requiredText.regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'admin:invalidTime');
export const scheduleSchema = z.object({ slots: z.array(z.object({ weekday: numeric(1, 7).refine(Number.isInteger), start: time, end: time, room: requiredText.max(100) }).strict().refine(row => row.start < row.end, { path: ['end'], message: 'admin:invalidTime' })).max(30) }).strict();
export const enrollmentSchema = z.object({ student_ids: z.array(positiveId).min(1).max(100).refine(ids => new Set(ids).size === ids.length), make_current: z.boolean() }).strict();
export const academicSettingsSchema = z.object({
  pass_mark: numeric(0, 100), attendance_warning_threshold: numeric(0, 100),
  letter_scale: z.array(z.object({ min: numeric(0, 100), max: numeric(0, 100), letter: requiredText.max(10) }).strict()).min(1).max(20).refine(validLetterScale, 'admin:invalidScale'),
  attendance_counted_statuses: z.array(z.enum(ATTENDANCE_STATUSES)).min(1).refine(values => new Set(values).size === values.length),
  weekend_days: z.array(numeric(1, 7).refine(Number.isInteger)).max(7).refine(values => new Set(values).size === values.length),
}).strict();
