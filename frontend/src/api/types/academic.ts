import type { AcademicSettings, AcademicYear, Announcement, Assignment, AttendanceRecord, AttendanceSession, Course, CourseOffering, Department, Faculty, GradeComponent, GradeEntry, Semester, Submission, User } from './index';
import type { AttendanceStatus, GradeStatus } from '../../config/constants';
export interface CourseView extends CourseOffering { course: Course; semester: Semester; teacher: Pick<User, 'id' | 'name'>; student_count: number; grade_status: GradeStatus }
export interface CourseDetail extends CourseView { components: GradeComponent[]; grades: GradeEntry[]; attendance_sessions: AttendanceSession[]; attendance_records: AttendanceRecord[]; attendance_percent: number | null; settings: AcademicSettings }
export interface CourseWeekSummary { week_number: number; lecture_count: number; assignment_count: number; announcement_count: number }
export interface CourseWeeksResponse { current_week: number | null; course_announcement_count: number; weeks: CourseWeekSummary[] }
export interface GradeBook { components: GradeComponent[]; entries: GradeEntry[]; status: GradeStatus }
export interface AttendanceBook { students: User[]; sessions: AttendanceSession[]; records: AttendanceRecord[] }
export interface AttendanceHistoryRow { id: number; date: string; status: AttendanceStatus | null }
export interface AssignmentView extends Assignment { course_name: Course['name']; submission: Submission | null; submission_count: number }
export interface SubmissionView extends Submission { student_name: string }
export interface ResultAssessment extends GradeComponent { score: number | null; feedback: string | null }
export interface StudentGradeItem {
  kind: 'component' | 'assignment'; source_id: number; title: string; week_number: number | null;
  score: number | null; max_score: number; weight: number | null; feedback: string | null;
  status: 'draft' | 'published' | 'locked' | 'not_submitted' | 'submitted' | 'graded';
}
export interface ResultAssignment { id: number; title: string; week_number: number; submitted: boolean; score: number | null; feedback: string | null }
export interface ResultCourse { id: number; code: string; name: Course['name']; credits: number; total: number | null; letter: string | null; status: GradeStatus; assessments: ResultAssessment[]; assignments: ResultAssignment[] }
export interface SemesterResult { semester: Semester; courses: ResultCourse[]; average: number | null }
export interface ResultsResponse { semesters: SemesterResult[]; cumulative_average: number | null }
export interface AcademicCatalog { faculties: Faculty[]; departments: Department[]; academic_years: AcademicYear[]; semesters: Semester[]; courses: Course[]; teachers: User[]; students: User[]; offerings: CourseView[] }
export interface TeacherActivity { id: number; name: string; courses: number; students: number; assignments: number; materials: number; graded: number; last_activity: string | null }
export interface AnnouncementView extends Announcement { author_name: string }
export type StructureResource = 'faculties' | 'departments' | 'academic-years' | 'semesters' | 'courses';
export interface StructureRow { id: number; name: string | Course['name']; faculty_id?: number; academic_year_id?: number; department_id?: number; code?: string; credits?: number; starts_at?: string; ends_at?: string }
