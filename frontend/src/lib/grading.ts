import type { AttendanceStatus, GradeStatus, Locale, Role } from '../config/constants';
import type { Assignment, GradeComponent, GradeEntry, Submission } from '../api/types';
import type { StudentGradeItem } from '../api/types/academic';

export function studentGradeItems({ offeringId, components, entries, assignments, submissions, studentId, status, locale }: {
  offeringId: number; components: GradeComponent[]; entries: GradeEntry[]; assignments: Assignment[];
  submissions: Submission[]; studentId: number; status: GradeStatus; locale: Locale;
}): StudentGradeItem[] {
  const assessments: StudentGradeItem[] = studentGradeBreakdown(components.filter(item => item.offering_id === offeringId), entries, studentId, status)
    .map(item => ({ kind: 'component', source_id: item.id, title: item.name[locale], week_number: null, score: item.score, max_score: item.max_score, weight: item.weight, feedback: item.feedback, status: item.score === null ? 'draft' : status }));
  const coursework: StudentGradeItem[] = assignments.filter(item => item.offering_id === offeringId).map(item => {
    const submission = submissions.find(row => row.assignment_id === item.id && row.student_id === studentId);
    return { kind: 'assignment', source_id: item.id, title: item.title, week_number: item.week_number, score: submission?.score ?? null, max_score: 100, weight: null, feedback: submission?.feedback ?? null,
      status: submission?.score != null ? 'graded' : submission ? 'submitted' : 'not_submitted' };
  });
  return [...assessments, ...coursework];
}

export function studentGradeBreakdown(components: GradeComponent[], entries: GradeEntry[], studentId: number, status: GradeStatus) {
  return components.map(component => {
    const entry = status === 'draft' ? undefined : entries.find(item => item.component_id === component.id && item.student_id === studentId && item.status !== 'draft');
    return { ...component, score: entry?.score ?? null, feedback: entry?.feedback ?? null };
  });
}

export const ASSESSMENT_KINDS = ['midterm', 'endterm', 'final', 'fx'] as const;
export type AssessmentKind = typeof ASSESSMENT_KINDS[number];
export function assessmentKind(name: string): AssessmentKind | null {
  const normalized = name.toLowerCase().replace(/[\s_-]+/g, '').replace(/exam$/, '');
  return ASSESSMENT_KINDS.find(kind => normalized === kind) ?? null;
}

export interface ComponentScore { score: number; max_score: number; weight: number }
export interface LetterRange { min: number; max: number; letter: string }
export interface CourseResult { total: number; credits: number }
export function validGradeComponentRevision(components: { id?: number; max_score: number }[], entries: { component_id: number; score: number }[]): boolean {
  const ids = components.flatMap(component => component.id === undefined ? [] : [component.id]);
  return new Set(ids).size === ids.length && components.every(component => entries
    .filter(entry => entry.component_id === component.id)
    .every(entry => Number.isFinite(entry.score) && entry.score >= 0 && entry.score <= component.max_score));
}
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

export function attendancePercentage(records: AttendanceStatus[], counted: readonly AttendanceStatus[] = ['present', 'late', 'excused'], totalSessions = records.length): number | null {
  if (!Number.isInteger(totalSessions) || totalSessions < records.length) throw new RangeError('Invalid session count');
  return totalSessions ? records.filter(status => counted.includes(status)).length / totalSessions * 100 : null;
}

export function canTransitionGrade(from: GradeStatus, to: GradeStatus, role: Role, permissions: string[]): boolean {
  if (role === 'student' || from === to) return false;
  if (from === 'locked') return role === 'admin' && to === 'published';
  if (from === 'draft' && to === 'published') return role === 'admin' || permissions.includes('grades.publish');
  return from === 'published' && to === 'locked' && (role === 'admin' || permissions.includes('grades.publish'));
}

export const studentVisibleGrades = <T extends { status: GradeStatus }>(grades: T[]): T[] => grades.filter(grade => grade.status !== 'draft');
