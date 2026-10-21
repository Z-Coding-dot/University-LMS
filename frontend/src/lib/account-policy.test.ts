import { expect, it } from 'vitest';
import { canChangeOwnPassword, canEditOwnIdentity, canManageAccounts, canSubmitProfileUpdate, requiresPasswordChange } from './account-policy';

it('keeps student and teacher identity/passwords under administrator control, including legacy flags', () => {
  for (const role of ['student', 'teacher'] as const) {
    const account = { role, must_change_password: true };
    expect(canEditOwnIdentity(account)).toBe(false);
    expect(canChangeOwnPassword(account)).toBe(false);
    expect(requiresPasswordChange(account)).toBe(false);
    expect(canManageAccounts(account)).toBe(false);
  }
});
it('rejects managed credential fields even if submitted unchanged while allowing language updates', () => {
  for (const role of ['student', 'teacher'] as const) {
    expect(canSubmitProfileUpdate({ role }, { locale: 'en' })).toBe(true);
    for (const field of ['name', 'email', 'password', 'current_password', 'password_confirmation']) {
      expect(canSubmitProfileUpdate({ role }, { locale: 'en', [field]: '' })).toBe(false);
    }
  }
  expect(canSubmitProfileUpdate({ role: 'admin' }, { name: 'Admin', locale: 'fa' })).toBe(true);
  expect(canSubmitProfileUpdate(null, { locale: 'en' })).toBe(false);
});
it('reserves self-service and account management for administrators', () => {
  expect(canEditOwnIdentity({ role: 'admin' })).toBe(true);
  expect(requiresPasswordChange({ role: 'admin', must_change_password: true })).toBe(true);
  expect(canManageAccounts({ role: 'admin' })).toBe(true);
  expect(canChangeOwnPassword(null)).toBe(false);
  expect(canEditOwnIdentity(null)).toBe(false);
  expect(canManageAccounts(null)).toBe(false);
});
