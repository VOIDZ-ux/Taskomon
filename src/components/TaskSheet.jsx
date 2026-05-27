import { useState, useEffect } from "react";
import { PALETTE, sameColor, hexToRgb, rgbToHex, normalizeHex } from "../utils/colorHelpers.js";
import { IconTrash, IconRepeat, IconCheckCircle } from "./Icons.jsx";

export default function TaskSheet({
  open,
  mode = "add",
  item,
  defaultKind = "habit",
  toPantry = false,
  blockedColors = [],
  reservedColors = [],
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const findFreeColor = () => PALETTE.find(p => !blockedColors.some(b => sameColor(b, p))) || PALETTE[1];

  const [kind, setKind] = useState(defaultKind);
  const [name, setName] = useState("");
  const [color, setColor] = useState(findFreeColor());
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [customOpen, setCustomOpen] = useState(false);
  const [rgb, setRgb] = useState({ r: 127, g: 232, b: 23 });
  const [hexInput, setHexInput] = useState("#7FE817");

  useEffect(() => {
    if (open) {
      const freeColor = findFreeColor();
      if (mode === "edit" && item) {
        setKind(item.kind === "pantry" ? "task" : item.kind);
        setName(item.name);
        setColor(item.color);
        setWeeklyGoal(item.weeklyGoal || 5);
        setRgb(hexToRgb(item.color));
        setHexInput(normalizeHex(item.color));
        setCustomOpen(!PALETTE.some(p => sameColor(p, item.color)));
      } else {
        setKind(toPantry ? "task" : defaultKind);
        setName("");
        setColor(freeColor);
        setWeeklyGoal(5);
        setRgb(hexToRgb(freeColor));
        setHexInput(normalizeHex(freeColor));
        setCustomOpen(false);
      }
    }
  }, [open, mode, item?.id, defaultKind, toPantry]);

  const isBlocked = (c) => blockedColors.some(b => sameColor(b, c));
  const isReserved = (c) => reservedColors.some(r => sameColor(r, c));
  const inPalette = PALETTE.some(p => sameColor(p, color));
  const colorConflict = isBlocked(color);

  const setCustom = (r, g, b) => {
    const c = { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    setRgb(c);
    const hex = rgbToHex(c.r, c.g, c.b);
    setColor(hex);
    setHexInput(hex);
  };

  const onHexInput = (v) => {
    setHexInput(v);
    const m = v.trim().match(/^#?([0-9a-f]{6})$/i);
    if (m) {
      const hex = "#" + m[1].toUpperCase();
      setColor(hex);
      setRgb(hexToRgb(hex));
    }
  };

  const canSubmit = name.trim() && !colorConflict;

  const submit = () => {
    if (!canSubmit) return;
    if (mode === "edit") {
      onUpdate(item.id, { name: name.trim(), color, weeklyGoal: kind === "habit" ? weeklyGoal : undefined });
    } else {
      onAdd({ kind, name: name.trim(), color, weeklyGoal: kind === "habit" ? weeklyGoal : undefined });
    }
    onClose();
  };

  const goalLabels = [
    "Once a week", "Twice a week", "3 days a week",
    "4 days a week", "5 days a week", "6 days a week", "Every day",
  ];

  return (
    <>
      <div className={`sheet-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`sheet ${open ? "open" : ""}`}>
        <div className="sheet-grip" />
        <h3>{mode === "edit" ? `EDIT ${kind.toUpperCase()}` : toPantry ? "NEW IN PANTRY" : "NEW"}</h3>

        {mode !== "edit" && !toPantry && (
          <div className="type-selector">
            <button className={kind === "habit" ? "on" : ""} onClick={() => setKind("habit")}>
              <IconRepeat size={11} />
              <span>Habit</span>
            </button>
            <button className={kind === "task" ? "on violet" : ""} onClick={() => setKind("task")}>
              <IconCheckCircle size={11} />
              <span>Task</span>
            </button>
          </div>
        )}
        {mode !== "edit" && (
          <div className="type-hint">
            {toPantry
              ? "Saved straight to Pantry · dormant until you activate it"
              : kind === "habit"
              ? "Recurring · contributes to weekly % based on goal"
              : "One-off · must be done today or it counts as missed"}
          </div>
        )}

        <div className="field">
          <input
            placeholder={kind === "habit" ? "e.g. meditate" : "e.g. send invoice"}
            value={name}
            onChange={e => setName(e.target.value.toLowerCase())}
            autoFocus={open}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        </div>

        {kind === "habit" && (
          <div className="goal-pop">
            <div className="gp-head">
              <span className="gp-lbl">Weekly goal</span>
              <span className="gp-val">{weeklyGoal}<small>× / week</small></span>
            </div>
            <input
              type="range" min="1" max="7" step="1"
              value={weeklyGoal}
              style={{ "--p": (((weeklyGoal - 1) / 6) * 100) + "%" }}
              onChange={e => setWeeklyGoal(Number(e.target.value))}
            />
            <div className="gp-dots">
              {[1,2,3,4,5,6,7].map(n => (
                <div key={n} className={`gp-dot ${n <= weeklyGoal ? "on" : ""}`} />
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 9, letterSpacing: 1, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
              {goalLabels[weeklyGoal - 1]}
            </div>
          </div>
        )}

        <div className="field" style={{ justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>color</span>
          <div className="swatches">
            {PALETTE.map(c => {
              const blocked = isBlocked(c);
              const active = sameColor(color, c);
              return (
                <div
                  key={c}
                  className={`swatch ${active ? "active" : ""} ${blocked ? "disabled" : ""}`}
                  style={{ background: c }}
                  title={blocked ? (isReserved(c) ? "Reserved by a deleted habit" : "Used by another item") : c}
                  onClick={() => { if (!blocked) { setColor(c); setCustomOpen(false); } }}
                />
              );
            })}
            <div
              className={`swatch rainbow ${(!inPalette || customOpen) ? "active" : ""}`}
              onClick={() => {
                setCustomOpen(o => !o);
                if (!customOpen && inPalette) setCustom(rgb.r, rgb.g, rgb.b);
              }}
              title="Custom color"
            />
          </div>
        </div>

        {customOpen && (
          <div className="rgb-pop" style={{ "--prev-glow": color + "66" }}>
            <div className="rgb-top">
              <div className="preview" style={{ background: color }} />
              <input className="hex" value={hexInput} onChange={e => onHexInput(e.target.value)} spellCheck="false" maxLength={7} />
            </div>
            <div className="rgb-rows">
              {[
                { k: "r", lbl: "R", color: "#ff7676" },
                { k: "g", lbl: "G", color: "#9bff76" },
                { k: "b", lbl: "B", color: "#76a8ff" },
              ].map(({ k, lbl, color: lblColor }) => (
                <div className="rgb-row" key={k}>
                  <div className="ch" style={{ color: lblColor }}>{lbl}</div>
                  <input type="range" min="0" max="255" step="1" className={k} value={rgb[k]}
                    onChange={e => setCustom(
                      k === "r" ? +e.target.value : rgb.r,
                      k === "g" ? +e.target.value : rgb.g,
                      k === "b" ? +e.target.value : rgb.b
                    )}
                  />
                  <div className="val">{rgb[k]}</div>
                </div>
              ))}
            </div>
            {colorConflict && (
              <div className="reserved-note" style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                <div className="swatch-mini" style={{ background: color }} />
                <span>This color is already in use.</span>
              </div>
            )}
          </div>
        )}

        {mode === "edit" && item && (
          <button className="delete-link" onClick={() => onDelete(item.id)}>
            <IconTrash size={14} />
            <span>Delete {item.kind === "habit" ? "habit" : "task"}</span>
          </button>
        )}

        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={submit}
            style={{ opacity: canSubmit ? 1 : 0.5, pointerEvents: canSubmit ? "auto" : "none" }}
          >
            {mode === "edit" ? "Save" : "+ Add"}
          </button>
        </div>
      </div>
    </>
  );
}
