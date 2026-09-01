import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, getTranslation } from '../i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('gyanmitra-language') || DEFAULT_LANGUAGE);

  useEffect(() => {
    localStorage.setItem('gyanmitra-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t: (key) => getTranslation(language, key),
    currentLanguageLabel: SUPPORTED_LANGUAGES.find((item) => item.code === language)?.label || 'English'
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
