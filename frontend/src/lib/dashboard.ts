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

// One result per enrolled student and course; incomplete gradebooks are omitted.
export function gradeDistribution(offeringIds: number[], enrollments: Enrollment[], components: GradeComponent[], entries: GradeEntry[]) {
  const buckets = ['0–49', '50–59', '60–69', '70–79', '80–89', '90–100'].map(label => ({ label, students: 0 }));
  let completed = 0;
  for (const id of offeringIds) {
    const parts = components.filter(component => component.offering_id === id);
    if (!parts.length) continue;
    for (const studentId of new Set(enrollments.filter(row => row.offering_id === id).map(row => row.student_id))) {
      const scores = parts.map(component => {
        const entry = entries.find(row => row.component_id === component.id && row.student_id === studentId);
        return entry ? { score: entry.score, max_score: component.max_score, weight: component.weight } : null;
      });
      if (scores.some(score => score === null)) continue;
      const total = courseTotal(scores.filter(score => score !== null));
      const index = total < 50 ? 0 : Math.min(5, Math.floor(total / 10) - 4);
      buckets[index].students++;
      completed++;
    }
  }
  return completed ? buckets : [];
}

export function visibleDashboardAnnouncements(user: User, announcements: Announcement[], offeringIds: number[]): Announcement[] {
  return announcements.filter(item => user.role === 'admin' || item.audience === 'all' ||
    (item.audience === 'role' && item.role === user.role) ||
    (item.audience === 'offering' && item.offering_id !== null && offeringIds.includes(item.offering_id)));
}
