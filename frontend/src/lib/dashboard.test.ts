import { describe, expect, it } from 'vitest';
import type { Announcement, CourseOffering, GradeComponent, GradeEntry, User } from '../api/types';
import { dashboardOfferingIds, gradeDistribution, publishedCourseTotal, visibleDashboardAnnouncements } from './dashboard';

const user = (role: User['role']): User => ({ id: 5, name: 'Test', email: 'test@campus.test', role, permissions: [], locale: 'en', must_change_password: false, status: 'active', profile: { institutional_id: 'ST-001', department_id: 1, current_semester_id: 2 } });
const offerings: CourseOffering[] = [
  { id: 1, course_id: 1, semester_id: 1, teacher_id: 5, capacity: 30, schedule: [] },
  { id: 2, course_id: 2, semester_id: 2, teacher_id: 5, capacity: 30, schedule: [] },
  { id: 3, course_id: 3, semester_id: 2, teacher_id: 6, capacity: 30, schedule: [] },
];
describe('dashboard data visibility', () => {
  it('charts complete weighted student course totals, including drafts and zero scores', () => {
    const parts: GradeComponent[] = [
      { id: 1, offering_id: 2, name: { fa: '', en: '' }, max_score: 20, weight: 40 },
      { id: 2, offering_id: 2, name: { fa: '', en: '' }, max_score: 60, weight: 60 },
      { id: 3, offering_id: 3, name: { fa: '', en: '' }, max_score: 100, weight: 100 },
    ];
    const enrollments = [5, 6, 7, 8].map((student_id, index) => ({ id: index, student_id, offering_id: 2 }));
    const entries = [[5, 1, 10], [5, 2, 30], [6, 1, 0], [6, 2, 0], [7, 1, 20], [7, 2, 60], [8, 1, 20], [99, 1, 20], [99, 2, 60]].map(([student_id, component_id, score], id) => ({ id, student_id, component_id, score, feedback: null, status: 'draft' as const, updated_at: '' }));
    expect(gradeDistribution([2], enrollments, parts, entries).map(row => row.students)).toEqual([1, 1, 0, 0, 0, 1]);
    expect(gradeDistribution([3], enrollments, parts, entries)).toEqual([]);
    expect(gradeDistribution([2], enrollments, [], entries)).toEqual([]);
  });
  it('scopes offerings by enrollment, teacher assignment and semester', () => {
    const enrollments = [{ id: 1, student_id: 5, offering_id: 3 }];
    expect(dashboardOfferingIds(user('student'), offerings, enrollments, 2)).toEqual([3]);
    expect(dashboardOfferingIds(user('teacher'), offerings, enrollments, 2)).toEqual([2]);
    expect(dashboardOfferingIds(user('admin'), offerings, enrollments, 2)).toEqual([2, 3]);
    expect(dashboardOfferingIds(user('student'), offerings, [], 2)).toEqual([]);
  });
  it('does not turn draft or missing components into student totals', () => {
    const components: GradeComponent[] = [
      { id: 1, offering_id: 2, name: { fa: '', en: '' }, max_score: 40, weight: 40 },
      { id: 2, offering_id: 2, name: { fa: '', en: '' }, max_score: 60, weight: 60 },
    ];
    const entries: GradeEntry[] = [
      { id: 1, student_id: 5, component_id: 1, score: 30, feedback: null, status: 'published', updated_at: '2026-10-19T08:00:00Z' },
      { id: 2, student_id: 5, component_id: 2, score: 45, feedback: null, status: 'draft', updated_at: '2026-10-19T08:00:00Z' },
    ];
    expect(publishedCourseTotal(components, entries, 5)).toBeNull();
    expect(publishedCourseTotal(components, entries.map(entry => ({ ...entry, status: 'locked' })), 5)).toBe(75);
    expect(publishedCourseTotal(components, entries, 99)).toBeNull();
  });
  it('filters role and offering announcements before sending dashboard data', () => {
    const items: Announcement[] = ['all', 'role', 'offering'].map((audience, index) => ({ id: index, title: '', body: '', audience: audience as Announcement['audience'], role: 'teacher', offering_id: 3, week_number: null, author_id: 1, created_at: '2026-10-19T08:00:00Z' }));
    expect(visibleDashboardAnnouncements(user('student'), items, [3]).map(item => item.id)).toEqual([0, 2]);
    expect(visibleDashboardAnnouncements(user('student'), items, []).map(item => item.id)).toEqual([0]);
    expect(visibleDashboardAnnouncements(user('admin'), items, []).map(item => item.id)).toEqual([0, 1, 2]);
  });
});
