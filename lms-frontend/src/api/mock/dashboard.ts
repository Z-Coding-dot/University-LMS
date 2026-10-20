import type { Locale } from '../../config/constants';
import { appConfig } from '../../config/app';
import type { User } from '../types';
import type { DashboardCourse, DashboardFile, DashboardMetric, DashboardSummary, DashboardTask } from '../types/dashboard';
import type { DashboardQuery } from '../../features/dashboard/schemas';
import { dashboardOfferingIds, publishedCourseTotal, visibleDashboardAnnouncements } from '../../lib/dashboard';
import { attendancePercentage, weightedAverage } from '../../lib/grading';
import { can, PERMISSIONS } from '../../lib/permissions';
import { formatDate } from '../../lib/date';
import { normalizeDigits } from '../../lib/number';
import { announcements, assignments, attendanceRecords, attendanceSessions, courses, enrollments, gradeComponents, gradeEntries, offerings, semesters, settings, submissions, users } from './fixtures';

const text = (value: string, locale: Locale) => value.split(' / ')[locale === 'fa' ? 0 : 1] ?? value;
export const canSeeDashboardGrades = (user: User) => user.role !== 'teacher' || can(user, PERMISSIONS.enterGrades) || can(user, PERMISSIONS.publishGrades);

export function buildDashboard(user: User, query: DashboardQuery, locale: Locale, now = new Date()): { summary: DashboardSummary; tasks: DashboardTask[]; files: DashboardFile[]; forbidden: boolean } {
  const dateParts = new Intl.DateTimeFormat('en', { timeZone: appConfig.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (key: string) => dateParts.find(item => item.type === key)?.value ?? '';
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const currentSemester = user.role === 'student' ? semesters.find(item => item.id === user.profile.current_semester_id) :
    semesters.find(item => item.starts_at <= today && item.ends_at >= today) ?? semesters.at(-1);
  // A newly provisioned student without enrollment/semester must see an empty dashboard.
  const ids = user.role === 'student' && !currentSemester ? [] : dashboardOfferingIds(user, offerings, enrollments, currentSemester?.id ?? null);
  const selectedIds = query.offering_id ? ids.filter(id => id === query.offering_id) : ids;
  const search = normalizeDigits(query.search).trim().toLocaleLowerCase();
  const courseFor = (id: number) => courses.find(course => course.id === offerings.find(offering => offering.id === id)?.course_id)!;
  const matches = (...values: string[]) => !search || values.some(value => value.toLocaleLowerCase().includes(search));
  const selected = selectedIds.filter(id => { const course = courseFor(id); return matches(course.code, course.name[locale]); });
  const attendanceFor = (offeringIds: number[]) => {
    const sessions = new Set(attendanceSessions.filter(session => offeringIds.includes(session.offering_id) && session.date <= today).map(session => session.id));
    return attendanceRecords.filter(record => sessions.has(record.session_id) && (user.role !== 'student' || record.student_id === user.id));
  };
  const dashboardCourses: DashboardCourse[] = ids.map(id => {
    const offering = offerings.find(item => item.id === id)!; const course = courseFor(id);
    return { id, name: course.name, code: course.code, credits: course.credits, teacher: users.find(item => item.id === offering.teacher_id)?.name ?? '',
      students: enrollments.filter(item => item.offering_id === id).length,
      sessions: attendanceSessions.filter(item => item.offering_id === id && item.date <= today).length,
      attendance_percent: attendancePercentage(attendanceFor([id]).map(record => record.status), settings.attendance_counted_statuses),
    };
  });
  const tasks: DashboardTask[] = assignments.filter(assignment => selectedIds.includes(assignment.offering_id)).map(assignment => {
    const course = courseFor(assignment.offering_id); const received = submissions.filter(item => item.assignment_id === assignment.id);
    const own = received.find(item => item.student_id === user.id);
    const enrolled = enrollments.filter(item => item.offering_id === assignment.offering_id).length;
    const reviewed = received.filter(item => item.score !== null).length;
    const status: DashboardTask['status'] = user.role === 'student' ? own ? own.score === null ? 'submitted' : 'graded' : assignment.due_at < now.toISOString() ? 'overdue' : 'pending' :
      received.length && reviewed === received.length ? 'complete' : received.some(item => item.score === null) ? 'review' : 'pending';
    return { id: assignment.id, offering_id: assignment.offering_id, title: text(assignment.title, locale), description: text(assignment.description, locale), course: course.name,
      due_at: assignment.due_at, submission_rate: enrolled ? received.length / enrolled * 100 : 0, status,
      score: user.role === 'student' ? own?.score ?? null : null, feedback: user.role === 'student' ? own?.feedback ?? null : null };
  }).filter(item => matches(item.title, item.description, item.course[locale]));
  const files: DashboardFile[] = assignments.filter(assignment => selectedIds.includes(assignment.offering_id)).flatMap(assignment =>
    assignment.attachments.map(file => ({ ...file, offering_id: assignment.offering_id, course: courseFor(assignment.offering_id).name, uploaded_at: file.created_at })))
    .filter(file => matches(file.name, file.course[locale]));
  const components = new Map(gradeComponents.filter(item => selected.includes(item.offering_id)).map(item => [item.id, item]));
  const latestGrades = canSeeDashboardGrades(user) ? gradeEntries.filter(entry => components.has(entry.component_id) && entry.status !== 'draft' &&
    (user.role !== 'student' || entry.student_id === user.id)).sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id - a.id).slice(0, 5).map(entry => {
    const component = components.get(entry.component_id)!;
    return { ...entry, offering_id: component.offering_id, student_name: users.find(item => item.id === entry.student_id)?.name ?? '', course: courseFor(component.offering_id).name, component: component.name, max_score: component.max_score };
  }) : [];
  const results = ids.flatMap(id => {
    const total = publishedCourseTotal(gradeComponents.filter(item => item.offering_id === id), gradeEntries, user.id);
    return total === null ? [] : [{ total, credits: courseFor(id).credits }];
  });
  const attendance = attendancePercentage(attendanceFor(ids).map(record => record.status), settings.attendance_counted_statuses);
  const reviews = submissions.filter(submission => submission.score === null && assignments.some(item => item.id === submission.assignment_id && ids.includes(item.offering_id))).length;
  const metrics: DashboardMetric[] = user.role === 'student' ? [{ key: 'average', value: weightedAverage(results), percent: true }, { key: 'attendance', value: attendance, percent: true }, { key: 'courses', value: ids.length }] :
    user.role === 'teacher' ? [{ key: 'courses', value: ids.length }, { key: 'students', value: new Set(enrollments.filter(item => ids.includes(item.offering_id)).map(item => item.student_id)).size }, ...(can(user, PERMISSIONS.manageAssignments) ? [{ key: 'reviews' as const, value: reviews }] : [{ key: 'attendance' as const, value: attendance, percent: true }])] :
      [{ key: 'students', value: users.filter(item => item.role === 'student').length }, { key: 'teachers', value: users.filter(item => item.role === 'teacher').length }, { key: 'courses', value: ids.length }, { key: 'attendance', value: attendance, percent: true }];
  const weekday = ((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
  const todayClasses = offerings.filter(item => selected.includes(item.id)).flatMap(offering => offering.schedule.filter(slot => slot.weekday === weekday).map(slot => ({ ...slot, course: courseFor(offering.id).name, teacher: users.find(item => item.id === offering.teacher_id)?.name ?? '' }))).sort((a, b) => a.start.localeCompare(b.start));
  const visibleAnnouncements = visibleDashboardAnnouncements(user, announcements, selectedIds).filter(item => matches(text(item.title, locale), text(item.body, locale))).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10).map(item => ({ ...item, title: text(item.title, locale), body: text(item.body, locale), author_name: users.find(author => author.id === item.author_id)?.name ?? '' }));
  const dates = [...new Set(attendanceSessions.filter(session => selectedIds.includes(session.offering_id) && session.date <= today).map(session => session.date))].sort().slice(-6);
  const series = dates.flatMap(date => {
    const sessions = new Set(attendanceSessions.filter(session => selectedIds.includes(session.offering_id) && session.date === date).map(session => session.id));
    const percentage = attendancePercentage(attendanceRecords.filter(record => sessions.has(record.session_id) && (user.role !== 'student' || record.student_id === user.id)).map(record => record.status), settings.attendance_counted_statuses);
    return percentage === null ? [] : [{ label: formatDate(date, locale), attendance: percentage }];
  });
  return { forbidden: !!query.offering_id && !ids.includes(query.offering_id), tasks, files, summary: { role: user.role, as_of: today, semester: currentSemester ?? null, metrics, courses: dashboardCourses, today: todayClasses, latest_grades: latestGrades, announcements: visibleAnnouncements, attendance_series: series } };
}
