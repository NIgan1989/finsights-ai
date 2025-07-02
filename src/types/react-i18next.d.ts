// Упрощенные типы для react-i18next для обхода конфликтов версий
declare module 'react-i18next' {
  export function useTranslation(): {
    t: (key: string, options?: any) => string;
    i18n: any;
  };
  
  export const initReactI18next: any;
}