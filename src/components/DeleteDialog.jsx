export default function DeleteDialog({ open, item, onCancel, onKeepHistory, onWipeAll }) {
  if (!item) return null;
  const isHabit = item.kind === "habit";
  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`} onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h4>Delete "{item.name}"?</h4>
        <p>
          {isHabit
            ? "Choose what to do with this habit's progress in your Calendar."
            : "This task will be removed. Wipe it from your Calendar too?"}
        </p>
        <div className="dialog-actions stack">
          <button className="btn-keep" onClick={onKeepHistory}>
            Keep history · reserve color
          </button>
          <button className="btn-danger" onClick={onWipeAll}>
            Wipe everything
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
        <div className="reserved-note">
          <div className="swatch-mini" style={{ background: item.color }} />
          <span>If kept, <strong style={{ color: "var(--fg)" }}>{item.color.toUpperCase()}</strong> can't be reused.</span>
        </div>
      </div>
    </div>
  );
}
