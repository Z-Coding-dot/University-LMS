import type { ReactNode } from 'react';
import { Brand } from './brand';
import { LanguageSwitcher } from '../shared/language-switcher';
import { useTranslation } from 'react-i18next';

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('auth');
  return <div className="min-h-dvh bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 lg:flex lg:items-center lg:px-6 lg:py-10">
    <div className="mx-auto grid w-full max-w-[1440px] gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12 xl:gap-20">
      <aside className="relative hidden h-[calc(100dvh-5rem)] min-h-[740px] max-h-[960px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand-action to-brand-action-hover lg:flex">
        <div className="relative z-10 p-8 text-white xl:p-12">
          <p className="mb-5 inline-flex rounded-full border border-white/30 bg-ink/20 px-4 py-2 font-medium">{t('eyebrow')}</p>
          <h2 className="whitespace-pre-line text-4xl font-semibold leading-snug tracking-tight xl:text-5xl">{t('headline')}</h2>
          <p className="mt-4 max-w-sm leading-relaxed">{t('description')}</p>
        </div>
        <div className="absolute -end-36 -top-40 h-[28rem] w-[28rem] rounded-full border border-white/25" />
        <div className="absolute -end-48 -top-24 h-[32rem] w-[32rem] rounded-full border border-white/25" />
        <div className="absolute -start-64 top-[36%] h-[34rem] w-[34rem] rounded-full border border-white/25" />
        <div className="absolute -start-64 top-[47%] h-[34rem] w-[34rem] rounded-full border border-white/25" />
        <div className="relative min-h-[320px] flex-1" aria-hidden="true">
          <div className="absolute start-1/2 top-[12%] h-[140%] w-[120%] -translate-x-1/2 rounded-[50%] bg-white rtl:translate-x-1/2" />
          <picture><source media="(min-width: 1024px)" srcSet="/images/auth/student-reading.png" /><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="" width={1280} height={1280} decoding="async" className="absolute bottom-0 start-[3%] h-full w-[94%] object-contain object-bottom" /></picture>
        </div>
      </aside>
      <div className="relative flex min-w-0 flex-col">
        <div className="flex justify-end"><LanguageSwitcher /></div>
        <main id="main-content" className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-8 sm:py-12 lg:py-8">
          <div className="mb-10 lg:mb-12"><Brand link="/login" showDescription={false} /></div>
          {children}
        </main>
      </div>
    </div>
  </div>;
}
