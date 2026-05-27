export default function IllInfoDialog({ open, onDismiss, onGoSettings }) {
  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`} onClick={onDismiss}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h4>Mon is not feeling well</h4>
        <p>
          This week's completion fell below your threshold. Keep completing habits and tasks to nurse Mon back to health — or lower the weekly threshold in Settings if the bar feels too high.
        </p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onDismiss}>Got it</button>
          <button className="btn btn-primary" onClick={onGoSettings}>Settings</button>
        </div>
      </div>
    </div>
  );
}
