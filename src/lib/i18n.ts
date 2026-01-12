import { i18n, type Messages } from "@lingui/core";

export type Locale = "en" | "zh";

const modules = ["common", "legendaries", "talents", "skills"] as const;

async function loadMessages(locale: Locale): Promise<Messages> {
  const allMessages: Messages = {};

  await Promise.all(
    modules.map(async (module) => {
      try {
        const mod = await import(`../locales/${locale}/${module}`);
        if (mod.messages) {
          Object.assign(allMessages, mod.messages);
          console.log(
            `[i18n] Loaded ${locale}/${module}:`,
            Object.keys(mod.messages).length,
            "messages",
          );
        }
      } catch (e) {
        console.warn(`[i18n] Failed to load ${locale}/${module}:`, e);
      }
    }),
  );

  console.log(
    `[i18n] Total messages for ${locale}:`,
    Object.keys(allMessages).length,
  );
  return allMessages;
}

const messageCache: Record<Locale, Messages | null> = { en: null, zh: null };

export const defaultLocale: Locale = "en";

export const SUPPORTED_LOCALES = [
  { locale: "en" as const, name: "English" },
  { locale: "zh" as const, name: "简体中文" },
] as const;

export const loadLocale = async (locale: Locale): Promise<void> => {
  let messages = messageCache[locale];
  if (!messages) {
    messages = await loadMessages(locale);
    messageCache[locale] = messages;
  }
  i18n.load(locale, messages);
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
