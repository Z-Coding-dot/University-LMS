import { useTranslation } from 'react-i18next';
import type { AttendanceStatus, GradeStatus } from '../../config/constants';
import { formatNumber } from '../../lib/number';
import { useDir } from '../../hooks/useDir';
import { Avatar, Badge } from '../ui/surfaces';
import { Select } from '../ui/fields';
import type { Semester } from '../../api/types';
export function UserCell({ name, secondary }: { name: string; secondary?: string }) { return <div className="flex min-w-0 items-center gap-3"><Avatar name={name} /><div className="min-w-0"><p className="truncate font-medium">{name}</p>{secondary && <p className="truncate text-gray-500">{secondary}</p>}</div></div>; }
export function StatusBadge({ status }: { status: 'active' | 'inactive' | GradeStatus }) { const { t } = useTranslation(); return <Badge tone={status === 'active' || status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'neutral'}>{t(`statuses.${status}`)}</Badge>; }
export function AttendanceBadge({ status }: { status: AttendanceStatus }) { const { t } = useTranslation(); return <Badge tone={status === 'present' ? 'success' : status === 'absent' ? 'danger' : status === 'late' ? 'warning' : 'neutral'}>{t(`statuses.${status}`)}</Badge>; }
export function GradeBadge({ total, passMark }: { total: number; passMark: number }) { const { locale } = useDir(); return <Badge tone={total >= passMark ? 'success' : 'danger'}>{formatNumber(total, locale, { maximumFractionDigits: 1 })}</Badge>; }
export function SemesterSwitcher({ semesters, value, onChange }: { semesters: Semester[]; value: number; onChange: (id: number) => void }) { const { t } = useTranslation(); const { locale } = useDir(); return <Select aria-label={t('semester')} value={String(value)} onValueChange={id => onChange(Number(id))} options={semesters.map(semester => ({ value: String(semester.id), label: semester.name[locale] }))} />; }
