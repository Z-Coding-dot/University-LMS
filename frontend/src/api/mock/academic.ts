import { z } from 'zod';
import type { Assignment, Attachment } from '../types';
import { can, PERMISSIONS } from '../../lib/permissions';
import { attendancePercentage, canTransitionGrade, cumulativeAverage, letterGrade, studentGradeBreakdown, studentGradeItems, validGradeComponentRevision, weightedAverage } from '../../lib/grading';
import { publishedCourseTotal, visibleDashboardAnnouncements } from '../../lib/dashboard';
import { calendarDay } from '../../lib/date';
import { validateUpload } from '../../lib/upload';
import { UPLOAD_LIMITS } from '../../config/uploads';
import { announcementSchema } from '../../features/announcements/schemas';
import { assignmentSchema, attendanceSchema, componentSchema, gradeBatchSchema, lectureSchema, submissionGradeSchema, weekNumber } from '../../features/teacher/schemas';
import { currentTeachingWeek, submissionRestriction } from '../../lib/coursework';
import { COURSE_WEEKS } from '../../config/constants';
import { positiveId } from '../../lib/validation';
import { academicYears, announcements, assignments, attendanceRecords, attendanceSessions, courses, departments, enrollments, faculties, gradeComponents, gradeEntries, lectures, semesters, settings, submissions, users } from './fixtures';
import { accessibleOfferings, courseView, currentSemesterId, gradeStates, requireOffering, seededAnnouncementIds, seedText } from './model';
import { fail, nextId, page, respond, validate, type MockContext } from './http';

