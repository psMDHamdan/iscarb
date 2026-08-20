'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Language } from '@/i18n/config';
import { DEFAULT_LANGUAGE, LANGUAGES, isRTL } from '@/i18n/config';

// Simple in-memory translations (in production, load from locales)
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'button.submit': 'Submit',
    'button.cancel': 'Cancel',
    'button.save': 'Save',
    'button.delete': 'Delete',
    'button.edit': 'Edit',
    'button.back': 'Back',
    'button.next': 'Next',
    'button.previous': 'Previous',
    'button.close': 'Close',
    'button.loading': 'Loading...',
    'button.create': 'Create',
    'button.import': 'Import',
    'button.export': 'Export',
    
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    
    // Errors
    'error.notFound': 'Not Found',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Forbidden',
    'error.serverError': 'Server Error',
    'error.networkError': 'Network Error',
    'error.timeout': 'Request Timeout',
    
    // Status
    'status.loading': 'Loading...',
    'status.success': 'Success',
    'status.error': 'Error',
    'status.warning': 'Warning',
    
    // Dialogs
    'dialog.confirm': 'Confirm',
    'dialog.confirmDelete': 'Are you sure you want to delete this item?',
    'dialog.confirmAction': 'Are you sure?',

    // AI Assistant
    'ai.assistant': 'AI Assistant',
    'ai.startConversation': 'Start a conversation with AI',
    'ai.typeMessage': 'Type your message...',
    'ai.clearHistory': 'Clear History',
    'ai.sources': 'Sources',
    'ai.enhance': 'Enhance with AI',
    'ai.enhanceWithAi': 'Get AI suggestions for improvement',
    'ai.explain': 'Explain This',

    // RDF/Knowledge Graph
    'rdf.graphViewer': 'Knowledge Graph',
    'rdf.mode.forceDirected': 'Force-Directed',
    'rdf.mode.tree': 'Tree',
    'rdf.mode.timeline': 'Timeline',
    'rdf.mode.table': 'Table',
    'rdf.mode.split': 'Split',
    'rdf.description': 'Description',
    'rdf.type': 'Type',
    'rdf.category': 'Category',
    'rdf.selectNode': 'Select a node to view details',
    'rdf.searchNodes': 'Search nodes...',
    'rdf.nodes': 'Nodes',
    'rdf.relatedNodes': 'Related Nodes',
    'rdf.noData': 'No graph data available',
  },
  ar: {
    // Common
    'button.submit': 'إرسال',
    'button.cancel': 'إلغاء',
    'button.save': 'حفظ',
    'button.delete': 'حذف',
    'button.edit': 'تعديل',
    'button.back': 'رجوع',
    'button.next': 'التالي',
    'button.previous': 'السابق',
    'button.close': 'إغلاق',
    'button.loading': 'جاري التحميل...',
    'button.create': 'إنشاء',
    'button.import': 'استيراد',
    'button.export': 'تصدير',
    
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.dashboard': 'لوحة التحكم',
    'nav.settings': 'الإعدادات',
    'nav.profile': 'الملف الشخصي',
    'nav.logout': 'تسجيل الخروج',
    
    // Errors
    'error.notFound': 'غير موجود',
    'error.unauthorized': 'غير مصرح',
    'error.forbidden': 'محظور',
    'error.serverError': 'خطأ الخادم',
    'error.networkError': 'خطأ الشبكة',
    'error.timeout': 'انتهت مهلة الانتظار',
    
    // Status
    'status.loading': 'جاري التحميل...',
    'status.success': 'نجح',
    'status.error': 'خطأ',
    'status.warning': 'تحذير',
    
    // Dialogs
    'dialog.confirm': 'تأكيد',
    'dialog.confirmDelete': 'هل أنت متأكد من رغبتك في حذف هذا العنصر؟',
    'dialog.confirmAction': 'هل أنت متأكد؟',

    // AI Assistant
    'ai.assistant': 'مساعد ذكي',
    'ai.startConversation': 'ابدأ محادثة مع الذكاء الاصطناعي',
    'ai.typeMessage': 'اكتب رسالتك...',
    'ai.clearHistory': 'حذف السجل',
    'ai.sources': 'المصادر',
    'ai.enhance': 'تحسين باستخدام الذكاء الاصطناعي',
    'ai.enhanceWithAi': 'احصل على اقتراحات الذكاء الاصطناعي للتحسين',
    'ai.explain': 'شرح',

    // RDF/Knowledge Graph
    'rdf.graphViewer': 'الرسم البياني للمعرفة',
    'rdf.mode.forceDirected': 'قوة موجهة',
    'rdf.mode.tree': 'شجرة',
    'rdf.mode.timeline': 'الخط الزمني',
    'rdf.mode.table': 'جدول',
    'rdf.mode.split': 'منقسم',
    'rdf.description': 'الوصف',
    'rdf.type': 'النوع',
    'rdf.category': 'الفئة',
    'rdf.selectNode': 'حدد عقدة لعرض التفاصيل',
    'rdf.searchNodes': 'البحث عن العقد...',
    'rdf.nodes': 'العقد',
    'rdf.relatedNodes': 'العقد ذات الصلة',
    'rdf.noData': 'لا توجد بيانات رسم بياني متاحة',
  },
};

// Get language from localStorage or detect from browser
function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const stored = localStorage.getItem('language');
  if (stored === LANGUAGES.EN || stored === LANGUAGES.AR) {
    return stored;
  }
  
  const browserLang = navigator.language.split('-')[0];
  return browserLang === LANGUAGES.AR ? LANGUAGES.AR : LANGUAGES.EN;
}

interface UseI18nReturn {
  t: (key: string, defaultValue?: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
}

export function useI18n(): UseI18nReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const language: Language = useMemo(() => {
    // Check URL for language prefix
    if (pathname.startsWith('/ar/')) return LANGUAGES.AR;
    if (pathname.startsWith('/en/')) return LANGUAGES.EN;
    
    // Fall back to stored or browser language
    return getStoredLanguage();
  }, [pathname]);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('language', lang);
    
    // Update document language
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    }
    
    // Redirect with language prefix
    const newPathname = pathname.replace(/^\/[a-z]{2}/, `/${lang}`);
    router.push(`${newPathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }, [pathname, router, searchParams]);

  const t = useCallback((key: string, defaultValue?: string): string => {
    return translations[language]?.[key] ?? defaultValue ?? key;
  }, [language]);

  return {
    t,
    language,
    setLanguage,
    isRTL: isRTL(language),
    dir: isRTL(language) ? 'rtl' : 'ltr',
  };
}

export default useI18n;
