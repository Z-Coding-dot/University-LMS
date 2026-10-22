import { expect, it } from 'vitest';
import { currentTeachingWeek, submissionRestriction } from './coursework';
const assignment = { submission_enabled: true, due_at: '2026-10-25T12:00:00Z' };
const now = new Date('2026-10-21T12:00:00Z').getTime();
it('selects the instructional week from the semester start in Kabul time', () => {
  expect(currentTeachingWeek('2026-09-01', '2027-01-15', new Date('2026-09-07T19:29:59Z'))).toBe(1);
  expect(currentTeachingWeek('2026-09-01', '2027-01-15', new Date('2026-09-07T19:30:00Z'))).toBe(2);
  expect(currentTeachingWeek('2026-09-01', '2027-01-15', new Date('2026-10-22T00:00:00Z'))).toBe(8);
});
it('keeps the week within sixteen and has no current week outside the semester', () => {
  expect(currentTeachingWeek('2026-09-01', '2027-01-15', new Date('2027-01-10T00:00:00Z'))).toBe(16);
  expect(currentTeachingWeek('2026-09-01', '2027-01-15', new Date('2026-08-31T00:00:00Z'))).toBeNull();
  expect(currentTeachingWeek('2026-09-01', '2027-01-15', new Date('2027-01-16T00:00:00Z'))).toBeNull();
  expect(() => currentTeachingWeek('2027-01-15', '2026-09-01')).toThrow(RangeError);
});
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
