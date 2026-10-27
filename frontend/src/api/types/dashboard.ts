import type { Announcement, Attachment, LocalizedName, Semester } from './index';
import type { GradeStatus, Role } from '../../config/constants';

export type DashboardMetricKey = 'average' | 'attendance' | 'courses' | 'students' | 'teachers' | 'reviews';
export interface DashboardMetric { key: DashboardMetricKey; value: number | null; percent?: boolean }
export interface DashboardCourse {
  id: number; code: string; name: LocalizedName; credits: number; teacher: string;
  attendance_percent: number | null; sessions: number; students: number;
}
export type TaskStatus = 'pending' | 'submitted' | 'graded' | 'overdue' | 'review' | 'complete';
export interface DashboardTask {
  id: number; offering_id: number; title: string; description: string; course: LocalizedName;
  due_at: string; submission_rate: number; status: TaskStatus;
  score: number | null; feedback: string | null;
}
export interface DashboardFile extends Attachment { offering_id: number; course: LocalizedName; uploaded_at: string }
export interface DashboardGrade {
  id: number; offering_id: number; student_name: string; course: LocalizedName; component: LocalizedName;
  score: number; max_score: number; feedback: string | null; status: GradeStatus; updated_at: string;
}
export interface DashboardClass {
  id: number; offering_id: number; course: LocalizedName; start: string; end: string; room: string; teacher: string;
}
export interface DashboardAnnouncement extends Announcement { author_name: string }
export interface DashboardWork {
  kind: 'attendance' | 'grades'; offering_id: number; course: LocalizedName;
  date: string | null; pending: number;
}
export interface DashboardSubmission {
  id: number; assignment_id: number; title: string; course: LocalizedName;
  student_name: string; submitted_at: string; score: number | null;
}
export interface DashboardSummary {
  role: Role; as_of: string; semester: Semester | null; metrics: DashboardMetric[];
  courses: DashboardCourse[]; today: DashboardClass[]; latest_grades: DashboardGrade[];
  announcements: DashboardAnnouncement[]; attendance_series: { label: string; attendance: number }[];
  grade_distribution: { label: string; students: number }[];
  pending_work: DashboardWork[]; recent_submissions: DashboardSubmission[];
}
