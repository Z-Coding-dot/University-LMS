import type { Assignment, Submission } from '../api/types';

export function submissionRestriction(assignment: Pick<Assignment, 'submission_enabled' | 'due_at'>, submission: Pick<Submission, 'score'> | null | undefined, now = Date.now()): string | null {
  if (!assignment.submission_enabled) return 'academic:submissionsDisabled';
  if (submission?.score !== null && submission?.score !== undefined) return 'academic:alreadyGraded';
  const deadline = new Date(assignment.due_at).getTime();
  if (!Number.isFinite(deadline) || deadline < now) return 'academic:deadlinePassed';
  return null;
}
