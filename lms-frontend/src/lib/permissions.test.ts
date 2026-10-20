import { expect, it } from 'vitest';
import { can, PERMISSIONS } from './permissions';
it('gives admins implicit grants while keeping unlock admin-only', () => {
  expect(can({ role: 'admin', permissions: [] }, PERMISSIONS.unlockGrades)).toBe(true);
  expect(can({ role: 'teacher', permissions: ['grades.unlock'] }, PERMISSIONS.unlockGrades)).toBe(false);
  expect(can(null, PERMISSIONS.enterGrades)).toBe(false);
  expect(can({ role: 'teacher', permissions: ['grades.enter'] }, PERMISSIONS.enterGrades)).toBe(true);
  expect(can({ role: 'student', permissions: ['grades.enter'] }, PERMISSIONS.enterGrades)).toBe(false);
});
