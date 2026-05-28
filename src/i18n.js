import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import it from "./locales/it.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";

const SUPPORTED = ["en", "it", "es", "pt", "fr", "de", "zh", "ja"];

const detectLang = () => {
  const saved = localStorage.getItem("taskomonLang");
  if (saved && SUPPORTED.includes(saved)) return saved;
  const browser = navigator.language.split("-")[0];
  return SUPPORTED.includes(browser) ? browser : "en";
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    it: { translation: it },
    es: { translation: es },
    pt: { translation: pt },
    fr: { translation: fr },
    de: { translation: de },
    zh: { translation: zh },
    ja: { translation: ja },
  },
  lng: detectLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
