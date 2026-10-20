import type { AttendanceStatus, GradeStatus, Role } from '../config/constants';

export interface ComponentScore { score: number; max_score: number; weight: number }
export interface LetterRange { min: number; max: number; letter: string }
export interface CourseResult { total: number; credits: number }
function finite(value: number) { if (!Number.isFinite(value)) throw new RangeError('Expected finite number'); }

export function courseTotal(components: ComponentScore[]): number {
  if (!components.length) return 0;
  components.forEach(({ score, max_score, weight }) => {
    [score, max_score, weight].forEach(finite);
    if (max_score <= 0 || score < 0 || score > max_score || weight < 0 || weight > 100) throw new RangeError('Invalid component');
  });
  if (Math.abs(components.reduce((sum, c) => sum + c.weight, 0) - 100) > 0.000001) throw new RangeError('Weights must sum to 100');
  return components.reduce((sum, c) => sum + c.score / c.max_score * c.weight, 0);
}

export function weightedAverage(courses: CourseResult[]): number | null {
  courses.forEach(({ total, credits }) => {
    [total, credits].forEach(finite);
    if (credits <= 0 || total < 0 || total > 100) throw new RangeError('Invalid course result');
  });
  const credits = courses.reduce((sum, course) => sum + course.credits, 0);
  return credits ? courses.reduce((sum, course) => sum + course.total * course.credits, 0) / credits : null;
}

export const semesterAverage = weightedAverage;
export const cumulativeAverage = (semesters: CourseResult[][]) => weightedAverage(semesters.flat());

export function letterGrade(total: number, scale: LetterRange[]): string | null {
  finite(total);
  return scale.find(range => total >= range.min && (total < range.max || (range.max === 100 && total === 100)))?.letter ?? null;
}

export function isPassing(total: number, passMark: number): boolean {
  [total, passMark].forEach(finite);
  if (total < 0 || total > 100 || passMark < 0 || passMark > 100) throw new RangeError('Invalid percentage');
  return total >= passMark;
}

export function attendancePercentage(records: AttendanceStatus[], counted: readonly AttendanceStatus[] = ['present', 'late', 'excused']): number | null {
  return records.length ? records.filter(status => counted.includes(status)).length / records.length * 100 : null;
}

export function canTransitionGrade(from: GradeStatus, to: GradeStatus, role: Role, permissions: string[]): boolean {
  if (role === 'student' || from === to) return false;
  if (from === 'locked') return role === 'admin' && to === 'published';
  if (from === 'draft' && to === 'published') return role === 'admin' || permissions.includes('grades.publish');
  return from === 'published' && to === 'locked' && (role === 'admin' || permissions.includes('grades.publish'));
}

export const studentVisibleGrades = <T extends { status: GradeStatus }>(grades: T[]): T[] => grades.filter(grade => grade.status !== 'draft');
