import { expect, it } from 'vitest';
import { canChangeOwnPassword, canEditOwnIdentity, canManageStudentAccounts, requiresPasswordChange } from './account-policy';

it('keeps student identity and passwords under administrator control', () => {
  const student = { role: 'student' as const, must_change_password: true };
  expect(canEditOwnIdentity(student)).toBe(false);
  expect(canChangeOwnPassword(student)).toBe(false);
  expect(requiresPasswordChange(student)).toBe(false);
  expect(canManageStudentAccounts(student)).toBe(false);
});
it('preserves teacher self-service and reserves student management for admins', () => {
  expect(canEditOwnIdentity({ role: 'teacher' })).toBe(true);
  expect(requiresPasswordChange({ role: 'teacher', must_change_password: true })).toBe(true);
  expect(canManageStudentAccounts({ role: 'teacher' })).toBe(false);
  expect(canManageStudentAccounts({ role: 'admin' })).toBe(true);
  expect(canChangeOwnPassword(null)).toBe(false);
});
