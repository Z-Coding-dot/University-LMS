import type { Assignment, Submission } from '../api/types';
import { COURSE_WEEKS } from '../config/constants';
import { calendarDay, parseISO } from './date';

export function currentTeachingWeek(startsAt: string, endsAt: string, now = new Date()): number | null {
  const today = calendarDay(now);
  const start = parseISO(startsAt).getTime(); const end = parseISO(endsAt).getTime();
  const day = parseISO(today).getTime();
  if (end < start) throw new RangeError('Invalid semester dates');
  if (day < start || day > end) return null;
  return Math.min(COURSE_WEEKS.length, Math.floor((day - start) / (7 * 86400000)) + 1);
}

export function submissionRestriction(assignment: Pick<Assignment, 'submission_enabled' | 'due_at'>, submission: Pick<Submission, 'score'> | null | undefined, now = Date.now()): string | null {
  if (!assignment.submission_enabled) return 'academic:submissionsDisabled';
  if (submission?.score !== null && submission?.score !== undefined) return 'academic:alreadyGraded';
  const deadline = new Date(assignment.due_at).getTime();
  if (!Number.isFinite(deadline) || deadline < now) return 'academic:deadlinePassed';
  return null;
}
