import { describe, expect, it } from 'vitest';
import { attendancePercentage, canTransitionGrade, courseTotal, cumulativeAverage, isPassing, letterGrade, semesterAverage, studentVisibleGrades } from './grading';
describe('academic calculations (display previews)', () => {
  it('weights normalized component scores', () => expect(courseTotal([{ score: 15, max_score: 20, weight: 40 }, { score: 45, max_score: 60, weight: 60 }])).toBe(75));
  it('rejects incomplete weights, over-max scores and nonfinite values', () => {
    for (const component of [{ score: 5, max_score: 10, weight: 20 }, { score: 11, max_score: 10, weight: 100 }, { score: NaN, max_score: 10, weight: 100 }]) expect(() => courseTotal([component])).toThrow(RangeError);
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
  it('protects the grade lifecycle and excludes drafts', () => {
    expect(canTransitionGrade('draft', 'published', 'teacher', ['grades.publish'])).toBe(true);
    expect(canTransitionGrade('draft', 'published', 'teacher', [])).toBe(false);
    expect(canTransitionGrade('locked', 'published', 'teacher', ['grades.unlock'])).toBe(false);
    expect(canTransitionGrade('locked', 'published', 'admin', [])).toBe(true);
    expect(canTransitionGrade('draft', 'published', 'student', ['grades.publish'])).toBe(false);
    expect(studentVisibleGrades([{ status: 'draft' }, { status: 'locked' }])).toEqual([{ status: 'locked' }]);
  });
});
