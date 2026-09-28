import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type AppLanguage = 'ar' | 'fr' | 'en';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
  tmdbLang: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇲🇦', dir: 'rtl', tmdbLang: 'ar-SA' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr', tmdbLang: 'fr-FR' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr', tmdbLang: 'en-US' },
];

export const TRANSLATIONS = {
  ar: {
    home: 'الرئيسية',
    movies: 'أفلام',
    series: 'مسلسلات',
    search: 'بحث',
    searchPlaceholder: 'ابحث عن فيلم أو مسلسل مباشرة...',
    quickSearch: 'بحث سريع',
    watchNow: 'مشاهدة الآن',
    watchTrailer: 'العرض الترويجي',
    viewDetails: 'التفاصيل',
    vipBadge: 'نتفرجو VIP • دقة 4K فائقة',
    viralHit: '🔥 تريند شائع على الويب',
    trendingRank: 'تريند اليوم',
    movieSingular: 'فيلم سينمائي',
    seriesSingular: 'مسلسل تلفزيوني',
    previousTitle: 'السابق',
    nextTitle: 'التالي',
    closeTrailer: 'إغلاق العرض الترويجي',
    seeAll: 'عرض الكل',
    moreInfo: 'تفاصيل الفيلم',
    trendingToday: 'الرائج اليوم',
    popularMovies: 'أفلام شائعة',
    popularSeries: 'مسلسلات شائعة',
    topRated: 'الأعلى تقييماً',
    nowPlaying: 'في السينما حالياً',
    loadMore: 'تحميل المزيد من العناوين...',
    loading: 'جاري التحميل...',
    noMoreResults: 'وصلت إلى نهاية القائمة',
    torrentioUnderDev: 'سيرفر بدون إعلانات (قيد التجهيز)',
    torrentioDesc: 'نعمل على تجهيز خوادم فائقة السرعة بدون إعلانات.',
    expandPlayer: 'توسيع المشغل',
    minimizePlayer: 'تصغير المشغل',
    subtitlesReady: 'الترجمة متزامنة وتلقائية داخل المشغل',
    instantSearchMatches: 'النتائج الفورية',
    viewAllResults: 'عرض جميع النتائج',
    noResults: 'لا توجد نتائج مطابقة',
    signIn: 'تسجيل الدخول',
    installApp: 'تثبيت التطبيق',
  },
  fr: {
    home: 'Accueil',
    movies: 'Films',
    series: 'Séries',
    search: 'Recherche',
    searchPlaceholder: 'Rechercher un film ou une série...',
    quickSearch: 'Recherche rapide',
    watchNow: 'Regarder',
    watchTrailer: 'Bande-annonce',
    viewDetails: 'Détails',
    vipBadge: 'NETFARJO VIP • 4K ULTRA',
    viralHit: '🔥 TENDANCE VIRALE',
    trendingRank: 'Tendances du jour',
    movieSingular: 'Film',
    seriesSingular: 'Série TV',
    previousTitle: 'Précédent',
    nextTitle: 'Suivant',
    closeTrailer: 'Fermer la bande-annonce',
    seeAll: 'Voir tout',
    moreInfo: 'Plus d’infos',
    trendingToday: 'Tendances du jour',
    popularMovies: 'Films populaires',
    popularSeries: 'Séries populaires',
    topRated: 'Les mieux notés',
    nowPlaying: 'Actuellement au cinéma',
    loadMore: 'Charger plus de titres...',
    loading: 'Chargement en cours...',
    noMoreResults: 'Fin des résultats',
    torrentioUnderDev: 'Serveur sans pub (En cours)',
    torrentioDesc: 'Nos serveurs ultra-rapides sans pubs sont en configuration.',
    expandPlayer: 'Agrandir le lecteur',
    minimizePlayer: 'Réduire le lecteur',
    subtitlesReady: 'Sous-titres automatiques et synchronisés',
    instantSearchMatches: 'Résultats instantanés',
    viewAllResults: 'Voir tous les résultats',
    noResults: 'Aucun résultat trouvé',
    signIn: 'Connexion',
    installApp: 'Installer l’application',
  },
  en: {
    home: 'Home',
    movies: 'Movies',
    series: 'Series',
    search: 'Search',
    searchPlaceholder: 'Search movies & series instantly...',
    quickSearch: 'Quick search',
    watchNow: 'Watch Now',
    watchTrailer: 'Watch Trailer',
    viewDetails: 'View details',
    vipBadge: 'NETFARJO VIP • 4K ULTRA',
    viralHit: '🔥 VIRAL ON WEB',
    trendingRank: 'Trending Today',
    movieSingular: 'Movie',
    seriesSingular: 'TV Series',
    previousTitle: 'Previous',
    nextTitle: 'Next',
    closeTrailer: 'Close Trailer',
    seeAll: 'See all',
    moreInfo: 'More Info',
    trendingToday: 'Trending Today',
    popularMovies: 'Popular movies',
    popularSeries: 'Popular series',
    topRated: 'Top Rated',
    nowPlaying: 'Now in Theatres',
    loadMore: 'Load More Titles...',
    loading: 'Loading...',
    noMoreResults: 'You’ve reached the end',
    torrentioUnderDev: 'Ad-Free Server (Coming Soon)',
    torrentioDesc: 'High-speed ad-free servers are under active setup.',
    expandPlayer: 'Expand Player',
    minimizePlayer: 'Standard View',
    subtitlesReady: 'Subtitles are ready and synchronized in player',
    instantSearchMatches: 'Instant Matches',
    viewAllResults: 'View all results',
    noResults: 'No matches found',
    signIn: 'Sign in',
    installApp: 'Install App',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.ar;

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  langObj: LanguageOption;
  t: (key: TranslationKey) => string;
  tmdbLang: string;
}

const STORAGE_KEY = 'netfarjo:language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
      if (saved && (saved === 'ar' || saved === 'fr' || saved === 'en')) {
        return saved;
      }
      // Default to English
      return 'en';
    } catch {
      return 'en';
    }
  });

  const langObj = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]!,
    [language],
  );

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = langObj.dir;
  }, [language, langObj.dir]);

  const t = (key: TranslationKey): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      langObj,
      t,
      tmdbLang: langObj.tmdbLang,
    }),
    [language, langObj],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider in isolated tests
    const defaultObj = SUPPORTED_LANGUAGES[2]!; // default English
    return {
      language: 'en' as AppLanguage,
      setLanguage: () => {},
      langObj: defaultObj,
      t: (key: TranslationKey) => TRANSLATIONS.en[key] || key,
      tmdbLang: 'en-US',
    };
  }
  return context;
}

export function getStoredLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    if (saved === 'ar' || saved === 'fr' || saved === 'en') return saved;
    return 'en';
  } catch {
    return 'en';
  }
}

export function getStoredTmdbLang(): string {
  const code = getStoredLanguage();
  if (code === 'ar') return 'ar-SA';
  if (code === 'fr') return 'fr-FR';
  return 'en-US';
}

