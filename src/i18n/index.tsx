import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import ar, { type TKey } from "./ar";
import en from "./en";
import ml from "./ml";

export type Language = "ar" | "ml" | "en";

const dictionaries: Record<Language, Record<TKey, string>> = { ar, en, ml };

export const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
  { code: "ar", label: "العربية" },
  { code: "ml", label: "മലയാളം" },
  { code: "en", label: "English" },
];

const LANG_KEY = "faraid.lang.v1";

interface I18nContextValue {
  lang: Language;
  dir: "rtl" | "ltr";
  setLang: (lang: Language) => void;
  t: (key: TKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLang(): Language {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "ar" || v === "ml" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "ar";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readStoredLang);

  useEffect(() => {
    const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Language) => setLangState(l), []);

  const t = useCallback(
    (key: TKey, params?: Record<string, string | number>) => {
      const dict = dictionaries[lang];
      let text: string = dict[key] ?? ar[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.split(`{${k}}`).join(String(v));
        }
      }
      return text;
    },
    [lang]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, t }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
