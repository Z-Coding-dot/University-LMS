import { expect, it } from 'vitest';
import { can, PERMISSIONS, PERMISSION_PRESETS, TEACHER_PERMISSIONS } from './permissions';
it('gives admins implicit grants while keeping unlock admin-only', () => {
  expect(can({ role: 'admin', permissions: [] }, PERMISSIONS.unlockGrades)).toBe(true);
  expect(can({ role: 'admin', permissions: ['attendance.take'] }, PERMISSIONS.takeAttendance)).toBe(false);
  expect(can({ role: 'teacher', permissions: ['attendance.take'] }, PERMISSIONS.takeAttendance)).toBe(true);
  expect(can({ role: 'teacher', permissions: ['grades.unlock'] }, PERMISSIONS.unlockGrades)).toBe(false);
  expect(can(null, PERMISSIONS.enterGrades)).toBe(false);
  expect(can({ role: 'teacher', permissions: ['grades.enter'] }, PERMISSIONS.enterGrades)).toBe(true);
  expect(can({ role: 'student', permissions: ['grades.enter'] }, PERMISSIONS.enterGrades)).toBe(false);
});
it('keeps presets limited to teacher grants and permits immediate revocation', () => {
  for (const preset of Object.values(PERMISSION_PRESETS)) {
    expect(new Set(preset).size).toBe(preset.length);
    expect(preset.every(permission => TEACHER_PERMISSIONS.includes(permission))).toBe(true);
    expect(can({ role: 'teacher', permissions: [...preset] }, PERMISSIONS.unlockGrades)).toBe(false);
  }
  expect(can({ role: 'teacher', permissions: [...PERMISSION_PRESETS.teaching] }, PERMISSIONS.publishGrades)).toBe(false);
  expect(can({ role: 'teacher', permissions: [...PERMISSION_PRESETS.full] }, PERMISSIONS.publishGrades)).toBe(true);
  expect(can({ role: 'teacher', permissions: [...PERMISSION_PRESETS.none] }, PERMISSIONS.enterGrades)).toBe(false);
});
