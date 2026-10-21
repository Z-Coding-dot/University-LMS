import type { AcademicSettings, AcademicYear, Announcement, Assignment, AttendanceRecord, AttendanceSession, Course, CourseOffering, Department, Enrollment, Faculty, GradeComponent, GradeEntry, Semester, Submission, User } from '../types';
import { PERMISSIONS } from '../../lib/permissions';
import { ATTENDANCE_STATUSES } from '../../config/constants';
import type { Lecture } from '../types';
import { demoStudentPassword } from '../../config/demo';
import { studyMaterials } from './materials';

export const DEMO_PASSWORD = 'Campus123!';
export const initialDemoPassword = (user: User) => user.role === 'student' ? demoStudentPassword(user.profile.institutional_id) : DEMO_PASSWORD;
export const users: User[] = [
  { id: 1, name: 'زهرا احمدی', email: 'admin@campus.test', role: 'admin', permissions: [], locale: 'fa', must_change_password: false, status: 'active', profile: { institutional_id: 'AD-001', department_id: null, current_semester_id: null } },
  ...['احمد ولی', 'Sara Rahimi', 'مریم نوری'].map((name, index): User => ({
    id: index + 2, name, email: `teacher${index + 1}@campus.test`, role: 'teacher',
    permissions: Object.values(PERMISSIONS).filter(p => p !== 'grades.unlock' && (index === 0 || p !== 'grades.publish')),
    locale: index === 1 ? 'en' : 'fa', must_change_password: false, status: 'active',
    profile: { institutional_id: `TC-00${index + 1}`, department_id: 1, current_semester_id: 2 },
  })),
  ...['فاطمه محمدی', 'Ali Hosseini', 'زینب رضایی', 'حامد کریمی', 'ستاره احمدی', 'Omid Safi', 'لیلا نوری', 'محمد نبی', 'شکیبا رحیمی', 'Farid Azizi', 'نازنین هاشمی', 'جاوید امیری', 'مینا سادات', 'بلال احمد', 'سارا اکبری', 'سلیم نادری', 'نگین حیدری', 'حسین صادقی', 'فرشته یوسفی', 'نورالله سلیمانی', 'ریحانه عزیزی', 'وحید نظری', 'مژگان وفا', 'احسان فایق', 'ملالی غفوری'].map((name, index): User => ({
    id: index + 5, name, email: `student${index + 1}@campus.test`, role: 'student', permissions: [],
    locale: index === 1 ? 'en' : 'fa', must_change_password: false, status: index === 24 ? 'inactive' : 'active',
    profile: { institutional_id: `ST-${String(index + 1).padStart(3, '0')}`, department_id: 1, current_semester_id: 2 },
  })),
];
export const faculties: Faculty[] = [{ id: 1, name: { fa: 'پوهنځی کمپیوتر ساینس', en: 'Computer Science Faculty' } }];
export const departments: Department[] = [{ id: 1, faculty_id: 1, name: { fa: 'دیپارتمنت انجنیری نرم‌افزار', en: 'Software Engineering' } }];
export const academicYears: AcademicYear[] = [{ id: 1, name: '1405 / 2026–27', starts_at: '2026-03-21', ends_at: '2027-03-20' }];
export const semesters: Semester[] = [
  { id: 1, academic_year_id: 1, name: { fa: 'سمستر بهاری ۱۴۰۵', en: 'Spring 2026' }, starts_at: '2026-03-21', ends_at: '2026-07-20' },
  { id: 2, academic_year_id: 1, name: { fa: 'سمستر خزانی ۱۴۰۵', en: 'Autumn 2026' }, starts_at: '2026-09-01', ends_at: '2027-01-15' },
];
export const courses: Course[] = [
  ['CS101', 'مبانی برنامه‌نویسی', 'Programming Fundamentals', 4],
  ['CS102', 'ریاضیات گسسته', 'Discrete Mathematics', 3],
  ['CS103', 'سیستم‌های دیجیتال', 'Digital Systems', 3],
  ['CS201', 'ساختمان داده‌ها', 'Data Structures', 4],
  ['CS202', 'دیتابیس', 'Database Systems', 3],
  ['CS203', 'انجنیری نرم‌افزار', 'Software Engineering', 3],
].map(([code, fa, en, credits], index) => ({ id: index + 1, code: String(code), name: { fa: String(fa), en: String(en) }, credits: Number(credits), department_id: 1 }));
export const offerings: CourseOffering[] = courses.map((course, index) => ({
  id: index + 1, course_id: course.id, semester_id: index < 3 ? 1 : 2, teacher_id: index % 3 + 2, capacity: 35,
  schedule: [{ id: index + 1, offering_id: index + 1, weekday: [6, 7, 1, 2, 3, 4][index], start: '09:00', end: '10:30', room: `B-${index + 101}` }],
}));
export const enrollments: Enrollment[] = offerings.flatMap(offering => users.filter(u => u.role === 'student').map((user, index) => ({ id: (offering.id - 1) * 25 + index + 1, offering_id: offering.id, student_id: user.id })));
export const gradeComponents: GradeComponent[] = offerings.flatMap(offering => [
  { id: offering.id * 2 - 1, offering_id: offering.id, name: { fa: 'امتحان وسط سمستر', en: 'Midterm' }, max_score: 40, weight: 40 },
  { id: offering.id * 2, offering_id: offering.id, name: { fa: 'امتحان نهایی', en: 'Final exam' }, max_score: 60, weight: 60 },
]);
export const gradeEntries: GradeEntry[] = gradeComponents.flatMap(component => users.filter(u => u.role === 'student').map((user, index) => ({
  id: (component.id - 1) * 25 + index + 1, student_id: user.id, component_id: component.id,
  score: Math.round(component.max_score * (0.6 + (index + component.id) % 8 * 0.045)), feedback: null,
  status: component.offering_id < 4 ? 'locked' : component.offering_id < 6 ? 'published' : 'draft',
  updated_at: `${component.offering_id < 4 ? '2026-07' : '2026-10'}-${String(15 + component.id % 5).padStart(2, '0')}T08:00:00Z`,
})));
export const attendanceSessions: AttendanceSession[] = offerings.flatMap(offering => [1, 2, 3, 4].map(day => ({ id: (offering.id - 1) * 4 + day, offering_id: offering.id, date: `${offering.semester_id === 1 ? '2026-06' : '2026-10'}-${String(day + 10).padStart(2, '0')}` })));
export const attendanceRecords: AttendanceRecord[] = attendanceSessions.flatMap(session => users.filter(u => u.role === 'student').map((user, index) => ({ id: (session.id - 1) * 25 + index + 1, session_id: session.id, student_id: user.id, status: index % 4 === 0 ? ATTENDANCE_STATUSES[(index + session.id) % 4] : 'present' })));
export const lectures: Lecture[] = offerings.map(offering => ({ id: offering.id, offering_id: offering.id, week_number: 4, title: 'درس هفتهٔ چهارم / Week four lecture', description: 'منابع این هفته را مطالعه کرده و سپس وظیفهٔ درسی را تکمیل کنید. / Read this week’s material before completing the assignment.', attachments: [studyMaterials[offering.course_id - 1]], updated_at: '2026-10-19T08:00:00Z' }));
export const assignments: Assignment[] = offerings.map(offering => ({ id: offering.id, offering_id: offering.id, week_number: 4, submission_enabled: true, title: 'تمرین عملی / Practical exercise', description: 'تمرین فصل اول را تکمیل کنید. / Complete the chapter one exercise.', due_at: offering.semester_id === 1 ? '2026-06-28T12:00:00Z' : `2026-10-${25 + offering.id % 3}T12:00:00Z`, attachments: [studyMaterials[offering.course_id - 1]] }));
export const submissions: Submission[] = [{ id: 1, assignment_id: 4, student_id: 5, files: [], submitted_at: '2026-10-19T08:00:00Z', score: null, feedback: null }];
export const announcements: Announcement[] = [
  { id: 1, title: 'آغاز سمستر خزانی / Autumn semester', body: 'به سمستر جدید خوش آمدید. / Welcome to the new semester.', audience: 'all', role: null, offering_id: null, author_id: 1, created_at: '2026-09-01T06:00:00Z' },
  { id: 2, title: 'منابع درسی جدید / New learning materials', body: 'منابع درسی جدید در حساب شما آماده است. پیش از درس بعدی آن‌ها را مرور کنید. / New study packs are available in your workspace. Review them before your next class.', audience: 'all', role: null, offering_id: null, author_id: 1, created_at: '2026-10-19T07:00:00Z' },
  { id: 3, title: 'جلسهٔ علمی استادان / Faculty meeting', body: 'جلسهٔ علمی این هفته روز پنج‌شنبه برگزار می‌شود. / This week’s faculty meeting will take place on Thursday.', audience: 'role', role: 'teacher', offering_id: null, author_id: 1, created_at: '2026-10-18T07:00:00Z' },
];
export const settings: AcademicSettings = {
  pass_mark: 55,
  letter_scale: [{ min: 90, max: 100, letter: 'A' }, { min: 80, max: 90, letter: 'B' }, { min: 70, max: 80, letter: 'C' }, { min: 55, max: 70, letter: 'D' }, { min: 0, max: 55, letter: 'F' }],
  attendance_counted_statuses: ['present', 'late', 'excused'], attendance_warning_threshold: 75, weekend_days: [5],
};
