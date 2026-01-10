const config = {
  sourceLocale: "en",
  locales: ["en", "zh"],
  catalogs: [{ path: "<rootDir>/src/locales/{locale}", include: ["src"] }],
};

export default config;
