import type { CourseOffering, User } from '../types';
import type { CourseView } from '../types/academic';
import type { GradeStatus } from '../../config/constants';
import { courses, enrollments, offerings, semesters, users } from './fixtures';
import { calendarDay } from '../../lib/date';
import { fail, type MockContext } from './http';
export const gradeStates = new Map<number, GradeStatus>(offerings.map(item => [item.id, item.id < 4 ? 'locked' : item.id < 6 ? 'published' : 'draft']));
export const currentSemesterId = () => semesters.find(item => item.starts_at <= calendarDay(new Date()) && item.ends_at >= calendarDay(new Date()))?.id ?? semesters.at(-1)?.id;
export function accessibleOfferings(user: User): CourseOffering[] {
  return offerings.filter(item => user.role === 'admin' || (user.role === 'teacher' ? item.teacher_id === user.id : enrollments.some(enrollment => enrollment.offering_id === item.id && enrollment.student_id === user.id)));
}
export function requireOffering(ctx: MockContext, id: number) {
  const offering = offerings.find(item => item.id === id);
  if (!offering) { fail(ctx, 404, 'common:notFoundTitle'); throw new Error('Unreachable'); }
  if (!accessibleOfferings(ctx.user).some(item => item.id === id)) fail(ctx);
  return offering;
}
export function courseView(item: CourseOffering): CourseView {
  const teacher = users.find(user => user.id === item.teacher_id)!;
  return { ...item, course: courses.find(course => course.id === item.course_id)!, semester: semesters.find(semester => semester.id === item.semester_id)!, teacher: { id: teacher.id, name: teacher.name }, student_count: enrollments.filter(row => row.offering_id === item.id).length, grade_status: gradeStates.get(item.id) ?? 'draft' };
}
export const seedText = (value: string, locale: 'fa' | 'en') => value.split(' / ')[locale === 'fa' ? 0 : 1] ?? value;
