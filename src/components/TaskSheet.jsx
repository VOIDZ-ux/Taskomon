import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

  const sheetTitle = mode === "edit"
    ? (kind === "habit" ? t("sheet.editHabit") : t("sheet.editTask"))
    : toPantry ? t("sheet.newInPantry") : t("sheet.new");

  const typeHint = toPantry
    ? t("sheet.hintPantry")
    : kind === "habit"
    ? t("sheet.hintHabit")
    : t("sheet.hintTask");

  return (
    <>
      <div className={`sheet-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`sheet ${open ? "open" : ""}`}>
        <div className="sheet-grip" />
        <h3>{sheetTitle}</h3>

        {mode !== "edit" && !toPantry && (
          <div className="type-selector">
            <button className={kind === "habit" ? "on" : ""} onClick={() => setKind("habit")}>
              <IconRepeat size={11} />
              <span>{t("sheet.kindHabit")}</span>
            </button>
            <button className={kind === "task" ? "on violet" : ""} onClick={() => setKind("task")}>
              <IconCheckCircle size={11} />
              <span>{t("sheet.kindTask")}</span>
            </button>
          </div>
        )}
        {mode !== "edit" && (
          <div className="type-hint">{typeHint}</div>
        )}

        <div className="field">
          <input
            placeholder={kind === "habit" ? t("sheet.placeholderHabit") : t("sheet.placeholderTask")}
            value={name}
            onChange={e => setName(e.target.value.toLowerCase())}
            autoFocus={open}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        </div>

        {kind === "habit" && (
          <div className="goal-pop">
            <div className="gp-head">
              <span className="gp-lbl">{t("sheet.weeklyGoal")}</span>
              <span className="gp-val">{weeklyGoal}<small>{t("sheet.perWeek")}</small></span>
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
              {t(`sheet.goalLabel${weeklyGoal}`)}
            </div>
          </div>
        )}

        <div className="field" style={{ justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>{t("sheet.colorLabel")}</span>
          <div className="swatches">
            {PALETTE.map(c => {
              const blocked = isBlocked(c);
              const active = sameColor(color, c);
              return (
                <div
                  key={c}
                  className={`swatch ${active ? "active" : ""} ${blocked ? "disabled" : ""}`}
                  style={{ background: c }}
                  title={blocked ? (isReserved(c) ? t("sheet.reservedColor") : t("sheet.usedColor")) : c}
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
              title={t("sheet.customColor")}
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
                <span>{t("sheet.colorInUse")}</span>
              </div>
            )}
          </div>
        )}

        {mode === "edit" && item && (
          <button className="delete-link" onClick={() => onDelete(item.id)}>
            <IconTrash size={14} />
            <span>{item.kind === "habit" ? t("sheet.deleteHabit") : t("sheet.deleteTask")}</span>
          </button>
        )}

        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={onClose}>{t("sheet.cancel")}</button>
          <button
            className="btn btn-primary"
            onClick={submit}
            style={{ opacity: canSubmit ? 1 : 0.5, pointerEvents: canSubmit ? "auto" : "none" }}
          >
            {mode === "edit" ? t("sheet.save") : t("sheet.add")}
          </button>
        </div>
      </div>
    </>
  );
}
