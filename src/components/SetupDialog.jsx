import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SetupDialog({ open, onComplete }) {
  const { t } = useTranslation();
  const [weekStart, setWeekStart] = useState("MON");
  const [resetHour, setResetHour] = useState(0);

  const hourLabel = String(resetHour).padStart(2, "0") + ":00";
  const hourHint = resetHour === 0
    ? t("setup.rolloverMidnight")
    : t("setup.rolloverHour", { hour: hourLabel });

  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`}>
      <div className="dialog setup-dialog" onClick={e => e.stopPropagation()}>

        <div className="setup-egg">
          <img src={import.meta.env.BASE_URL + "EggSprite.png"} alt="egg" style={{ width: 64, height: 64, imageRendering: "pixelated" }} />
        </div>

        <h4>{t("setup.welcome")}</h4>
        <p>{t("setup.intro")}</p>

        <div className="setup-field">
          <div className="setup-field-label">{t("setup.weekStartLabel")}</div>
          <div className="pill-toggle">
            <button className={weekStart === "MON" ? "on" : ""} onClick={() => setWeekStart("MON")}>MON</button>
            <button className={weekStart === "SUN" ? "on" : ""} onClick={() => setWeekStart("SUN")}>SUN</button>
          </div>
        </div>

        <div className="setup-field">
          <div className="setup-field-label">{t("setup.rolloverLabel")}</div>
          <div className="hour-pop" style={{ background: "transparent", border: "none", padding: 0 }}>
            <div className="hp-readout">
              <span className="hp-val">{hourLabel}</span>
              <span className="hp-help">{t("setup.rolloverRange")}</span>
            </div>
            <input
              type="range" min="0" max="23" step="1" value={resetHour}
              style={{ "--p": ((resetHour / 23) * 100) + "%" }}
              onChange={e => setResetHour(Number(e.target.value))}
            />
            <div className="hp-hint">{hourHint}</div>
          </div>
        </div>

        <div className="dialog-actions" style={{ marginTop: 18 }}>
          <button
            className="btn-keep"
            style={{ flex: 1 }}
            onClick={() => onComplete(weekStart, resetHour)}
          >
            {t("setup.startBtn")}
          </button>
        </div>

      </div>
    </div>
  );
}
