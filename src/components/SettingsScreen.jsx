import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconBack, PhysicalSwitch } from "./Icons.jsx";

export default function SettingsScreen({ active, onBack, prefs, setPrefs, onReset, devMode, onDevSimulateWeek, onDevForceHatch, onDevForceIll, onDevForceGolden }) {
  const { t } = useTranslation();
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [hourOpen, setHourOpen] = useState(false);

  return (
    <div className={`sub-screen ${active ? "active" : ""}`}>
      <div className="sub-header">
        <button className="back-btn" onClick={onBack} title="Back"><IconBack /></button>
        <div className="title">{t("settings.title")}</div>
        <div />
      </div>

      <div className="settings-section">
        <div className="settings-section-label">{t("settings.weekSection")}</div>
        <div className="settings-row">
          <div className="label">{t("settings.weekStartLabel")}</div>
          <div className="pill-toggle">
            <button className={prefs.weekStart === "MON" ? "on" : ""} onClick={() => setPrefs(p => ({ ...p, weekStart: "MON" }))}>MON</button>
            <button className={prefs.weekStart === "SUN" ? "on" : ""} onClick={() => setPrefs(p => ({ ...p, weekStart: "SUN" }))}>SUN</button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-label">{t("settings.creatureSection")}</div>
        <div className="settings-row clickable" onClick={() => setThresholdOpen(o => !o)}>
          <div>
            <div className="label">{t("settings.thresholdLabel")}</div>
            <div className="sub">{t("settings.thresholdSub")}</div>
          </div>
          <div className="value">{prefs.threshold}%</div>
        </div>
        {thresholdOpen && (
          <div className="threshold-pop">
            <div className="tp-readout">
              <span className="tp-val">{prefs.threshold}%</span>
              <span className="tp-range">{t("settings.thresholdRange")}</span>
            </div>
            <input
              type="range" min="0" max="100" step="5" value={prefs.threshold}
              style={{ "--p": prefs.threshold + "%" }}
              onChange={e => setPrefs(p => ({ ...p, threshold: Number(e.target.value) }))}
            />
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-section-label">{t("settings.daySection")}</div>
        <div className="settings-row clickable" onClick={() => setHourOpen(o => !o)}>
          <div>
            <div className="label">{t("settings.rolloverLabel")}</div>
            <div className="sub">{t("settings.rolloverSub")}</div>
          </div>
          <div className="value">{String(prefs.resetHour).padStart(2, "0")}:00</div>
        </div>
        {hourOpen && (
          <div className="hour-pop">
            <div className="hp-readout">
              <span className="hp-val">{String(prefs.resetHour).padStart(2, "0")}:00</span>
              <span className="hp-help">{t("settings.rolloverRange")}</span>
            </div>
            <input
              type="range" min="0" max="23" step="1" value={prefs.resetHour}
              style={{ "--p": ((prefs.resetHour / 23) * 100) + "%" }}
              onChange={e => setPrefs(p => ({ ...p, resetHour: Number(e.target.value) }))}
            />
            <div className="hp-hint">
              {prefs.resetHour === 0
                ? t("settings.rolloverMidnight")
                : t("settings.rolloverHour", { hour: `${String(prefs.resetHour).padStart(2, "0")}:00` })}
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-section-label">{t("settings.displaySection")}</div>
        <div className="settings-row">
          <div className="label">{t("settings.showClock")}</div>
          <PhysicalSwitch on={prefs.showClock} onClick={() => setPrefs(p => ({ ...p, showClock: !p.showClock }))} />
        </div>
        <div className="settings-row">
          <div className="label">{t("settings.format24h")}</div>
          <PhysicalSwitch on={prefs.h24} onClick={() => setPrefs(p => ({ ...p, h24: !p.h24 }))} />
        </div>
      </div>

      {devMode && (
        <div className="settings-section">
          <div className="settings-section-label" style={{ color: "#f59e0b" }}>{t("settings.devTools")}</div>
          <div className="settings-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
            <button className="btn btn-ghost" onClick={onDevSimulateWeek}>{t("settings.devSimulate")}</button>
            <div className="sub" style={{ marginTop: 2 }}>{t("settings.devSimulateSub")}</div>
          </div>
          <div className="settings-row">
            <button className="btn btn-ghost" onClick={onDevForceHatch} style={{ width: "100%" }}>{t("settings.devHatch")}</button>
          </div>
          <div className="settings-row">
            <button className="btn btn-ghost" onClick={onDevForceIll} style={{ width: "100%" }}>{t("settings.devIll")}</button>
          </div>
          <div className="settings-row">
            <button className="btn btn-ghost" onClick={onDevForceGolden} style={{ width: "100%" }}>{t("settings.devGolden")}</button>
          </div>
        </div>
      )}

      <div className="footer-version">
        Taskomon<span className="vnum">v1.0.0</span>
      </div>
    </div>
  );
}
