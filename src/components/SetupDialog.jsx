import { useState } from "react";

export default function SetupDialog({ open, onComplete }) {
  const [weekStart, setWeekStart] = useState("MON");
  const [resetHour, setResetHour] = useState(0);

  const hourLabel = String(resetHour).padStart(2, "0") + ":00";
  const hourHint = resetHour === 0
    ? "Your day rolls over at midnight."
    : `Your day rolls over at ${hourLabel}. Anything before that still counts as the previous day.`;

  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`}>
      <div className="dialog setup-dialog" onClick={e => e.stopPropagation()}>

        <div className="setup-egg">
          <img src="/EggSprite.png" alt="egg" style={{ width: 64, height: 64, imageRendering: "pixelated" }} />
        </div>

        <h4>WELCOME TO TASKOMON</h4>
        <p>Before we start, set up a couple of preferences so your Mon knows when your week begins and ends.</p>

        {/* ── Week start ─────────────────────────── */}
        <div className="setup-field">
          <div className="setup-field-label">Week starts on</div>
          <div className="pill-toggle">
            <button
              className={weekStart === "MON" ? "on" : ""}
              onClick={() => setWeekStart("MON")}
            >MON</button>
            <button
              className={weekStart === "SUN" ? "on" : ""}
              onClick={() => setWeekStart("SUN")}
            >SUN</button>
          </div>
        </div>

        {/* ── Day rollover ───────────────────────── */}
        <div className="setup-field">
          <div className="setup-field-label">Day rollover</div>
          <div className="hour-pop" style={{ background: "transparent", border: "none", padding: 0 }}>
            <div className="hp-readout">
              <span className="hp-val">{hourLabel}</span>
              <span className="hp-help">00 — 23</span>
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
            Let's go!
          </button>
        </div>

      </div>
    </div>
  );
}
