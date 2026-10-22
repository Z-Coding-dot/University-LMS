import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ResultAssessment, ResultAssignment } from '../../../api/types/academic';
import { useDir } from '../../../hooks/useDir';
import { formatNumber } from '../../../lib/number';

export function AssessmentScores({ assessments }: { assessments: ResultAssessment[] }) {
  const { t } = useTranslation('academic'); const { locale } = useDir();
  if (!assessments.length) return <span className="text-gray-400">{t('notConfigured')}</span>;
  return <div className="space-y-2">{assessments.map(item => <div key={item.id} className="min-w-20"><p className="font-medium">{item.score === null ? t('notPublished') : <bdi>{formatNumber(item.score, locale)} / {formatNumber(item.max_score, locale)}</bdi>}</p><p className="text-gray-500">{t('assessmentWeight', { value: formatNumber(item.weight, locale) })}</p>{item.feedback && <p className="mt-1 whitespace-pre-wrap text-gray-500">{item.feedback}</p>}</div>)}</div>;
}

export function AssignmentResultList({ assignments }: { assignments: ResultAssignment[] }) {
  const { t } = useTranslation('academic'); const { locale } = useDir();
  if (!assignments.length) return <span className="text-gray-400">{t('noAssignments')}</span>;
  const graded = assignments.filter(item => item.score !== null).length;
  return <details className="min-w-36"><summary className="min-h-11 cursor-pointer py-2 font-medium text-brand-action">{t('assignmentGradeCount', { graded: formatNumber(graded, locale), total: formatNumber(assignments.length, locale) })}</summary><ul className="space-y-3">{assignments.map(item => <li key={item.id}><Link to={`/assignments/${item.id}`} className="inline-flex min-h-11 items-center text-brand-action">{item.title}</Link><p className="text-gray-500">{t('weekNumber', { value: formatNumber(item.week_number, locale) })}</p><p className="font-medium">{item.score === null ? t(item.submitted ? 'notGraded' : 'notSubmitted') : <bdi>{formatNumber(item.score, locale)} / {formatNumber(100, locale)}</bdi>}</p>{item.feedback && <p className="mt-1 whitespace-pre-wrap text-gray-500">{item.feedback}</p>}</li>)}</ul></details>;
}