const uploads = new Map<number, { file: Attachment; user_id: number; offering_id: number; purpose: string }>();
const seededAssignments = new Set(assignments.map(item => item.id));
const seededLectures = new Set(lectures.map(item => item.id));
const filesFor = (ctx: MockContext, ids: number[], offeringId: number, purpose: string, existing: Attachment[] = []) => ids.map(id => {
  const found = uploads.get(id);
  if (found && found.offering_id === offeringId && found.purpose === purpose && found.user_id === ctx.user.id) return found.file;
  const original = existing.find(file => file.id === id);
  if (original) return original;
  fail(ctx, 422, 'academic:invalidFiles', 'attachment_ids'); throw new Error('Unreachable');
});
export function handleAcademic(ctx: MockContext) {
  const { path, method, user, locale, config, body } = ctx;
  const ok = (data: unknown, status = 200) => respond(config, status, { data });
  const requireTeacher = (permission?: Parameters<typeof can>[1]) => {
    if (user.role === 'student' || (permission && !can(user, permission))) fail(ctx);
  };
  if (path === '/catalog' && method === 'GET') return ok({ semesters, departments, faculties, academic_years: academicYears, courses });
  if (path === '/courses' && method === 'GET') {
    const semesterId = Number(config.params?.semester_id) || (user.role === 'student' ? user.profile.current_semester_id : currentSemesterId());
    const rows = accessibleOfferings(user).filter(item => item.semester_id === semesterId).map(courseView);
    return page(ctx, rows, { name: item => item.course.name[locale], code: item => item.course.code, credits: item => item.course.credits, teacher: item => item.teacher.name }, 'name');
  }
  const lectureMatch = path.match(/^\/courses\/(\d+)\/lectures(?:\/(\d+))?$/);
  if (lectureMatch) {
    const offering = requireOffering(ctx, Number(lectureMatch[1])); const id = Number(lectureMatch[2]);
    if (!lectureMatch[2] && method === 'GET') {
      const week = config.params?.week_number === undefined ? undefined : validate(weekNumber, config.params.week_number, config);
      const rows = lectures.filter(item => item.offering_id === offering.id && (!week || item.week_number === week)).map(item => ({ ...item, title: seededLectures.has(item.id) ? seedText(item.title, locale) : item.title, description: seededLectures.has(item.id) ? seedText(item.description, locale) : item.description }));
      return page(ctx, rows, { title: row => row.title, week_number: row => row.week_number, updated_at: row => row.updated_at }, '-updated_at');
    }
    requireTeacher(PERMISSIONS.manageMaterials);
    const existing = lectureMatch[2] ? lectures.find(item => item.id === id && item.offering_id === offering.id) : undefined;
    if (lectureMatch[2] && !existing) return fail(ctx, 404, 'common:notFoundTitle');
    if ((!lectureMatch[2] && method === 'POST') || (existing && method === 'PATCH')) {
      const input = validate(lectureSchema, body, config);
      if (input.offering_id !== offering.id) return fail(ctx, 422, 'academic:invalidCourse');
      const row = { id: existing?.id ?? nextId(lectures), offering_id: offering.id, week_number: input.week_number, title: input.title, description: input.description, attachments: filesFor(ctx, input.attachment_ids, offering.id, 'lecture', existing?.attachments), updated_at: new Date().toISOString() };
      if (existing) { Object.assign(existing, row); seededLectures.delete(existing.id); } else lectures.push(row);
      return ok(row, existing ? 200 : 201);
    }
    return fail(ctx, 404, 'common:notFoundTitle');
  }
  const courseMatch = path.match(/^\/courses\/(\d+)(?:\/(weeks|roster|attendance|attendance-history|grade-breakdown|grades|grade-components|grade-status))?$/);
  if (courseMatch) {
    const offering = requireOffering(ctx, Number(courseMatch[1])); const id = offering.id; const action = courseMatch[2];
    const studentIds = enrollments.filter(item => item.offering_id === id).map(item => item.student_id);
    const students = users.filter(item => studentIds.includes(item.id));
    const components = gradeComponents.filter(item => item.offering_id === id);
    const componentIds = new Set(components.map(item => item.id));
    const entries = gradeEntries.filter(item => componentIds.has(item.component_id));
    const sessions = attendanceSessions.filter(item => item.offering_id === id).sort((a, b) => b.date.localeCompare(a.date));
    const sessionIds = new Set(sessions.map(item => item.id));
    const records = attendanceRecords.filter(item => sessionIds.has(item.session_id) && (user.role !== 'student' || item.student_id === user.id));
    const status = gradeStates.get(id) ?? 'draft';
    if (action === 'weeks' && method === 'GET') {
      const semester = semesters.find(item => item.id === offering.semester_id)!;
      const notices = visibleDashboardAnnouncements(user, announcements, [id]).filter(item => item.offering_id === id);
      return ok({ current_week: currentTeachingWeek(semester.starts_at, semester.ends_at), course_announcement_count: notices.filter(item => item.week_number === null).length,
        weeks: COURSE_WEEKS.map(week => ({ week_number: week, lecture_count: lectures.filter(item => item.offering_id === id && item.week_number === week).length, assignment_count: assignments.filter(item => item.offering_id === id && item.week_number === week).length, announcement_count: notices.filter(item => item.week_number === week).length })) });
    }
    if (!action && method === 'GET') return ok({ ...courseView(offering), components, grades: user.role === 'student' ? entries.filter(item => item.student_id === user.id && item.status !== 'draft' && status !== 'draft') : [], attendance_sessions: sessions, attendance_records: records, attendance_percent: attendancePercentage(records.map(item => item.status), settings.attendance_counted_statuses, sessions.length * (user.role === 'student' ? 1 : students.length)), settings });
    if (action === 'attendance-history' && method === 'GET') {
      if (user.role !== 'student') return fail(ctx);
      return page(ctx, sessions.map(session => ({ id: session.id, date: session.date, status: records.find(record => record.session_id === session.id)?.status ?? null })), { date: row => row.date, status: row => row.status }, '-date');
    }
    if (action === 'grade-breakdown' && method === 'GET') {
      if (user.role !== 'student') return fail(ctx);
      const coursework = assignments.filter(item => item.offering_id === id).map(item => ({ ...item, title: seededAssignments.has(item.id) ? seedText(item.title, locale) : item.title }));
      const rows = studentGradeItems({ offeringId: id, components, entries, assignments: coursework, submissions, studentId: user.id, status, locale });
      return page(ctx, rows, { title: row => row.title, kind: row => row.kind, week_number: row => row.week_number, weight: row => row.weight, score: row => row.score });
    }
    if (action === 'roster' && method === 'GET') { requireTeacher(); return page(ctx, students, { name: row => row.name, email: row => row.email, institutional_id: row => row.profile.institutional_id }, 'name'); }
    if (action === 'attendance') {
      if (method === 'GET') { requireTeacher(); return ok({ students, sessions, records }); }
      if (method === 'POST') {
        requireTeacher(PERMISSIONS.takeAttendance);
        const input = validate(attendanceSchema, body, config);
        if (input.date > calendarDay(new Date()) || new Set(input.records.map(row => row.student_id)).size !== input.records.length || input.records.some(row => !studentIds.includes(row.student_id))) return fail(ctx, 422, 'academic:invalidAttendance');
        let session = sessions.find(item => item.date === input.date);
        if (!session) { session = { id: nextId(attendanceSessions), offering_id: id, date: input.date }; attendanceSessions.push(session); }
        for (const row of input.records) {
          const existing = attendanceRecords.find(item => item.session_id === session.id && item.student_id === row.student_id);
          if (existing) existing.status = row.status; else attendanceRecords.push({ id: nextId(attendanceRecords), session_id: session.id, ...row });
        }
        return ok(session);
      }
    }
    if (action === 'grades') {
      requireTeacher();
      if (!can(user, PERMISSIONS.enterGrades) && !can(user, PERMISSIONS.publishGrades)) return fail(ctx);
      if (method === 'GET') return ok({ components, entries, status });
      if (method === 'PUT') {
        requireTeacher(PERMISSIONS.enterGrades);
        if (status === 'locked') return fail(ctx, 403, 'academic:gradesLocked');
        const input = validate(gradeBatchSchema, body, config);
        const keys = input.entries.map(row => `${row.student_id}:${row.component_id}`);
        if (new Set(keys).size !== keys.length || input.entries.some(row => !studentIds.includes(row.student_id) || !componentIds.has(row.component_id) || row.score > components.find(component => component.id === row.component_id)!.max_score)) return fail(ctx, 422, 'academic:invalidGrades');
        for (const row of input.entries) {
          const existing = gradeEntries.find(item => item.student_id === row.student_id && item.component_id === row.component_id);
          const values = { ...row, feedback: row.feedback ?? null, status, updated_at: new Date().toISOString() };
          if (existing) Object.assign(existing, values); else gradeEntries.push({ id: nextId(gradeEntries), ...values });
        }
        return ok({ status });
      }
    }
    if (action === 'grade-components' && method === 'PUT') {
      requireTeacher(PERMISSIONS.enterGrades);
      if (status !== 'draft') return fail(ctx, 403, 'academic:componentsPublished');
      const input = validate(componentSchema, body, config);
      if (input.components.some(component => component.id !== undefined && !componentIds.has(component.id)) || !validGradeComponentRevision(input.components, entries)) return fail(ctx, 422, 'academic:invalidGrades');
      let componentId = nextId(gradeComponents);
      const keep = new Set(input.components.flatMap(item => item.id ? [item.id] : []));
      for (let i = gradeComponents.length - 1; i >= 0; i--) if (gradeComponents[i].offering_id === id && !keep.has(gradeComponents[i].id)) gradeComponents.splice(i, 1);
      for (const component of input.components) {
        const existing = gradeComponents.find(item => item.id === component.id);
        const next = { ...component, id: component.id ?? componentId++, offering_id: id };
        if (existing) Object.assign(existing, next); else gradeComponents.push(next);
      }
      const validIds = new Set(gradeComponents.map(item => item.id));
      for (let i = gradeEntries.length - 1; i >= 0; i--) if (!validIds.has(gradeEntries[i].component_id)) gradeEntries.splice(i, 1);
      return ok(gradeComponents.filter(item => item.offering_id === id));
    }
    if (action === 'grade-status' && method === 'PUT') {
      const input = validate(z.object({ status: z.enum(['draft', 'published', 'locked']) }), body, config);
      if (!canTransitionGrade(status, input.status, user.role, user.permissions)) return fail(ctx);
      if (input.status === 'published' && status === 'draft' && (!components.length || Math.abs(components.reduce((sum, item) => sum + item.weight, 0) - 100) > .000001 || studentIds.some(student => components.some(component => !entries.some(entry => entry.student_id === student && entry.component_id === component.id))))) return fail(ctx, 422, 'academic:completeGrades');
      gradeStates.set(id, input.status); entries.forEach(entry => { entry.status = input.status; entry.updated_at = new Date().toISOString(); });
      return ok({ status: input.status });
    }
  }
  if ((path === '/results' || path === '/results/courses') && method === 'GET') {
    if (user.role !== 'student') return fail(ctx);
    const all = accessibleOfferings(user);
    const results = semesters.filter(semester => all.some(item => item.semester_id === semester.id)).map(semester => {
      const rows = all.filter(item => item.semester_id === semester.id).map(item => {
        const course = courses.find(course => course.id === item.course_id)!;
        const status = gradeStates.get(item.id) ?? 'draft';
        const total = status === 'draft' ? null : publishedCourseTotal(gradeComponents.filter(component => component.offering_id === item.id), gradeEntries, user.id);
        const assessments = studentGradeBreakdown(gradeComponents.filter(component => component.offering_id === item.id), gradeEntries, user.id, status);
        const coursework = assignments.filter(assignment => assignment.offering_id === item.id).map(assignment => {
          const submission = submissions.find(row => row.assignment_id === assignment.id && row.student_id === user.id);
          return { id: assignment.id, title: seededAssignments.has(assignment.id) ? seedText(assignment.title, locale) : assignment.title, week_number: assignment.week_number, submitted: !!submission, score: submission?.score ?? null, feedback: submission?.feedback ?? null };
        });
        return { id: item.id, code: course.code, name: course.name, credits: course.credits, total, letter: total === null ? null : letterGrade(total, settings.letter_scale), status, assessments, assignments: coursework };
      });
      return { semester, courses: rows, average: weightedAverage(rows.flatMap(row => row.total === null ? [] : [{ total: row.total, credits: row.credits }])) };
    });
    if (path === '/results/courses') { const semesterId = Number(config.params?.semester_id); const selected = results.find(item => item.semester.id === semesterId); return page(ctx, selected?.courses ?? [], { name: row => row.name[locale], code: row => row.code, credits: row => row.credits, total: row => row.total }); }
    return ok({ semesters: results, cumulative_average: cumulativeAverage(results.map(result => result.courses.flatMap(row => row.total === null ? [] : [{ total: row.total, credits: row.credits }]))) });
  }
  if (path === '/timetable' && method === 'GET') {
    if (user.role === 'teacher' && !can(user, PERMISSIONS.viewTimetable)) return fail(ctx);
    const semesterId = Number(config.params?.semester_id) || (user.role === 'student' ? user.profile.current_semester_id : currentSemesterId());
    return ok({ slots: accessibleOfferings(user).filter(item => item.semester_id === semesterId).flatMap(item => item.schedule.map(slot => ({ ...slot, title: courses.find(course => course.id === item.course_id)!.name[locale], teacher: users.find(teacher => teacher.id === item.teacher_id)?.name }))), weekend_days: settings.weekend_days });
  }
  if (path === '/uploads' && method === 'POST') {
    if (!(body instanceof FormData)) return fail(ctx, 422, 'academic:invalidFiles');
    const offeringId = Number(body.get('offering_id')); requireOffering(ctx, offeringId);
    const purpose = String(body.get('purpose'));
    if (purpose === 'assignment') requireTeacher(PERMISSIONS.manageAssignments); else if (purpose === 'lecture') requireTeacher(PERMISSIONS.manageMaterials); else if (purpose !== 'submission' || user.role !== 'student') return fail(ctx);
    const files = [...body.getAll('files[]'), ...body.getAll('files')].filter((item): item is File => item instanceof File);
    if (!files.length || files.length > UPLOAD_LIMITS.maxFiles) return fail(ctx, 422, 'academic:invalidFiles');
    for (const file of files) { const error = validateUpload(file); if (error) return fail(ctx, 422, error); }
    const result = files.map(file => {
      const item: Attachment = { id: 10000 + uploads.size, name: file.name, size: file.size, mime_type: file.type, url: URL.createObjectURL(file), created_at: new Date().toISOString() };
      uploads.set(item.id, { file: item, user_id: user.id, offering_id: offeringId, purpose }); return item;
    });
    config.onUploadProgress?.({ loaded: files.reduce((sum, file) => sum + file.size, 0), total: files.reduce((sum, file) => sum + file.size, 0), progress: 1, bytes: files.reduce((sum, file) => sum + file.size, 0), lengthComputable: true, upload: true });
    return ok(result, 201);
  }
  const assignmentMatch = path.match(/^\/assignments(?:\/(\d+)(?:\/(submissions))?)?$/);
  if (assignmentMatch) {
    const id = Number(assignmentMatch[1]); const assigned = id ? assignments.find(item => item.id === id) : undefined;
    const accessibleIds = accessibleOfferings(user).map(item => item.id);
    const requestedOffering = Number(config.params?.offering_id);
    if (requestedOffering && !accessibleIds.includes(requestedOffering)) return fail(ctx);
    if (assignmentMatch[1] && !assigned) return fail(ctx, 404, 'common:notFoundTitle');
    if (assigned) requireOffering(ctx, assigned.offering_id);
    const view = (item: Assignment) => ({ ...item, title: seededAssignments.has(item.id) ? seedText(item.title, locale) : item.title, description: seededAssignments.has(item.id) ? seedText(item.description, locale) : item.description, course_name: courses.find(course => course.id === requireOffering(ctx, item.offering_id).course_id)!.name, submission: user.role === 'student' ? submissions.find(row => row.assignment_id === item.id && row.student_id === user.id) ?? null : null, submission_count: submissions.filter(row => row.assignment_id === item.id).length });
    if (assigned && !assignmentMatch[2] && method === 'GET') return ok(view(assigned));
    if (!assignmentMatch[1] && method === 'GET') {
      const week = config.params?.week_number === undefined ? undefined : validate(weekNumber, config.params.week_number, config);
      const rows = assignments.filter(item => accessibleIds.includes(item.offering_id) && (!requestedOffering || requestedOffering === item.offering_id) && (!week || item.week_number === week)).map(view);
      return page(ctx, rows, { title: row => row.title, due_at: row => row.due_at, week_number: row => row.week_number, course: row => row.course_name[locale] }, 'due_at');
    }
    if (assignmentMatch[2] === 'submissions' && assigned) {
      if (method === 'GET') { requireTeacher(PERMISSIONS.manageAssignments); return page(ctx, submissions.filter(item => item.assignment_id === id).map(item => ({ ...item, student_name: users.find(student => student.id === item.student_id)?.name ?? '' })), { student_name: row => row.student_name, submitted_at: row => row.submitted_at, score: row => row.score }, '-submitted_at'); }
      if (method === 'POST') {
        if (user.role !== 'student') return fail(ctx);
        const input = validate(z.object({ file_ids: z.array(positiveId).min(1).max(UPLOAD_LIMITS.maxFiles) }), body, config);
        const existing = submissions.find(item => item.assignment_id === id && item.student_id === user.id);
        const restriction = submissionRestriction(assigned, existing);
        if (restriction) return fail(ctx, restriction === 'academic:alreadyGraded' ? 403 : 422, restriction);
        const files = filesFor(ctx, input.file_ids, assigned.offering_id, 'submission', existing?.files);
        const row = { id: existing?.id ?? nextId(submissions), student_id: user.id, assignment_id: id, files, submitted_at: new Date().toISOString(), score: null, feedback: null };
        if (existing) Object.assign(existing, row); else submissions.push(row);
        return ok(row, 201);
      }
    }
    if ((!assignmentMatch[1] && method === 'POST') || (assigned && method === 'PATCH')) {
      requireTeacher(PERMISSIONS.manageAssignments);
      const input = validate(assignmentSchema, body, config); requireOffering(ctx, input.offering_id);
      if (assigned && assigned.offering_id !== input.offering_id) return fail(ctx, 422, 'academic:invalidCourse');
      if (input.due_date < calendarDay(new Date())) return fail(ctx, 422, 'academic:deadlinePassed', 'due_date');
      const row = { id: assigned?.id ?? nextId(assignments), offering_id: input.offering_id, week_number: input.week_number, submission_enabled: input.submission_enabled, title: input.title, description: input.description, due_at: new Date(`${input.due_date}T23:59:59+04:30`).toISOString(), attachments: filesFor(ctx, input.attachment_ids, input.offering_id, 'assignment', assigned?.attachments) };
      if (assigned) { Object.assign(assigned, row); seededAssignments.delete(assigned.id); } else assignments.push(row);
      return ok(row, assigned ? 200 : 201);
    }
  }
  const scoreMatch = path.match(/^\/submissions\/(\d+)$/);
  if (scoreMatch && method === 'PATCH') {
    requireTeacher(PERMISSIONS.manageAssignments);
    const submission = submissions.find(item => item.id === Number(scoreMatch[1]));
    const assignment = assignments.find(item => item.id === submission?.assignment_id);
    if (!submission || !assignment) return fail(ctx, 404, 'common:notFoundTitle');
    requireOffering(ctx, assignment.offering_id);
    Object.assign(submission, validate(submissionGradeSchema, body, config)); return ok(submission);
  }
  const announcementMatch = path.match(/^\/announcements(?:\/(\d+))?$/);
  if (announcementMatch) {
    const ids = accessibleOfferings(user).map(item => item.id); const offeringId = Number(config.params?.offering_id);
    if (offeringId && !ids.includes(offeringId)) return fail(ctx);
    if (method === 'GET' && !announcementMatch[1]) {
      const week = config.params?.week_number === undefined ? undefined : validate(weekNumber, config.params.week_number, config);
      const courseWide = config.params?.course_wide === undefined ? false : validate(z.coerce.number().int().min(0).max(1), config.params.course_wide, config) === 1;
      if (week && courseWide) return fail(ctx, 422, 'common:validationError');
      const rows = visibleDashboardAnnouncements(user, announcements, ids).filter(item => (!offeringId || item.offering_id === offeringId) && (!week || item.week_number === week) && (!courseWide || item.week_number === null)).map(item => ({ ...item, title: seededAnnouncementIds.has(item.id) ? seedText(item.title, locale) : item.title, body: seededAnnouncementIds.has(item.id) ? seedText(item.body, locale) : item.body, author_name: users.find(author => author.id === item.author_id)?.name ?? '' }));
      return page(ctx, rows, { title: row => row.title, created_at: row => row.created_at, author_name: row => row.author_name }, '-created_at');
    }
    if (method === 'POST' || method === 'PATCH') {
      requireTeacher(PERMISSIONS.postAnnouncements);
      const input = validate(announcementSchema, body, config);
      if (user.role === 'teacher' && input.audience !== 'offering') return fail(ctx);
      if (input.audience === 'offering') requireOffering(ctx, input.offering_id!);
      const existing = announcementMatch[1] ? announcements.find(item => item.id === Number(announcementMatch[1])) : undefined;
      if (announcementMatch[1] && !existing) return fail(ctx, 404, 'common:notFoundTitle');
      if (existing && user.role !== 'admin' && existing.author_id !== user.id) return fail(ctx);
      if (existing?.offering_id) requireOffering(ctx, existing.offering_id);
      const row = { id: existing?.id ?? nextId(announcements), ...input, role: input.audience === 'role' ? input.role! : null, offering_id: input.audience === 'offering' ? input.offering_id! : null, author_id: existing?.author_id ?? user.id, created_at: existing?.created_at ?? new Date().toISOString() };
      if (existing) { Object.assign(existing, row); seededAnnouncementIds.delete(existing.id); } else announcements.push(row);
      return ok(row, existing ? 200 : 201);
    }
  }
  return undefined;
}
