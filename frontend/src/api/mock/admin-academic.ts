import type { AcademicYear, Course, CourseOffering, Department, Faculty, Semester } from '../types';
import type { StructureResource, StructureRow } from '../types/academic';
import { academicSettingsSchema, enrollmentSchema, offeringSchema, scheduleSchema, structureSchemas } from '../../features/admin/academic-schemas';
import { slotsOverlap } from '../../lib/academic-rules';
import { academicYears, courses, departments, enrollments, faculties, offerings, semesters, settings, users } from './fixtures';
import { courseView, gradeStates } from './model';
import { fail, nextId, page, respond, validate, type MockContext } from './http';

const structure = { faculties, departments, 'academic-years': academicYears, semesters, courses };
export function handleAdminAcademic(ctx: MockContext) {
  if (!/^\/admin\/(catalog|structure|offerings|settings|locked-grades)(?:\/|$)/.test(ctx.path)) return undefined;
  if (ctx.user.role !== 'admin') return fail(ctx);
  const { path, method, config, body, locale } = ctx;
  const ok = (data: unknown, status = 200) => respond(config, status, { data: structuredClone(data) });
  if (path === '/admin/catalog' && method === 'GET') return ok({ faculties, departments, academic_years: academicYears, semesters, courses, teachers: users.filter(user => user.role === 'teacher'), students: users.filter(user => user.role === 'student'), offerings: offerings.map(courseView) });
  if (path === '/admin/settings' && method === 'PUT') { Object.assign(settings, validate(academicSettingsSchema, body, config)); return ok(settings); }
  const match = path.match(/^\/admin\/structure\/(faculties|departments|academic-years|semesters|courses)(?:\/(\d+))?$/);
  if (match) {
    const resource = match[1] as StructureResource; const id = Number(match[2]); const rows: StructureRow[] = structure[resource];
    if (!match[2] && method === 'GET') return page(ctx, rows, { name: row => typeof row.name === 'string' ? row.name : row.name[locale], id: row => row.id }, 'name');
    const existing = match[2] ? rows.find(row => row.id === id) : undefined;
    if (match[2] && !existing) return fail(ctx, 404, 'common:notFoundTitle');
    if ((!match[2] && method === 'POST') || (existing && method === 'PATCH')) {
      // Each resource schema preserves its own fields; parents are validated below.
      const input = validate(structureSchemas[resource], body, config);
      if ('faculty_id' in input && !faculties.some(row => row.id === input.faculty_id)) return fail(ctx, 422, 'admin:invalidParent', 'faculty_id');
      if ('department_id' in input && !departments.some(row => row.id === input.department_id)) return fail(ctx, 422, 'admin:invalidParent', 'department_id');
      if ('academic_year_id' in input) {
        const year = academicYears.find(row => row.id === input.academic_year_id);
        if (!year || input.starts_at < year.starts_at || input.ends_at > year.ends_at) return fail(ctx, 422, 'admin:invalidDates', 'academic_year_id');
      }
      if (resource === 'academic-years' && 'starts_at' in input && semesters.some(row => row.academic_year_id === id && (row.starts_at < input.starts_at || row.ends_at > input.ends_at))) return fail(ctx, 422, 'admin:invalidDates', 'ends_at');
      if ('code' in input && courses.some(row => row.id !== id && row.code.toLowerCase() === input.code.toLowerCase())) return fail(ctx, 422, 'admin:duplicateCode', 'code');
      const row = { ...input, id: existing?.id ?? nextId(rows) };
      if (existing) Object.assign(existing, row);
      else {
        // Schemas above correspond exactly to this validated resource discriminator.
        if (resource === 'faculties') faculties.push(row as Faculty);
        else if (resource === 'departments') departments.push(row as Department);
        else if (resource === 'academic-years') academicYears.push(row as AcademicYear);
        else if (resource === 'semesters') semesters.push(row as Semester);
        else courses.push(row as Course);
      }
      return ok(row, existing ? 200 : 201);
    }
  }
  if ((path === '/admin/offerings' || path === '/admin/locked-grades') && method === 'GET') {
    const semester = Number(config.params?.semester_id);
    const rows = offerings.filter(row => (!semester || row.semester_id === semester) && (path !== '/admin/locked-grades' || gradeStates.get(row.id) === 'locked')).map(courseView);
    return page(ctx, rows, { name: row => row.course.name[locale], teacher: row => row.teacher.name, capacity: row => row.capacity, students: row => row.student_count }, 'name');
  }
  const offeringMatch = path.match(/^\/admin\/offerings(?:\/(\d+)(?:\/(candidates|enrollments|schedule))?)?$/);
  if (offeringMatch) {
    const id = Number(offeringMatch[1]); const action = offeringMatch[2];
    const existing = offeringMatch[1] ? offerings.find(row => row.id === id) : undefined;
    if (offeringMatch[1] && !existing) return fail(ctx, 404, 'common:notFoundTitle');
    if (!action && ((!offeringMatch[1] && method === 'POST') || (existing && method === 'PATCH'))) {
      const input = validate(offeringSchema, body, config);
      if (!courses.some(row => row.id === input.course_id) || !semesters.some(row => row.id === input.semester_id) || !users.some(row => row.id === input.teacher_id && row.role === 'teacher' && row.status === 'active')) return fail(ctx, 422, 'admin:invalidParent');
      if (existing && (existing.course_id !== input.course_id || existing.semester_id !== input.semester_id)) return fail(ctx, 422, 'admin:immutableOffering');
      if (existing && enrollments.filter(row => row.offering_id === id).length > input.capacity) return fail(ctx, 422, 'admin:capacityExceeded', 'capacity');
      if (existing && offerings.some(other => other.id !== id && other.semester_id === existing.semester_id && other.teacher_id === input.teacher_id && other.schedule.some(slot => existing.schedule.some(next => slotsOverlap(slot, next))))) return fail(ctx, 422, 'admin:scheduleConflict');
      const row: CourseOffering = { id: existing?.id ?? nextId(offerings), ...input, schedule: existing?.schedule ?? [] };
      if (existing) Object.assign(existing, row); else { offerings.push(row); gradeStates.set(row.id, 'draft'); }
      return ok(courseView(row), existing ? 200 : 201);
    }
    if (existing && action === 'candidates' && method === 'GET') return page(ctx, users.filter(user => user.role === 'student' && user.status === 'active' && !enrollments.some(row => row.offering_id === id && row.student_id === user.id)), { name: row => row.name, email: row => row.email, institutional_id: row => row.profile.institutional_id }, 'name');
    if (existing && action === 'enrollments' && method === 'POST') {
      const input = validate(enrollmentSchema, body, config);
      if (input.student_ids.some(student => !users.some(row => row.id === student && row.role === 'student' && row.status === 'active'))) return fail(ctx, 422, 'admin:invalidParent');
      const newIds = input.student_ids.filter(student => !enrollments.some(row => row.offering_id === id && row.student_id === student));
      if (enrollments.filter(row => row.offering_id === id).length + newIds.length > existing.capacity) return fail(ctx, 422, 'admin:capacityExceeded');
      if (offerings.some(other => other.id !== id && other.semester_id === existing.semester_id && enrollments.some(row => row.offering_id === other.id && newIds.includes(row.student_id)) && other.schedule.some(slot => existing.schedule.some(next => slotsOverlap(slot, next))))) return fail(ctx, 422, 'admin:scheduleConflict');
      for (const student of input.student_ids) {
        if (newIds.includes(student)) enrollments.push({ id: nextId(enrollments), student_id: student, offering_id: id });
        if (input.make_current) {
          const user = users.find(row => row.id === student)!; user.profile.current_semester_id = existing.semester_id;
          user.profile.department_id ??= courses.find(row => row.id === existing.course_id)!.department_id;
        }
      }
      return ok(courseView(existing));
    }
    if (existing && action === 'schedule' && method === 'PUT') {
      const input = validate(scheduleSchema, body, config);
      const students = enrollments.filter(row => row.offering_id === id).map(row => row.student_id);
      const selfConflict = input.slots.some((slot, index) => input.slots.slice(index + 1).some(next => slotsOverlap(slot, next)));
      const conflict = offerings.some(other => other.id !== id && other.semester_id === existing.semester_id && other.schedule.some(slot => input.slots.some(next => slotsOverlap(slot, next) && (other.teacher_id === existing.teacher_id || slot.room.toLowerCase() === next.room.toLowerCase() || enrollments.some(row => row.offering_id === other.id && students.includes(row.student_id))))));
      if (selfConflict || conflict) return fail(ctx, 422, 'admin:scheduleConflict');
      let slotId = Math.max(0, ...offerings.flatMap(row => row.schedule.map(slot => slot.id))) + 1;
      existing.schedule = input.slots.map(slot => ({ ...slot, id: slotId++, offering_id: id }));
      return ok(courseView(existing));
    }
  }
  return fail(ctx, 404, 'common:notFoundTitle');
}
