import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const LANGS = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "pt", flag: "🇧🇷", label: "Português" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
  { code: "ja", flag: "🇯🇵", label: "日本語" },
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
        {current.flag}
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
