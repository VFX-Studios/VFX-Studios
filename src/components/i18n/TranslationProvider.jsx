import React, { createContext, useContext, useState, useEffect } from 'react';

const I18nContext = createContext();

const translations = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.videoStudio': 'Video Studio',
    'nav.analytics': 'Analytics',
    'video.upload': 'Upload Video',
    'video.export': 'Export Video',
    'ai.analyzing': 'Analyzing...',
    'common.loading': 'Loading...',
  },
  es: {
    'nav.dashboard': 'Panel',
    'nav.videoStudio': 'Estudio de Video',
    'nav.analytics': 'Analítica',
    'video.upload': 'Subir Video',
    'video.export': 'Exportar Video',
    'ai.analyzing': 'Analizando...',
    'common.loading': 'Cargando...',
  },
  fr: {
    'nav.dashboard': 'Tableau de Bord',
    'nav.videoStudio': 'Studio Vidéo',
    'nav.analytics': 'Analytique',
    'video.upload': 'Télécharger Vidéo',
    'video.export': 'Exporter Vidéo',
    'ai.analyzing': 'Analyse...',
    'common.loading': 'Chargement...',
  },
  de: {
    'nav.dashboard': 'Dashboard',
    'nav.videoStudio': 'Video Studio',
    'nav.analytics': 'Analytik',
    'video.upload': 'Video Hochladen',
    'video.export': 'Video Exportieren',
    'ai.analyzing': 'Analysiere...',
    'common.loading': 'Lädt...',
  },
  zh: {
    'nav.dashboard': '仪表板',
    'nav.videoStudio': '视频工作室',
    'nav.analytics': '分析',
    'video.upload': '上传视频',
    'video.export': '导出视频',
    'ai.analyzing': '分析中...',
    'common.loading': '加载中...',
  }
};

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const stored = localStorage.getItem('vfx-language');
    if (stored && translations[stored]) {
      setLanguageState(stored);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (translations[browserLang]) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('vfx-language', lang);
  };

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}