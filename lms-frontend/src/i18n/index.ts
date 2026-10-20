import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../lib/storage';
import { appConfig } from '../config/app';
import faCommon from './fa/common.json';
import enCommon from './en/common.json';
import faAuth from './fa/auth.json';
import enAuth from './en/auth.json';
import faNavigation from './fa/navigation.json';
import enNavigation from './en/navigation.json';
import faProfile from './fa/profile.json';
import enProfile from './en/profile.json';
import faFoundation from './fa/foundation.json';
import enFoundation from './en/foundation.json';
import faAdmin from './fa/admin.json';
import enAdmin from './en/admin.json';
import faDashboard from './fa/dashboard.json';
import enDashboard from './en/dashboard.json';

const savedLocale = storage.get('lms-locale');
void i18n.use(initReactI18next).init({
  resources: {
    fa: { common: faCommon, auth: faAuth, navigation: faNavigation, profile: faProfile, foundation: faFoundation, admin: faAdmin, dashboard: faDashboard },
    en: { common: enCommon, auth: enAuth, navigation: enNavigation, profile: enProfile, foundation: enFoundation, admin: enAdmin, dashboard: enDashboard },
  },
  lng: savedLocale === 'en' ? 'en' : 'fa', fallbackLng: 'en', supportedLngs: ['fa', 'en'],
  defaultNS: 'common', interpolation: { escapeValue: false }, returnNull: false,
});

function synchronizeLanguage(language: string) {
  const locale = language === 'en' ? 'en' : 'fa';
  document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale === 'fa' ? 'fa-AF' : 'en';
  document.title = `${appConfig.name[locale]} · ${i18n.t('appDescription')}`;
  storage.set('lms-locale', locale);
}
synchronizeLanguage(i18n.language);
i18n.on('languageChanged', synchronizeLanguage);
export default i18n;
