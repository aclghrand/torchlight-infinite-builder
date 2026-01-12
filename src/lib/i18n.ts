import { i18n } from "@lingui/core";
import { messages as enCommonMessages } from "@/src/locales/en/common";
import { messages as enLegendariesMessages } from "@/src/locales/en/legendaries";
import { messages as enTalentMessages } from "@/src/locales/en/talents";
import { messages as zhCommonMessages } from "@/src/locales/zh/common";
import { messages as zhLegendariesMessages } from "@/src/locales/zh/legendaries";
import { messages as zhTalentMessages } from "@/src/locales/zh/talents";

export type Locale = "en" | "zh";

const localeMessages: Record<Locale, typeof enCommonMessages> = {
  en: { ...enCommonMessages, ...enLegendariesMessages, ...enTalentMessages },
  zh: { ...zhCommonMessages, ...zhLegendariesMessages, ...zhTalentMessages },
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
