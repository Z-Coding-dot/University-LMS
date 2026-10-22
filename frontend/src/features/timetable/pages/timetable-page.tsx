import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { academicApi } from '../../../api/endpoints/academic';
import { useAcademicQuery } from '../../../hooks/useAcademic';
import { useDir } from '../../../hooks/useDir';
import { PageHeader } from '../../../components/layout/page-header';
import { QueryState } from '../../../components/shared/query-state';
import { WeekTimetable } from '../../../components/shared/week-timetable';
import { Select } from '../../../components/ui/fields';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store';
import { can, PERMISSIONS } from '../../../lib/permissions';
export function TimetablePage() {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const [semester, setSemester] = useState('current');
  const catalog = useAcademicQuery(['catalog'], academicApi.catalog);
  const user = useAuthStore(state => state.user);
  const allowed = user?.role !== 'teacher' || can(user, PERMISSIONS.viewTimetable);
  const query = useAcademicQuery(['timetable', semester], () => academicApi.timetable({ semester_id: semester === 'current' ? undefined : semester }), allowed);
  if (!allowed) return <Navigate to="/403" replace />;
  return <><PageHeader title={t('timetable')} actions={<Select aria-label={t('semester')} value={semester} onValueChange={setSemester} options={[{ value: 'current', label: t('currentSemester') }, ...(catalog.data?.semesters ?? []).map(item => ({ value: String(item.id), label: item.name[locale] }))]} />} /><QueryState pending={query.isPending} error={query.error} retry={query.refetch}>{query.data && <WeekTimetable slots={query.data.slots} weekendDays={query.data.weekend_days} />}</QueryState></>;
}
