import type { ReactNode } from 'react';
import { Brand } from './brand';
import { LanguageSwitcher } from '../shared/language-switcher';

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 lg:flex lg:items-center lg:px-6 lg:py-10">
    <div className="mx-auto grid w-full max-w-[1440px] gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12 xl:gap-20">
      <aside aria-hidden="true" className="relative hidden h-[calc(100dvh-5rem)] min-h-[580px] max-h-[860px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff5907] via-[#e74700] to-[#b92f00] lg:block">
        <div className="absolute -end-36 -top-40 h-[28rem] w-[28rem] rounded-full border border-white/25" />
        <div className="absolute -end-48 -top-24 h-[32rem] w-[32rem] rounded-full border border-white/25" />
        <div className="absolute -start-64 top-[36%] h-[34rem] w-[34rem] rounded-full border border-white/25" />
        <div className="absolute -start-64 top-[47%] h-[34rem] w-[34rem] rounded-full border border-white/25" />
        <div className="absolute start-1/2 top-[54%] h-full w-[120%] -translate-x-1/2 rounded-[50%] bg-white rtl:translate-x-1/2" />
        <img src="/images/auth/student-reading.png" alt="" width={1280} height={1280} fetchPriority="high" className="absolute bottom-0 start-[3%] h-[76%] w-[94%] object-contain object-bottom" />
      </aside>
      <div className="relative flex min-w-0 flex-col">
        <div className="flex justify-end"><LanguageSwitcher /></div>
        <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12 lg:py-8">
          <div className="mb-10 lg:mb-12"><Brand link="/login" showDescription={false} /></div>
          {children}
        </main>
      </div>
    </div>
  </div>;
}
