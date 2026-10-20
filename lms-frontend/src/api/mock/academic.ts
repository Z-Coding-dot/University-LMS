import { z } from 'zod';
import type { Attachment } from '../types';
import { can, PERMISSIONS } from '../../lib/permissions';
import { attendancePercentage, canTransitionGrade, cumulativeAverage, letterGrade, weightedAverage } from '../../lib/grading';
import { publishedCourseTotal, visibleDashboardAnnouncements } from '../../lib/dashboard';
import { calendarDay } from '../../lib/date';
import { validateUpload } from '../../lib/upload';
import { UPLOAD_LIMITS } from '../../config/uploads';
import { announcementSchema } from '../../features/announcements/schemas';
import { assignmentSchema, attendanceSchema, componentSchema, gradeBatchSchema, submissionGradeSchema } from '../../features/teacher/schemas';
import { positiveId } from '../../lib/validation';
import { academicYears, announcements, assignments, attendanceRecords, attendanceSessions, courses, departments, enrollments, faculties, gradeComponents, gradeEntries, semesters, settings, submissions, users } from './fixtures';
import { accessibleOfferings, courseView, currentSemesterId, gradeStates, requireOffering, seedText } from './model';
import { fail, nextId, page, respond, validate, type MockContext } from './http';

const uploads = new Map<number, { file: Attachment; user_id: number; offering_id: number; purpose: string }>();
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
  const courseMatch = path.match(/^\/courses\/(\d+)(?:\/(roster|attendance|attendance-history|grade-breakdown|grades|grade-components|grade-status))?$/);
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
    if (!action && method === 'GET') return ok({ ...courseView(offering), components, grades: user.role === 'student' ? entries.filter(item => item.student_id === user.id && item.status !== 'draft' && status !== 'draft') : [], attendance_sessions: sessions, attendance_records: records, attendance_percent: attendancePercentage(records.map(item => item.status), settings.attendance_counted_statuses), settings });
    if (action === 'attendance-history' && method === 'GET') {
      if (user.role !== 'student') return fail(ctx);
      return page(ctx, records.map(item => ({ ...item, date: sessions.find(session => session.id === item.session_id)!.date })), { date: row => row.date, status: row => row.status }, '-date');
    }
    if (action === 'grade-breakdown' && method === 'GET') {
      if (user.role !== 'student') return fail(ctx);
      const rows = components.map(component => { const entry = status === 'draft' ? undefined : entries.find(item => item.component_id === component.id && item.student_id === user.id && item.status !== 'draft'); return { ...component, score: entry?.score ?? null, feedback: entry?.feedback ?? null }; });
      return page(ctx, rows, { name: row => row.name[locale], weight: row => row.weight, score: row => row.score });
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
      if (input.components.some(component => component.id !== undefined && !componentIds.has(component.id))) return fail(ctx, 422, 'academic:invalidGrades');
      const keep = new Set(input.components.flatMap(item => item.id ? [item.id] : []));
      for (let i = gradeComponents.length - 1; i >= 0; i--) if (gradeComponents[i].offering_id === id && !keep.has(gradeComponents[i].id)) gradeComponents.splice(i, 1);
      for (const component of input.components) {
        const existing = gradeComponents.find(item => item.id === component.id);
        const next = { ...component, id: component.id ?? nextId(gradeComponents), offering_id: id };
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
        return { id: item.id, code: course.code, name: course.name, credits: course.credits, total, letter: total === null ? null : letterGrade(total, settings.letter_scale), status };
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
    if (purpose === 'assignment') requireTeacher(PERMISSIONS.manageAssignments); else if (purpose !== 'submission' || user.role !== 'student') return fail(ctx);
    const files = body.getAll('files').filter((item): item is File => item instanceof File);
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
    if (id && !assigned) return fail(ctx, 404, 'common:notFoundTitle');
    if (assigned) requireOffering(ctx, assigned.offering_id);
    if (!id && method === 'GET') {
      const rows = assignments.filter(item => accessibleIds.includes(item.offering_id) && (!requestedOffering || requestedOffering === item.offering_id)).map(item => ({ ...item, title: item.id <= 6 ? seedText(item.title, locale) : item.title, description: item.id <= 6 ? seedText(item.description, locale) : item.description, course_name: courses.find(course => course.id === requireOffering(ctx, item.offering_id).course_id)!.name, submission: user.role === 'student' ? submissions.find(row => row.assignment_id === item.id && row.student_id === user.id) ?? null : null, submission_count: submissions.filter(row => row.assignment_id === item.id).length }));
      return page(ctx, rows, { title: row => row.title, due_at: row => row.due_at, course: row => row.course_name[locale] }, 'due_at');
    }
    if (assignmentMatch[2] === 'submissions' && assigned) {
      if (method === 'GET') { requireTeacher(PERMISSIONS.manageAssignments); return page(ctx, submissions.filter(item => item.assignment_id === id).map(item => ({ ...item, student_name: users.find(student => student.id === item.student_id)?.name ?? '' })), { student_name: row => row.student_name, submitted_at: row => row.submitted_at, score: row => row.score }, '-submitted_at'); }
      if (method === 'POST') {
        if (user.role !== 'student') return fail(ctx);
        if (new Date(assigned.due_at).getTime() < Date.now()) return fail(ctx, 422, 'academic:deadlinePassed');
        const input = validate(z.object({ file_ids: z.array(positiveId).min(1).max(UPLOAD_LIMITS.maxFiles) }), body, config);
        const existing = submissions.find(item => item.assignment_id === id && item.student_id === user.id);
        if (existing?.score !== null && existing?.score !== undefined) return fail(ctx, 403, 'academic:alreadyGraded');
        const files = filesFor(ctx, input.file_ids, assigned.offering_id, 'submission', existing?.files);
        const row = { id: existing?.id ?? nextId(submissions), student_id: user.id, assignment_id: id, files, submitted_at: new Date().toISOString(), score: null, feedback: null };
        if (existing) Object.assign(existing, row); else submissions.push(row);
        return ok(row, 201);
      }
    }
    if ((!id && method === 'POST') || (assigned && method === 'PATCH')) {
      requireTeacher(PERMISSIONS.manageAssignments);
      const input = validate(assignmentSchema, body, config); requireOffering(ctx, input.offering_id);
      if (assigned && assigned.offering_id !== input.offering_id) return fail(ctx, 422, 'academic:invalidCourse');
      if (input.due_date < calendarDay(new Date())) return fail(ctx, 422, 'academic:deadlinePassed', 'due_date');
      const row = { id: assigned?.id ?? nextId(assignments), offering_id: input.offering_id, title: input.title, description: input.description, due_at: new Date(`${input.due_date}T23:59:59+04:30`).toISOString(), attachments: filesFor(ctx, input.attachment_ids, input.offering_id, 'assignment', assigned?.attachments) };
      if (assigned) Object.assign(assigned, row); else assignments.push(row);
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
      const rows = visibleDashboardAnnouncements(user, announcements, ids).filter(item => !offeringId || item.audience === 'all' || item.offering_id === offeringId).map(item => ({ ...item, title: item.id <= 3 ? seedText(item.title, locale) : item.title, body: item.id <= 3 ? seedText(item.body, locale) : item.body, author_name: users.find(author => author.id === item.author_id)?.name ?? '' }));
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
      if (existing) Object.assign(existing, row); else announcements.push(row);
      return ok(row, existing ? 200 : 201);
    }
  }
  return undefined;
}
