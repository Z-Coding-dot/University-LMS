import { describe, expect, it } from 'vitest';
import { assessmentKind, attendancePercentage, canTransitionGrade, courseTotal, cumulativeAverage, isPassing, letterGrade, semesterAverage, studentGradeBreakdown, studentGradeItems, studentVisibleGrades, validGradeComponentRevision } from './grading';
const combinedBook = {
  offeringId: 4, studentId: 5, status: 'published' as const, locale: 'en' as const,
  components: [{ id: 1, offering_id: 4, name: { fa: '', en: 'Midterm' }, max_score: 40, weight: 40 }],
  entries: [{ id: 1, student_id: 5, component_id: 1, score: 30, feedback: 'Exam feedback', status: 'published' as const, updated_at: '2026-10-21T00:00:00Z' }],
  assignments: [{ id: 1, offering_id: 4, week_number: 4, title: 'Exercise', description: '', due_at: '2026-10-25T12:00:00Z', submission_enabled: true, attachments: [] }],
  submissions: [{ id: 1, assignment_id: 1, student_id: 5, files: [], submitted_at: '2026-10-20T12:00:00Z', score: 0, feedback: 'Assignment feedback' }],
};
describe('academic calculations (display previews)', () => {
  it('combines components and assignments without losing colliding IDs or zero scores', () => {
    const rows = studentGradeItems(combinedBook);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ kind: 'component', source_id: 1, score: 30, max_score: 40, weight: 40 });
    expect(rows[1]).toMatchObject({ kind: 'assignment', source_id: 1, score: 0, max_score: 100, weight: null, status: 'graded' });
    expect(new Set(rows.map(row => `${row.kind}:${row.source_id}`)).size).toBe(2);
  });
  it('scopes combined grades to the course and student while hiding draft exam feedback', () => {
    const rows = studentGradeItems({ ...combinedBook, status: 'draft', assignments: [...combinedBook.assignments, { ...combinedBook.assignments[0], id: 2, offering_id: 99 }], submissions: combinedBook.submissions.map(row => ({ ...row, student_id: 6 })) });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ score: null, feedback: null, status: 'draft' });
    expect(rows[1]).toMatchObject({ score: null, feedback: null, status: 'not_submitted' });
  });
  it('maps assessment labels without assigning weights or treating custom components as finals', () => {
    expect(assessmentKind('Midterm')).toBe('midterm');
    expect(assessmentKind('End-term exam')).toBe('endterm');
    expect(assessmentKind('Final exam')).toBe('final');
    expect(assessmentKind('FX')).toBe('fx');
    expect(assessmentKind('Final project')).toBeNull();
  });
  it('keeps results scoped to the student and hides draft scores and feedback', () => {
    const component = { id: 1, offering_id: 4, name: { fa: '', en: 'Midterm' }, max_score: 40, weight: 40 };
    const entry = { id: 1, student_id: 5, component_id: 1, score: 0, feedback: 'Private feedback', status: 'published' as const, updated_at: '2026-10-21T00:00:00Z' };
    expect(studentGradeBreakdown([component], [entry], 5, 'published')[0].score).toBe(0);
    expect(studentGradeBreakdown([component], [entry], 5, 'draft')[0]).toMatchObject({ score: null, feedback: null });
    expect(studentGradeBreakdown([component], [{ ...entry, status: 'draft' }], 5, 'published')[0]).toMatchObject({ score: null, feedback: null });
    expect(studentGradeBreakdown([component], [entry], 6, 'published')[0]).toMatchObject({ score: null, feedback: null });
  });
  it('weights normalized component scores', () => expect(courseTotal([{ score: 15, max_score: 20, weight: 40 }, { score: 45, max_score: 60, weight: 60 }])).toBe(75));
  it('rejects incomplete weights, over-max scores and nonfinite values', () => {
    for (const component of [{ score: 5, max_score: 10, weight: 20 }, { score: 11, max_score: 10, weight: 100 }, { score: NaN, max_score: 10, weight: 100 }]) expect(() => courseTotal([component])).toThrow(RangeError);
  });
  it('rejects duplicate component IDs and maxima below retained scores', () => {
    const entries = [{ component_id: 1, score: 18 }];
    expect(validGradeComponentRevision([{ id: 1, max_score: 20 }], entries)).toBe(true);
    expect(validGradeComponentRevision([{ id: 1, max_score: 10 }], entries)).toBe(false);
    expect(validGradeComponentRevision([{ id: 1, max_score: 20 }, { id: 1, max_score: 20 }], entries)).toBe(false);
    expect(validGradeComponentRevision([{ max_score: 10 }], entries)).toBe(true);
  });
  it('weights cumulative results by credits rather than semester means', () => {
    expect(semesterAverage([{ total: 80, credits: 3 }, { total: 60, credits: 1 }])).toBe(75);
    expect(cumulativeAverage([[{ total: 80, credits: 3 }], [{ total: 40, credits: 1 }]])).toBe(70);
    expect(semesterAverage([])).toBeNull();
  });
  it('uses configurable pass marks and letter scales', () => {
    expect(isPassing(55, 55)).toBe(true);
    expect(letterGrade(90, [{ min: 90, max: 100, letter: 'A' }])).toBe('A');
    expect(letterGrade(89, [{ min: 90, max: 100, letter: 'A' }])).toBeNull();
    expect(letterGrade(89.9999999, [{ min: 80, max: 90, letter: 'B' }, { min: 90, max: 100, letter: 'A' }])).toBe('B');
    expect(letterGrade(100, [{ min: 90, max: 100, letter: 'A' }])).toBe('A');
  });
  it('counts attendance using selected statuses and handles no sessions', () => {
    expect(attendancePercentage(['present', 'late', 'excused', 'absent'])).toBe(75);
    expect(attendancePercentage(['present', 'late'], ['present'])).toBe(50);
    expect(attendancePercentage([])).toBeNull();
  });
  it('includes sessions without a record in the denominator', () => {
    expect(attendancePercentage(['present'], ['present'], 4)).toBe(25);
    expect(attendancePercentage([], ['present'], 2)).toBe(0);
    for (const total of [-1, 0, 1.5, NaN]) expect(() => attendancePercentage(['present'], ['present'], total)).toThrow(RangeError);
  });
  it('protects the grade lifecycle and excludes drafts', () => {
    expect(canTransitionGrade('draft', 'published', 'teacher', ['grades.publish'])).toBe(true);
    expect(canTransitionGrade('draft', 'published', 'teacher', [])).toBe(false);
    expect(canTransitionGrade('locked', 'published', 'teacher', ['grades.unlock'])).toBe(false);
    expect(canTransitionGrade('locked', 'published', 'admin', [])).toBe(true);
    expect(canTransitionGrade('draft', 'published', 'student', ['grades.publish'])).toBe(false);
    expect(studentVisibleGrades([{ status: 'draft' }, { status: 'locked' }])).toEqual([{ status: 'locked' }]);
  });
});
