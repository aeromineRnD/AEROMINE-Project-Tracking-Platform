"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { translations, type Locale, type TranslationKey } from "./translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: async () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.language) {
      setLocaleState(session.user.language as Locale);
    }
  }, [status, session?.user?.language]);

  async function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    await fetch("/api/user/language", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLocale }),
    });
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  const { locale } = useLanguage();
  return function t(key: TranslationKey, args?: Record<string, string | number>): string {
    const str = (translations[locale] as Record<string, string>)[key]
      ?? (translations.en as Record<string, string>)[key]
      ?? key;
    if (!args) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => String(args[k] ?? k));
  };
}
