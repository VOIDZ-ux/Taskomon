import { useState } from "react";
import { IconBack, PhysicalSwitch } from "./Icons.jsx";

export default function SettingsScreen({ active, onBack, prefs, setPrefs, onReset, devMode, onDevSimulateWeek, onDevForceHatch, onDevForceIll, onDevForceGolden }) {
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [hourOpen, setHourOpen] = useState(false);

  return (
    <div className={`sub-screen ${active ? "active" : ""}`}>
      <div className="sub-header">
        <button className="back-btn" onClick={onBack} title="Back"><IconBack /></button>
        <div className="title">Settings</div>
        <div />
      </div>

      <div className="settings-section">
        <div className="settings-section-label">Week</div>
        <div className="settings-row">
          <div className="label">Week starts on</div>
          <div className="pill-toggle">
            <button className={prefs.weekStart === "MON" ? "on" : ""} onClick={() => setPrefs(p => ({ ...p, weekStart: "MON" }))}>MON</button>
            <button className={prefs.weekStart === "SUN" ? "on" : ""} onClick={() => setPrefs(p => ({ ...p, weekStart: "SUN" }))}>SUN</button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-label">Creature</div>
        <div className="settings-row clickable" onClick={() => setThresholdOpen(o => !o)}>
          <div>
            <div className="label">Completion threshold</div>
            <div className="sub">Weekly % needed to keep your Mon healthy</div>
          </div>
          <div className="value">{prefs.threshold}%</div>
        </div>
        {thresholdOpen && (
          <div className="threshold-pop">
            <div className="tp-readout">
              <span className="tp-val">{prefs.threshold}%</span>
              <span className="tp-range">0 — 100</span>
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
        <div className="settings-section-label">Day</div>
        <div className="settings-row clickable" onClick={() => setHourOpen(o => !o)}>
          <div>
            <div className="label">Day rollover</div>
            <div className="sub">When tasks expire and habits reset. Pick later if you work nights.</div>
          </div>
          <div className="value">{String(prefs.resetHour).padStart(2, "0")}:00</div>
        </div>
        {hourOpen && (
          <div className="hour-pop">
            <div className="hp-readout">
              <span className="hp-val">{String(prefs.resetHour).padStart(2, "0")}:00</span>
              <span className="hp-help">00 — 23</span>
            </div>
            <input
              type="range" min="0" max="23" step="1" value={prefs.resetHour}
              style={{ "--p": ((prefs.resetHour / 23) * 100) + "%" }}
              onChange={e => setPrefs(p => ({ ...p, resetHour: Number(e.target.value) }))}
            />
            <div className="hp-hint">
              {prefs.resetHour === 0
                ? "Your day rolls over at midnight."
                : `Your day rolls over at ${String(prefs.resetHour).padStart(2, "0")}:00. Anything before that still counts as the previous day.`}
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-section-label">Display</div>
        <div className="settings-row">
          <div className="label">Show clock on main screen</div>
          <PhysicalSwitch on={prefs.showClock} onClick={() => setPrefs(p => ({ ...p, showClock: !p.showClock }))} />
        </div>
        <div className="settings-row">
          <div className="label">24h format</div>
          <PhysicalSwitch on={prefs.h24} onClick={() => setPrefs(p => ({ ...p, h24: !p.h24 }))} />
        </div>
      </div>

      {devMode && (
        <div className="settings-section">
          <div className="settings-section-label" style={{ color: "#f59e0b" }}>DEV TOOLS</div>
          <div className="settings-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
            <button className="btn btn-ghost" onClick={onDevSimulateWeek}>Simulate week complete</button>
            <div className="sub" style={{ marginTop: 2 }}>wait up to 60s for hatch to trigger</div>
          </div>
          <div className="settings-row">
            <button className="btn btn-ghost" onClick={onDevForceHatch} style={{ width: "100%" }}>Force hatch now</button>
          </div>
          <div className="settings-row">
            <button className="btn btn-ghost" onClick={onDevForceIll} style={{ width: "100%" }}>Force ill state</button>
          </div>
          <div className="settings-row">
            <button className="btn btn-ghost" onClick={onDevForceGolden} style={{ width: "100%" }}>Force golden state</button>
          </div>
        </div>
      )}

      <div className="footer-version">
        Taskomon<span className="vnum">v1.0.0</span>
      </div>
    </div>
  );
}
