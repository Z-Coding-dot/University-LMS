import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { handleAdminAcademic } from '../api/mock/admin-academic';
import { handleAcademic } from '../api/mock/academic';
import { buildDashboard } from '../api/mock/dashboard';
import { attendanceSessions, courses, departments, offerings, users } from '../api/mock/fixtures';
import type { MockContext } from '../api/mock/http';
import { dashboardQuerySchema } from '../features/dashboard/schemas';
import { PERMISSIONS } from './permissions';

const admin = users.find(user => user.role === 'admin')!;
function context(path: string, method = 'GET', body?: unknown): MockContext {
  return { path, method, body, user: admin, locale: 'en', issuePassword: () => '', config: { headers: new AxiosHeaders(), params: {} } as InternalAxiosRequestConfig };
}
const query = dashboardQuerySchema.parse({});
const now = new Date('2026-10-24T08:00:00Z');

describe('administrator academic management', () => {
  it('keeps attendance entry teacher-only even when directly calling the API', () => {
    const offering = offerings[0];
    try {
      handleAcademic(context(`/courses/${offering.id}/attendance`, 'POST', { date: '2026-10-20', records: [] }));
      expect.fail('Administrator attendance entry must be rejected');
    } catch (error) {
      expect(error).toBeInstanceOf(AxiosError);
      expect((error as AxiosError).response?.status).toBe(403);
    }
  });

  it('offers attendance work to assigned teachers but only grade supervision to administrators', () => {
    const offering = offerings.find(row => row.semester_id === 2)!;
    const teacher = { ...users.find(user => user.id === offering.teacher_id)!, permissions: [PERMISSIONS.takeAttendance] };
    const session = { id: 99999, offering_id: offering.id, date: '2026-10-22' };
    attendanceSessions.push(session);
    try {
      expect(buildDashboard(teacher, query, 'en', now).work.some(row => row.kind === 'attendance')).toBe(true);
      const data = buildDashboard(admin, query, 'en', now);
      expect(data.work.some(row => row.kind === 'attendance')).toBe(false);
      expect(data.summary.metrics.some(row => row.key === 'attendance')).toBe(false);
      expect(buildDashboard(teacher, query, 'en', now).summary.grade_distribution).toEqual([]);
    } finally { attendanceSessions.splice(attendanceSessions.indexOf(session), 1); }
  });

  it('lists teacher activity only to administrators and filters assigned classes', () => {
    const activity = handleAdminAcademic(context('/admin/teacher-activity'))!;
    expect(activity.data.data.length).toBe(users.filter(row => row.role === 'teacher').length);
    const teacher = users.find(row => row.role === 'teacher')!;
    const ctx = context('/admin/offerings'); ctx.config.params = { teacher_id: teacher.id };
    const response = handleAdminAcademic(ctx)!;
    expect(response.data.data.length).toBeGreaterThan(0);
    expect(response.data.data.every((row: { teacher_id: number }) => row.teacher_id === teacher.id)).toBe(true);
    expect(() => handleAdminAcademic({ ...context('/admin/teacher-activity'), user: teacher })).toThrow(AxiosError);
  });

  it('deletes an unused subject and preserves subjects linked to classes', () => {
    const added = handleAdminAcademic(context('/admin/structure/courses', 'POST', { name: { en: 'Temporary subject', fa: 'Temporary subject' }, code: 'TEMP-DELETE', credits: 3, department_id: departments[0].id }))!;
    const id = added.data.data.id as number;
    try {
      expect(handleAdminAcademic(context(`/admin/structure/courses/${id}`, 'DELETE'))?.status).toBe(204);
      expect(courses.some(row => row.id === id)).toBe(false);
      const linked = offerings[0].course_id;
      expect(() => handleAdminAcademic(context(`/admin/structure/courses/${linked}`, 'DELETE'))).toThrow(AxiosError);
      expect(courses.some(row => row.id === linked)).toBe(true);
    } finally { const index = courses.findIndex(row => row.id === id); if (index >= 0) courses.splice(index, 1); }
  });

  it('deletes unused classes but preserves enrolled classes and their records', () => {
    const sample = offerings[0];
    const added = handleAdminAcademic(context('/admin/offerings', 'POST', { course_id: sample.course_id, semester_id: sample.semester_id, teacher_id: sample.teacher_id, capacity: 30 }))!;
    const id = added.data.data.id as number;
    try {
      expect(handleAdminAcademic(context(`/admin/offerings/${id}`, 'DELETE'))?.status).toBe(204);
      expect(offerings.some(row => row.id === id)).toBe(false);
      expect(() => handleAdminAcademic(context(`/admin/offerings/${sample.id}`, 'DELETE'))).toThrow(AxiosError);
      expect(offerings.some(row => row.id === sample.id)).toBe(true);
    } finally { const index = offerings.findIndex(row => row.id === id); if (index >= 0) offerings.splice(index, 1); }
  });
});
