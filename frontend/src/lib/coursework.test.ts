import { expect, it } from 'vitest';
import { submissionRestriction } from './coursework';
const assignment = { submission_enabled: true, due_at: '2026-10-25T12:00:00Z' };
const now = new Date('2026-10-21T12:00:00Z').getTime();
it('permits new and ungraded replacement submissions before the deadline', () => {
  expect(submissionRestriction(assignment, null, now)).toBeNull();
  expect(submissionRestriction(assignment, { score: null }, now)).toBeNull();
});
it('blocks disabled, expired, invalid and graded uploads including a zero score', () => {
  expect(submissionRestriction({ ...assignment, submission_enabled: false }, null, now)).toBe('academic:submissionsDisabled');
  expect(submissionRestriction(assignment, { score: 0 }, now)).toBe('academic:alreadyGraded');
  expect(submissionRestriction(assignment, null, now + 7 * 86400000)).toBe('academic:deadlinePassed');
  expect(submissionRestriction({ ...assignment, due_at: 'invalid' }, null, now)).toBe('academic:deadlinePassed');
});
