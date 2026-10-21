import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { academicApi } from '../../../api/endpoints/academic';
import type { CourseView } from '../../../api/types/academic';
import { DataTable, type DataColumn } from '../../../components/ui/data-table';
import { PageHeader } from '../../../components/layout/page-header';
import { Select } from '../../../components/ui/fields';
import { buttonStyles } from '../../../components/ui/button';
import { useAcademicQuery } from '../../../hooks/useAcademic';
import { useAuthStore } from '../../auth/store';
import { useDir } from '../../../hooks/useDir';
import { formatNumber } from '../../../lib/number';
export function CoursesPage({ gradebook = false }: { gradebook?: boolean }) {
  const { t } = useTranslation('academic'); const { locale } = useDir(); const user = useAuthStore(state => state.user);
  const [semester, setSemester] = useState('current'); const catalog = useAcademicQuery(['catalog'], academicApi.catalog);
  const columns: DataColumn<CourseView>[] = [
    { id: 'name', header: t('course'), accessor: row => row.course.name[locale], mobile: 'primary', sortable: true, cell: row => <Link to={`/courses/${row.id}${gradebook ? '?tab=grades' : ''}`} className="font-semibold text-brand">{row.course.name[locale]}</Link> },
    { id: 'code', header: t('code'), accessor: row => row.course.code, mobile: 'primary', sortable: true },
    { id: 'teacher', header: t('teacher'), accessor: row => row.teacher.name, mobile: 'secondary', sortable: true },
    { id: 'credits', header: t('credits'), accessor: row => row.course.credits, mobile: 'secondary', sortable: true, cell: row => formatNumber(row.course.credits, locale) },
  ];
  return <><PageHeader title={t(gradebook ? 'gradebook' : user?.role === 'teacher' ? 'myClasses' : 'myCourses')} /><DataTable columns={columns} queryKey={['courses', user?.id, locale]} fetchPage={academicApi.courses} getRowId={row => String(row.id)} label={t('myCourses')} filterValues={{ semester_id: semester === 'current' ? undefined : semester }} filters={<div className="sm:w-64"><Select aria-label={t('semester')} value={semester} onValueChange={setSemester} options={[{ value: 'current', label: t('currentSemester') }, ...(catalog.data?.semesters ?? []).map(item => ({ value: String(item.id), label: item.name[locale] }))]} /></div>} actions={row => <Link className={buttonStyles({ variant: 'secondary' })} to={`/courses/${row.id}${gradebook ? '?tab=grades' : ''}`}>{t('openCourse')}</Link>} /></>;
}
