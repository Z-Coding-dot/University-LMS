import type { Announcement, CourseOffering, Enrollment, GradeComponent, GradeEntry, User } from '../api/types';
import { courseTotal } from './grading';

export function dashboardOfferingIds(user: User, offerings: CourseOffering[], enrollments: Enrollment[], semesterId: number | null): number[] {
  const enrolled = new Set(enrollments.filter(item => item.student_id === user.id).map(item => item.offering_id));
  return offerings.filter(offering => (semesterId === null || offering.semester_id === semesterId) &&
    (user.role === 'admin' || (user.role === 'teacher' ? offering.teacher_id === user.id : enrolled.has(offering.id))))
    .map(offering => offering.id);
}

export function publishedCourseTotal(components: GradeComponent[], entries: GradeEntry[], studentId: number): number | null {
  if (!components.length) return null;
  const scores = components.map(component => {
    const entry = entries.find(item => item.student_id === studentId && item.component_id === component.id && item.status !== 'draft');
    return entry ? { score: entry.score, max_score: component.max_score, weight: component.weight } : null;
  });
  return scores.every(score => score !== null) ? courseTotal(scores) : null;
}

export function visibleDashboardAnnouncements(user: User, announcements: Announcement[], offeringIds: number[]): Announcement[] {
  return announcements.filter(item => user.role === 'admin' || item.audience === 'all' ||
    (item.audience === 'role' && item.role === user.role) ||
    (item.audience === 'offering' && item.offering_id !== null && offeringIds.includes(item.offering_id)));
}
