import { i18n } from "@lingui/core";
import { messages as enMessages } from "@/src/locales/en";
import { messages as zhMessages } from "@/src/locales/zh";

export type Locale = "en" | "zh";

const localeMessages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  zh: zhMessages,
};

export const defaultLocale: Locale = "en";

export const SUPPORTED_LOCALES = [
  { locale: "en" as const, name: "English" },
  { locale: "zh" as const, name: "简体中文" },
] as const;

export const loadLocale = (locale: Locale): void => {
  i18n.load(locale, localeMessages[locale]);
  i18n.activate(locale);
};

export const getStoredLocale = (): Locale => {
  if (typeof window === "undefined") {
    return defaultLocale;
  }
  const stored = localStorage.getItem("locale");
  if (stored === "en" || stored === "zh") {
    return stored;
  }
  return defaultLocale;
};

export const detectBrowserLocale = (): Locale => {
  if (typeof window === "undefined") {
    return defaultLocale;
  }
  const browserLang = navigator.language || navigator.languages?.[0] || "";
  if (browserLang.startsWith("zh")) {
    return "zh";
  }
  if (browserLang.startsWith("en")) {
    return "en";
  }
  return defaultLocale;
};

export const setStoredLocale = (locale: Locale): void => {
  localStorage.setItem("locale", locale);
  loadLocale(locale);
};

// Initialize with stored locale, or auto-detect from browser language
const initialLocale = ((): Locale => {
  const stored = getStoredLocale();
  if (stored !== defaultLocale) {
    return stored;
  }
  if (typeof window === "undefined") {
    return defaultLocale;
  }
  const detected = detectBrowserLocale();
  setStoredLocale(detected);
  return detected;
})();
loadLocale(initialLocale);

// Expose for debugging
if (typeof window !== "undefined") {
  (window as unknown as { setLocale: typeof setStoredLocale }).setLocale =
    setStoredLocale;
}

export { i18n };
