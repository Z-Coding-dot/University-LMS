import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/layout/page-header';
import { Card } from '../../../components/ui/surfaces';
import { PasswordForm } from '../../auth/components/password-form';
export function SecurityPage() { const { t } = useTranslation('profile'); return <><PageHeader title={t('passwordTitle')} description={t('passwordDescription')} /><Card className="max-w-2xl"><PasswordForm /></Card></>; }
