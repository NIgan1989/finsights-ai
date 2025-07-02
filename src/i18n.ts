import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationRU from './locales/ru/translation.json';
import translationKK from './locales/kk/translation.json';

const resources = {
    en: {
        translation: translationEN,
    },
    ru: {
        translation: translationRU,
    },
    kk: {
        translation: translationKK,
    },
};

i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18next; 