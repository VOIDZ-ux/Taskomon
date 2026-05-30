import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const LANGS = [
  { code: "en", flag: "🇬🇧", label: "English",    short: "EN" },
  { code: "it", flag: "🇮🇹", label: "Italiano",   short: "IT" },
  { code: "es", flag: "🇪🇸", label: "Español",    short: "ES" },
  { code: "pt", flag: "🇧🇷", label: "Português",  short: "PT" },
  { code: "fr", flag: "🇫🇷", label: "Français",   short: "FR" },
  { code: "de", flag: "🇩🇪", label: "Deutsch",    short: "DE" },
  { code: "zh", flag: "🇨🇳", label: "中文",        short: "ZH" },
  { code: "ja", flag: "🇯🇵", label: "日本語",      short: "JA" },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const select = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("taskomonLang", code);
    setOpen(false);
  };

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      <button
        className="icon-btn lang-btn"
        onClick={() => setOpen(o => !o)}
        title="Language"
      >
        {current.short}
      </button>
      {open && (
        <div className="lang-drop">
          {LANGS.map(l => (
            <button
              key={l.code}
              className={l.code === i18n.language ? "active" : ""}
              onClick={() => select(l.code)}
            >
              <span className="lang-flag">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
